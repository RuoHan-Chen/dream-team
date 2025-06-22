import { Agent, run } from '@openai/agents';
import { resolveTool, getContractInfoTool } from './resolve-tool.js';
import { loadEnv } from './load-env.js';

// Load environment variables
loadEnv();

async function testResolveTools() {
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is required');
    process.exit(1);
  }

  // Get contract address from command line or use a placeholder
  const contractAddress = process.argv[2] || '0x1234567890123456789012345678901234567890';
  
  console.log('🚀 Testing Escrow Resolve Tools');
  console.log('📍 Contract Address:', contractAddress);
  console.log('🔑 Oracle Private Key:', process.env.ORACLE_PRIVATE_KEY ? 'Set ✓' : 'Not set ⚠️');
  console.log('');

  // Create agent with resolve tools
  const agent = new Agent({
    name: 'Escrow Test Agent',
    instructions: `You are testing the escrow contract tools. 
    When asked to check a contract, use get_escrow_info.
    When asked to resolve, first check the contract state, then resolve if appropriate.
    For resolve_escrow, use null for the privateKey parameter to use the environment variable.`,
    tools: [resolveTool, getContractInfoTool],
  });

  try {
    // Test 1: Get contract info
    console.log('📋 Test 1: Getting contract information...');
    const infoResult = await run(
      agent,
      `Get information about the escrow contract at ${contractAddress}`
    );
    console.log(infoResult.finalOutput);
    console.log('\n' + '='.repeat(80) + '\n');

    // Test 2: Attempt to resolve (will fail if not oracle or wrong state)
    if (process.env.ORACLE_PRIVATE_KEY) {
      console.log('🔧 Test 2: Attempting to resolve contract...');
      const resolveResult = await run(
        agent,
        `Check if the contract at ${contractAddress} can be resolved, and if so, resolve it with outcome TRUE. Use null for the private key to use the environment variable.`
      );
      console.log(resolveResult.finalOutput);
    } else {
      console.log('⚠️  Skipping resolve test - ORACLE_PRIVATE_KEY not set');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usage instructions
if (process.argv.length < 3) {
  console.log(`
Usage: tsx agent/test-resolve.ts <CONTRACT_ADDRESS>

Example:
  tsx agent/test-resolve.ts 0x1234567890123456789012345678901234567890

Environment variables:
  OPENAI_API_KEY     - Required: Your OpenAI API key
  ORACLE_PRIVATE_KEY - Optional: Private key of the oracle (for resolving)
`);
}

// Run the test
testResolveTools().catch(console.error); 