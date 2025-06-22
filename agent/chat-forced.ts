import { Agent, run, MCPServerStdio } from '@openai/agents';
import * as readline from 'readline';
import { loadEnv } from './load-env.js';

// Load environment variables from .env file
loadEnv();

// Check for OpenAI API key early
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required\n');
  console.error('Get your API key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

const BACKEND_URL = process.env.SETTLEMENT_SEARCH_BACKEND_URL || "http://localhost:3001";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

// Create readline interface for chat
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function chat() {
  console.log('Connecting to MCP server...');
  
  // Build env object conditionally
  const mcpEnv: Record<string, string> = {
    ...process.env,
    SETTLEMENT_SEARCH_BACKEND_URL: BACKEND_URL,
  };
  
  // Only add WALLET_PRIVATE_KEY if it exists
  if (PRIVATE_KEY) {
    mcpEnv.WALLET_PRIVATE_KEY = PRIVATE_KEY;
    console.log('✓ Using wallet private key from environment');
  } else {
    console.log('⚠️  No WALLET_PRIVATE_KEY found - a new wallet will be generated for each authentication');
  }
  
  const mcpServer = new MCPServerStdio({
    name: 'Settlement Search MCP',
    command: 'tsx',
    args: ['../mcp-server-startup.ts'],
    env: mcpEnv
  });

  try {
    await mcpServer.connect();
    console.log('✅ Successfully connected to MCP server\n');
  } catch (error) {
    console.error('❌ Failed to connect to MCP server:', error);
    console.error('\nMake sure the Settlement Search backend is running: npm run backend\n');
    process.exit(1);
  }

  const agent = new Agent({
    name: 'Settlement Search Chat Assistant',
    instructions: `You are an AI assistant that ONLY communicates by using tools. You have access to these MCP tools:

AVAILABLE TOOLS:
1. authenticate - Authenticates wallet (use when: auth, login, authenticate, connect wallet)
2. search - Performs web search (costs $0.05 USDC)
3. scheduleSearch - Schedules future search (costs $0.10-0.15 USDC)
4. viewHistory - Shows search history
5. viewPending - Shows pending searches
6. deleteQuery - Deletes a scheduled query
7. getCurrentTime - Gets current time
8. getQueryDetails - Gets query details
9. getCoinbaseOnrampLink - Gets link to buy USDC

STRICT RULES:
- You MUST use tools for EVERY interaction
- NEVER respond without calling at least one tool
- If unsure which tool to use, use getCurrentTime as a default
- For authentication requests, ALWAYS use the authenticate tool immediately
- For search requests, check if authenticated first, then search

EXAMPLES OF TOOL USAGE:
- "hi" or "hello" → Use getCurrentTime to greet with current time
- "auth" or "login" → Use authenticate tool
- "search X" → Use authenticate (if needed) then search tool
- "history" → Use viewHistory tool
- "help" → Use getCurrentTime and explain available tools`,
    mcpServers: [mcpServer],
    model: 'gpt-4o', // Use a more capable model
  });

  console.log('Settlement Search Chat Assistant');
  console.log('Type "exit" to quit\n');
  console.log('Available commands: auth, search, history, pending, help\n');

  // Chat loop
  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('You: ', resolve);
    });

    if (input.toLowerCase() === 'exit') {
      break;
    }

    try {
      // Augment the user's message to force tool usage
      let augmentedInput = input;
      
      // If the user just says hi/hello, force a tool call
      if (input.toLowerCase().match(/^(hi|hello|hey)$/)) {
        augmentedInput = "Use the getCurrentTime tool to greet me with the current time";
      }
      // If they mention auth/login, be explicit
      else if (input.toLowerCase().includes('auth') || input.toLowerCase().includes('login')) {
        augmentedInput = "Use the authenticate tool right now to authenticate me";
      }
      // If they want to search, be explicit
      else if (input.toLowerCase().includes('search')) {
        augmentedInput = `First check if I'm authenticated (if not, authenticate me), then use the search tool to: ${input}`;
      }
      
      const result = await run(agent, augmentedInput);
      console.log('\nAssistant:', result.finalOutput, '\n');
    } catch (error) {
      console.error('\nError:', error instanceof Error ? error.message : String(error), '\n');
    }
  }

  rl.close();
  await mcpServer.close();
}

chat().catch(console.error); 