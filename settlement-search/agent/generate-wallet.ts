import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load existing env vars
dotenv.config();

console.log('🔑 Wallet Generator for Settlement Search\n');

// Generate a new private key
const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('Generated new wallet:');
console.log(`Address: ${account.address}`);
console.log(`Private Key: ${privateKey}\n`);

// Check if .env file exists
const envPath = path.join(process.cwd(), '..', '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  // Read existing .env
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if WALLET_PRIVATE_KEY already exists
  if (envContent.includes('WALLET_PRIVATE_KEY=')) {
    console.log('⚠️  WARNING: WALLET_PRIVATE_KEY already exists in .env file');
    console.log('Current wallet will be replaced. Press Ctrl+C to cancel or Enter to continue...');
    
    await new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });
    
    // Replace existing WALLET_PRIVATE_KEY
    envContent = envContent.replace(/WALLET_PRIVATE_KEY=.*/g, `WALLET_PRIVATE_KEY=${privateKey}`);
  } else {
    // Append WALLET_PRIVATE_KEY
    envContent += `\n# Generated wallet for Settlement Search\nWALLET_PRIVATE_KEY=${privateKey}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
} else {
  // Create new .env file
  const newEnvContent = `# Settlement Search Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Generated wallet for Settlement Search
WALLET_PRIVATE_KEY=${privateKey}

# Optional: Backend URL (defaults to http://localhost:3001)
SETTLEMENT_SEARCH_BACKEND_URL=http://localhost:3001

# Optional: Network (base or base-sepolia)
X402_NETWORK=base-sepolia
`;
  
  fs.writeFileSync(envPath, newEnvContent);
  console.log('📝 Created new .env file');
}

console.log('\n✅ Wallet saved to .env file!');
console.log('\nNext steps:');
console.log('1. If you haven\'t already, add your OpenAI API key to the .env file');
console.log('2. Fund your wallet with USDC on Base Sepolia');
console.log('3. Run: npm run chat');
console.log('\nYour wallet address (for funding): ' + account.address);
console.log('\nTo get USDC, you can use the getCoinbaseOnrampLink tool after authenticating.'); 