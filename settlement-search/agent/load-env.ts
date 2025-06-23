import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env from multiple locations
export function loadEnv() {
  // First try current directory
  let result = dotenv.config();
  
  if (result.error || !process.env.OPENAI_API_KEY) {
    // Try parent directory
    const parentEnvPath = path.join(process.cwd(), '..', '.env');
    if (fs.existsSync(parentEnvPath)) {
      result = dotenv.config({ path: parentEnvPath });
      if (!result.error) {
        console.log('✓ Loaded .env from parent directory');
      }
    }
  } else {
    console.log('✓ Loaded .env from current directory');
  }
  
  // Also try agent-specific .env if we're not already in the agent directory
  if (!process.cwd().endsWith('agent')) {
    const agentEnvPath = path.join(process.cwd(), 'agent', '.env');
    if (fs.existsSync(agentEnvPath)) {
      dotenv.config({ path: agentEnvPath });
      console.log('✓ Also loaded agent/.env');
    }
  }
  
  return result;
} 