import { extract } from '@extractus/article-extractor';
import axios from 'axios';

export interface Article {
  title: string;
  content: string;
  author?: string;
  publishDate?: string;
  source?: string;
  success: boolean;
  method: string;
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Method 1: Jina AI Reader (fastest, cleanest)
async function extractWithJina(url: string): Promise<Article> {
  if (!process.env.JINA_AI_API_KEY) {
    throw new Error('Jina AI key not configured');
  }

  try {
    const response = await axios.get(`https://r.jina.ai/${url}`, {
      headers: {
        'Authorization': `Bearer ${process.env.JINA_AI_API_KEY}`,
        'X-Return-Format': 'markdown',
        'Accept': 'text/plain'
      },
      timeout: 8000
    });

    if (response.data && response.data.length > 200) {
      const title = extractTitleFromMarkdown(response.data);
      return {
        title,
        content: response.data,
        success: true,
        method: 'jina'
      };
    }

    throw new Error('Insufficient content returned');
  } catch (error) {
    throw new Error(`Jina extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Method 2: Firecrawl (good for paywalls and JavaScript-heavy sites)
async function extractWithFirecrawl(url: string): Promise<Article> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl key not configured');
  }

  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v0/scrape',
      { 
        url,
        formats: ['markdown']
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    if (response.data?.data?.markdown && response.data.data.markdown.length > 200) {
      return {
        title: response.data.data.metadata?.title || extractTitleFromMarkdown(response.data.data.markdown),
        content: response.data.data.markdown,
        author: response.data.data.metadata?.author,
        publishDate: response.data.data.metadata?.publishedTime,
        source: response.data.data.metadata?.sourceURL,
        success: true,
        method: 'firecrawl'
      };
    }

    throw new Error('Insufficient content returned');
  } catch (error) {
    throw new Error(`Firecrawl extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Method 3: Article Extractor (fast, offline, works for most sites)
async function extractWithArticleExtractor(url: string): Promise<Article> {
  try {
    const article = await extract(url);

    if (article && article.content && article.content.length > 200) {
      return {
        title: article.title || 'Untitled Article',
        content: article.content,
        author: article.author,
        publishDate: article.published,
        source: article.source,
        success: true,
        method: 'article-extractor'
      };
    }

    throw new Error('Insufficient content extracted');
  } catch (error) {
    throw new Error(`Article extractor failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to extract title from markdown
function extractTitleFromMarkdown(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Article';
}

// Main extraction function with automatic fallback chain
export async function extractArticle(url: string): Promise<Article> {
  // Validate URL
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL format. Please provide a valid HTTP or HTTPS URL.');
  }

  // Skip Jina in serverless environments (Vercel/Lambda) due to timeout issues
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  const methods = isServerless
    ? [
        { name: 'Firecrawl', fn: extractWithFirecrawl },
        { name: 'Article Extractor', fn: extractWithArticleExtractor }
      ]
    : [
        { name: 'Jina AI Reader', fn: extractWithJina },
        { name: 'Firecrawl', fn: extractWithFirecrawl },
        { name: 'Article Extractor', fn: extractWithArticleExtractor }
      ];

  const errors: string[] = [];

  for (const method of methods) {
    try {
      console.log(`[Extractor] Trying: ${method.name}`);
      const result = await method.fn(url);
      
      if (result.success && result.content.length > 200) {
        console.log(`[Extractor] ✓ Success with ${method.name} (${result.content.length} chars)`);
        return result;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${method.name}: ${errorMsg}`);
      console.warn(`[Extractor] ✗ ${method.name} failed:`, errorMsg);
      continue;
    }
  }

  throw new Error(
    `All extraction methods failed. Please check the URL and try again.\n\n` +
    `Attempted methods:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
  );
}

// Export for testing individual methods
export const extractors = {
  jina: extractWithJina,
  firecrawl: extractWithFirecrawl,
  articleExtractor: extractWithArticleExtractor
};
