'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMarkets } from '@/context/MarketContext';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Clock, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConnectWallet } from '@/components/ConnectWallet';

const MarketChart = dynamic(() => import('@/components/MarketChart').then(mod => mod.MarketChart), {
  loading: () => <p className="text-center text-white/50">Loading chart...</p>,
  ssr: false
});

export default function MarketDetailPage() {
  const { markets, placeBet, resolveMarket } = useMarkets();
  const params = useParams();
  const marketId = parseInt(params.id as string, 10);
  const router = useRouter();
  
  const market = markets.find(m => m.id === marketId);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!market) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Market not found.</h1>
          <Link href="/active" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
            Back to Active Markets
          </Link>
        </div>
      </main>
    )
  }

  const handlePlaceBet = () => {
    if (!selectedOutcome || !betAmount) {
      return;
    }
    
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    
    // Place the bet
    placeBet(market.id, selectedOutcome, parseFloat(betAmount));
    setBetAmount('');
    setSelectedOutcome(null);
    setIsConfirming(false);
  };

  const handleCancelBet = () => {
    setIsConfirming(false);
  };

  const isResolutionTime = Date.now() > market.ends;

  const totalBets = market.yesBets + market.noBets;
  const yesOdds = totalBets > 0 ? Math.round((market.yesBets / totalBets) * 100) : 50;
  const noOdds = totalBets > 0 ? 100 - yesOdds : 50;
  const totalPoolSize = market.yesBets + market.noBets;

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-6xl">
        <header className="flex flex-wrap justify-between items-center mb-12 gap-4">
          <Link href="/" className="block hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo.png"
              alt="Dream Market Logo"
              width={200}
              height={60}
              className="h-16 md:h-24 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl">
              Home
            </Link>
            <Link href="/active" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl">
              Active Markets
            </Link>
            <Link href="/create" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl">
              Create Market
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <div className="bg-white/10 p-6 md:p-8 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
          <button onClick={() => router.back()} className="mb-6 text-sm text-gray-300 hover:text-white transition-colors">
            &larr; Back to markets
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side: Market Info & Chart */}
            <div className="w-full md:w-2/3">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{market.question}</h1>
              <div className="flex items-center text-gray-300 text-sm mb-2">
                <Clock size={16} className="mr-2" />
                <span>Ends: {new Date(market.ends).toLocaleString()}</span>
              </div>
              <div className="flex items-center text-gray-300 text-sm mb-2">
                <Info size={16} className="mr-2" />
                <span>Resolves via: </span>
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(market.searchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline ml-1"
                >
                  {market.searchQuery.length > 30 ? `${market.searchQuery.slice(0, 30)}...` : market.searchQuery}
                </a>
              </div>
              {market.contractAddress && (
                <div className="flex items-center text-gray-300 text-sm mb-6">
                  <Info size={16} className="mr-2" />
                  <span>Contract: </span>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${market.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline ml-1 font-mono"
                  >
                    {market.contractAddress.slice(0, 6)}...{market.contractAddress.slice(-4)}
                  </a>
                </div>
              )}

              <div className="h-64 md:h-80 bg-white/5 rounded-lg p-4 mb-6 backdrop-blur-sm border border-white/10">
                <MarketChart 
                  data={market.oddsHistory} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-center">
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h2 className="text-lg text-gray-300 mb-2">Current Odds</h2>
                  <p className="text-2xl font-bold">
                    <span className="text-green-400">YES {yesOdds}%</span> / <span className="text-red-400">NO {noOdds}%</span>
                  </p>
                </div>
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h2 className="text-lg text-gray-300 mb-2">Total Pool Size</h2>
                  <p className="text-2xl font-bold text-white">${totalPoolSize.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <h2 className="text-lg text-gray-300 mb-2">Your Bets</h2>
                  <p className="text-2xl font-bold text-white">$0.00</p>
                </div>
              </div>
            </div>

            {/* Right Side: Betting Interface */}
            <div className="w-full md:w-1/3">
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center text-white">Place Your Bet</h2>
                
                {market.resolved ? (
                  <div className="text-center p-8 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                    <p className="text-xl font-bold text-gray-300">Market Resolved</p>
                    <p className="text-4xl font-bold mt-2 text-green-400">{market.resolved}</p>
                  </div>
                ) : isResolutionTime ? (
                  <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                    <p className="text-lg font-bold text-gray-300 mb-4">Market has ended. Awaiting resolution.</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => resolveMarket(market.id, 'YES')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Resolve YES
                      </button>
                      <button 
                        onClick={() => resolveMarket(market.id, 'NO')}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        Resolve NO
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        onClick={() => setSelectedOutcome('YES')}
                        disabled={isConfirming}
                        className={`font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                          selectedOutcome === 'YES' 
                            ? 'bg-green-500 border border-green-400 text-white' 
                            : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
                        } ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Bet YES
                      </button>
                      <button
                        onClick={() => setSelectedOutcome('NO')}
                        disabled={isConfirming}
                        className={`font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                          selectedOutcome === 'NO' 
                            ? 'bg-red-500 border border-red-400 text-white' 
                            : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
                        } ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Bet NO
                      </button>
                    </div>

                    {selectedOutcome && (
                      <div className="mb-4">
                        <label htmlFor="bet-amount" className="block text-sm font-medium text-gray-200 mb-1">
                          Amount (PYUSD)
                        </label>
                        <input
                          id="bet-amount"
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={isConfirming}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    )}

                    {isConfirming && (
                      <div className="mb-4 p-4 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                        <p className="text-sm text-gray-200 mb-2">Confirm your bet:</p>
                        <p className="text-lg font-bold text-white">
                          {selectedOutcome} - ${betAmount}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handlePlaceBet}
                        disabled={!selectedOutcome || !betAmount}
                        className={`flex-1 font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl ${
                          isConfirming 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                        } disabled:bg-gray-700 disabled:cursor-not-allowed`}
                      >
                        {isConfirming ? 'Confirm' : 'Submit Bet'}
                      </button>
                      
                      {isConfirming && (
                        <button
                          onClick={handleCancelBet}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6">
                <h2 className="text-2xl font-semibold mb-6 text-white text-center">Betting History</h2>
                <div className="space-y-4">
                  {market.historicalBets.map(bet => (
                    <div key={bet.id} className="bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10 flex justify-between items-center hover:bg-white/10 transition-all duration-300">
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-bold text-sm truncate text-white">
                          {bet.user.slice(0, 6)}...{bet.user.slice(-4)}
                        </p>
                        <p className="text-xs text-gray-300 truncate">
                          {new Date(bet.time).toLocaleDateString()} {new Date(bet.time).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className={`text-sm font-bold flex-shrink-0 ${bet.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                        {bet.side} - ${bet.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}