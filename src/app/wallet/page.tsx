'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useBalance } from 'wagmi';

export default function WalletPage() {
  const { ready, authenticated, user, login } = usePrivy();

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: user?.wallet?.address as `0x${string}` | undefined,
  });

  if (!ready) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-white">My Wallet</h1>

      {!authenticated ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-900/50 rounded-lg">
          <p className="text-xl mb-4 text-white">Please connect your wallet to continue.</p>
          <button
            onClick={login}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Account Info</h2>
          <div className="space-y-2">
            <p className="text-white">
              <span className="font-semibold">Address:</span>{' '}
              <span className="font-mono text-sm text-gray-300">{user?.wallet?.address}</span>
            </p>
            <p className="text-white">
              <span className="font-semibold">Balance:</span>{' '}
              {isBalanceLoading
                ? 'Loading...'
                : balance
                ? `${balance.formatted} ${balance.symbol}`
                : 'Not available'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 