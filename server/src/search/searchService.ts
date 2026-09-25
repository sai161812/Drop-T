import { v4 as uuidv4 } from 'uuid';
import { Product, CompetitorReference, SearchProviderStatus, EvidenceType } from '@droptest/shared';
import { config } from '../config.js';

export interface RawSearchResult {
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
    const categoryLabels: Record<string, string> = {
      clothing_accessories: 'clothing accessories',
      local_food_beverages: 'food beverages',
      digital_products_services: 'digital product service',
      other: 'product'
    };
    const data = product.category_data || {};
    const enteredFeatures = [data.material, data.item_type, data.core_use_case, data.main_function]
      .filter(value => typeof value === 'string' && value.trim()).map(value => String(value).trim());
    const markets = Array.isArray(product.availability_markets)
      ? product.availability_markets.filter(value => value && value !== 'not_decided').slice(0, 2)
      : [];
    const price = typeof product.price === 'number' && product.price > 0
      ? `${product.currency || ''} ${product.price}`.trim()
      : '';
    const summary = (product.summary || '').replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 8).join(' ');
    return [product.name, categoryLabels[product.category] || product.category, ...enteredFeatures, ...markets, price, summary, 'alternatives']
      .filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
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

      const references = this.processSearchResults(rawResults, product, query, now);

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

  static canonicalizeUrl(urlStr: string): string {
    try {
      const url = new URL(urlStr.trim());
      url.hash = '';
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref']
        .forEach(key => url.searchParams.delete(key));
      url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      const sorted = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
      url.search = '';
      sorted.forEach(([key, value]) => url.searchParams.append(key, value));
      return url.toString();
    } catch {
      return urlStr.trim();
    }
  }

  static processSearchResults(rawResults: RawSearchResult[], product: Product, query: string, now = new Date().toISOString()): CompetitorReference[] {
    const seenUrls = new Set<string>();
    const productTokens = [product.name, product.category, product.summary]
      .join(' ').toLowerCase().split(/\W+/).filter(token => token.length > 3);
    const ranked = rawResults.map((item, index) => {
      const canonicalUrl = this.canonicalizeUrl(item.url);
      const domain = item.domain || this.extractDomain(canonicalUrl);
      const text = `${item.title} ${item.snippet}`.toLowerCase();
      const overlap = productTokens.filter(token => text.includes(token)).length;
      let productPath = 0;
      try { productPath = /\/(products?|shop|store|pricing|services?)\b/i.test(new URL(canonicalUrl).pathname) ? 2 : 0; } catch { /* filtered below */ }
      return { item, canonicalUrl, domain, score: overlap + productPath, index };
    }).sort((a, b) => b.score - a.score || a.index - b.index);

    const references: CompetitorReference[] = [];
    for (const { item, canonicalUrl, domain, score } of ranked) {
      const lowerDomain = domain.toLowerCase();
      const snippet = item.snippet?.trim() || '';
      let isHttp = false;
      try { isHttp = ['http:', 'https:'].includes(new URL(canonicalUrl).protocol); } catch { /* excluded */ }
      if (!isHttp || seenUrls.has(canonicalUrl) || snippet.length < 25 || score < 1) continue;
      if (/duckduckgo\.com|google\.|bing\.com|facebook\.com|instagram\.com|x\.com$/.test(lowerDomain)) continue;
      seenUrls.add(canonicalUrl);
      references.push({
        id: uuidv4(), product_id: product.id, query,
        title: item.title.trim().slice(0, 200), url: canonicalUrl, domain,
        snippet_or_fact: snippet.slice(0, 500), source_type: 'automated',
        evidence_type: 'retrieved_snippet' as EvidenceType,
        supported_facts: this.extractSupportedFacts(snippet, item.title),
        selected: references.length < 5, date_checked: now, created_at: now
      });
      if (references.length >= 8) break;
    }
    return references;
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
