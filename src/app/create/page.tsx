'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMarkets } from '@/context/MarketContext';
import { useRouter } from 'next/navigation';

export default function CreateMarketPage() {
  const { addMarket } = useMarkets();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ends, setEnds] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !ends || !searchQuery) {
      alert('Please fill out all fields.');
      return;
    }

    try {
      // Step 1: Call autodeploy API to get transaction hash
      const deployResponse = await fetch('http://localhost:4200/api/create-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          deadline: Math.floor(new Date(ends).getTime() / 1000),
        }),
      });

      const deployResult = await deployResponse.json();

      if (deployResult.status !== 'pending') {
        throw new Error(deployResult.error || 'Deployment failed');
      }

      const txHash = deployResult.transactionHash;
      console.log('Deployment transaction hash:', txHash);
      const rpcUrl = 'https://sepolia.infura.io/v3/' + process.env.NEXT_PUBLIC_INFURA_API_KEY;
      // Step 2: Wait a bit for transaction to be mined, then get contract address
      setTimeout(async () => {
        try {
          const contractResponse = await fetch('/api/get-contract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txHash: txHash,
              rpcUrl: rpcUrl,
            }),
          });

          const contractResult = await contractResponse.json();

          if (contractResult.status === 'success') {
            const contractAddress = contractResult.contractAddress;
            console.log('Contract deployed at:', contractAddress);

            // Step 3: Add market with contract address
            addMarket({
              question,
              searchQuery,
              ends: new Date(ends).getTime(),
              contractAddress: contractAddress,
            });
            router.push('/active');
          } else {
            throw new Error(contractResult.error || 'Failed to get contract address');
          }
        } catch (contractError) {
          console.error('Error getting contract address:', contractError);
          alert('Market created but could not retrieve contract address. Please check the transaction manually.');
          // Still add the market without address
          addMarket({
            question,
            searchQuery,
            ends: new Date(ends).getTime(),
          });
          router.push('/active');
        }
      }, 10000); // Wait 5 seconds for transaction to be mined

    } catch (error) {
      console.error('Deployment error:', error);
      alert(`Error creating market: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
              <button onClick={() => router.back()} className="mb-6 text-sm text-gray-300 hover:text-white transition-colors">
                &larr; Back to markets
              </button>
              <h1 className="text-4xl font-bold mb-8 text-center text-white">
                Create a New Market
              </h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="question" className="block text-sm font-medium text-gray-200 mb-2">
                    Market Question
                  </label>
                  <input
                    id="question"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., Will ETH reach $5,000 by the end of the year?"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition backdrop-blur-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-200 mb-2">
                    Resolution Search Query
                  </label>
                  <input
                    id="searchQuery"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., ETH price on CoinGecko at end of year"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition backdrop-blur-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ends" className="block text-sm font-medium text-gray-200 mb-2">
                    Resolution Date and Time
                  </label>
                  <input
                    id="ends"
                    type="datetime-local"
                    value={ends}
                    onChange={(e) => setEnds(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition backdrop-blur-sm calendar-picker-light"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Create Market
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 