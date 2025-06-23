import React from 'react';
import { useWallet } from '../contexts/WalletContext';

export const WalletConnect: React.FC = () => {
  const { address, isConnected, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error: any) {
      console.error('Failed to connect:', error);
      alert(error.message || 'Failed to connect wallet');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="wallet-info">
        <span className="wallet-address">{formatAddress(address!)}</span>
        <button onClick={disconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} className="connect-btn">
      Connect Wallet
    </button>
  );
}; 