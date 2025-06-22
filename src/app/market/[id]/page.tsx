'use client';

import { useState } from 'react';
import { useMarkets } from '@/context/MarketContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MarketChart = dynamic(() => import('@/components/MarketChart').then(mod => mod.MarketChart), {
  loading: () => <p className="text-center text-white/50">Loading chart...</p>,
  ssr: false
});

export default function MarketDetailPage() {
  const { markets, placeBet } = useMarkets();
  const params = useParams();
  const marketId = parseInt(params.id as string, 10);
  
  const market = markets.find(m => m.id === marketId);
  const [betAmount, setBetAmount] = useState('');

  if (!market) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Market not found.</h1>
      </main>
    )
  }

  const handleBet = (side: 'YES' | 'NO') => {
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid bet amount.');
      return;
    }
    placeBet(market.id, side, amount);
    setBetAmount('');
  };
  
  const totalBets = market.yesBets + market.noBets;
  const yesOdds = totalBets > 0 ? Math.round((market.yesBets / totalBets) * 100) : 50;
  const noOdds = totalBets > 0 ? 100 - yesOdds : 50;
  const totalPoolSize = market.yesBets + market.noBets;

  const inputStyles = "w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-web3-purple-light focus:outline-none transition-all duration-300 text-center";

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-4xl">
        <Link href="/" className="text-sm text-web3-purple-light hover:underline mb-6 block">
          &larr; Back to All Markets
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
          {market.title}
        </h1>
        <p className="text-center text-white/60 mb-12">
          Time until resolution: {new Date(market.resolutionTime).toLocaleString()}
        </p>
        
        <div className="mb-12">
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
        
        <div className="bg-white/5 p-8 rounded-lg border border-white/10">
          <h2 className="text-2xl font-semibold mb-6 text-center">Place Your Bet</h2>
          <div className="flex items-center gap-4 mb-6">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.00 PYUSD"
              className={inputStyles}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleBet('YES')}
              className="bg-green-500/80 border border-green-400 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500 transition-colors duration-300 text-lg"
            >
              Bet YES
            </button>
            <button
              onClick={() => handleBet('NO')}
              className="bg-red-500/80 border border-red-400 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-500 transition-colors duration-300 text-lg"
            >
              Bet NO
            </button>
          </div>
        </div>

        <div className="mt-12">
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
    </main>
  );
}