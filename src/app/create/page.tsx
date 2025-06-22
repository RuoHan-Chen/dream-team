'use client';

import { useState } from 'react';
import { useMarkets } from '@/context/MarketContext';
import Link from 'next/link';

export default function CreateMarketPage() {
  const { addMarket } = useMarkets();
  const [question, setQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolutionTime, setResolutionTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMarket({
      title: question,
      searchQuery,
      resolutionTime,
    });
  };

  const inputStyles = "w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-web3-purple-light focus:outline-none transition-all duration-300";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <Link href="/" className="text-sm text-web3-purple-light hover:underline mb-4 block">
            &larr; Back to Markets
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
            Create a New Market
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="question" className="block text-lg font-semibold mb-2">
              Market Question
            </label>
            <p className="text-sm text-white/60 mb-2">
              Propose a clear, binary (Yes/No) question.
            </p>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder='e.g., "Will Player X score more than 30 points tonight?"'
              className={inputStyles}
              required
            />
          </div>

          <div>
            <label htmlFor="search-query" className="block text-lg font-semibold mb-2">
              Resolution Search Query
            </label>
            <p className="text-sm text-white/60 mb-2">
              Provide a web search query that will be used to resolve the market.
            </p>
            <input
              type="text"
              id="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='e.g., "Player X points scored on [date]"'
              className={inputStyles}
              required
            />
          </div>

          <div>
            <label htmlFor="resolution-time" className="block text-lg font-semibold mb-2">
              Resolution Time
            </label>
            <p className="text-sm text-white/60 mb-2">
              When should the search query be executed to resolve the market?
            </p>
            <input
              type="datetime-local"
              id="resolution-time"
              value={resolutionTime}
              onChange={(e) => setResolutionTime(e.target.value)}
              className={`${inputStyles} calendar-picker-light`}
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-3 px-6 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-lg"
            >
              Preview & Confirm Market
            </button>
          </div>
        </form>
      </div>
    </main>
  );
} 