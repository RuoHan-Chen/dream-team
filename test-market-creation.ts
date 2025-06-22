import axios from 'axios';
import { SiweMessage } from 'siwe';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const API_URL = 'http://localhost:3001';

// Test wallet setup
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http()
});

async function authenticate() {
  try {
    // Get nonce
    const nonceResponse = await axios.get(`${API_URL}/auth/nonce`);
    const { nonce } = nonceResponse.data;

    // Create SIWE message
    const siweMessage = new SiweMessage({
      domain: 'localhost',
      address: account.address,
      statement: 'Sign in to Settlement Search',
      uri: 'http://localhost:3001',
      version: '1',
      chainId: sepolia.id,
      nonce: nonce,
    });

    const message = siweMessage.prepareMessage();
    const signature = await walletClient.signMessage({ message });

    // Verify and get JWT
    const verifyResponse = await axios.post(`${API_URL}/auth/verify`, {
      message,
      signature,
    });

    return verifyResponse.data.token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

async function testMarketCreation(token: string) {
  try {
    // Set resolution time to 10 minutes from now for testing
    const resolutionDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const marketData = {
      marketQuestion: "Will ETH price be above $3000 on the resolution date?",
      searchQuery: "current ETH price in USD",
      resolutionDate: resolutionDate
    };

    console.log('Creating market with data:', marketData);

    // Note: This will require x402 payment header in production
    // For testing, you might want to disable x402 temporarily
    const response = await axios.post(
      `${API_URL}/api/markets/create`,
      marketData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Market created successfully:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 402) {
      console.log('Payment required. X402 details:', error.response.data);
      // In a real scenario, you would handle the payment here
    } else {
      console.error('Market creation error:', error.response?.data || error.message);
    }
    throw error;
  }
}

async function main() {
  console.log('Testing market creation endpoint...');
  console.log('Test wallet address:', account.address);

  try {
    // Authenticate
    console.log('\n1. Authenticating...');
    const token = await authenticate();
    console.log('Authentication successful!');

    // Create market
    console.log('\n2. Creating market...');
    const market = await testMarketCreation(token);
    
    console.log('\n✅ Market creation test completed successfully!');
    console.log('Market contract address:', market.marketContractAddress);
    console.log('Query ID:', market.queryId);
    console.log('Scheduled for:', market.scheduledFor);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
main(); 