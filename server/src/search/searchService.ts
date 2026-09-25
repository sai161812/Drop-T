import { v4 as uuidv4 } from 'uuid';
import { Product, CompetitorReference, SearchProviderStatus, EvidenceType } from '@droptest/shared';
import { config } from '../config.js';

interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain?: string;
}

export class SearchService {
  /**
   * Check status of search provider integrations
   */
  static getProviderStatus(): SearchProviderStatus {
    if (config.braveSearchApiKey && config.braveSearchApiKey.trim().length > 0) {
      return {
        is_configured: true,
        provider: 'brave',
        credential_present: true,
        message: 'Brave Search API connected'
      };
    }

    if (config.tavilyApiKey && config.tavilyApiKey.trim().length > 0) {
      return {
        is_configured: true,
        provider: 'tavily',
        credential_present: true,
        message: 'Tavily Search API connected'
      };
    }

    if (config.serperApiKey && config.serperApiKey.trim().length > 0) {
      return {
        is_configured: true,
        provider: 'serper',
        credential_present: true,
        message: 'Serper Google Search API connected'
      };
    }

    return {
      is_configured: true,
      provider: 'duckduckgo',
      credential_present: false,
      required_credential: 'BRAVE_SEARCH_API_KEY (or TAVILY_API_KEY)',
      message: 'Direct web search active. For high-volume production search, configure BRAVE_SEARCH_API_KEY or TAVILY_API_KEY in .env.'
    };
  }

  /**
   * Build an effective, concise market search query from product facts
   */
  static buildSearchQuery(product: Product): string {
    const parts: string[] = [];

    // Category terms
    const categoryMap: Record<string, string> = {
      clothing_accessories: 'sustainable clothing apparel',
      local_food_beverages: 'artisan food beverage brand',
      digital_products_services: 'software tool app platform',
      other: 'product'
    };
    const catTerm = categoryMap[product.category] || 'product';

    // Distinguishing features from category_data
    let featureTerm = '';
    if (product.category_data) {
      if (product.category_data.material) {
        featureTerm += `${product.category_data.material} `;
      }
      if (product.category_data.item_type) {
        featureTerm += `${product.category_data.item_type} `;
      }
      if (product.category_data.core_use_case) {
        featureTerm += `${product.category_data.core_use_case} `;
      }
      if (product.category_data.main_function) {
        featureTerm += `${product.category_data.main_function} `;
      }
    }

    // Market / region
    let marketTerm = '';
    if (Array.isArray(product.availability_markets) && product.availability_markets.length > 0 && product.availability_markets[0] !== 'not_decided') {
      marketTerm = product.availability_markets[0];
    } else if (product.currency === 'INR') {
      marketTerm = 'India';
    }

    const cleanSummary = (product.summary || '').replace(/[^\w\s]/g, ' ').split(/\s+/).slice(0, 6).join(' ');
    
    // Combine query
    const query = `${product.name} ${featureTerm} ${catTerm} ${marketTerm}`.trim().replace(/\s+/g, ' ');
    return query.length > 10 ? query : `${product.name} ${cleanSummary} competitors alternatives`;
  }

  /**
   * Search for comparable products across live search providers
   */
  static async searchComparableProducts(
    product: Product,
    customQuery?: string
  ): Promise<{
    status: 'completed' | 'no_matches' | 'failed';
    query: string;
    references: CompetitorReference[];
    provider: string;
    error?: string;
  }> {
    const query = customQuery?.trim() || this.buildSearchQuery(product);
    const now = new Date().toISOString();

    try {
      let rawResults: RawSearchResult[] = [];
      let providerName = 'direct';

      if (config.braveSearchApiKey) {
        providerName = 'brave';
        rawResults = await this.queryBraveSearch(query, config.braveSearchApiKey);
      } else if (config.tavilyApiKey) {
        providerName = 'tavily';
        rawResults = await this.queryTavilySearch(query, config.tavilyApiKey);
      } else if (config.serperApiKey) {
        providerName = 'serper';
        rawResults = await this.querySerperSearch(query, config.serperApiKey);
      } else {
        providerName = 'duckduckgo';
        rawResults = await this.queryDuckDuckGoSearch(query);
      }

      if (!rawResults || rawResults.length === 0) {
        return {
          status: 'no_matches',
          query,
          references: [],
          provider: providerName
        };
      }

      // Filter out low quality results, remove duplicates by domain, and convert to CompetitorReference
      const seenDomains = new Set<string>();
      const references: CompetitorReference[] = [];

      for (const item of rawResults) {
        const domain = item.domain || this.extractDomain(item.url);
        if (!domain || seenDomains.has(domain.toLowerCase())) {
          continue;
        }

        // Avoid search engine self-links
        if (domain.includes('duckduckgo.com') || domain.includes('google.com') || domain.includes('bing.com')) {
          continue;
        }

        seenDomains.add(domain.toLowerCase());

        // Extract clean facts supported by the actual snippet
        const supportedFacts = this.extractSupportedFacts(item.snippet, item.title);

        references.push({
          id: uuidv4(),
          product_id: product.id,
          query,
          title: item.title.trim().slice(0, 200),
          url: item.url.trim(),
          domain,
          snippet_or_fact: item.snippet.trim().slice(0, 500),
          source_type: 'automated',
          evidence_type: 'retrieved_snippet' as EvidenceType,
          supported_facts: supportedFacts,
          selected: references.length < 5, // Select up to 5 by default
          date_checked: now,
          created_at: now
        });

        if (references.length >= 8) break; // Collect up to 8 unique references
      }

      if (references.length === 0) {
        return {
          status: 'no_matches',
          query,
          references: [],
          provider: providerName
        };
      }

      return {
        status: 'completed',
        query,
        references,
        provider: providerName
      };
    } catch (err: any) {
      return {
        status: 'failed',
        query,
        references: [],
        provider: 'search',
        error: err.message || 'Search execution failed'
      };
    }
  }

  /**
   * Brave Search API integration
   */
  private static async queryBraveSearch(query: string, apiKey: string): Promise<RawSearchResult[]> {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`Brave Search API error (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    const results: RawSearchResult[] = [];

    if (data.web?.results && Array.isArray(data.web.results)) {
      for (const item of data.web.results) {
        if (item.url && item.title) {
          results.push({
            title: item.title,
            url: item.url,
            snippet: item.description || item.title,
            domain: this.extractDomain(item.url)
          });
        }
      }
    }

    return results;
  }

  /**
   * Tavily Search API integration
   */
  private static async queryTavilySearch(query: string, apiKey: string): Promise<RawSearchResult[]> {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 8,
        include_answer: false
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`Tavily Search API error (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    const results: RawSearchResult[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        if (item.url && item.title) {
          results.push({
            title: item.title,
            url: item.url,
            snippet: item.content || item.title,
            domain: this.extractDomain(item.url)
          });
        }
      }
    }

    return results;
  }

  /**
   * Serper Google Search API integration
   */
  private static async querySerperSearch(query: string, apiKey: string): Promise<RawSearchResult[]> {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        q: query,
        num: 8
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`Serper API error (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    const results: RawSearchResult[] = [];

    if (data.organic && Array.isArray(data.organic)) {
      for (const item of data.organic) {
        if (item.link && item.title) {
          results.push({
            title: item.title,
            url: item.link,
            snippet: item.snippet || item.title,
            domain: this.extractDomain(item.link)
          });
        }
      }
    }

    return results;
  }

  /**
   * Direct DuckDuckGo HTML web search fallback (Zero-credential real HTTP web search)
   */
  private static async queryDuckDuckGoSearch(query: string): Promise<RawSearchResult[]> {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      throw new Error(`Web search query returned status ${res.status}`);
    }

    const html = await res.text();
    const results: RawSearchResult[] = [];

    // Parse DuckDuckGo HTML results with regex
    // <a class="result__url" href="..."> or <a class="result__snippet" ...>
    const resultBlocks = html.split(/class="result\s+results_links/i).slice(1);

    for (const block of resultBlocks) {
      // Extract title & URL
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

      if (titleMatch) {
        let rawUrl = titleMatch[1];
        // Clean duckduckgo redirect URL e.g. //duckduckgo.com/l/?uddg=https%3A%2F%2F...
        const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          rawUrl = decodeURIComponent(uddgMatch[1]);
        }

        const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
        const snippet = snippetMatch 
          ? snippetMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim()
          : rawTitle;

        if (rawUrl.startsWith('http')) {
          results.push({
            title: rawTitle,
            url: rawUrl,
            snippet,
            domain: this.extractDomain(rawUrl)
          });
        }
      }

      if (results.length >= 8) break;
    }

    return results;
  }

  /**
   * Helper: extract domain name from URL
   */
  static extractDomain(urlStr: string): string {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./i, '');
    } catch {
      return 'web';
    }
  }

  /**
   * Helper: extract distinct supported factual statements from snippet
   */
  static extractSupportedFacts(snippet: string, title: string): string[] {
    if (!snippet || snippet.trim().length === 0) {
      return [title.trim()];
    }

    // Split snippet into sentences or clauses
    const sentences = snippet
      .split(/(?<=[.!?])\s+|\s+[-–—|]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.toLowerCase().includes('click here') && !s.toLowerCase().includes('read more'));

    if (sentences.length === 0) {
      return [snippet.trim().slice(0, 150)];
    }

    return sentences.slice(0, 3);
  }
}
