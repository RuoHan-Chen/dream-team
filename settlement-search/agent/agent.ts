import { Agent, run, MCPServerStdio, withTrace } from '@openai/agents';
import * as path from 'node:path';

// Configuration
const BACKEND_URL = process.env.SETTLEMENT_SEARCH_BACKEND_URL || "http://localhost:3001";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY; // Optional wallet private key

async function main() {
  // Create MCP server connection
  const mcpServer = new MCPServerStdio({
    name: 'Settlement Search MCP',
    command: 'tsx', // or 'ts-node' or 'node' if compiled
    args: ['mcp-server.ts'],
    env: {
      ...process.env,
      SETTLEMENT_SEARCH_BACKEND_URL: BACKEND_URL,
      WALLET_PRIVATE_KEY: PRIVATE_KEY || '',
    }
  });

  // Connect to the MCP server
  await mcpServer.connect();

  try {
    // Create an agent that uses the MCP server
    const agent = new Agent({
      name: 'Settlement Search Assistant',
      instructions: `You are a helpful assistant that can search across multiple AI search providers (Exa, Perplexity, Brave, Tavily) using Settlement Search.
      
      To use the search functionality:
      1. First authenticate using the authenticate tool
      2. Then use the search tool for immediate searches or scheduleSearch for future queries
      3. You can view search history with viewHistory and pending queries with viewPending
      
      All searches require payment in USDC. If the user doesn't have enough funds, help them get USDC using the getCoinbaseOnrampLink tool.
      
      Be helpful and guide users through the authentication and search process.`,
      mcpServers: [mcpServer],
    });

    // Example: Authenticate and perform a search
    await withTrace('Settlement Search Example', async () => {
      // First authenticate
      console.log('Authenticating...');
      let result = await run(
        agent, 
        'Please authenticate me for Settlement Search' + 
        (PRIVATE_KEY ? ' using the configured private key' : ' and generate a new wallet for me')
      );
      console.log(result.finalOutput);

      // Perform a search
      console.log('\nPerforming a search...');
      result = await run(
        agent,
        'Search for "latest developments in AI agents and MCP protocol"'
      );
      console.log(result.finalOutput);

      // Schedule a future search
      console.log('\nScheduling a future search...');
      result = await run(
        agent,
        'Schedule a search for tomorrow at 10am asking "What are the top tech news stories today?"'
      );
      console.log(result.finalOutput);
    });
  } finally {
    // Always close the MCP server connection
    await mcpServer.close();
  }
}

// Run the example
main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});