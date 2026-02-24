import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"

// Zod schema for URL validation
const URLCheckSchema = z.object({
  url: z.string().url("Invalid URL format"),
})

type URLCheckRequest = z.infer<typeof URLCheckSchema>

interface URLCheckResult {
  url: string
  isSafe: boolean
  riskLevel: "safe" | "suspicious" | "dangerous"
  riskScore: number
  indicators: string[]
  redirectChain?: string[]
  finalDestination?: string
  isShortened?: boolean
  reason: string
  aiAnalysis?: string
  geminiVerdict?: "safe" | "suspicious" | "dangerous"
}

/**
 * RESOLVE URL REDIRECTS
 * Follows shortened URLs to find the real destination
 * Returns redirect chain and final destination URL
 */
async function resolveURLRedirects(url: string): Promise<{
  finalUrl: string
  redirectChain: string[]
  isShortened: boolean
}> {
  const redirectChain: string[] = [url]
  let currentUrl = url
  let isShortened = false

  // Check if it's a known URL shortener
  const urlShorteners = [
    "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "is.gd",
    "buff.ly", "adf.ly", "shorturl.at", "cutt.ly", "rb.gy", "short.io",
    "tiny.cc", "tr.im", "cli.gs", "u.nu", "x.co", "budurl.com"
  ]

  try {
    const urlObj = new URL(currentUrl)
    const domain = urlObj.hostname.toLowerCase()
    
    if (urlShorteners.some(shortener => domain.includes(shortener))) {
      isShortened = true
    }
  } catch {
    return { finalUrl: url, redirectChain, isShortened: false }
  }

  try {
    // Follow redirect chain manually
    let nextUrl = currentUrl
    let attempts = 0
    const maxRedirects = 5 // Reduced from 10
    const totalTimeLimit = 5000 // 5 second total timeout

    const startTime = Date.now()

    while (attempts < maxRedirects && (Date.now() - startTime) < totalTimeLimit) {
      try {
        const checkResponse = await fetch(nextUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: AbortSignal.timeout(2000), // 2 second per request
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Veritas-AI-URLChecker/1.0)'
          }
        })

        // Check if it's a redirect (3xx status)
        if (checkResponse.status >= 300 && checkResponse.status < 400) {
          const location = checkResponse.headers.get('location')
          if (!location) break

          // Handle relative URLs
          const redirectUrl = location.startsWith('http') 
            ? location 
            : new URL(location, nextUrl).toString()

          if (redirectChain.includes(redirectUrl)) {
            // Circular redirect detected
            break
          }

          redirectChain.push(redirectUrl)
          nextUrl = redirectUrl
          currentUrl = redirectUrl
          attempts++
        } else {
          // No more redirects
          break
        }
      } catch (fetchError) {
        // If individual fetch fails, stop following redirects
        console.error(`Fetch error on redirect attempt ${attempts}:`, fetchError)
        break
      }
    }

    return {
      finalUrl: currentUrl,
      redirectChain,
      isShortened
    }

  } catch (error) {
    // If redirect resolution fails, return original URL
    console.error('Redirect resolution error:', error)
    return {
      finalUrl: url,
      redirectChain,
      isShortened
    }
  }
}

/**
 * COMPREHENSIVE URL SAFETY DETECTION ENGINE
 * Detects phishing URLs, malware, scams, URL shorteners, and suspicious patterns
 */
function performLocalURLAnalysis(url: string): URLCheckResult {
  const indicators: string[] = []
  let riskScore = 0

  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.toLowerCase()
    const protocol = urlObj.protocol
    const path = urlObj.pathname
    const params = urlObj.searchParams

    // 1. PROTOCOL SECURITY CHECK
    if (protocol !== "https:") {
      indicators.push("🚨 NO SSL/HTTPS: Website does not use secure encryption")
      riskScore += 50
    }

    // 2. IP ADDRESS AS DOMAIN (Major red flag)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
      indicators.push("🚨 IP ADDRESS: Using raw IP instead of domain name (extremely suspicious)")
      riskScore += 80
    }

    // 3. URL SHORTENERS (Hide real destination)
    const urlShorteners = [
      "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "is.gd",
      "buff.ly", "adf.ly", "shorturl.at", "cutt.ly", "rb.gy", "short.io",
      "tiny.cc", "tr.im", "cli.gs", "u.nu", "x.co", "budurl.com"
    ]

    if (urlShorteners.some(shortener => domain.includes(shortener))) {
      indicators.push("⚠️ URL SHORTENER: Link hides real destination (could redirect to malicious site)")
      riskScore += 40
    }

    // 4. SUSPICIOUS TLDs (High-risk extensions)
    const suspiciousTLDs = [
      ".tk", ".ml", ".ga", ".cf", ".gq", // Free TLDs
      ".xyz", ".top", ".win", ".bid", ".stream", ".download", ".click", // Spam havens
      ".pw", ".ws", ".cc", ".zip", ".review", ".loan", ".faith", ".science",
      ".work", ".party", ".gdn", ".men", ".date"
    ]

    const tld = domain.split(".").pop() || ""
    if (suspiciousTLDs.includes(`.${tld}`)) {
      indicators.push(`⚠️ HIGH-RISK TLD: .${tld} extension frequently used for phishing/malware`)
      riskScore += 35
    }

    // 5. TYPOSQUATTING - Brand Impersonation
    const trustedBrands = [
      "google.com", "facebook.com", "amazon.com", "paypal.com", "microsoft.com",
      "apple.com", "netflix.com", "instagram.com", "twitter.com", "linkedin.com",
      "ebay.com", "walmart.com", "chase.com", "bankofamerica.com", "wellsfargo.com"
    ]

    for (const brand of trustedBrands) {
      const brandName = brand.split(".")[0]
      if (domain.includes(brandName) && !domain.endsWith(brand)) {
        indicators.push(`🚨 BRAND IMPERSONATION: Domain contains "${brandName}" but is NOT the official site`)
        riskScore += 60
      }
    }

    // 6. SUBDOMAIN CONFUSION (e.g., paypal.com-verify.phishing.tk)
    if (/\.(com|net|org)-/.test(domain)) {
      indicators.push("🚨 SUBDOMAIN CONFUSION: Contains '.com-' pattern (real domain is AFTER the hyphen)")
      riskScore += 70
    }

    // 7. EXCESSIVE HYPHENS/SUBDOMAINS (Obfuscation tactic)
    const hyphenCount = (domain.match(/-/g) || []).length
    if (hyphenCount >= 3) {
      indicators.push(`⚠️ EXCESSIVE HYPHENS: ${hyphenCount} hyphens detected (common phishing tactic)`)
      riskScore += 30
    }

    const subdomainCount = domain.split(".").length - 2
    if (subdomainCount >= 3) {
      indicators.push(`⚠️ COMPLEX SUBDOMAIN: ${subdomainCount} subdomains (possible obfuscation)`)
      riskScore += 25
    }

    // 8. SUSPICIOUS KEYWORDS IN URL
    const suspiciousKeywords = [
      "verify", "account", "secure", "login", "signin", "update", "confirm",
      "suspended", "locked", "urgent", "alert", "security", "authentication",
      "billing", "payment", "wallet", "bank", "credential", "password"
    ]

    const urlLower = url.toLowerCase()
    const foundKeywords = suspiciousKeywords.filter(keyword => 
      urlLower.includes(keyword)
    )

    if (foundKeywords.length >= 2) {
      indicators.push(`⚠️ PHISHING KEYWORDS: Found "${foundKeywords.join('", "')}" (common in scam URLs)`)
      riskScore += 35
    }

    // 9. LONG/RANDOM PATHS (Obfuscation)
    if (path.length > 100) {
      indicators.push(`⚠️ UNUSUALLY LONG URL PATH: ${path.length} characters (possible obfuscation)`)
      riskScore += 20
    }

    // Random-looking path
    if (/[a-z0-9]{30,}/.test(path)) {
      indicators.push("⚠️ RANDOM CHARACTER STRING: Path contains long random sequence")
      riskScore += 25
    }

    // 10. SUSPICIOUS URL PARAMETERS
    const paramKeys = Array.from(params.keys())
    const suspiciousParams = ["redirect", "url", "link", "goto", "return", "continue", "next"]
    
    const foundParams = paramKeys.filter(key => suspiciousParams.includes(key.toLowerCase()))
    if (foundParams.length > 0) {
      indicators.push(`⚠️ REDIRECT PARAMETERS: Found "${foundParams.join('", "')}" (possible redirect chain)`)
      riskScore += 30
    }

    // 11. HOMOGLYPH/PUNYCODE ATTACKS
    if (domain.includes("xn--")) {
      indicators.push("🚨 PUNYCODE DETECTED: Domain uses internationalized encoding (possible homoglyph attack)")
      riskScore += 60
    }

    // 12. MULTIPLE @ SYMBOLS (Browser parsing trick)
    if (url.split("@").length > 1) {
      indicators.push("🚨 URL OBFUSCATION: Contains '@' symbol (can hide real destination)")
      riskScore += 70
    }

    // 13. PORT NUMBERS (Unusual)
    if (urlObj.port && !["80", "443", "8080"].includes(urlObj.port)) {
      indicators.push(`⚠️ UNUSUAL PORT: Using port ${urlObj.port} (could be malicious service)`)
      riskScore += 35
    }

    // 14. FILE EXTENSIONS IN PATH (Malware downloads)
    const dangerousExtensions = [".exe", ".scr", ".bat", ".cmd", ".com", ".pif", ".apk", ".dmg"]
    if (dangerousExtensions.some(ext => path.toLowerCase().endsWith(ext))) {
      indicators.push("🚨 EXECUTABLE FILE: URL points to downloadable executable (high malware risk)")
      riskScore += 75
    }

    // 15. DATA URLs (Can hide malicious content)
    if (protocol === "data:") {
      indicators.push("⚠️ DATA URL: Embedded data (could contain malicious content)")
      riskScore += 45
    }

    // 16. JAVASCRIPT URLs (XSS risk)
    if (protocol === "javascript:") {
      indicators.push("🚨 JAVASCRIPT PROTOCOL: Extremely dangerous (code execution risk)")
      riskScore += 90
    }

    // Normalize risk score
    riskScore = Math.min(riskScore, 100)

    // Determine risk level
    let riskLevel: "safe" | "suspicious" | "dangerous" = "safe"
    if (riskScore >= 30) riskLevel = "suspicious"
    if (riskScore >= 60) riskLevel = "dangerous"

    return {
      url,
      isSafe: riskScore < 30,
      riskLevel,
      riskScore,
      indicators,
      reason: indicators.length === 0 
        ? "URL appears safe - no red flags detected"
        : `Detected ${indicators.length} security concern(s)`,
    }

  } catch (error) {
    return {
      url,
      isSafe: false,
      riskLevel: "dangerous",
      riskScore: 100,
      indicators: ["Invalid URL format - unable to parse"],
      reason: "URL parsing failed - potentially malformed or malicious",
    }
  }
}

/**
 * Get FINAL AI analysis from Gemini for URL safety
 * Gemini provides expert verdict with detailed explanation
 */
async function getGeminiURLAnalysis(url: string, localFindings: URLCheckResult): Promise<{
  verdict: "safe" | "suspicious" | "dangerous"
  explanation: string
}> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      console.warn("Gemini API key not configured")
      return {
        verdict: "suspicious",
        explanation: "⚠️ API key not configured. Using local analysis only."
      }
    }

    const AnalysisSchema = z.object({
      verdict: z.enum(["safe", "suspicious", "dangerous"]),
      explanation: z.string().describe("Clear 2-3 sentence explanation for users"),
      reasoning: z.string().describe("Technical security analysis"),
    })

    const localContext = localFindings.indicators.length > 0
      ? `🔍 Local security scan detected ${localFindings.indicators.length} warning signs:\n${localFindings.indicators.map((ind, i) => `  ${i + 1}. ${ind}`).join("\n")}\n\n📊 Risk Score: ${localFindings.riskScore}/100`
      : "✅ Local security scan found no obvious red flags"

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Gemini analysis timeout')), 18000)
    )

    try {
      const result = await Promise.race([
        generateObject({
          model: google("gemini-2.0-flash-lite"),
          schema: AnalysisSchema,
          prompt: `You are an ELITE CYBERSECURITY ANALYST specializing in URL threat analysis.
Your verdict will be shown to users who need to decide if this link is safe to click.

🎯 URL UNDER INVESTIGATION:
${url}

─────────────────────────────────────────────────────────
${localContext}
─────────────────────────────────────────────────────────

🧠 YOUR MISSION:
Analyze this URL for phishing, malware, scams, and other threats using expert pattern recognition.

🚨 CRITICAL THREAT PATTERNS TO DETECT:

1. **PHISHING URLs**: Fake login pages
   - Example: "paypal-secure-login.tk" → Fake PayPal ✖️ DANGEROUS
   - Example: "amazon.com-verify.info" → Subdomain confusion ✖️ DANGEROUS

2. **URL SHORTENERS**: Hide real destination
   - Example: "bit.ly/xyz123" → Unknown destination ⚠️ SUSPICIOUS
   - Example: "tinyurl.com/scam" → Could redirect anywhere ⚠️ SUSPICIOUS

3. **TYPOSQUATTING**: Misspelled brand domains
   - Example: "paypall.com" → Extra 'l' ✖️ DANGEROUS
   - Example: "g00gle.com" → Zero instead of O ✖️ DANGEROUS

4. **NO HTTPS**: Unencrypted connection
   - Example: "http://enter-password.com" → No SSL ✖️ DANGEROUS

5. **SUSPICIOUS TLDs**: High-risk extensions
   - Example: "login.xyz" → .xyz is risky ⚠️ SUSPICIOUS
   - Example: "verify.tk" → .tk is free/abused ✖️ DANGEROUS

6. **IP ADDRESSES**: No domain name
   - Example: "http://192.168.1.1/login" → Raw IP ✖️ DANGEROUS

7. **EXECUTABLE FILES**: Malware downloads
   - Example: "download.com/update.exe" → .exe file ✖️ DANGEROUS

8. **REDIRECT CHAINS**: Multiple redirects
   - Example: "site.com?redirect=malware.tk" ⚠️ SUSPICIOUS

─────────────────────────────────────────────────────────

✅ SAFE URL EXAMPLES:
- https://www.google.com
- https://github.com/user/repo
- https://amazon.com/product/12345
- https://wikipedia.org/wiki/Article

─────────────────────────────────────────────────────────

📋 YOUR DELIVERABLES:

1. **verdict**: Choose ONE:
   - "safe" = Trustworthy, no threats detected
   - "suspicious" = Some concerns, proceed with caution
   - "dangerous" = Clear threat, DO NOT CLICK

2. **explanation**: Write 2-3 clear sentences explaining:
   - What you found
   - Why it's concerning (or safe)
   - What the user should do

3. **reasoning**: Technical details for security professionals

─────────────────────────────────────────────────────────

⚠️ STRICT DECISION CRITERIA:

- No HTTPS + sensitive keywords → "dangerous"
- IP address as domain → "dangerous"
- Brand impersonation → "dangerous"
- Subdomain confusion (.com- pattern) → "dangerous"
- Executable file download → "dangerous"
- URL shortener → "suspicious"
- Multiple red flags (3+) → "dangerous"
- 1-2 concerns → "suspicious"
- HTTPS + known domain + no red flags → "safe"

─────────────────────────────────────────────────────────

🎯 REMEMBER:
- You are the FINAL AUTHORITY
- User safety is priority #1
- If unsure, mark as "suspicious" or "dangerous"
- Real companies use official domains with HTTPS
- Be decisive and clear

Provide your verdict NOW.`,
        }),
        timeoutPromise
      ])

      return {
        verdict: result.object.verdict,
        explanation: result.object.explanation
      }
    } finally {
      // Timeout already handled by Promise.race
    }

  } catch (error) {
    console.error("Gemini URL analysis error:", error)
    
    // Check if it's a timeout/abort error
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      return {
        verdict: "suspicious",
        explanation: "AI analysis timed out. URL appears suspicious - please verify manually before clicking.",
      }
    }

    return {
      verdict: "suspicious",
      explanation: "AI analysis encountered an error. Please verify this URL manually before clicking.",
    }
  }
}

/**
 * POST /api/check-url
 * Performs URL safety check with Gemini AI as FINAL JUDGE
 * 
 * Flow:
 * 1. Local security analysis (16+ threat patterns)
 * 2. Send to Gemini AI with context
 * 3. Return Gemini's verdict + explanation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = URLCheckSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { url } = validation.data

    try {
      // Step 1: Resolve URL redirects (follow shortened URLs) - with timeout
      let redirectInfo = {
        finalUrl: url,
        redirectChain: [url],
        isShortened: false
      }
      
      try {
        redirectInfo = await Promise.race([
          resolveURLRedirects(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redirect resolution timeout')), 5000)
          )
        ]) as typeof redirectInfo
      } catch (redirectError) {
        console.error("Redirect resolution timeout, using original URL:", redirectError)
        // Fall back to original URL
      }

      const urlToAnalyze = redirectInfo.finalUrl

      // Step 2: Run local URL analysis on final destination
      const localResult = performLocalURLAnalysis(urlToAnalyze)
      
      // Add redirect info to result
      localResult.redirectChain = redirectInfo.redirectChain
      localResult.finalDestination = redirectInfo.finalUrl
      localResult.isShortened = redirectInfo.isShortened

      // If shortened URL redirects to something dangerous, add indicator
      if (redirectInfo.isShortened && redirectInfo.redirectChain.length > 1) {
        localResult.indicators.unshift(
          `🔗 SHORTENED URL: Redirects to ${redirectInfo.finalUrl}`
        )
      }

      // Step 3: Get Gemini's final verdict (analyze final destination)
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

      if (!apiKey) {
        return NextResponse.json({
          ...localResult,
          aiAnalysis: "⚠️ API key not configured. Using local analysis only.",
          geminiVerdict: localResult.riskLevel,
        }, { status: 200 })
      }

      let geminiVerdictData
      try {
        geminiVerdictData = await Promise.race([
          getGeminiURLAnalysis(urlToAnalyze, localResult),
          new Promise<{ verdict: "safe" | "suspicious" | "dangerous"; explanation: string }>((_, reject) => 
            setTimeout(() => reject(new Error('Gemini analysis timeout')), 22000)
          )
        ])
      } catch (geminiError) {
        console.error("Gemini analysis error or timeout:", geminiError)
        // Fall back to local analysis
        geminiVerdictData = {
          verdict: localResult.riskLevel,
          explanation: localResult.reason
        }
      }

      // FINAL RESULT: Gemini's verdict is what user sees
      const result: URLCheckResult = {
        url: url, // Original URL
        isSafe: geminiVerdictData.verdict === "safe",
        riskLevel: geminiVerdictData.verdict,
        riskScore: geminiVerdictData.verdict === "dangerous" ? 85 : geminiVerdictData.verdict === "suspicious" ? 60 : 15,
        indicators: localResult.indicators,
        redirectChain: redirectInfo.redirectChain,
        finalDestination: redirectInfo.finalUrl,
        isShortened: redirectInfo.isShortened,
        reason: geminiVerdictData.explanation,
        aiAnalysis: geminiVerdictData.explanation,
        geminiVerdict: geminiVerdictData.verdict,
      }

      return NextResponse.json(result, { status: 200 })
    } catch (innerError) {
      console.error("URL check processing error:", innerError)
      // Return error response with proper JSON
      return NextResponse.json(
        {
          error: "Failed to check URL",
          message: innerError instanceof Error ? innerError.message : "Unknown error",
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("URL check request parsing error:", error)
    // Ensure we return valid JSON even on parse errors
    return NextResponse.json(
      {
        error: "Invalid request format",
        message: error instanceof Error ? error.message : "Failed to parse request",
      },
      { status: 400 }
    )
  }
}

export const maxDuration = 30
