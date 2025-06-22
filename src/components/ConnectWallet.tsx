'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useBalance } from 'wagmi';
import { pyusdContractAddress } from '@/contracts/MarketContract';

export function ConnectWallet() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const address = user?.wallet?.address as `0x${string}` | undefined;
  const { data: balance } = useBalance({
    address: address,
    token: pyusdContractAddress,
  });

  if (!ready) {
    return null;
  }

  const walletClientType = user?.wallet?.walletClientType;
  
  // Format the wallet type to be more readable (e.g., 'coinbase-wallet' -> 'Coinbase Wallet')
  const walletDisplayName = walletClientType
    ? walletClientType
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace('Wallet Wallet', 'Wallet')
        + (walletClientType.includes('wallet') ? '' : ' Wallet')
    : 'Wallet';

  return (
    <div>
      {authenticated && user?.wallet ? (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-white">{walletDisplayName}</p>
            <p className="text-sm hidden md:block">
              {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
            </p>
            <p className="text-sm">
              {balance ? `${parseFloat(balance.formatted).toFixed(2)}` : '...'}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-md backdrop-blur-sm border border-white/20 transition-all duration-300 text-sm"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-md backdrop-blur-sm border border-white/20 transition-all duration-300"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
} 