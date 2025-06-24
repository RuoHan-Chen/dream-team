import Exa from 'exa-js';
import axios from 'axios';
import OpenAI from 'openai';
import { tavily } from '@tavily/core';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Initialize clients
const exa = new Exa(process.env.EXASEARCH_API_KEY || '');
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
});

interface SearchResult {
  provider: string;
  answer?: string;
  results: any[];
  error?: string;
}

async function searchExa(query: string): Promise<SearchResult> {
  try {
    const [searchResult, answerResult] = await Promise.all([
      exa.searchAndContents(query, {
        type: 'neural',
        numResults: 5,
        text: true,
      }),
      exa.search(query, { type: 'neural', numResults: 1 }) // Get answer separately
    ]);

    return {
      provider: 'Exa',
      answer: searchResult.results[0]?.text ?
        `Based on the search results: ${searchResult.results[0].text.substring(0, 300)}...` :
        'No answer available',
      results: searchResult.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.text?.substring(0, 200) + '...',
        score: r.score,
      })),
    };
  } catch (error) {
    console.error('Exa search error:', error);
    return { provider: 'Exa', results: [], error: 'Search failed' };
  }
}

async function searchPerplexity(query: string): Promise<SearchResult> {
  try {
    const response = await perplexity.chat.completions.create({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: query }
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    return {
      provider: 'Perplexity',
      answer: content,
      results: [], // Perplexity doesn't return separate sources, they're embedded in the answer
    };
  } catch (error) {
    console.error('Perplexity search error:', error);
    return { provider: 'Perplexity', answer: '', results: [], error: 'Search failed' };
  }
}

async function searchBrave(query: string): Promise<SearchResult> {
  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: { q: query },
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY || ''
      }
    });

    const data = response.data;

    // Extract answer from Brave's response if available
    let answer = '';
    if (data.discussions?.results?.length > 0) {
      answer = data.discussions.results[0].text || '';
    } else if (data.web?.results?.length > 0) {
      // Create a simple answer from the first few results
      answer = `Based on search results: ${data.web.results.slice(0, 3).map((r: any) => r.description).join(' ')}`;
    }

    return {
      provider: 'Brave',
      answer: answer || 'No direct answer available',
      results: (data.web?.results || []).slice(0, 5).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
      })),
    };
  } catch (error) {
    console.error('Brave search error:', error);
    return { provider: 'Brave', answer: '', results: [], error: 'Search failed' };
  }
}

async function searchTavily(query: string): Promise<SearchResult> {
  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY || '' });
    const response = await tvly.search(query, {
      includeAnswer: true,
      maxResults: 5,
    });

    return {
      provider: 'Tavily',
      answer: response.answer || 'No answer available',
      results: response.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      })),
    };
  } catch (error) {
    console.error('Tavily search error:', error);
    return { provider: 'Tavily', answer: '', results: [], error: 'Search failed' };
  }
}

export async function searchAllProviders(query: string): Promise<SearchResult[]> {
  const [exaResults, perplexityResults, braveResults, tavilyResults] = await Promise.all([
    searchExa(query),
    searchPerplexity(query),
    searchBrave(query),
    searchTavily(query),
  ]);

  return [exaResults, perplexityResults, braveResults, tavilyResults];
} 