# Escrow Contract Resolve Tool

This tool allows an OpenAI agent to interact with and resolve boolean prediction escrow contracts on Ethereum Sepolia.

## Features

- **Get Contract Info**: Check the current state of any escrow contract
- **Resolve Contract**: Call the `resolveAndDistribute` function to resolve the market (oracle only)

## Setup

1. **Install Dependencies**
   ```bash
   npm install viem zod @openai/agents
   ```

2. **Set Environment Variables**
   ```bash
   # Required for OpenAI
   export OPENAI_API_KEY="sk-..."
   
   # Optional: Set oracle private key (can also be passed as parameter)
   export ORACLE_PRIVATE_KEY="0x..."
   ```

## Usage

### Import the Tools

```typescript
import { resolveTool, getContractInfoTool } from './resolve-tool.js';
```

### Create an Agent with the Tools

```typescript
import { Agent } from '@openai/agents';

const agent = new Agent({
  name: 'Escrow Oracle',
  instructions: 'You can check and resolve escrow contracts on Sepolia',
  tools: [resolveTool, getContractInfoTool],
});
```

### Tool Parameters

#### `get_escrow_info`
- `contractAddress` (string): The contract address on Sepolia

#### `resolve_escrow`
- `contractAddress` (string): The contract address on Sepolia
- `outcome` (boolean): The resolution outcome (true/false)
- `privateKey` (string | null): Oracle's private key - pass null to use ORACLE_PRIVATE_KEY env var

### Example Commands

```typescript
// Check contract status
await run(agent, "Check the escrow contract at 0x123...");

// Resolve with TRUE using environment variable
await run(agent, "Resolve contract 0x123... with outcome TRUE, use null for private key");

// Resolve with FALSE using specific private key
await run(agent, "Resolve contract 0x123... with FALSE using private key 0xabc...");
```

## Contract Requirements

The escrow contract must:
- Be deployed on Ethereum Sepolia
- Have the calling address set as the oracle
- Be past the deadline for resolution
- Be in the "Open" state (not already resolved)

## Security Notes

- **Private Key Handling**: Never commit private keys to version control
- **Oracle Authority**: Only the designated oracle can resolve contracts
- **Irreversible**: Contract resolution cannot be undone
- **Gas Fees**: Resolving requires ETH for gas on Sepolia

## Error Handling

The tool handles common errors:
- Not the oracle address
- Contract already resolved
- Deadline not yet reached
- Invalid contract address
- Insufficient gas

## Running the Example

```bash
# Make sure you have the required environment variables set
export OPENAI_API_KEY="sk-..."
export ORACLE_PRIVATE_KEY="0x..."

# Run the example agent
tsx agent/agent-with-resolve.ts
```

## Integration with Other Agents

You can combine these tools with other agent capabilities:

```typescript
const agent = new Agent({
  name: 'Multi-Tool Agent',
  instructions: 'You can search the web and resolve contracts',
  tools: [
    resolveTool,
    getContractInfoTool,
    webSearchTool(), // from @openai/agents
    // ... other tools
  ],
});
``` 