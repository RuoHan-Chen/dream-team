'use client';

import Link from "next/link";
import Image from "next/image";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useMarkets } from "@/context/MarketContext";

export default function ResolvedMarketsPage() {
  const { markets } = useMarkets();

  const resolvedMarkets = markets.filter(m => m.resolved);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <header className="flex flex-wrap justify-between items-center mb-12 gap-4">
          <Link href="/" className="block hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo.png"
              alt="Dream Market Logo"
              width={200}
              height={60}
              className="h-16 md:h-24 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl">
              Home
            </Link>
            <Link href="/active" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl">
              Active Markets
            </Link>
            <Link href="/create" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl">
              Create Market
            </Link>
            <ConnectWallet />
          </div>
        </header>

        <section>
          <h2 className="text-3xl font-semibold mb-6 text-white">Resolved Markets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resolvedMarkets.length > 0 ? (
              resolvedMarkets.map((market) => (
                <Link key={market.id} href={`/market/${market.id}`}>
                  <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-pointer opacity-70 shadow-lg hover:shadow-xl">
                    <h3 className="font-bold text-lg">{market.question}</h3>
                    <p className="text-emerald-400 font-bold mt-2">Resolved: {market.resolved}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-xl text-gray-300">No resolved markets found.</p>
                <Link href="/active" className="inline-block mt-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
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