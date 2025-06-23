import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createWalletClient, custom, WalletClient, getAddress } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { Hex } from 'viem';

interface WalletContextType {
  walletClient: WalletClient | null;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          const checksummedAddress = getAddress(accounts[0] as Hex);
          const client = createWalletClient({
            account: checksummedAddress,
            chain: baseSepolia,
            transport: custom(window.ethereum)
          });
          setWalletClient(client);
          setAddress(checksummedAddress);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('Please install MetaMask or another Web3 wallet');
    }

    try {
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

      const checksummedAddress = getAddress(accounts[0] as Hex);
      const client = createWalletClient({
        account: checksummedAddress,
        chain: baseSepolia,
        transport: custom(window.ethereum)
      });

      setWalletClient(client);
      setAddress(checksummedAddress);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setWalletClient(null);
    setAddress(null);
    setIsConnected(false);
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== address) {
          // Re-connect with new account
          const checksummedAddress = getAddress(accounts[0] as Hex);
          const client = createWalletClient({
            account: checksummedAddress,
            chain: baseSepolia,
            transport: custom(window.ethereum!)
          });

          setWalletClient(client);
          setAddress(checksummedAddress);
          setIsConnected(true);
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address]);

  return (
    <WalletContext.Provider 
      value={{
        walletClient,
        address,
        isConnected,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}; 