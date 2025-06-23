import { SiweMessage } from 'siwe';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface AuthResult {
  success: boolean;
  token?: string;
  address?: string;
  error?: string;
}

// SIWE authentication flow
export async function authenticateWithSIWE(address: string, signMessage: (message: string) => Promise<string>): Promise<AuthResult> {
  try {
    // Step 1: Get nonce from backend
    const nonceResponse = await axios.get(`${API_BASE_URL}/auth/nonce`);
    const { nonce } = nonceResponse.data;

    // Step 2: Create SIWE message
    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign this message to authenticate with Settlement Search',
      uri: window.location.origin,
      version: '1',
      chainId: 1, // Mainnet - adjust if using different chain
      nonce,
      issuedAt: new Date().toISOString(),
    });

    const message = siweMessage.prepareMessage();

    // Step 3: Sign message using Privy
    const signature = await signMessage(message);

    // Step 4: Verify signature with backend
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify`, {
      message,
      signature,
    });

    if (verifyResponse.data.success) {
      return {
        success: true,
        token: verifyResponse.data.token,
        address: verifyResponse.data.address,
      };
    } else {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  } catch (error: any) {
    console.error('SIWE authentication error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Authentication failed',
    };
  }
} 