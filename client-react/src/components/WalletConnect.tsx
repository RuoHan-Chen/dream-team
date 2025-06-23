import React from 'react';
import { usePrivy } from '@privy-io/react-auth';

export function WalletConnect() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return <button disabled className="connect-btn">Loading Privy...</button>;
  }

  if (!authenticated) {
    return <button onClick={login} className="connect-btn">Connect Wallet</button>;
  }

  return (
    <div className="wallet-connected">
      <div className="wallet-info">
        <span className="status-indicator">●</span>
        <span className="address">{user?.wallet?.address}</span>
      </div>
      <button onClick={logout} className="disconnect-btn">
        Logout
      </button>
    </div>
  );
} 