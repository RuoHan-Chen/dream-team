'use client';

import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useMarkets } from "@/context/MarketContext";

export default function ResolvedMarketsPage() {
  const { markets } = useMarkets();

  const resolvedMarkets = markets.filter(m => m.resolved);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <header className="flex flex-wrap justify-between items-center mb-12 gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Resolved Markets
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Home
            </Link>
            <Link href="/active" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Active Markets
            </Link>
            <Link href="/create" className="bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300 text-center">
              Create Market
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resolvedMarkets.length > 0 ? (
              resolvedMarkets.map((market) => (
                <Link key={market.id} href={`/market/${market.id}`}>
                  <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer opacity-70">
                    <h3 className="font-bold text-lg">{market.question}</h3>
                    <p className="text-emerald-400 font-bold mt-2">Resolved: {market.resolved}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-300">No resolved markets found.</p>
                <Link href="/active" className="inline-block mt-4 bg-web3-purple/80 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple transition-colors duration-300">
                  View Active Markets
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
} 