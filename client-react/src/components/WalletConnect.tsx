import React from 'react';
import { useWallet } from '../contexts/WalletContext';

export function WalletConnect() {
  const { isConnected, address, isConnecting, error, connectWallet, disconnectWallet, authenticate, authToken } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <span className="status-indicator">●</span>
          <span className="address">{formatAddress(address)}</span>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
        </div>
        {!authToken && (
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => authenticate().catch(err => console.error('Manual auth failed:', err))}
              className="connect-btn"
            >
              Authenticate Manually
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="connect-btn"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
} 