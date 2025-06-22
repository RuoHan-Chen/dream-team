'use client';

import { useState } from 'react';
import { useMarkets } from '@/context/MarketContext';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Clock, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  if (!market) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Market not found.</h1>
      </main>
    )
  }

  const handlePlaceBet = () => {
    if (!selectedOutcome || !betAmount) {
      alert('Please select an outcome and enter an amount.');
      return;
    }
    placeBet(market.id, selectedOutcome, parseFloat(betAmount));
    setBetAmount('');
    setSelectedOutcome(null);
  };

  const isResolutionTime = Date.now() > market.ends;

  const totalBets = market.yesBets + market.noBets;
  const yesOdds = totalBets > 0 ? Math.round((market.yesBets / totalBets) * 100) : 50;
  const noOdds = totalBets > 0 ? 100 - yesOdds : 50;
  const totalPoolSize = market.yesBets + market.noBets;

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-700">
        <button onClick={() => router.back()} className="mb-6 text-sm text-gray-400 hover:text-white transition-colors">
          &larr; Back to markets
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Side: Market Info & Chart */}
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{market.question}</h1>
            <div className="flex items-center text-gray-400 text-sm mb-2">
              <Clock size={16} className="mr-2" />
              <span>Ends: {new Date(market.ends).toLocaleString()}</span>
            </div>
            <div className="flex items-center text-gray-400 text-sm mb-6">
              <Info size={16} className="mr-2" />
              <span>Resolves via: <em className="text-gray-300">{market.searchQuery}</em></span>
            </div>

            <div className="h-64 md:h-80 bg-gray-900 rounded-lg p-4 mb-6">
              <MarketChart data={market.oddsHistory} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-center">
              <div className="bg-white/10 p-6 rounded-lg">
                <h2 className="text-lg text-white/60 mb-2">Current Odds</h2>
                <p className="text-2xl font-bold">
                  <span className="text-green-400">YES {yesOdds}%</span> / <span className="text-red-400">NO {noOdds}%</span>
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg">
                <h2 className="text-lg text-white/60 mb-2">Total Pool Size</h2>
                <p className="text-2xl font-bold">${totalPoolSize.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 p-6 rounded-lg">
                <h2 className="text-lg text-white/60 mb-2">Your Bets</h2>
                <p className="text-2xl font-bold">$0.00</p>
              </div>
            </div>
          </div>

          {/* Right Side: Betting Interface */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-900 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-center">Place Your Bet</h2>
              
              {market.resolved ? (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                  <p className="text-xl font-bold text-gray-300">Market Resolved</p>
                  <p className="text-4xl font-bold mt-2 text-green-400">{market.resolved}</p>
                </div>
              ) : isResolutionTime ? (
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <p className="text-lg font-bold text-gray-300 mb-4">Market has ended. Awaiting resolution.</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => resolveMarket(market.id, 'YES')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                      Resolve YES
                    </button>
                    <button 
                      onClick={() => resolveMarket(market.id, 'NO')}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
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
                      className="bg-green-500/80 border border-green-400 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bet YES
                    </button>
                    <button
                      onClick={() => setSelectedOutcome('NO')}
                      className="bg-red-500/80 border border-red-400 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Bet NO
                    </button>
                  </div>

                  {selectedOutcome && (
                    <div className="mb-4">
                      <label htmlFor="bet-amount" className="block text-sm font-medium text-gray-400 mb-1">
                        Amount (PYUSD)
                      </label>
                      <input
                        id="bet-amount"
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                      />
                    </div>
                  )}

                  <button
                    onClick={handlePlaceBet}
                    disabled={!selectedOutcome || !betAmount}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Submit Bet
                  </button>
                </>
              )}
            </div>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <h2 className="text-2xl font-semibold mb-6">Betting History</h2>
              <div className="space-y-4">
                {market.historicalBets.map(bet => (
                  <div key={bet.id} className="bg-white/5 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-bold">{bet.user}</p>
                      <p className="text-sm text-white/60">{bet.time}</p>
                    </div>
                    <div className={`text-lg font-bold ${bet.side === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                      {bet.side} - ${bet.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}