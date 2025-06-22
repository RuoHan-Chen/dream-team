'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// --- Types ---
export interface Bet {
  id: number;
  user: string;
  side: 'YES' | 'NO';
  amount: number;
  time: string;
}

export interface Market {
  id: number;
  title: string;
  searchQuery: string;
  resolutionTime: string;
  yesBets: number;
  noBets: number;
  resolved: 'YES' | 'NO' | null;
  oddsHistory: { time: number, yesOdds: number }[];
  historicalBets: { id: number; user: string; side: 'YES' | 'NO'; amount: number; time: string }[];
}

interface MarketContextType {
  markets: Market[];
  addMarket: (market: Omit<Market, 'id' | 'yesBets' | 'noBets' | 'historicalBets' | 'resolved' | 'oddsHistory'>) => void;
  placeBet: (marketId: number, side: 'YES' | 'NO', amount: number) => void;
}

// --- Initial Data (using homepage mocks as a base) ---
const MOCK_MARKETS: Market[] = [];

// --- Context Definition ---
const MarketContext = createContext<MarketContextType | undefined>(undefined);


// --- Provider Component ---
export function MarketProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);
  const router = useRouter();

  useEffect(() => {
    const autoResolveMarket = () => {
      setMarkets(prevMarkets => {
        let marketsChanged = false;
        const now = new Date();
        const updatedMarkets = prevMarkets.map(market => {
          if (!market.resolved && new Date(market.resolutionTime) < now) {
            marketsChanged = true;
            // In a real app, an agent would run the search query. Here, we'll randomly resolve it.
            const randomResult: 'YES' | 'NO' = Math.random() > 0.5 ? 'YES' : 'NO';
            return { ...market, resolved: randomResult };
          }
          return market;
        });

        if (marketsChanged) {
          return updatedMarkets;
        }
        return prevMarkets;
      });
    };

    const interval = setInterval(autoResolveMarket, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const addMarket = (market: Omit<Market, 'id' | 'yesBets' | 'noBets' | 'historicalBets' | 'resolved' | 'oddsHistory'>) => {
    const newMarket: Market = {
      ...market,
      id: markets.length + 1,
      yesBets: 0,
      noBets: 0,
      historicalBets: [],
      resolved: null,
      oddsHistory: [{ time: Date.now(), yesOdds: 50 }],
    };
    setMarkets(prevMarkets => [...prevMarkets, newMarket]);
    router.push('/');
  };

  const placeBet = (marketId: number, side: 'YES' | 'NO', amount: number) => {
    setMarkets(prevMarkets => {
      const newMarkets = prevMarkets.map(market => {
        if (market.id === marketId) {
          const newYesBets = market.yesBets + (side === 'YES' ? amount : 0);
          const newNoBets = market.noBets + (side === 'NO' ? amount : 0);
          const totalBets = newYesBets + newNoBets;
          const newYesOdds = totalBets > 0 ? (newYesBets / totalBets) * 100 : 50;

          const newBet = {
            id: market.historicalBets.length + 1,
            user: '0xAb...89', // mock user
            side,
            amount,
            time: new Date().toLocaleTimeString()
          };

          return {
            ...market,
            yesBets: newYesBets,
            noBets: newNoBets,
            oddsHistory: [...market.oddsHistory, { time: Date.now(), yesOdds: newYesOdds }],
            historicalBets: [newBet, ...market.historicalBets],
          };
        }
        return market;
      });
      return newMarkets;
    });
  };

  return (
    <MarketContext.Provider value={{ markets, addMarket, placeBet }}>
      {children}
    </MarketContext.Provider>
  );
}

// --- Custom Hook ---
export function useMarkets() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarkets must be used within a MarketProvider');
  }
  return context;
} 