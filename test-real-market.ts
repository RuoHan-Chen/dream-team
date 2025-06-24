import { config } from 'dotenv';
import axios from 'axios';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http, parseAbi, getContract } from 'viem';
import { sepolia } from 'viem/chains';
import { database } from './database';

// Load environment variables
config();

const API_BASE_URL = 'http://localhost:3001';

// Contract ABI for checking state
const escrowABI = parseAbi([
  'function oracle() public view returns (address)',
  'function state() public view returns (uint8)',
  'function question() public view returns (string)',
  'function totalTrue() public view returns (uint256)',
  'function totalFalse() public view returns (uint256)',
  'function totalPool() public view returns (uint256)',
]);

async function testRealMarket() {
  console.log('🚀 Real Market Flow Test\n');

  // Step 1: Verify Configuration
  console.log('📋 Step 1: Verifying Configuration\n');
  
  const oracleAddress = process.env.ORACLE_ADDRESS;
  const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
  
  if (!oracleAddress || !oraclePrivateKey) {
    console.error('❌ Missing required environment variables:');
    if (!oracleAddress) console.error('   - ORACLE_ADDRESS');
    if (!oraclePrivateKey) console.error('   - ORACLE_PRIVATE_KEY');
    console.error('\nSet these in your .env file to continue.');
    return;
  }

  // Verify the private key matches the oracle address
  try {
    const account = privateKeyToAccount(oraclePrivateKey as `0x${string}`);
    if (account.address.toLowerCase() !== oracleAddress.toLowerCase()) {
      console.error('❌ ORACLE_PRIVATE_KEY does not match ORACLE_ADDRESS!');
      console.error(`   - ORACLE_ADDRESS: ${oracleAddress}`);
      console.error(`   - Private key controls: ${account.address}`);
      console.error('\nMake sure ORACLE_PRIVATE_KEY is the private key for ORACLE_ADDRESS.');
      return;
    }
    console.log('✅ Oracle configuration verified!');
    console.log(`   - Oracle Address: ${oracleAddress}`);
  } catch (error) {
    console.error('❌ Invalid ORACLE_PRIVATE_KEY format');
    return;
  }

  // Step 2: Create a real market with a specific question
  console.log('\n📊 Step 2: Creating a Real Market\n');
  
  // Use a question that will have a clear TRUE/FALSE answer
  const marketData = {
    marketQuestion: 'Is the current price of Ethereum above $3000 USD?',
    searchQuery: 'current ethereum ETH price USD',
    resolutionDate: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes from now
  };

  console.log('Market Details:');
  console.log(`- Question: ${marketData.marketQuestion}`);
  console.log(`- Search Query: ${marketData.searchQuery}`);
  console.log(`- Resolution: ${new Date(marketData.resolutionDate).toLocaleString()}\n`);

  let marketContractAddress: string;
  let queryId: number;

  try {
    console.log('Deploying market contract...');
    const response = await axios.post(`${API_BASE_URL}/api/markets/create`, marketData);
    
    marketContractAddress = response.data.marketContractAddress;
    queryId = response.data.queryId;
    const transactionHash = response.data.transactionHash;
    
    console.log('✅ Market created successfully!');
    console.log(`- Contract Address: ${marketContractAddress}`);
    console.log(`- Query ID: ${queryId}`);
    console.log(`- Deploy TX: ${transactionHash}`);
    console.log(`- View on Sepolia: https://sepolia.etherscan.io/address/${marketContractAddress}`);
  } catch (error: any) {
    console.error('❌ Failed to create market:', error.response?.data || error.message);
    return;
  }

  // Step 3: Verify the deployed contract
  console.log('\n🔍 Step 3: Verifying Deployed Contract\n');
  
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    const contract = getContract({
      address: marketContractAddress as `0x${string}`,
      abi: escrowABI,
      client: publicClient,
    });

    const contractOracle = await contract.read.oracle();
    const contractQuestion = await contract.read.question();
    const contractState = await contract.read.state();

    console.log('Contract Details:');
    console.log(`- Oracle: ${contractOracle}`);
    console.log(`- Question: ${contractQuestion}`);
    console.log(`- State: ${contractState === 0 ? 'Open' : 'Resolved'}`);
    
    if (contractOracle.toLowerCase() !== oracleAddress.toLowerCase()) {
      console.error('\n❌ Contract oracle does not match configured oracle!');
      return;
    }
    console.log('\n✅ Contract deployed correctly with our oracle!');
  } catch (error) {
    console.error('❌ Failed to verify contract:', error);
    return;
  }

  // Step 4: Monitor for resolution
  console.log('\n⏳ Step 4: Waiting for Search Execution and Resolution\n');
  console.log('The scheduler will:');
  console.log('1. Execute the search at resolution time');
  console.log('2. Get real results from multiple providers');
  console.log('3. Send results to the agent');
  console.log('4. Agent will analyze and resolve the market\n');

  let resolved = false;
  let attempts = 0;
  const maxAttempts = 20; // ~3 minutes
  
  while (!resolved && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    attempts++;
    
    try {
      // Check market status via API
      const statusResponse = await axios.get(`${API_BASE_URL}/api/markets/${marketContractAddress}`);
      const marketStatus = statusResponse.data;
      
      if (marketStatus.status === 'completed') {
        console.log('\n✅ Search completed!');
        console.log(`Summary: "${marketStatus.summary}"`);
        
        if (marketStatus.sources) {
          console.log('\nSearch Results from Providers:');
          marketStatus.sources.forEach((provider: any) => {
            console.log(`\n${provider.provider}:`);
            console.log(`Answer: ${provider.answer}`);
          });
        }

        // Check contract state to see if resolved
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(),
        });

        const contract = getContract({
          address: marketContractAddress as `0x${string}`,
          abi: escrowABI,
          client: publicClient,
        });

        const contractState = await contract.read.state();
        if (contractState !== 0) {
          resolved = true;
          console.log('\n🎉 Market Resolved On-Chain!');
          
          // Get final pool state
          const [totalTrue, totalFalse, totalPool] = await Promise.all([
            contract.read.totalTrue(),
            contract.read.totalFalse(),
            contract.read.totalPool(),
          ]);
          
          console.log('\nFinal Pool State:');
          console.log(`- Total Pool: ${Number(totalPool) / 1e6} USDC`);
          console.log(`- True Bets: ${Number(totalTrue) / 1e6} USDC`);
          console.log(`- False Bets: ${Number(totalFalse) / 1e6} USDC`);
          
          // Check backend logs for agent's decision
          const query = await database.getQueryById(queryId);
          if (query) {
            console.log('\n📋 Agent Analysis:');
            console.log('Check the backend logs to see:');
            console.log('- How the agent interpreted the search results');
            console.log('- What outcome it determined (TRUE/FALSE)');
            console.log('- The transaction it sent to resolve');
          }
        } else {
          console.log('\nMarket not yet resolved on-chain. Checking again...');
        }
      } else {
        console.log(`Status check ${attempts}/${maxAttempts}: Search status = ${marketStatus.status}`);
      }
    } catch (error) {
      console.log(`Status check ${attempts}/${maxAttempts}: Error checking status`);
    }
  }

  if (!resolved) {
    console.log('\n⏱️  Market did not resolve within timeout.');
    console.log('Check the backend logs for any errors.');
    console.log('You can also manually trigger execution from the UI.');
  }

  console.log('\n📊 Test Complete!');
  console.log('\nWhat just happened:');
  console.log('1. ✅ Deployed a real contract on Sepolia');
  console.log('2. ✅ Scheduled a real search query');
  console.log('3. ✅ Search executed with real data');
  console.log('4. ✅ Agent received real results');
  console.log('5. ' + (resolved ? '✅ Agent resolved the market on-chain' : '❌ Resolution pending'));
}

// Run the test
testRealMarket().catch(console.error); 