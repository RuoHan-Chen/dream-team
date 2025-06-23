import { Agent, run } from '@openai/agents';
import { resolveTool, getContractInfoTool } from './resolve-tool.js';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env' }); // Load from parent directory
config({ path: '.env' }); // Also try local directory

// Debug: Check if ORACLE_PRIVATE_KEY is loaded
if (process.env.ORACLE_PRIVATE_KEY) {
  console.log('[MarketResolver] ORACLE_PRIVATE_KEY is loaded (first 10 chars):', process.env.ORACLE_PRIVATE_KEY.substring(0, 10) + '...');
} else {
  console.log('[MarketResolver] WARNING: ORACLE_PRIVATE_KEY not found in environment');
}

// Tool to interpret search results and determine market outcome
const interpretSearchResultsTool = tool({
  name: 'interpret_search_results',
  description: 'Interpret search results to determine a boolean outcome for a prediction market. Returns TRUE or FALSE with reasoning.',
  parameters: z.object({
    marketQuestion: z.string().describe('The market question to be resolved'),
    searchSummary: z.string().describe('The summary from the search results'),
    searchResults: z.string().describe('The detailed search results (JSON string)'),
    interpretation: z.string().describe('Your interpretation of whether the answer is TRUE or FALSE based on the evidence')
  }),
  async execute({ marketQuestion, searchSummary, searchResults, interpretation }) {
    // Parse the interpretation to extract the boolean outcome
    const lowerInterpretation = interpretation.toLowerCase();
    let outcome: boolean;
    
    if (lowerInterpretation.includes('true') && !lowerInterpretation.includes('false')) {
      outcome = true;
    } else if (lowerInterpretation.includes('false') && !lowerInterpretation.includes('true')) {
      outcome = false;
    } else {
      // Try to determine from context
      outcome = lowerInterpretation.includes('yes') || 
                lowerInterpretation.includes('confirmed') || 
                lowerInterpretation.includes('succeeded') ||
                lowerInterpretation.includes('achieved');
    }
    
    return `Based on the search results for "${marketQuestion}":

Interpretation: ${interpretation}

**RESOLUTION: ${outcome ? 'TRUE' : 'FALSE'}**

This determination is based on the evidence provided in the search results.`;
  }
});

// Create the market resolver agent
export const marketResolverAgent = new Agent({
  name: 'Market Resolver Agent',
  instructions: `You are an oracle agent that resolves prediction markets based on search results.
  
  Your workflow:
  1. When given a market contract address and search results, first check the contract state using get_escrow_info
  2. Carefully analyze the market question and search results using interpret_search_results
  3. Determine if the evidence clearly supports TRUE or FALSE
  4. If the market is still open, resolve it using resolve_escrow with your determined outcome
  
  When interpreting search results:
  - Read the market question carefully to understand exactly what is being asked
  - Look for specific evidence in the search results that directly answers the question
  - For price/threshold questions: Check if the value met or exceeded the threshold
  - For event questions: Look for confirmation that the event did or did not occur
  - For date-based questions: Verify if the event happened by the specified date
  
  Resolution guidelines:
  - TRUE: The condition in the question was met/achieved/occurred
  - FALSE: The condition was NOT met/achieved/occurred
  
  Important:
  - Base your decision ONLY on the evidence in the search results
  - If evidence is unclear or contradictory, explain why but still make a decision based on preponderance of evidence
  - When calling resolve_escrow, DO NOT pass the privateKey parameter - the tool will use the environment variable
  - After determining the outcome, immediately resolve the market if it's still open`,
  tools: [resolveTool, getContractInfoTool, interpretSearchResultsTool],
});

// Function to resolve a market based on search results
export async function resolveMarketWithSearchResults(
  contractAddress: string,
  marketQuestion: string,
  searchSummary: string,
  searchResults: any
) {
  const prompt = `I need you to resolve a prediction market based on search results.

Market Contract: ${contractAddress}

Market Question: "${marketQuestion}"

Search Summary: ${searchSummary}

Search Results: ${JSON.stringify(searchResults, null, 2)}

Please follow these steps:
1. First use get_escrow_info to check the contract state
2. Use interpret_search_results to analyze the evidence and determine if the answer is TRUE or FALSE
3. If the market is still open (state = Open), use resolve_escrow to resolve it with your determined outcome (pass only contractAddress and outcome parameters)
4. Provide clear reasoning for your decision`;

  const result = await run(marketResolverAgent, prompt);
  return result;
}

// Function for scheduler to call when search completes
export async function resolveMarketFromScheduler(
  marketContractAddress: string,
  marketQuestion: string,
  searchSummary: string,
  searchResults: any
): Promise<{ success: boolean; message: string; outcome?: boolean }> {
  try {
    console.log(`[MarketResolver] Starting resolution for market ${marketContractAddress}`);
    
    const result = await resolveMarketWithSearchResults(
      marketContractAddress,
      marketQuestion,
      searchSummary,
      searchResults
    );
    
    // Extract outcome from the result
    const output = result.finalOutput ?? '';
    console.log('[MarketResolver] Agent output:', output);
    
    // Try multiple patterns to extract the outcome
    let outcome: boolean | undefined;
    
    // Pattern 1: RESOLUTION: TRUE/FALSE
    const resolutionMatch = output.match(/RESOLUTION:\s*(TRUE|FALSE)/i);
    if (resolutionMatch) {
      outcome = resolutionMatch[1].toUpperCase() === 'TRUE';
    }
    
    // Pattern 2: Final Answer: TRUE/FALSE
    if (outcome === undefined) {
      const finalAnswerMatch = output.match(/Final Answer:\s*(TRUE|FALSE)/i);
      if (finalAnswerMatch) {
        outcome = finalAnswerMatch[1].toUpperCase() === 'TRUE';
      }
    }
    
    // Pattern 3: Successfully resolved with outcome
    if (outcome === undefined) {
      const resolvedMatch = output.match(/\*\*Resolution:\*\*\s*(TRUE|FALSE)/i);
      if (resolvedMatch) {
        outcome = resolvedMatch[1].toUpperCase() === 'TRUE';
      }
    }
    
    // Pattern 4: Check for "resolved the market" and extract from context
    if (outcome === undefined && output.includes('Successfully resolved the market')) {
      // Look for TRUE or FALSE after "Resolution:"
      const afterResolution = output.match(/Resolution:.*?(TRUE|FALSE)/is);
      if (afterResolution) {
        outcome = afterResolution[1].toUpperCase() === 'TRUE';
      }
    }
    
    // Pattern 5: Look for **TRUE** or **FALSE**
    if (outcome === undefined) {
      const boldMatch = output.match(/\*\*(TRUE|FALSE)\*\*/i);
      if (boldMatch) {
        outcome = boldMatch[1].toUpperCase() === 'TRUE';
      }
    }
    
    // Pattern 6: Look for standalone TRUE or FALSE in context of "outcome is"
    if (outcome === undefined) {
      const outcomeIsMatch = output.match(/outcome\s+(?:is|for[^:]*is)[:\s]*(TRUE|FALSE)/i);
      if (outcomeIsMatch) {
        outcome = outcomeIsMatch[1].toUpperCase() === 'TRUE';
      }
    }
    
    // Pattern 7: Look for "resolved it as TRUE/FALSE"
    if (outcome === undefined) {
      const resolvedAsMatch = output.match(/resolved\s+(?:it\s+)?as\s+(TRUE|FALSE)/i);
      if (resolvedAsMatch) {
        outcome = resolvedAsMatch[1].toUpperCase() === 'TRUE';
      }
    }
    
    // Pattern 8: Look for "Action Taken" followed by TRUE/FALSE
    if (outcome === undefined) {
      const actionMatch = output.match(/Action Taken:.*?resolved.*?(TRUE|FALSE)/is);
      if (actionMatch) {
        outcome = actionMatch[1].toUpperCase() === 'TRUE';
      }
    }
    
    console.log(`[MarketResolver] Extracted outcome: ${outcome}`);
    
    return {
      success: true,
      message: output,
      outcome
    };
  } catch (error) {
    console.error(`[MarketResolver] Error resolving market:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Example usage
async function main() {
  // Example with a specific market
  const contractAddress = '0xf176657dbac9181bbe954f059631eda74e3a40ed';
  const marketQuestion = 'Will Bitcoin be above $100,000 by end of 2024?';
  const searchSummary = 'Current Bitcoin price is $67,500 as of December 2024. The price has not exceeded $100,000.';
  const searchResults = [
    {
      provider: 'CoinMarketCap',
      answer: 'Bitcoin is currently trading at $67,500',
      sources: [{ title: 'BTC Price', url: 'https://coinmarketcap.com', snippet: 'BTC: $67,500' }]
    }
  ];

  const result = await resolveMarketWithSearchResults(
    contractAddress,
    marketQuestion,
    searchSummary,
    searchResults
  );

  console.log(result.finalOutput);
}

// Export for use in other modules
export default marketResolverAgent;

// Run if called directly
if (process.argv[1]?.endsWith('market-resolver-agent.ts') || process.argv[1]?.endsWith('market-resolver-agent.js')) {
  main().catch(console.error);
} 