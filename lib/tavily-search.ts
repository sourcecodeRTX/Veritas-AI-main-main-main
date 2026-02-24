import axios from 'axios';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilyResponse {
  answer?: string;
  results: TavilySearchResult[];
  responseTime: number;
}

/**
 * Search the web using Tavily AI (optimized for AI/LLM use)
 * Free tier: 1000 searches/month
 */
export async function searchTavily(
  query: string,
  options: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
    includeAnswer?: boolean;
  } = {}
): Promise<TavilyResponse | null> {
  if (!process.env.TAVILY_API_KEY) {
    console.warn('[Tavily] API key not configured, skipping search');
    return null;
  }

  try {
    const {
      searchDepth = 'advanced',
      maxResults = 5,
      includeDomains,
      excludeDomains,
      includeAnswer = true
    } = options;

    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer,
        include_domains: includeDomains,
        exclude_domains: excludeDomains,
        include_raw_content: false,
        include_images: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log(`[Tavily] Search successful for: "${query}" (${response.data.results?.length || 0} results)`);

    return {
      answer: response.data.answer,
      results: response.data.results || [],
      responseTime: response.data.response_time || 0
    };
  } catch (error) {
    console.error('[Tavily] Search failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Search for fact-checks specifically on trusted fact-checking sites
 */
export async function searchFactChecks(claim: string): Promise<TavilyResponse | null> {
  return searchTavily(`fact check: ${claim}`, {
    searchDepth: 'advanced',
    maxResults: 5,
    includeDomains: [
      'snopes.com',
      'factcheck.org',
      'politifact.com',
      'reuters.com',
      'apnews.com',
      'fullfact.org',
      'factcheck.afp.com',
      'www.bbc.com/news/reality_check'
    ],
    includeAnswer: true
  });
}

/**
 * Search for recent news about a topic
 */
export async function searchNews(topic: string): Promise<TavilyResponse | null> {
  return searchTavily(`${topic} news`, {
    searchDepth: 'basic',
    maxResults: 10,
    includeDomains: [
      'reuters.com',
      'apnews.com',
      'bbc.com',
      'theguardian.com',
      'nytimes.com',
      'washingtonpost.com',
      'cnn.com',
      'bloomberg.com'
    ],
    includeAnswer: false
  });
}

/**
 * Verify a claim by searching for evidence
 */
export async function verifyClaimWithSources(claim: string): Promise<{
  factCheckSources: TavilySearchResult[];
  newsSources: TavilySearchResult[];
  aiSummary?: string;
}> {
  console.log(`[Verification] Verifying claim: "${claim.substring(0, 100)}..."`);

  // Search fact-checking sites
  const factCheckResults = await searchFactChecks(claim);
  
  // Search news sources
  const newsResults = await searchNews(claim);

  return {
    factCheckSources: factCheckResults?.results || [],
    newsSources: newsResults?.results.slice(0, 5) || [],
    aiSummary: factCheckResults?.answer
  };
}

/**
 * Get AI-powered summary for a query
 */
export async function getAISummary(query: string): Promise<string | null> {
  const result = await searchTavily(query, {
    searchDepth: 'advanced',
    maxResults: 5,
    includeAnswer: true
  });

  return result?.answer || null;
}
