const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { abi, bytecode } = require('../autodeploy/BooleanPredictionEscrow.json');
require('dotenv').config({ path: '.env.local' });

async function deployContract() {
  // Load and validate private key
  const rawPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rawPrivateKey) {
    throw new Error('DEPLOYER_PRIVATE_KEY is not set in .env.local file');
  }

  const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;
  console.log("Loaded private key length:", privateKey.length - 2);
  console.log("Loaded private key (masked):", privateKey.slice(0, 6) + "..." + privateKey.slice(-4));

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: require('viem/chains').sepolia,
    transport: http()
  });

  // Contract deployment parameters
  const question = "Will ETH reach $5,000 by the end of 2024?";
  const deadline = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
  const oracleAddress = process.env.ORACLE_ADDRESS || account.address; // Use deployer as oracle for now
  const stablecoinAddress = process.env.STABLECOIN_ADDRESS || '0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53'; // PYUSD on Sepolia

  console.log('Deploying contract with parameters:');
  console.log('Question:', question);
  console.log('Deadline:', new Date(deadline * 1000).toISOString());
  console.log('Oracle:', oracleAddress);
  console.log('Stablecoin:', stablecoinAddress);

  try {
    const result = await client.deployContract({
      abi,
      bytecode,
      args: [
        question,
        BigInt(deadline),
        oracleAddress,
        stablecoinAddress
      ]
    });

    console.log('✅ Contract deployed successfully!');
    console.log('Contract address:', result.contractAddress);
    console.log('Transaction hash:', result.transactionHash);
    
    // Update the contract address in the MarketContract.ts file
    console.log('\n📝 Please update src/contracts/MarketContract.ts with the new address:');
    console.log(`export const marketContractAddress = '${result.contractAddress}';`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployContract()
    .then(() => {
      console.log('Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployContract }; 