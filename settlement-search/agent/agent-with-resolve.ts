import { Agent, run } from '@openai/agents';
import { resolveTool, getContractInfoTool } from './resolve-tool.js';

// Example of creating an agent with the resolve tool
async function main() {
  // Create an agent with the escrow resolution tools
  const agent = new Agent({
    name: 'Escrow Oracle Agent',
    instructions: `You are an oracle agent that can resolve boolean prediction escrow contracts on Ethereum Sepolia.
    
    You have two main tools:
    1. get_escrow_info - Use this to check the current state of an escrow contract
    2. resolve_escrow - Use this to resolve a contract (only works if you are the oracle)
    
    When asked to resolve a contract:
    - First use get_escrow_info to check the contract state
    - Verify the deadline has passed
    - Then use resolve_escrow with the appropriate outcome
    - For the privateKey parameter: pass null to use the ORACLE_PRIVATE_KEY environment variable, or provide a specific key
    
    Always be careful and double-check before resolving, as this action cannot be undone.`,
    tools: [resolveTool, getContractInfoTool],
  });

  // Example 1: Get contract info
  console.log('=== Example 1: Getting contract info ===');
  const infoResult = await run(
    agent,
    'Check the status of the escrow contract at 0x1234567890123456789012345678901234567890'
  );
  console.log(infoResult.finalOutput);

  // Example 2: Resolve a contract
  console.log('\n=== Example 2: Resolving a contract ===');
  const resolveResult = await run(
    agent,
    'Resolve the escrow contract at 0x1234567890123456789012345678901234567890 with outcome TRUE. Use null for the private key to use the ORACLE_PRIVATE_KEY environment variable.'
  );
  console.log(resolveResult.finalOutput);

  // Example 3: Complex scenario
  console.log('\n=== Example 3: Check then resolve ===');
  const complexResult = await run(
    agent,
    'First check if the contract at 0x1234567890123456789012345678901234567890 can be resolved, then resolve it with FALSE if the deadline has passed.'
  );
  console.log(complexResult.finalOutput);
}

// Create the agent for export
export const escrowOracleAgent = new Agent({
  name: 'Escrow Oracle Agent',
  instructions: `You are an oracle agent that can resolve boolean prediction escrow contracts on Ethereum Sepolia.
  
  You have two main tools:
  1. get_escrow_info - Use this to check the current state of an escrow contract
  2. resolve_escrow - Use this to resolve a contract (only works if you are the oracle)
  
  When asked to resolve a contract:
  - First use get_escrow_info to check the contract state
  - Verify the deadline has passed
  - Then use resolve_escrow with the appropriate outcome
  - For the privateKey parameter: pass null to use the ORACLE_PRIVATE_KEY environment variable, or provide a specific key
  
  Always be careful and double-check before resolving, as this action cannot be undone.`,
  tools: [resolveTool, getContractInfoTool],
});

// Run the example
if (process.argv[1]?.endsWith('agent-with-resolve.ts') || process.argv[1]?.endsWith('agent-with-resolve.js')) {
  main().catch(console.error);
} 