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
import { useWriteContract, useReadContract } from 'wagmi';
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
  contractAddress?: `0x${string}`; // Address of the deployed contract
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

function toHexAddress(addr: string): `0x${string}` {
  return addr as `0x${string}`;
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
    async (marketData: Omit<Market, 'id' | 'poolSize' | 'yesBets' | 'noBets' | 'resolved' | 'historicalBets' | 'oddsHistory'>) => {
      try {
        // For now, we'll create a mock market without deploying a contract
        // In a real implementation, you would deploy the contract here
        const newMarket: Market = {
          ...marketData,
          id: markets.length + 1,
          poolSize: 0,
          yesBets: 0,
          noBets: 0,
          resolved: null,
          historicalBets: [],
          oddsHistory: [],
          contractAddress: (`0xMockContract${markets.length + 1}` as `0x${string}`), // Mock address
        };
        setMarkets((prevMarkets) => [...prevMarkets, newMarket]);
        router.push('/');
      } catch (error) {
        console.error('Failed to create market:', error);
        alert('Failed to create market. Please try again.');
      }
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
    async (marketId: number, selectedOutcome: 'YES' | 'NO', amount: number) => {
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

      const market = markets.find(m => m.id === marketId);
      if (!market) {
        alert('Market not found.');
        return;
      }

      if (!market.contractAddress || market.contractAddress.startsWith('0xMockContract')) {
        // For mock markets, update the local state
        const updatedMarkets = markets.map((m) => {
          if (m.id === marketId) {
            const newBet: Bet = {
              id: m.historicalBets.length + 1,
              user: userAddress,
              side: selectedOutcome,
              amount: amount,
              time: new Date().toISOString(),
            };
            const updatedMarket = {
              ...m,
              poolSize: m.poolSize + amount,
              yesBets: selectedOutcome === 'YES' ? m.yesBets + amount : m.yesBets,
              noBets: selectedOutcome === 'NO' ? m.noBets + amount : m.noBets,
              historicalBets: [...m.historicalBets, newBet],
            };
            // Recalculate odds and update history
            const { yesBets, noBets } = updatedMarket;
            const totalBets = yesBets + noBets;
            const yesOdds = totalBets > 0 ? (yesBets / totalBets) * 100 : 50;
            updatedMarket.oddsHistory.push({ time: Date.now(), yesOdds });
            return updatedMarket;
          }
          return m;
        });
        setMarkets(updatedMarkets);
        return;
      }

      // For real contracts, interact with the blockchain
      if (!market.contractAddress) {
        alert('Market contract address is missing.');
        return;
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(market.contractAddress)) {
        alert('Market contract address is not a valid Ethereum address.');
        return;
      }
      try {
        console.log('Placing bet on contract...', { marketId, selectedOutcome, amount, userAddress });
        
        // First approve the contract to spend PYUSD
        await writeContractAsync({
          address: pyusdContractAddress,
          abi: pyusdContractAbi,
          functionName: 'approve',
          args: [market.contractAddress, parseUnits(amount.toString(), 6)],
        });

        // Then place the bet
        await writeContractAsync({
          address: toHexAddress(market.contractAddress),
          abi: marketContractAbi,
          functionName: 'placeBet',
          args: [selectedOutcome === 'YES', parseUnits(amount.toString(), 6)],
        });

        // Update local state to reflect the bet
        const updatedMarkets = markets.map((m) => {
          if (m.id === marketId) {
            const newBet: Bet = {
              id: m.historicalBets.length + 1,
              user: userAddress,
              side: selectedOutcome,
              amount: amount,
              time: new Date().toISOString(),
            };
            const updatedMarket = {
              ...m,
              poolSize: m.poolSize + amount,
              yesBets: selectedOutcome === 'YES' ? m.yesBets + amount : m.yesBets,
              noBets: selectedOutcome === 'NO' ? m.noBets + amount : m.noBets,
              historicalBets: [...m.historicalBets, newBet],
            };
            // Recalculate odds and update history
            const { yesBets, noBets } = updatedMarket;
            const totalBets = yesBets + noBets;
            const yesOdds = totalBets > 0 ? (yesBets / totalBets) * 100 : 50;
            updatedMarket.oddsHistory.push({ time: Date.now(), yesOdds });
            return updatedMarket;
          }
          return m;
        });
        setMarkets(updatedMarkets);
      } catch (err) {
        console.error('Transaction failed', err);
        alert('Transaction failed. See console for details.');
      }
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