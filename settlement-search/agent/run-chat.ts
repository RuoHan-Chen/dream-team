import { loadEnv } from './load-env.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
loadEnv();

// Disable OpenAI tracing if not explicitly enabled
if (!process.env.OPENAI_TRACING_ENABLED) {
  process.env.OPENAI_DISABLE_TRACING = 'true';
}

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable is required');
  console.error('\nPlease set it in one of the following ways:');
  console.error('1. Create a .env file with: OPENAI_API_KEY=your-key-here');
  console.error('2. Export it in your terminal: export OPENAI_API_KEY="your-key-here"');
  console.error('3. Run with: OPENAI_API_KEY="your-key-here" npm run chat\n');
  console.error('Get your API key from: https://platform.openai.com/api-keys\n');
  process.exit(1);
}

// Check for wallet private key
if (!process.env.WALLET_PRIVATE_KEY) {
  console.warn('⚠️  WARNING: WALLET_PRIVATE_KEY not found in environment variables');
  console.warn('\nWithout a persistent wallet key, a new wallet will be generated each time');
  console.warn('you authenticate, causing searches to fail due to lack of funds.\n');
  console.warn('To fix this:');
  console.warn('1. Run: npm run generate-wallet');
  console.warn('2. Or add to .env: WALLET_PRIVATE_KEY=0x-your-private-key\n');
  
  const response = await new Promise<string>((resolve) => {
    process.stdout.write('Continue anyway? (y/N): ');
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });
  
  if (response.toLowerCase() !== 'y') {
    console.log('\nRun: npm run generate-wallet');
    process.exit(0);
  }
}

// Optional: Check if backend is running
const BACKEND_URL = process.env.SETTLEMENT_SEARCH_BACKEND_URL || 'http://localhost:3001';
console.log(`ℹ️  Using backend URL: ${BACKEND_URL}`);

if (process.env.WALLET_PRIVATE_KEY) {
  console.log('ℹ️  Using provided wallet private key');
} else {
  console.log('ℹ️  No wallet private key provided - a new wallet will be generated');
}

console.log(''); // Empty line for spacing

// Import and run the chat
import('./chat.js').catch((error) => {
  console.error('Failed to start chat:', error);
  process.exit(1);
}); 