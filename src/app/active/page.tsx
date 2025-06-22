'use client';

import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useMarkets } from "@/context/MarketContext";

export default function ActiveMarketsPage() {
  const { markets } = useMarkets();

  const activeMarkets = markets.filter(m => !m.resolved);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <header className="flex flex-wrap justify-between items-center mb-12 gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Active Markets
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Home
            </Link>
            <Link href="/create" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Create Market
            </Link>
            <Link href="/resolved" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Resolved Markets
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeMarkets.length > 0 ? (
              activeMarkets.map((market) => (
                <Link key={market.id} href={`/market/${market.id}`}>
                  <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <h3 className="font-bold text-lg">{market.question}</h3>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-300">No active markets found.</p>
                <Link href="/create" className="inline-block mt-4 bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300">
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