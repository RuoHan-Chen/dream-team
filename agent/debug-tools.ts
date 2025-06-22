import { Agent, MCPServerStdio } from '@openai/agents';
import { loadEnv } from './load-env.js';

// Load environment variables from .env file
loadEnv();

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const BACKEND_URL = process.env.SETTLEMENT_SEARCH_BACKEND_URL || "http://localhost:3001";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

async function debugTools() {
  console.log('🔍 Debugging MCP Tools Discovery\n');
  
  console.log('1. Creating MCP server connection...');
  const mcpServer = new MCPServerStdio({
    name: 'Settlement Search MCP',
    command: 'tsx',
    args: ['../mcp-server-startup.ts'],
    env: {
      ...process.env,
      SETTLEMENT_SEARCH_BACKEND_URL: BACKEND_URL,
      WALLET_PRIVATE_KEY: PRIVATE_KEY || '',
    }
  });

  try {
    console.log('2. Connecting to MCP server...');
    await mcpServer.connect();
    console.log('✅ Successfully connected to MCP server\n');
    
    console.log('3. Getting available tools...');
    // The tools should be discovered automatically when the agent is created
    
    const agent = new Agent({
      name: 'Debug Agent',
      instructions: 'Debug agent for testing tool discovery',
      mcpServers: [mcpServer],
    });
    
    console.log('✅ Agent created successfully');
    console.log('\n4. Tools should be available to the agent now.');
    console.log('   (OpenAI Agents SDK handles tool discovery internally)\n');
    
    // Try to use a tool to verify it works
    console.log('5. Testing tool usage...');
    const { run } = await import('@openai/agents');
    
    try {
      const result = await run(agent, 'Use the getCurrentTime tool to show me the current time');
      console.log('✅ Tool execution successful!');
      console.log('Result:', result.finalOutput);
    } catch (error) {
      console.error('❌ Tool execution failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to MCP server:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Is the Settlement Search backend running? (npm run backend)');
    console.error('2. Is mcp-server.ts in the parent directory?');
    console.error('3. Do you have tsx installed? (npm install -g tsx)');
    console.error('4. Check the error message above for details');
  } finally {
    console.log('\n6. Closing MCP server connection...');
    await mcpServer.close();
    console.log('✅ Done');
  }
}

debugTools().catch(console.error); 