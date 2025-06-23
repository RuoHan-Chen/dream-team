import { tool } from '@openai/agents';
import { z } from 'zod';
import { createWalletClient, createPublicClient, http, parseAbi, getContract } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from 'viem';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env' }); // Load from parent directory
config({ path: '.env' }); // Also try local directory

// Contract ABI - only including the functions we need
const escrowABI = parseAbi([
  'function resolveAndDistribute(bool outcome) external',
  'function oracle() public view returns (address)',
  'function state() public view returns (uint8)',
  'function deadline() public view returns (uint256)',
  'function question() public view returns (string)',
  'function totalTrue() public view returns (uint256)',
  'function totalFalse() public view returns (uint256)',
  'function totalPool() public view returns (uint256)',
  'event MarketResolved(bool outcome)',
]);

// Create the resolve tool
export const resolveTool = tool({
  name: 'resolve_escrow',
  description: 'Resolve a boolean prediction escrow contract on Ethereum Sepolia by calling resolveAndDistribute. Only the oracle can call this function.',
  parameters: z.object({
    contractAddress: z.string().describe('The address of the escrow contract on Sepolia'),
    outcome: z.boolean().describe('The resolution outcome - true or false'),
    privateKey: z.string().nullable().describe('Oracle\'s private key (hex format with 0x prefix). Pass null to use ORACLE_PRIVATE_KEY env var'),
  }),
  async execute({ contractAddress, outcome, privateKey }) {
    try {
      // Get private key from args or environment
      // Handle the case where agent passes string "null"
      let oraclePrivateKey: Hex | undefined;
      if (privateKey && privateKey !== 'null' && privateKey !== 'undefined') {
        oraclePrivateKey = privateKey as Hex;
      } else {
        oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY as Hex;
      }
      
      console.log('[ResolveTool] Private key source:', privateKey ? 'argument' : 'environment');
      console.log('[ResolveTool] Private key exists:', !!oraclePrivateKey);
      console.log('[ResolveTool] Private key first 10 chars:', oraclePrivateKey ? oraclePrivateKey.substring(0, 10) + '...' : 'none');
      
      if (!oraclePrivateKey) {
        throw new Error('No private key provided. Please provide the oracle\'s private key or set ORACLE_PRIVATE_KEY environment variable');
      }

      // Create account from private key
      const account = privateKeyToAccount(oraclePrivateKey);
      console.log('[ResolveTool] Oracle account address:', account.address);

      // Create wallet client for sending transactions
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(process.env.SEPOLIA_RPC_URL),
      });

      // Create public client for reading contract state
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.SEPOLIA_RPC_URL),
      });

      // Get contract instance
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: escrowABI,
        client: { wallet: walletClient, public: publicClient },
      });

      // First, let's check if the caller is the oracle
      const oracleAddress = await contract.read.oracle();
      console.log('[ResolveTool] Contract oracle address:', oracleAddress);
      console.log('[ResolveTool] Our oracle address:', account.address);
      console.log('[ResolveTool] Addresses match:', oracleAddress.toLowerCase() === account.address.toLowerCase());
      
      if (oracleAddress.toLowerCase() !== account.address.toLowerCase()) {
        return `Error: Your address (${account.address}) is not the oracle. The oracle address is ${oracleAddress}`;
      }

      // Check if the market is still open (state = 0)
      const state = await contract.read.state();
      if (state !== 0) {
        return 'Error: The market has already been resolved';
      }

      // For testing - deadline check removed, oracle can resolve at any time
      // const deadline = await contract.read.deadline();
      // const currentTime = BigInt(Math.floor(Date.now() / 1000));
      // if (currentTime < deadline) {
      //   const deadlineDate = new Date(Number(deadline) * 1000);
      //   return `Error: Cannot resolve yet. The deadline is ${deadlineDate.toLocaleString()}`;
      // }

      // Get some contract info for the response
      const question = await contract.read.question();
      const totalTrue = await contract.read.totalTrue();
      const totalFalse = await contract.read.totalFalse();
      const totalPool = await contract.read.totalPool();

      // Call resolveAndDistribute
      const hash = await contract.write.resolveAndDistribute([outcome]);

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        return `Successfully resolved the market!

**Question:** ${question}
**Resolution:** ${outcome ? 'TRUE' : 'FALSE'}
**Transaction Hash:** ${hash}

**Pool Distribution:**
- Total Pool: ${Number(totalPool) / 1e6} USDC
- True Bets: ${Number(totalTrue) / 1e6} USDC
- False Bets: ${Number(totalFalse) / 1e6} USDC
- Winners: Those who bet ${outcome ? 'TRUE' : 'FALSE'} will receive their proportional share

View on Etherscan: https://sepolia.etherscan.io/tx/${hash}`;
      } else {
        return `Transaction failed. Hash: ${hash}`;
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('execution reverted')) {
        if (error.message.includes('Only oracle can resolve')) {
          return 'Error: Only the oracle can resolve this market';
        }
        if (error.message.includes('Invalid market state')) {
          return 'Error: The market has already been resolved';
        }
      }
      
      return `Failed to resolve contract: ${error.message}`;
    }
  },
});

// Export a function to get contract info
export const getContractInfoTool = tool({
  name: 'get_escrow_info',
  description: 'Get information about a boolean prediction escrow contract on Ethereum Sepolia',
  parameters: z.object({
    contractAddress: z.string().describe('The address of the escrow contract on Sepolia'),
  }),
  async execute({ contractAddress }) {
    try {
      // Create public client for reading
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.SEPOLIA_RPC_URL),
      });

      // Get contract instance for reading
      const contract = getContract({
        address: contractAddress as `0x${string}`,
        abi: escrowABI,
        client: publicClient,
      });

      // Read contract state
      const [question, oracle, state, deadline, totalTrue, totalFalse, totalPool] = await Promise.all([
        contract.read.question(),
        contract.read.oracle(),
        contract.read.state(),
        contract.read.deadline(),
        contract.read.totalTrue(),
        contract.read.totalFalse(),
        contract.read.totalPool(),
      ]);

      const deadlineDate = new Date(Number(deadline) * 1000);
      const currentTime = new Date();
      const marketState = state === 0 ? 'Open' : 'Resolved';

      return `**Escrow Contract Information**

**Address:** ${contractAddress}
**Question:** ${question}
**Oracle:** ${oracle}
**State:** ${marketState}
**Deadline:** ${deadlineDate.toLocaleString()} (${deadlineDate > currentTime ? 'Future' : 'Past'})

**Pool Information:**
- Total Pool: ${Number(totalPool) / 1e6} USDC
- True Bets: ${Number(totalTrue) / 1e6} USDC
- False Bets: ${Number(totalFalse) / 1e6} USDC

${marketState === 'Open' && deadlineDate <= currentTime ? '⚠️ This market can now be resolved by the oracle' : ''}`;
    } catch (error: any) {
      return `Failed to get contract info: ${error.message}`;
    }
  },
});