'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Market {
  id: number;
  question: string;
  searchQuery: string;
  poolSize: number;
  yesBets: number;
  noBets: number;
  ends: number;
  resolved: 'YES' | 'NO' | null;
  historicalBets: any[];
  oddsHistory: any[];
  contractAddress?: `0x${string}`;
}

interface SearchBarProps {
  markets: Market[];
}

export function SearchBar({ markets }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Market[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const filtered = markets.filter(market =>
      market.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.searchQuery.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filtered);
    setShowResults(true);
  }, [searchTerm, markets]);

  const handleMarketClick = (market: Market) => {
    setSearchTerm('');
    setShowResults(false);
    router.push(`/market/${market.id}`);
  };

  const handleClickOutside = () => {
    setTimeout(() => setShowResults(false), 200);
  };

  const activeMarkets = searchResults.filter(market => !market.resolved);
  const resolvedMarkets = searchResults.filter(market => market.resolved !== null);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Search markets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim() !== '' && setShowResults(true)}
          onBlur={handleClickOutside}
          className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {activeMarkets.length > 0 && (
            <div className="p-3">
              <h3 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Active Markets ({activeMarkets.length})
              </h3>
              {activeMarkets.map((market) => (
                <div
                  key={market.id}
                  onClick={() => handleMarketClick(market)}
                  className="p-3 hover:bg-gray-800 rounded-md cursor-pointer transition-colors duration-200"
                >
                  <h4 className="text-white font-medium text-sm">{market.question}</h4>
                  <p className="text-gray-300 text-xs mt-1">Pool: ${market.poolSize.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          {resolvedMarkets.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Resolved Markets ({resolvedMarkets.length})
              </h3>
              {resolvedMarkets.map((market) => (
                <div
                  key={market.id}
                  onClick={() => handleMarketClick(market)}
                  className="p-3 hover:bg-gray-800 rounded-md cursor-pointer transition-colors duration-200"
                >
                  <h4 className="text-white font-medium text-sm">{market.question}</h4>
                  <p className="text-gray-300 text-xs mt-1">
                    Result: {market.resolved} • Pool: ${market.poolSize.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showResults && searchTerm.trim() !== '' && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/20 rounded-lg shadow-lg z-50 p-4">
          <p className="text-gray-300 text-center">No markets found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
} 