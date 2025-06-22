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
  historicalBets: Bet[];
  resolved: 'Yes' | 'No' | null;
}

interface MarketContextType {
  markets: Market[];
  addMarket: (market: Omit<Market, 'id' | 'yesBets' | 'noBets' | 'historicalBets' | 'resolved'>) => void;
  placeBet: (marketId: number, side: 'YES' | 'NO', amount: number) => void;
}

// --- Initial Data (using homepage mocks as a base) ---
const initialMarkets: Market[] = [];


// --- Context Definition ---
const MarketContext = createContext<MarketContextType | undefined>(undefined);


// --- Provider Component ---
export function MarketProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(initialMarkets);
  const router = useRouter();

  useEffect(() => {
    const resolveMarkets = () => {
      const now = new Date();
      setMarkets(prevMarkets => {
        let marketsChanged = false;
        const updatedMarkets = prevMarkets.map(market => {
          if (!market.resolved && new Date(market.resolutionTime) < now) {
            marketsChanged = true;
            // In a real app, an agent would run the search query. Here, we'll randomly resolve it.
            const randomResult: 'Yes' | 'No' = Math.random() > 0.5 ? 'Yes' : 'No';
            return { ...market, resolved: randomResult };
          }
          return market;
        });
        return marketsChanged ? updatedMarkets : prevMarkets;
      });
    };

    const interval = setInterval(resolveMarkets, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const addMarket = (market: Omit<Market, 'id' | 'yesBets' | 'noBets' | 'historicalBets' | 'resolved'>) => {
    const newMarket: Market = {
      ...market,
      id: markets.length + 1,
      yesBets: 0,
      noBets: 0,
      historicalBets: [],
      resolved: null,
    };
    setMarkets(prevMarkets => [...prevMarkets, newMarket]);
    router.push('/');
  };

  const placeBet = (marketId: number, side: 'YES' | 'NO', amount: number) => {
    setMarkets(prevMarkets => 
      prevMarkets.map(market => {
        if (market.id === marketId) {
          const newBet: Bet = {
            id: market.historicalBets.length + 1,
            user: '0xabc...def', // Mock user
            side,
            amount,
            time: new Date().toLocaleTimeString()
          };
          
          return {
            ...market,
            yesBets: side === 'YES' ? market.yesBets + amount : market.yesBets,
            noBets: side === 'NO' ? market.noBets + amount : market.noBets,
            historicalBets: [newBet, ...market.historicalBets]
          };
        }
        return market;
      })
    );
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