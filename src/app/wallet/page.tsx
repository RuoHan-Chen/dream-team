'use client';

import { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';

// Mock data - in a real app, this would come from wallet connections and API calls
const walletData = {
  winningsToClaim: 350.00,
  bettingHistory: [
    { id: 1, market: "Will PlayerX score > 30 points?", side: 'YES', amount: 100, result: 'WON', profit: 65 },
    { id: 2, market: "Will ETH reach $4k?", side: 'NO', amount: 50, result: 'LOST', profit: -50 },
    { id: 3, market: "Did TeamA win?", side: 'YES', amount: 200, result: 'PENDING', profit: 0 },
  ]
};

const PYUSD_SEPOLIA_ADDRESS = '0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53';

export default function WalletPage() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address,
    token: PYUSD_SEPOLIA_ADDRESS,
    chainId: sepolia.id,
  });

  const balance = balanceData ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(2) : '0.00';


  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    // Real app: trigger deposit transaction
    alert(`Depositing ${depositAmount} PYUSD...`);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    // Real app: trigger withdraw transaction
    alert(`Withdrawing ${withdrawAmount} PYUSD...`);
  };

  const handleClaim = () => {
    // Real app: trigger claim transaction
    alert(`Claiming ${walletData.winningsToClaim} PYUSD...`);
  }
  
  const inputStyles = "w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-web3-purple-light focus:outline-none transition-all duration-300";
  const buttonStyles = "w-full bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-3 px-6 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-lg";

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 mb-12 text-center">
          My Wallet
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <h2 className="text-lg text-white/60 mb-2">PYUSD Balance</h2>
            {isConnected ? (
              isBalanceLoading ? (
                <p className="text-4xl font-bold">Loading...</p>
              ) : (
                <p className="text-4xl font-bold">${balance}</p>
              )
            ) : (
              <p className="text-2xl font-bold text-white/60">Connect wallet to see balance</p>
            )}
          </div>
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <h2 className="text-lg text-white/60 mb-2">Winnings to Claim</h2>
            <p className="text-4xl font-bold text-emerald-400">${walletData.winningsToClaim.toLocaleString()}</p>
            {walletData.winningsToClaim > 0 && (
              <button onClick={handleClaim} className="mt-4 bg-emerald-500/80 border border-emerald-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-500 transition-colors duration-300">
                Claim Now
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 p-8 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-center">Deposit PYUSD</h2>
            <form onSubmit={handleDeposit}>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount to deposit"
                className={`${inputStyles} mb-4`}
                required
              />
              <button type="submit" className={buttonStyles}>Deposit</button>
            </form>
          </div>
          <div className="bg-white/5 p-8 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-6 text-center">Withdraw PYUSD</h2>
            <form onSubmit={handleWithdraw}>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw"
                className={`${inputStyles} mb-4`}
                required
              />
              <button type="submit" className={buttonStyles}>Withdraw</button>
            </form>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-semibold mb-6">Betting History</h2>
          <div className="space-y-4">
            {walletData.bettingHistory.map(bet => (
              <div key={bet.id} className="bg-white/5 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                <p className="font-bold flex-1 mb-2 md:mb-0">{bet.market}</p>
                <div className="flex items-center space-x-4">
                  <span className={`font-bold ${bet.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                    {bet.side} - ${bet.amount}
                  </span>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    bet.result === 'WON' ? 'bg-green-500/30 text-green-300' :
                    bet.result === 'LOST' ? 'bg-red-500/30 text-red-300' :
                    'bg-gray-500/30 text-gray-300'
                  }`}>
                    {bet.result}
                  </span>
                  {bet.result !== 'PENDING' && (
                    <span className={`font-bold ${bet.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.profit > 0 ? `+$${bet.profit}` : `-$${Math.abs(bet.profit)}`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
} 