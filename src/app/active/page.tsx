'use client';

import Link from "next/link";
import { useMarkets } from "@/context/MarketContext";

export default function ActiveMarketsPage() {
  const { markets } = useMarkets();

  const activeMarkets = markets.filter(m => !m.resolved);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <section>
          <h2 className="text-3xl font-semibold mb-6 text-white">Active Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMarkets.length > 0 ? (
              activeMarkets.map((market) => (
                <Link key={market.id} href={`/market/${market.id}`}>
                  <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                    <h3 className="font-bold text-lg mb-2">{market.question}</h3>
                    <p className="text-sm text-gray-300">
                      Resolves: {new Date(market.ends).toLocaleDateString()} at {new Date(market.ends).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-300">No active markets found.</p>
                <Link href="/create" className="inline-block mt-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Create the first market
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
} 