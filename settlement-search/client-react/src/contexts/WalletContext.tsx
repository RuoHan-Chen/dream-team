import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createWalletClient, custom, type WalletClient, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Hex } from 'viem';
import { SiweMessage } from 'siwe';

interface WalletContextType {
  isConnected: boolean;
  address: Hex | null;
  walletClient: WalletClient | null;
  error: string | null;
  isConnecting: boolean;
  authToken: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  authenticate: () => Promise<string | void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<Hex | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        }) as string[];

        if (accounts.length > 0) {
          const checksummedAccount = getAddress(accounts[0] as Hex);
          const client = createWalletClient({
            account: checksummedAccount,
            chain: baseSepolia,
            transport: custom(window.ethereum)
          });

          setWalletClient(client);
          setAddress(checksummedAccount);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    }
  };

  const connectWallet = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Ethereum wallet');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check if on correct network (Base Sepolia)
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      }) as string;

      const baseSepoliaChainIdHex = '0x14a34'; // 84532 in hex

      if (chainId !== baseSepoliaChainIdHex) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: baseSepoliaChainIdHex }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to browser wallet
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: baseSepoliaChainIdHex,
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create viem wallet client with checksummed address
      const checksummedAccount = getAddress(accounts[0] as Hex);
      const client = createWalletClient({
        account: checksummedAccount,
        chain: baseSepolia,
        transport: custom(window.ethereum)
      });

      setWalletClient(client);
      setAddress(checksummedAccount);
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const authenticate = useCallback(async () => {
    console.log('authenticate called', { walletClient, address });
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get nonce from server
      console.log('Fetching nonce from:', `${API_URL}/auth/nonce`);
      const nonceResponse = await fetch(`${API_URL}/auth/nonce`);

      if (!nonceResponse.ok) {
        throw new Error(`Failed to get nonce: ${nonceResponse.status} ${nonceResponse.statusText}`);
      }

      const { nonce } = await nonceResponse.json();
      console.log('Got nonce:', nonce);

      // Create SIWE message with checksummed address
      const checksummedAddress = getAddress(address);
      console.log('Address checksum:', { original: address, checksummed: checksummedAddress });

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksummedAddress,
        statement: 'Sign this message to authenticate with Settlement Search',
        uri: window.location.origin,
        version: '1',
        chainId: baseSepolia.id,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const message = siweMessage.prepareMessage();
      console.log('SIWE message prepared:', message);

      // Sign message
      console.log('Requesting signature...');
      const signature = await walletClient.signMessage({
        account: address,
        message
      });
      console.log('Got signature:', signature);

      // Verify with server
      console.log('Verifying with server...');
      const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            domain: siweMessage.domain,
            address: siweMessage.address,
            statement: siweMessage.statement,
            uri: siweMessage.uri,
            version: siweMessage.version,
            chainId: siweMessage.chainId,
            nonce: siweMessage.nonce,
            issuedAt: siweMessage.issuedAt
          },
          signature
        })
      });

      const result = await verifyResponse.json();
      console.log('Verify response:', result);

      if (!verifyResponse.ok) {
        throw new Error(result.error || 'Authentication failed');
      }

      setAuthToken(result.token);
      console.log('Auth token set successfully');
      return result.token;
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
      throw err;
    }
  }, [walletClient, address]);

  const disconnectWallet = useCallback(() => {
    setWalletClient(null);
    setAddress(null);
    setIsConnected(false);
    setError(null);
    setAuthToken(null);
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // Re-connect with new account
          const checksummedAccount = getAddress(accounts[0] as Hex);
          const client = createWalletClient({
            account: checksummedAccount,
            chain: baseSepolia,
            transport: custom(window.ethereum)
          });

          setWalletClient(client);
          setAddress(checksummedAccount);
          setIsConnected(true);
          setAuthToken(null); // Clear auth token on account change
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address, disconnectWallet]);

  const value: WalletContextType = {
    isConnected,
    address,
    walletClient,
    error,
    isConnecting,
    authToken,
    connectWallet,
    disconnectWallet,
    authenticate,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 