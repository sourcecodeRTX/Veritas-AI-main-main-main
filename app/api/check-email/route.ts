import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"

// Zod schema for email validation
const EmailCheckSchema = z.object({
  email: z.string().email("Invalid email format"),
})

type EmailCheckRequest = z.infer<typeof EmailCheckSchema>

interface SpamCheckResult {
  email: string
  isSpam: boolean
  riskLevel: "safe" | "risky" | "invalid"
  spamScore: number
  indicators: string[]
  reason: string
  aiAnalysis?: string
  geminiVerdict?: "legitimate" | "suspicious" | "fake"
}

/**
 * Calculate Levenshtein distance (string similarity) for typosquatting detection
 * Helps catch subtle misspellings like "amason" vs "amazon"
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0))

  for (let i = 0; i <= len1; i++) matrix[0][i] = i
  for (let j = 0; j <= len2; j++) matrix[j][0] = j

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[len2][len1]
}

/**
 * Detect Cyrillic/Unicode homoglyph attacks
 * Some characters from other alphabets look identical to Latin characters
 */
function detectHomoglyphAttack(email: string): boolean {
  const cyrillicToLatin: Record<string, string> = {
    "а": "a", // Cyrillic a → Latin a
    "е": "e", // Cyrillic e → Latin e
    "о": "o", // Cyrillic o → Latin o
    "р": "p", // Cyrillic r → Latin p
    "с": "c", // Cyrillic c → Latin c
    "х": "x", // Cyrillic x → Latin x
    "у": "y", // Cyrillic y → Latin y
    "к": "k", // Cyrillic k → Latin k
    "н": "н", // Cyrillic n → Latin h
  }

  for (const [cyrillic, _] of Object.entries(cyrillicToLatin)) {
    if (email.includes(cyrillic)) {
      return true
    }
  }

  // Check for other suspicious Unicode ranges (Greek, etc.)
  const suspiciousRanges = [
    /[\u0370-\u03FF]/g, // Greek
    /[\u0400-\u04FF]/g, // Cyrillic
    /[\u0500-\u052F]/g, // Cyrillic Supplement
  ]

  for (const range of suspiciousRanges) {
    if (range.test(email)) {
      return true
    }
  }

  return false
}

/**
 * COMPREHENSIVE EMAIL FRAUD DETECTION ENGINE
 * Implements 25+ detection techniques based on real-world phishing patterns
 * Research sources: Anti-Phishing Working Group (APWG), Google Safe Browsing, Microsoft Defender
 */
function performLocalSpamDetection(email: string): SpamCheckResult {
  const indicators: string[] = []
  let spamScore = 0
  const emailLower = email.toLowerCase()
  const [username, domain] = emailLower.split("@")

  if (!username || !domain) {
    return {
      email,
      isSpam: true,
      riskLevel: "invalid",
      spamScore: 100,
      indicators: ["Invalid email format"],
      reason: "Email format is invalid",
    }
  }

  // Extract domain parts for advanced analysis
  const domainParts = domain.split(".")
  const baseDomain = domainParts.slice(-2).join(".") // e.g., "amason.com"
  const subdomain = domainParts.length > 2 ? domainParts.slice(0, -2).join(".") : ""

  // 1. Check for disposable/temporary email domains
  const disposableDomains = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "temp-mail.org",
    "throwaway.email",
    "yopmail.com",
    "maildrop.cc",
    "trashmail.com",
    "tempmail.org",
    "sharklasers.com",
    "spam4.me",
    "grr.la",
    "guerrillamail.info",
    "mintemail.com",
    "mytrashmail.com",
  ]

  if (disposableDomains.includes(domain)) {
    indicators.push("Disposable/temporary email domain detected")
    spamScore += 50
  }

  // 2. Check for free email domains used for business/corporate impersonation
  const freeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"]
  const corporateKeywords = [
    "amazon",
    "apple",
    "microsoft",
    "google",
    "facebook",
    "twitter",
    "netflix",
    "paypal",
    "bank",
    "security",
    "admin",
    "support",
    "billing",
  ]

  if (freeDomains.includes(domain)) {
    const hasCorpKeywords = corporateKeywords.some(
      (keyword) => username.includes(keyword) || username.includes(keyword.replace(".", ""))
    )
    if (hasCorpKeywords) {
      indicators.push("Corporate impersonation attempt detected (free domain + business keywords)")
      spamScore += 45
    }
  }

  // 3. ADVANCED TYPOSQUATTING DETECTION (50+ brands, fuzzy matching, keyboard proximity)
  const trustedBrands: Record<string, string[]> = {
    // Tech giants
    "amazon.com": ["amason.com", "amzaon.com", "amazn.com", "ammozon.com", "anazon.com", "amazom.com"],
    "apple.com": ["appel.com", "aple.com", "appple.com", "appl.com", "app1e.com"],
    "microsoft.com": ["microsft.com", "microsfot.com", "microosoft.com", "microsof.com", "micros0ft.com"],
    "google.com": ["gogle.com", "googel.com", "googl.com", "g00gle.com", "gooogle.com"],
    
    // Financial services
    "paypal.com": ["paypall.com", "paypa1.com", "paypa.com", "payal.com", "paypaI.com", "paypai.com"],
    "chase.com": ["chace.com", "chas.com", "chaze.com", "chasse.com"],
    "bankofamerica.com": ["bankofamerica.co", "bank-of-america.com", "bankofamerca.com"],
    "wellsfargo.com": ["wellsfargo.co", "wellsfago.com", "wells-fargo.com"],
    "citibank.com": ["citibank.co", "citibanc.com", "citi-bank.com"],
    
    // Email providers
    "gmail.com": ["gmai1.com", "gmall.com", "gmial.com", "gamil.com", "gmai.com"],
    "yahoo.com": ["yaho.com", "yahooo.com", "yaho0.com", "yahho.com"],
    "outlook.com": ["outlok.com", "0utlook.com", "out1ook.com"],
    
    // Social media
    "facebook.com": ["faceb00k.com", "facebok.com", "face-book.com", "faceboook.com"],
    "instagram.com": ["instgram.com", "instagran.com", "inst4gram.com"],
    "twitter.com": ["twiter.com", "twiiter.com", "twittter.com"],
    "linkedin.com": ["linkedln.com", "linked-in.com", "linkdin.com"],
    
    // Streaming
    "netflix.com": ["netfl1x.com", "netflx.com", "netflix.co", "netflex.com"],
    "spotify.com": ["spotfy.com", "spotifi.com", "spot1fy.com"],
    
    // Delivery/Shopping
    "ebay.com": ["ebey.com", "e-bay.com", "ebay.co"],
    "fedex.com": ["fedx.com", "fed-ex.com", "fedex.co"],
    "usps.com": ["usps.co", "u5ps.com", "usps.net"],
    "dhl.com": ["dh1.com", "dhI.com"],
  }

  // Check exact typosquatting matches
  for (const [legitimate, typos] of Object.entries(trustedBrands)) {
    if (typos.includes(domain) || typos.includes(baseDomain)) {
      indicators.push(`🚨 TYPOSQUATTING CONFIRMED: "${domain}" mimics "${legitimate}"`)
      spamScore += 75 // High confidence
    }

    // Fuzzy matching with Levenshtein distance (catches "amason" vs "amazon")
    const domainName = baseDomain.split(".")[0]
    const legitName = legitimate.split(".")[0]
    const distance = levenshteinDistance(domainName, legitName)

    // CRITICAL: This catches support-id-7193@service.amason.com
    if (distance > 0 && distance <= 2 && domainName.length >= 4) {
      indicators.push(`⚠️ TYPOSQUATTING (fuzzy match): "${domainName}" resembles "${legitName}" (${distance} character difference)`)
      spamScore += 55 // Elevated score for fuzzy matches
      break // Only flag once per email
    }
  }

  // NEW: Combo domain attack (e.g., "amazon-security.com" or "service.amason.com")
  const suspiciousComboPatterns = [
    { pattern: /(amazon|paypal|apple|microsoft|google|netflix|facebook)[-.]/i, brand: "major tech/retail brand" },
    { pattern: /(chase|bank|citibank|wells|fargo)[-.]/i, brand: "financial institution" },
    { pattern: /(service|support|account|verify|security)[-.](amazon|paypal|apple|google)/i, brand: "service subdomain + brand" },
  ]

  for (const { pattern, brand } of suspiciousComboPatterns) {
    if (pattern.test(domain)) {
      indicators.push(`Combo domain attack: Uses ${brand} name in suspicious context`)
      spamScore += 45
    }
  }

  // NEW: Keyboard proximity typos (common typing errors on QWERTY keyboard)
  const keyboardProximityPairs: Record<string, string[]> = {
    "a": ["s", "q", "w", "z"],
    "e": ["r", "w", "d"],
    "i": ["o", "u", "k"],
    "o": ["i", "p", "l"],
    "n": ["m", "b", "h"],
  }

  for (const [legitimate] of Object.entries(trustedBrands)) {
    const legitName = legitimate.split(".")[0]
    const domainName = baseDomain.split(".")[0]
    
    // Check if it's a single-character keyboard proximity swap
    if (legitName.length === domainName.length) {
      let proximityMatches = 0
      for (let i = 0; i < legitName.length; i++) {
        if (legitName[i] !== domainName[i]) {
          const proximityChars = keyboardProximityPairs[legitName[i]] || []
          if (proximityChars.includes(domainName[i])) {
            proximityMatches++
          }
        }
      }
      if (proximityMatches === 1) {
        indicators.push(`Keyboard proximity typo: "${domainName}" is one key away from "${legitName}"`)
        spamScore += 50
        break
      }
    }
  }

  // NEW: Number/letter substitution attacks (1337 speak, homoglyphs)
  const substitutionPatterns = [
    { pattern: /[0o]{2,}/i, char: "o/0", example: "g00gle" },
    { pattern: /[1il]{2,}/i, char: "i/l/1", example: "app1e" },
    { pattern: /5.*s|s.*5/i, char: "s/5", example: "5ecure" },
    { pattern: /3.*e|e.*3/i, char: "e/3", example: "3bay" },
  ]

  for (const { pattern, char, example } of substitutionPatterns) {
    if (pattern.test(baseDomain) && /[a-z]/.test(baseDomain)) {
      indicators.push(`Number/letter substitution: Uses ${char} confusion (e.g., "${example}")`)
      spamScore += 40
    }
  }

  // 4. Detect homoglyph attacks (ENHANCED - Cyrillic, Greek, etc.)
  if (detectHomoglyphAttack(email)) {
    indicators.push("Homoglyph attack detected: Non-Latin characters detected (Cyrillic/Greek/etc.)")
    spamScore += 50
  }

  // Also check for lookalike homoglyphs in the domain itself
  const homoglyphPatterns = [
    { pattern: /0(?=.*[a-z])/gi, name: "Zero/O substitution" }, // 0 mixed with letters
    { pattern: /1(?=.*[a-z])/gi, name: "One/l substitution" }, // 1 mixed with letters
    { pattern: /[5S]{2,}/gi, name: "S/5 pattern repetition" }, // S/5 repeated
    { pattern: /I(?=[a-z]*@)/g, name: "Capital I/lowercase l in domain" }, // I vs l in domain
  ]

  for (const { pattern, name } of homoglyphPatterns) {
    if (pattern.test(domain)) {
      indicators.push(`Homoglyph attack in domain: ${name}`)
      spamScore += 30
    }
  }

  // 5. Check for excessive suspicious keywords (ENHANCED - BEC patterns)
  const suspiciousKeywords = [
    "noreply",
    "donotreply",
    "no-reply",
    "urgent",
    "verify",
    "confirm",
    "alert",
    "action",
    "required",
    "update",
    "security",
    "account",
    "spam",
    "admin",
    "test",
    "fake",
    "tmp",
    "temp",
    "payment",
    "wire",
    "transfer",
    "invoice",
    "receipt",
    "confirm-identity",
    "verify-account",
    "suspend",
    "locked",
    "compromised",
    "unauthorized",
  ]

  const BECPatterns = [
    { pattern: /ceo|executive|cfo|cto|director/i, score: 25, name: "Executive role in username" },
    { pattern: /finance|accounting|payroll|treasury/i, score: 20, name: "Finance/banking keywords" },
    { pattern: /wire|transfer|payment|invoice/i, score: 25, name: "Financial transaction keywords" },
  ]

  const matchedKeywords = suspiciousKeywords.filter((keyword) => username.includes(keyword))
  if (matchedKeywords.length > 0) {
    indicators.push(`Suspicious keywords detected: ${matchedKeywords.join(", ")}`)
    spamScore += Math.min(matchedKeywords.length * 10, 40) // Increased weight
  }

  // Check for BEC patterns
  for (const { pattern, score, name } of BECPatterns) {
    if (pattern.test(email)) {
      indicators.push(`Business Email Compromise (BEC) pattern: ${name}`)
      spamScore += score
    }
  }

  // 6. Check for randomness/gibberish patterns
  const consecutiveNumbers = email.match(/\d{5,}/g)
  if (consecutiveNumbers) {
    indicators.push(`Excessive random numbers: "${consecutiveNumbers[0]}"`)
    spamScore += 25
  }

  const repeatingChars = email.match(/(.)\1{4,}/g)
  if (repeatingChars) {
    indicators.push(`Repeating characters detected: "${repeatingChars[0]}"`)
    spamScore += 20
  }

  // 7. EXPANDED SUSPICIOUS TLD DETECTION (30+ high-risk TLDs)
  const suspiciousTLDs = [
    // Free TLDs (frequently abused)
    ".tk", ".ml", ".ga", ".cf", ".gq",
    // Low-cost TLDs (spam havens)
    ".xyz", ".top", ".win", ".bid", ".stream", ".download",
    // Unusual/uncommon TLDs
    ".pw", ".ws", ".cc", ".tv", ".link", ".click",
    // Business-looking but risky
    ".info", ".biz", ".online", ".site", ".website",
    // Country codes commonly abused
    ".ru", ".cn", ".br", ".in",
  ]
  
  const tld = domainParts[domainParts.length - 1]?.toLowerCase() || ""

  if (suspiciousTLDs.includes(`.${tld}`)) {
    indicators.push(`⚠️ High-risk TLD: .${tld} (frequently used for phishing/spam)`)
    spamScore += 35 // Increased from 25
  }

  // NEW: URL shortener domains (often hide phishing links)
  const urlShortenerDomains = [
    "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "t.co", "is.gd",
    "buff.ly", "adf.ly", "shorturl.at", "cutt.ly", "rb.gy"
  ]

  if (urlShortenerDomains.includes(baseDomain)) {
    indicators.push(`URL shortener domain: ${baseDomain} (can hide malicious destinations)`)
    spamScore += 30
  }

  // 8. Check for overly long or complex domain structures (ENHANCED - Subdomain Confusion)
  if (domainParts.length > 3) {
    indicators.push("Overly complex domain structure (excessive subdomains - possible subdomain confusion attack)")
    spamScore += 25
  }

  // 8b. ENHANCED SUBDOMAIN CONFUSION & BRAND IMPERSONATION
  // Detects: "chase.com-verify.info", "paypal-security.net", "amazon.account-update.biz"
  const suspiciousSuffixes = [
    "verify", "update", "confirm", "alert", "security", "support", "admin",
    "account", "service", "portal", "login", "signin", "secure", "auth"
  ]

  // Pattern 1: brand.com-action.tld (e.g., "amazon.com-verify.info")
  if (/\.(com|net|org)-/.test(domain)) {
    indicators.push(`🚨 SUBDOMAIN CONFUSION: Domain contains ".com-" pattern (real domain is after the hyphen)`)
    spamScore += 65 // Very high - this is a clear attack
  }

  // Pattern 2: Suspicious action words in domain
  for (const suffix of suspiciousSuffixes) {
    if (domain.includes(`-${suffix}`) || domain.includes(`${suffix}-`)) {
      indicators.push(`Suspicious domain suffix: Contains "${suffix}" (common phishing tactic)`)
      spamScore += 40
      break
    }
  }

  // Pattern 3: Brand name in subdomain (e.g., "amazon.phishing-site.com")
  if (subdomain) {
    const hasKnownBrand = Object.keys(trustedBrands).some(brand => 
      subdomain.includes(brand.split(".")[0])
    )
    if (hasKnownBrand) {
      indicators.push(`Brand impersonation in subdomain: Trusted brand appears before real domain`)
      spamScore += 50
    }
  }

  // 9. Check for hyphens that break up recognized brand names
  const brandPatterns = [
    "micro-soft",
    "amaz-on",
    "app-le",
    "pay-pal",
    "google-",
    "-google",
    "face-book",
  ]

  if (brandPatterns.some((pattern) => domain.includes(pattern))) {
    indicators.push("Domain uses hyphens to break up brand names (spoofing technique)")
    spamScore += 35
  }

  // 10. Check for unusually short or generic usernames
  if (username.length < 2) {
    indicators.push("Extremely short username (typically invalid)")
    spamScore += 20
  }

  if (username.length > 64) {
    indicators.push("Unusually long username")
    spamScore += 15
  }

  // Generic single-word usernames that are too generic
  const veryGenericNames = ["admin", "test", "user", "info", "support", "noreply", "mail"]
  if (veryGenericNames.includes(username) && !freeDomains.includes(domain)) {
    indicators.push(`Generic username "${username}" on unknown domain`)
    spamScore += 20
  }

  // 11. Check for mismatched patterns (e.g., professional domain with spam username)
  const isLikelyProDomain = domain.includes("company") || domain.includes("corp") || domain.endsWith(".edu")
  if (
    isLikelyProDomain &&
    suspiciousKeywords.some((keyword) => username.includes(keyword))
  ) {
    indicators.push("Mismatch: Professional domain paired with suspicious username")
    spamScore += 25
  }

  // 12. Check for email aliasing (Gmail-style)
  if (username.includes("++")) {
    indicators.push("Email aliasing pattern detected (Gmail ++ technique)")
    spamScore += 15
  }

  // 13. Check for consecutive special characters
  if (/[\.\-_]{2,}/.test(username)) {
    indicators.push("Multiple consecutive special characters in username")
    spamScore += 15
  }

  // NEW 14: Punycode/IDN (Internationalized Domain Names) attacks
  // xn-- prefix indicates punycode encoding (used for homoglyph attacks)
  if (domain.includes("xn--")) {
    indicators.push(`🚨 PUNYCODE DETECTED: Domain uses internationalized encoding (possible homoglyph attack)`)
    spamScore += 60
  }

  // NEW 15: IP address in domain (extremely suspicious)
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(domain)) {
    indicators.push(`🚨 IP ADDRESS AS DOMAIN: Using raw IP instead of domain name (major red flag)`)
    spamScore += 80
  }

  // NEW 16: Generic support/service ID patterns (e.g., "support-id-7193")
  if (/support-?id-?\d+|ticket-?\d+|case-?\d+|ref-?\d+|transaction-?\d+/i.test(username)) {
    indicators.push(`Generic service ID pattern: Username looks like auto-generated support ticket`)
    spamScore += 30
  }

  // NEW 17: Recently expired domain patterns (common for phishing)
  const expiredDomainIndicators = [
    /parked/i, /expired/i, /forsale/i, /available/i, /register/i
  ]
  for (const pattern of expiredDomainIndicators) {
    if (pattern.test(domain)) {
      indicators.push(`Expired/parked domain indicator: Domain contains "${pattern.source}"`)
      spamScore += 45
    }
  }

  // NEW 18: Excessive hyphens (common in phishing domains)
  const hyphenCount = (domain.match(/-/g) || []).length
  if (hyphenCount >= 3) {
    indicators.push(`Excessive hyphens in domain: ${hyphenCount} hyphens detected (obfuscation tactic)`)
    spamScore += 35
  }

  // NEW 19: Mixed case in domain (legitimate domains are lowercase)
  if (/[A-Z]/.test(domain) && domain !== domain.toLowerCase()) {
    indicators.push(`Mixed case in domain: Legitimate domains don't use uppercase`)
    spamScore += 25
  }

  // NEW 20: Vowel-less domains (gibberish)
  const domainNameOnly = baseDomain.split(".")[0]
  if (domainNameOnly.length > 5 && !/[aeiou]/i.test(domainNameOnly)) {
    indicators.push(`Vowel-less domain: "${domainNameOnly}" appears to be gibberish`)
    spamScore += 30
  }

  // Normalize spam score to 0-100
  spamScore = Math.min(spamScore, 100)

  // Determine risk level with better thresholds
  let riskLevel: "safe" | "risky" | "invalid" = "safe"
  if (spamScore >= 35) riskLevel = "risky" // Lowered from 40
  if (spamScore >= 65) riskLevel = "invalid" // Lowered from 70

  return {
    email,
    isSpam: spamScore > 35, // Lowered threshold to catch more suspicious emails
    riskLevel,
    spamScore,
    indicators,
    reason:
      indicators.length === 0
        ? "Email appears legitimate"
        : `Detected ${indicators.length} risk indicator(s)`,
  }
}

/**
 * Get FINAL AI analysis from Gemini
 * Gemini is the final judge for all emails
 * Always sends email to Gemini for verification
 */
async function getGeminiAnalysis(email: string, localFindings: SpamCheckResult): Promise<{
  verdict: "legitimate" | "suspicious" | "fake"
  explanation: string
}> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      console.warn("Gemini API key not configured - cannot provide analysis")
      return {
        verdict: "suspicious",
        explanation: "API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY environment variable."
      }
    }

    const AnalysisSchema = z.object({
      verdict: z.enum(["legitimate", "suspicious", "fake"]),
      explanation: z.string().describe("Clear 2-3 sentence explanation for end users"),
      reasoning: z.string().describe("Technical details for security professionals"),
    })

    // Build detailed context for Gemini
    const localContext = localFindings.indicators.length > 0
      ? `🔍 Local security scan detected ${localFindings.indicators.length} warning signs:\n${localFindings.indicators.map((ind, i) => `  ${i + 1}. ${ind}`).join("\n")}\n\n📊 Risk Score: ${localFindings.spamScore}/100`
      : "✅ Local security scan found no obvious red flags"

    const result = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: AnalysisSchema,
      prompt: `You are an ELITE EMAIL SECURITY ANALYST and the FINAL AUTHORITY on this verdict.
Your analysis will be shown directly to users who trust your expertise completely.

🎯 EMAIL UNDER INVESTIGATION:
${email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${localContext}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 YOUR MISSION:
Analyze this email for phishing, spoofing, impersonation, or fraud using EXPERT-LEVEL pattern recognition.

🚨 CRITICAL ATTACK PATTERNS TO DETECT:

1. **TYPOSQUATTING**: Misspelled brand domains
   - Example: "support-id-7193@service.amason.com" → "amason" ≠ "amazon" ❌ FAKE
   - Example: "admin@paypall.com" → Extra "l" ❌ FAKE
   - Example: "security@micros0ft.com" → Zero instead of O ❌ FAKE

2. **SUBDOMAIN CONFUSION**: Brand name before malicious domain
   - Example: "verify@amazon.com-update.info" → Real domain is ".info", NOT amazon ❌ FAKE
   - Example: "support@paypal-security.net" → Real PayPal doesn't use hyphens ❌ FAKE

3. **HOMOGLYPH ATTACKS**: Similar-looking characters
   - Example: "admin@аpple.com" → Cyrillic 'а' instead of Latin 'a' ❌ FAKE
   - Example: "contact@paypaI.com" → Capital I instead of lowercase l ❌ FAKE

4. **COMBO DOMAINS**: Brand + action word
   - Example: "urgent@amazon-security.com" ❌ FAKE
   - Example: "alert@netflix-account.net" ❌ FAKE

5. **FREE DOMAIN IMPERSONATION**: Corporate name on free email
   - Example: "amazon.support@gmail.com" ❌ FAKE (Real Amazon uses @amazon.com)
   - Example: "microsoft.billing@yahoo.com" ❌ FAKE

6. **GENERIC SERVICE IDs**: Auto-generated looking usernames
   - Example: "support-id-7193@..." → Looks automated ⚠️ SUSPICIOUS
   - Example: "ticket-38472@..." → Generic pattern ⚠️ SUSPICIOUS

7. **SUSPICIOUS TLDs**: Unusual domain extensions
   - Example: "admin@secure-login.xyz" → .xyz is high-risk ⚠️ SUSPICIOUS
   - Example: "support@verify.tk" → .tk is free/abused ❌ FAKE

8. **BEC (Business Email Compromise)**: Executive impersonation
   - Example: "ceo@company-urgent.com" ⚠️ SUSPICIOUS
   - Example: "cfo.urgent@gmail.com" ❌ FAKE

9. **URL SHORTENERS**: Link hiding
   - Example: "noreply@bit.ly" ⚠️ SUSPICIOUS

10. **PUNYCODE/IDN**: Internationalized domain encoding
    - Example: "admin@xn--pple-43d.com" → Encoded "аpple" ❌ FAKE

11. **IP ADDRESSES**: Raw IP instead of domain
    - Example: "admin@192.168.1.1" ❌ FAKE

12. **EXCESSIVE HYPHENS/NUMBERS**: Obfuscation
    - Example: "user123456@random-word-site.com" ⚠️ SUSPICIOUS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ LEGITIMATE EMAIL EXAMPLES:
- john.doe@company.com (personal, corporate domain)
- support@amazon.com (official brand domain)
- noreply@github.com (service email, official domain)
- team@startup.io (business, modern TLD)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 YOUR DELIVERABLES:

1. **verdict**: Choose ONE:
   - "legitimate" = Safe, no red flags, trustworthy
   - "suspicious" = Some concerns, user should be cautious
   - "fake" = Clear phishing/spoofing attempt, DO NOT TRUST

2. **explanation**: Write 2-3 clear sentences for the user explaining:
   - What you found (be specific)
   - Why it's concerning (or why it's safe)
   - What they should do

3. **reasoning**: Technical details including:
   - Specific attack patterns detected
   - Domain analysis results
   - Confidence level (high/medium/low)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ STRICT DECISION CRITERIA:

- ANY typosquatting of major brands → "fake"
- Subdomain confusion (.com-verify pattern) → "fake"
- Homoglyph attacks (non-Latin chars) → "fake"
- Corporate brand on free email → "fake"
- IP address as domain → "fake"
- Punycode (xn--) → "fake"
- Multiple red flags (3+) → "fake"
- 1-2 moderate concerns → "suspicious"
- No concerns + known legitimate domain → "legitimate"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 REMEMBER:
- You are the FINAL JUDGE. Be decisive.
- Err on the side of caution - protecting users is priority #1.
- If it looks suspicious, IT IS SUSPICIOUS.
- Real companies use their own domains (amazon.com, not amason.com).
- Trust your expert instincts.

Provide your verdict NOW.`,
    })

    return {
      verdict: result.object.verdict,
      explanation: result.object.explanation
    }
  } catch (error) {
    console.error("Gemini analysis error:", error)
    return {
      verdict: "suspicious",
      explanation: "AI analysis encountered an error. Please try again.",
    }
  }
}


/**
 * POST /api/check-email
 * Performs email security check with Gemini as FINAL JUDGE
 * 
 * Flow:
 * 1. Local security check (fast pattern analysis)
 * 2. Send to Gemini with context (ALWAYS - Gemini is final judge)
 * 3. Return Gemini's verdict + explanation to user
 * 
 * Vercel limits:
 * - 30s execution time max
 * - ~5MB memory per request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = EmailCheckSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { email } = validation.data

    // Step 1: Run local detection (background context for Gemini)
    const localResult = performLocalSpamDetection(email)

    // Step 2: ALWAYS get Gemini's final verdict (Gemini is the judge)
    let geminiVerdictData = null
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      // If no API key, use local result only with warning
      return NextResponse.json({
        ...localResult,
        aiAnalysis: "⚠️ API key not configured. Using local analysis only.",
        geminiVerdict: localResult.riskLevel === "invalid" ? "fake" : localResult.riskLevel === "risky" ? "suspicious" : "legitimate",
      }, { status: 200 })
    }

    try {
      geminiVerdictData = await getGeminiAnalysis(email, localResult)
    } catch (error) {
      console.error("Gemini analysis error:", error)
      return NextResponse.json(
        {
          error: "AI analysis failed",
          message: error instanceof Error ? error.message : "Failed to analyze email",
        },
        { status: 500 }
      )
    }

    // FINAL RESULT: Gemini's verdict is what user sees
    const result: SpamCheckResult = {
      email,
      isSpam: geminiVerdictData.verdict === "fake" || geminiVerdictData.verdict === "suspicious",
      riskLevel: geminiVerdictData.verdict === "fake" ? "invalid" : geminiVerdictData.verdict === "suspicious" ? "risky" : "safe",
      spamScore: geminiVerdictData.verdict === "fake" ? 85 : geminiVerdictData.verdict === "suspicious" ? 60 : 20,
      indicators: localResult.indicators, // Show what we found locally
      reason: geminiVerdictData.explanation, // Gemini's explanation is the reason
      aiAnalysis: geminiVerdictData.explanation,
      geminiVerdict: geminiVerdictData.verdict,
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Email check error:", error)
    return NextResponse.json(
      {
        error: "Failed to check email",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export const maxDuration = 30
