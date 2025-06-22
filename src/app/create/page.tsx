'use client';

import { useState } from 'react';
import { useMarkets } from '@/context/MarketContext';
import { useRouter } from 'next/navigation';

export default function CreateMarketPage() {
  const { addMarket } = useMarkets();
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ends, setEnds] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !ends || !searchQuery) {
      alert('Please fill out all fields.');
      return;
    }
    addMarket({
      question,
      searchQuery,
      ends: new Date(ends).getTime(),
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700">
        <button onClick={() => router.back()} className="mb-6 text-sm text-gray-400 hover:text-white transition-colors">
          &larr; Back to markets
        </button>
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
          Create a New Market
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-2">
              Market Question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will ETH reach $5,000 by the end of the year?"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              required
            />
          </div>
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-300 mb-2">
              Resolution Search Query
            </label>
            <input
              id="searchQuery"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., ETH price on CoinGecko at end of year"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
              required
            />
          </div>
          <div>
            <label htmlFor="ends" className="block text-sm font-medium text-gray-300 mb-2">
              Resolution Date and Time
            </label>
            <input
              id="ends"
              type="datetime-local"
              value={ends}
              onChange={(e) => setEnds(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition calendar-picker-light"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Create Market
          </button>
        </form>
      </div>
    </main>
  );
} 