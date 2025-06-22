'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import {
  marketContractAddress,
  marketContractAbi,
  pyusdContractAddress,
  pyusdContractAbi,
} from '@/contracts/MarketContract';
import { parseUnits } from 'viem';

// --- Types ---
interface Bet {
  id: number;
  user: string;
  side: 'YES' | 'NO';
  amount: number;
  time: string;
}

interface OddsHistory {
  time: number;
  yesOdds: number;
}

interface Market {
  id: number;
  question: string;
  searchQuery: string;
  poolSize: number;
  yesBets: number;
  noBets: number;
  ends: number; // timestamp
  resolved: 'YES' | 'NO' | null;
  historicalBets: Bet[];
  oddsHistory: OddsHistory[];
}

interface MarketContextType {
  markets: Market[];
  addMarket: (market: Omit<Market, 'id' | 'poolSize' | 'yesBets' | 'noBets' | 'resolved' | 'historicalBets' | 'oddsHistory'>) => void;
  placeBet: (marketId: number, side: 'YES' | 'NO', amount: number) => void;
  resolveMarket: (marketId: number, resolution: 'YES' | 'NO') => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

interface MarketProviderProps {
  children: ReactNode;
}

// --- Provider Component ---
export const MarketProvider: React.FC<MarketProviderProps> = ({ children }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const { writeContractAsync } = useWriteContract();
  const { authenticated, user, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updatedMarkets = markets.map((market) => {
        if (market.ends < now && !market.resolved) {
          // Simple resolution logic: higher bet amount wins
          const resolvedValue: 'YES' | 'NO' = market.yesBets > market.noBets ? 'YES' : 'NO';
          return { ...market, resolved: resolvedValue };
        }
        return market;
      });
      // Only update state if there were changes to avoid re-renders
      if (JSON.stringify(markets) !== JSON.stringify(updatedMarkets)) {
        setMarkets(updatedMarkets);
      }
    }, 1000 * 60); // Check every minute

    return () => clearInterval(interval);
  }, [markets]);

  const addMarket = useCallback(
    (marketData: Omit<Market, 'id' | 'poolSize' | 'yesBets' | 'noBets' | 'resolved' | 'historicalBets' | 'oddsHistory'>) => {
      const newMarket: Market = {
        ...marketData,
        id: markets.length + 1,
        poolSize: 0,
        yesBets: 0,
        noBets: 0,
        resolved: null,
        historicalBets: [],
        oddsHistory: [],
      };
      setMarkets((prevMarkets) => [...prevMarkets, newMarket]);
      router.push('/');
    },
    [markets, router]
  );

  const resolveMarket = (marketId: number, resolution: 'YES' | 'NO') => {
    setMarkets(prevMarkets =>
      prevMarkets.map(market => {
        if (market.id === marketId && !market.resolved) {
          return { ...market, resolved: resolution };
        }
        return market;
      })
    );
  };

  const placeBet = useCallback(
    (marketId: number, selectedOutcome: 'YES' | 'NO', amount: number) => {
      if (!authenticated) {
        alert('Please connect your wallet to place a bet.');
        login();
        return;
      }

      const userAddress = user?.wallet?.address;

      if (!userAddress) {
        alert('Could not find wallet address.');
        return;
      }

      if (marketContractAddress === '0xYourContractAddressHere') {
        alert('Please replace "0xYourContractAddressHere" with your deployed contract address in src/contracts/MarketContract.ts');
        return;
      }
      
      console.log('Placing bet...', { marketId, selectedOutcome, amount, userAddress });
      
      writeContractAsync({
        address: pyusdContractAddress,
        abi: pyusdContractAbi,
        functionName: 'approve',
        args: [marketContractAddress, parseUnits(amount.toString(), 6)],
      })
      .then(() => {
        return writeContractAsync({
          address: marketContractAddress,
          abi: marketContractAbi,
          functionName: 'placeBet',
          args: [
            BigInt(marketId),
            selectedOutcome === 'YES' ? 1 : 0,
            parseUnits(amount.toString(), 6)
          ],
        });
      })
      .then(() => {
        alert('Bet placed successfully!');
        const updatedMarkets = markets.map((market) => {
          if (market.id === marketId) {
            const newBet: Bet = {
              id: market.historicalBets.length + 1,
              user: userAddress,
              side: selectedOutcome,
              amount: amount,
              time: new Date().toISOString(),
            };
            const updatedMarket = {
              ...market,
              poolSize: market.poolSize + amount,
              yesBets: selectedOutcome === 'YES' ? market.yesBets + amount : market.yesBets,
              noBets: selectedOutcome === 'NO' ? market.noBets + amount : market.noBets,
              historicalBets: [...market.historicalBets, newBet],
            };
            // Recalculate odds and update history
            const { yesBets, noBets } = updatedMarket;
            const totalBets = yesBets + noBets;
            const yesOdds = totalBets > 0 ? (yesBets / totalBets) * 100 : 50;
            updatedMarket.oddsHistory.push({ time: Date.now(), yesOdds });
            return updatedMarket;
          }
          return market;
        });
        setMarkets(updatedMarkets);
      })
      .catch((err) => {
        console.error('Transaction failed', err);
        alert('Transaction failed. See console for details.');
      });
    },
    [markets, writeContractAsync, authenticated, user, login]
  );

  const contextValue = {
    markets,
    addMarket,
    placeBet,
    resolveMarket,
  };

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
};

// --- Custom Hook ---
export const useMarkets = () => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarkets must be used within a MarketProvider');
  }
  return context;
}; 