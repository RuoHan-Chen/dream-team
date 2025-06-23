import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

console.log('🔍 Checking .env file location...\n');

// Check current directory (agent/)
const agentEnvPath = path.join(process.cwd(), '.env');
const parentEnvPath = path.join(process.cwd(), '..', '.env');

let agentEnvExists = fs.existsSync(agentEnvPath);
let parentEnvExists = fs.existsSync(parentEnvPath);

if (agentEnvExists) {
  console.log('✓ Found .env in agent/ directory');
  const result = dotenv.config({ path: agentEnvPath });
  if (process.env.WALLET_PRIVATE_KEY) {
    console.log('✓ WALLET_PRIVATE_KEY is set');
  } else {
    console.log('❌ WALLET_PRIVATE_KEY not found in agent/.env');
  }
}

if (parentEnvExists) {
  console.log('✓ Found .env in parent directory');
  const result = dotenv.config({ path: parentEnvPath });
  if (process.env.WALLET_PRIVATE_KEY) {
    console.log('✓ WALLET_PRIVATE_KEY is set in parent .env');
  }
}

console.log('\n📋 Solution:\n');

if (agentEnvExists && !parentEnvExists) {
  console.log('Your .env file is in the agent/ directory, but the scripts expect it in the parent directory.');
  console.log('\nOption 1: Move your .env file:');
  console.log('  mv .env ../.env\n');
  console.log('Option 2: Copy your WALLET_PRIVATE_KEY to the parent .env:');
  console.log('  cp .env ../.env');
} else if (agentEnvExists && parentEnvExists) {
  console.log('You have .env files in both locations. The parent directory .env takes precedence.');
  console.log('\nMake sure your WALLET_PRIVATE_KEY is in the parent ../.env file.');
} else if (!agentEnvExists && !parentEnvExists) {
  console.log('No .env file found. Run:');
  console.log('  npm run generate-wallet');
} else {
  console.log('Your .env file is correctly located in the parent directory.');
  if (!process.env.WALLET_PRIVATE_KEY) {
    console.log('\nHowever, WALLET_PRIVATE_KEY is not set. Add it to your ../.env file:');
    console.log('  WALLET_PRIVATE_KEY=0x-your-private-key-here');
  }
}

console.log('\nCurrent working directory:', process.cwd()); 