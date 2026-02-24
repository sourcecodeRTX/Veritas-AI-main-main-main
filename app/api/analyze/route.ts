import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { extractArticle } from "@/lib/article-extractor"
import { searchFactChecks, searchTavily } from "@/lib/tavily-search"

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set")
}

// Schema for the structured response from Gemini
const analysisSchema = z.object({
  verdict: z
    .string()
    .describe('Overall authenticity verdict (e.g., "Highly Authentic", "Likely Misleading", "Unverified")'),
  confidence: z.number().min(0).max(100).describe("Confidence score as a percentage"),
  summary: z.string().describe("Concise summary of the article content"),
  claims: z
    .array(
      z.object({
        text: z.string().describe("The specific claim from the article"),
        status: z.enum(["verified", "contradicted", "unverified"]).describe("Verification status of the claim"),
        explanation: z.string().describe("Explanation of why the claim received this status"),
      }),
    )
    .describe("Analysis of key claims in the article"),
  reasoning: z.string().describe("Detailed reasoning for the overall verdict"),
  sources: z
    .array(
      z.object({
        title: z.string().describe("Title of the source"),
        url: z.string().describe("URL of the source"),
      }),
    )
    .describe("External sources used for verification"),
})

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Fallback analysis generator when external APIs fail
 * Provides basic text analysis without AI dependencies
 */
function generateFallbackAnalysis(
  articleText: string,
  sourceUrl?: string,
  metadata?: { title?: string; author?: string; publishDate?: string } | null
): z.infer<typeof analysisSchema> {
  // Extract claims from text (simple sentence extraction)
  const sentences = articleText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300)
    .slice(0, 5) // Take first 5 substantial sentences

  const claims = sentences.map((sentence, index) => ({
    text: sentence,
    status: "unverified" as const,
    explanation: "Unable to verify this claim due to service unavailability. External fact-checking services are temporarily offline. Please verify this information through authoritative sources."
  }))

  // Analyze URL for credibility indicators
  let sourceTrust = "unknown"
  let domainInfo = ""
  
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl)
      const domain = url.hostname.toLowerCase()
      
      // Check for known credible domains
      const trustedDomains = [
        'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'cnn.com',
        'theguardian.com', 'nytimes.com', 'washingtonpost.com', 'wsj.com',
        'npr.org', 'bloomberg.com', 'economist.com', 'nature.com', 'science.org'
      ]
      
      const isTrusted = trustedDomains.some(d => domain.includes(d))
      sourceTrust = isTrusted ? "recognized news organization" : "requires verification"
      domainInfo = `Source domain: ${domain}`
    } catch (e) {
      domainInfo = "Unable to parse source URL"
    }
  }

  // Generate confidence based on available information
  const hasMetadata = !!metadata?.title || !!metadata?.author
  const hasSource = !!sourceUrl
  const isLongEnough = articleText.length > 500
  
  let confidence = 40 // Base confidence for fallback mode
  if (hasMetadata) confidence += 15
  if (hasSource && sourceTrust === "recognized news organization") confidence += 25
  if (isLongEnough) confidence += 10

  // Generate summary (first 250 characters of clean text)
  const summary = articleText.substring(0, 250).trim() + "..."

  return {
    verdict: sourceTrust === "recognized news organization" 
      ? "Partially Authentic - Verification Limited"
      : "Unverified - External Services Unavailable",
    confidence: Math.min(confidence, 65), // Cap at 65% for fallback mode
    summary: `${metadata?.title || "Article"}: ${summary}\n\nNote: This is a limited analysis generated without AI assistance due to temporary service unavailability. ${domainInfo}`,
    claims,
    reasoning: `FALLBACK ANALYSIS MODE ACTIVE

This analysis was generated with limited capabilities due to temporary unavailability of external AI and fact-checking services. The assessment is based on basic text analysis and source domain recognition.

LIMITATIONS:
- No external fact-checking databases accessed
- No AI-powered claim verification
- No cross-referencing with authoritative sources
- No deep semantic analysis

SOURCE ANALYSIS:
${domainInfo}
Source trust level: ${sourceTrust}

CONTENT OVERVIEW:
Article length: ${articleText.length} characters
Identified claims: ${claims.length}
${metadata?.title ? `Title: ${metadata.title}` : ''}
${metadata?.author ? `Author: ${metadata.author}` : ''}
${metadata?.publishDate ? `Published: ${metadata.publishDate}` : ''}

RECOMMENDATION:
Due to service limitations, please verify this information through multiple authoritative sources:
1. Check fact-checking websites (Snopes, FactCheck.org, PolitiFact)
2. Search for coverage from multiple reputable news organizations
3. Look for primary sources and official statements
4. Verify any statistics or quotes through original sources
5. Consider the publication date and current relevance

This fallback analysis serves as a starting point only. Always practice critical media literacy and cross-reference important information.`,
    sources: sourceUrl ? [
      {
        title: metadata?.title || "Original Article",
        url: sourceUrl
      }
    ] : []
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Generative AI API key is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const body = await request.json()
    const { text, url } = body

    if (!text && !url) {
      return NextResponse.json({ error: "Either article text or URL must be provided." }, { status: 400 })
    }

    let articleText = text
    const sourceUrl = url
    let extractionMetadata = null

    // If URL is provided, extract text using our multi-tier extractor
    if (url && !text) {
      try {
        const extraction = await extractArticle(url)
        articleText = extraction.content
        extractionMetadata = {
          title: extraction.title,
          author: extraction.author,
          publishDate: extraction.publishDate
        }
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to extract text from URL" },
          { status: 400 },
        )
      }
    }

    if (!articleText || articleText.trim().length < 50) {
      return NextResponse.json(
        {
          error: "Article text is too short for meaningful analysis. Please provide a longer article or check the URL.",
        },
        { status: 400 },
      )
    }

    // Truncate very long articles to prevent token limits
    if (articleText.length > 50000) {
      articleText = articleText.substring(0, 50000) + "...\n\n[Article truncated for analysis]"
    }

    // Use Tavily for comprehensive web search and fact-checking
    let webSearchContext = ''
    
    // Fire off searches in background with timeout protection
    const searchTimeoutMs = 8000; // 8 seconds max for searches
    if (sourceUrl || articleText) {
      try {
        const searchQuery = extractionMetadata?.title || articleText.substring(0, 200)
        
        // Create race: searches vs timeout
        const searchPromise = Promise.all([
          searchFactChecks(searchQuery).catch(() => null),
          sourceUrl ? searchTavily(new URL(sourceUrl).hostname).catch(() => null) : Promise.resolve(null)
        ]);
        
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([null, null]), searchTimeoutMs));
        
        const [factCheckResponse, newsResponse] = await Promise.race([searchPromise, timeoutPromise]) as any;
        
        const contexts = []
        
        if (factCheckResponse && factCheckResponse.results && factCheckResponse.results.length > 0) {
          const topFactChecks = factCheckResponse.results.slice(0, 3)
          contexts.push('FACT-CHECK RESULTS:\n' + topFactChecks.map((fc: any, i: number) => 
            `${i + 1}. ${fc.title}\n   Source: ${fc.url}\n   Finding: ${fc.content?.substring(0, 250) || 'N/A'}...`
          ).join('\n'))
        }
        
        if (newsResponse && newsResponse.results && newsResponse.results.length > 0) {
          const topNews = newsResponse.results.slice(0, 2)
          contexts.push('RELATED NEWS:\n' + topNews.map((n: any, i: number) => 
            `${i + 1}. ${n.title}\n   Source: ${n.url}\n   Context: ${n.content?.substring(0, 200) || 'N/A'}...`
          ).join('\n'))
        }
        
        if (contexts.length > 0) {
          webSearchContext = '\n\n--- WEB SEARCH VERIFICATION (via Tavily AI) ---\n' + contexts.join('\n\n') + '\n--- END WEB SEARCH ---\n'
        }
      } catch (error) {
        console.log('[Tavily] Web search failed or timed out:', error)
      }
    }

    const prompt = `You are a professional fact-checker and news authenticity analyst with expertise in journalism, media literacy, and information verification. Your role is to provide accurate, evidence-based assessments of news articles.

${sourceUrl ? `SOURCE URL: ${sourceUrl}\n` : ""}${extractionMetadata?.title ? `TITLE: ${extractionMetadata.title}\n` : ""}${extractionMetadata?.author ? `AUTHOR: ${extractionMetadata.author}\n` : ""}${extractionMetadata?.publishDate ? `PUBLISHED: ${extractionMetadata.publishDate}\n` : ""}${webSearchContext}

ARTICLE TO ANALYZE:
${articleText}

ANALYSIS FRAMEWORK:

1. CONTENT ASSESSMENT:
   - Identify the main claims, facts, and assertions
   - Distinguish between factual statements and opinions/analysis
   - Check for proper attribution and sourcing within the article
   - Evaluate the logical consistency of the narrative

2. SOURCE CREDIBILITY:
   - Assess the reputation and track record of the publication
   - Consider the author's credentials and expertise
   - Evaluate the publication date and timeliness
   - Check for editorial standards and correction policies

3. FACT VERIFICATION:
   - Cross-reference key claims with authoritative sources
   - Look for corroboration from multiple independent sources
   - Check official statements, government records, or primary sources
   - Verify quotes, statistics, and specific details

4. BIAS AND PRESENTATION:
   - Identify potential bias in language or framing
   - Check for balanced reporting and multiple perspectives
   - Look for sensationalism or misleading headlines
   - Assess whether context is appropriately provided

AUTHENTICITY SCALE:
- "Highly Authentic" (90-100%): Well-sourced, verified facts, reputable publication, balanced reporting
- "Mostly Authentic" (70-89%): Generally accurate with minor issues or unverified details
- "Partially Authentic" (50-69%): Mix of accurate and questionable information
- "Likely Misleading" (30-49%): Significant inaccuracies, poor sourcing, or biased presentation
- "Highly Misleading" (10-29%): Mostly false information or deliberately deceptive
- "Unverified" (0-9%): Insufficient information to make a determination

IMPORTANT GUIDELINES:
- Be conservative in your assessments - err on the side of caution
- Consider the difference between "unverified" and "false" - lack of evidence is not proof of falsehood
- Legitimate news sources can have different perspectives while still being authentic
- Focus on factual accuracy rather than political or ideological alignment
- Consider the article's purpose (news reporting vs. opinion vs. analysis)
- Account for the complexity of breaking news where details may still be emerging

For each claim analysis:
- "verified": Confirmed by multiple reliable sources or official records
- "contradicted": Directly refuted by credible evidence
- "unverified": Insufficient evidence available, but not necessarily false

Provide specific, actionable reasoning for your assessment. Include relevant source URLs that support your analysis.`

    // Use stable Gemini 2.0 Flash (better free tier limits)
    const googleClient = google("gemini-2.0-flash")

    // Try to generate structured analysis using Gemini
    let result
    try {
      result = await generateObject({
        model: googleClient,
        schema: analysisSchema,
        prompt,
        temperature: 0.1, // Lower temperature for more consistent and accurate results
        maxRetries: 3,
        experimental_telemetry: {
          isEnabled: false,
        },
      })
      
      return NextResponse.json(result.object)
    } catch (geminiError) {
      console.error("[Gemini] AI analysis failed, attempting fallback:", geminiError)
      
      // FALLBACK MECHANISM: Generate basic report without external AI
      // This ensures the app always provides some analysis even if all APIs fail
      const fallbackAnalysis = generateFallbackAnalysis(articleText, sourceUrl, extractionMetadata)
      console.log("[Fallback] Generated fallback analysis due to AI service failure")
      return NextResponse.json(fallbackAnalysis)
    }
  } catch (error) {
    console.error("Analysis error:", error)

    // Handle specific AI SDK errors
    if (error instanceof Error) {
      // Handle model overload errors
      if (error.message.includes("overloaded") || error.message.includes("503")) {
        return NextResponse.json(
          {
            error:
              "The AI service is currently experiencing high demand. Please wait a moment and try again. If the issue persists, try again in a few minutes.",
          },
          { status: 503 },
        )
      }
      if (error.message.includes("API key") || error.message.includes("authentication")) {
        return NextResponse.json(
          {
            error:
              "Google Generative AI API key is missing or invalid. Please check your GOOGLE_GENERATIVE_AI_API_KEY environment variable.",
          },
          { status: 500 },
        )
      }
      if (error.message.includes("rate limit") || error.message.includes("quota")) {
        return NextResponse.json(
          { error: "Service temporarily unavailable due to high demand. Please try again in a few minutes." },
          { status: 429 },
        )
      }
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Analysis timed out. Please try again with a shorter article." },
          { status: 408 },
        )
      }
    }

    return NextResponse.json(
      { error: "Analysis failed due to an unexpected error. Please try again later." },
      { status: 500 },
    )
  }
}
