'use client';

import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useMarkets } from "@/context/MarketContext";

export default function HomePage() {
  const { markets } = useMarkets();

  const activeMarkets = markets.filter(m => !m.resolved);
  const resolvedMarkets = markets.filter(m => m.resolved);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <header className="flex flex-wrap justify-between items-center mb-12 gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
            Dream Market
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/create" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Create Market
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <section>
          <h2 className="text-3xl font-semibold mb-6">Active Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMarkets.map((market) => (
              <Link key={market.id} href={`/market/${market.id}`}>
                <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <h3 className="font-bold text-lg">{market.question}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-semibold mb-6">Resolved Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resolvedMarkets.map((market) => (
              <Link key={market.id} href={`/market/${market.id}`}>
                <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer opacity-70">
                  <h3 className="font-bold text-lg">{market.question}</h3>
                  <p className="text-emerald-400 font-bold mt-2">Resolved: {market.resolved}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
