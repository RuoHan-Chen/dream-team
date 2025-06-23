import { Agent, run, MCPServerStdio } from '@openai/agents';
import * as readline from 'readline';
import { loadEnv } from './load-env.js';

// Load environment variables from .env file
loadEnv();

// Check for OpenAI API key early
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required\n');
  console.error('Please set it using one of these methods:\n');
  console.error('1. Export in terminal:');
  console.error('   export OPENAI_API_KEY="sk-your-key-here"\n');
  console.error('2. Run with environment variable:');
  console.error('   OPENAI_API_KEY="sk-your-key-here" tsx agent/chat.ts\n');
  console.error('3. Create a .env file in the project root with:');
  console.error('   OPENAI_API_KEY=sk-your-key-here\n');
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
    console.error('\nMake sure:');
    console.error('1. The mcp-server-startup.ts file exists in the parent directory');
    console.error('2. You have tsx installed (npm install -g tsx)');
    console.error('3. The Settlement Search backend is running (npm run backend)');
    console.error('4. The mcp-server.ts compiles without errors\n');
    process.exit(1);
  }

  const agent = new Agent({
    name: 'Settlement Search Chat Assistant',
    instructions: `You are a conversational assistant for Settlement Search. You MUST use the provided MCP tools to help users.

CRITICAL: You have access to these MCP tools that you MUST use:
- authenticate: ALWAYS use this tool when users ask to authenticate, login, or connect their wallet
- search: Use this for immediate web searches
- scheduleSearch: Use this to schedule searches for the future
- viewHistory: Use this to show search history
- viewPending: Use this to show pending scheduled searches
- deleteQuery: Use this to delete scheduled queries
- getCurrentTime: Use this to get current time for scheduling
- getQueryDetails: Use this to get details about a specific query
- getCoinbaseOnrampLink: Use this when users need USDC

IMPORTANT RULES:
1. When a user asks to authenticate, search, or use any feature, you MUST call the appropriate tool
2. Do NOT just describe what you could do - actually DO IT by calling the tools
3. If authentication fails, check the error message and help the user accordingly
4. Always be helpful but remember to USE THE TOOLS, not just talk about them

Example interactions:
- User: "authenticate me" → Call the authenticate tool
- User: "search for X" → Call the authenticate tool first if needed, then the search tool
- User: "show my history" → Call the viewHistory tool`,
    mcpServers: [mcpServer],
  });

  console.log('Settlement Search Chat Assistant');
  console.log('Type "exit" to quit\n');

  // Chat loop
  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question('You: ', resolve);
    });

    if (input.toLowerCase() === 'exit') {
      break;
    }

    try {
      const result = await run(agent, input);
      console.log('\nAssistant:', result.finalOutput, '\n');
    } catch (error) {
      console.error('\nError:', error instanceof Error ? error.message : String(error), '\n');
    }
  }

  rl.close();
  await mcpServer.close();
}

chat().catch(console.error);