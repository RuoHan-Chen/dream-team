'use client';

import Link from "next/link";
import Image from "next/image";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <header className="flex flex-wrap justify-between items-center mb-3 gap-4">
          <Image
            src="/logo.png"
            alt="Dream Market Logo"
            width={200}
            height={60}
            className="h-24 md:h-36 w-auto"
            priority
          />
          <div className="flex items-center gap-4">
            <ConnectWallet />
          </div>
        </header>

        <div className="text-center py-16">
          <h2 className="text-3xl font-semibold mb-8 text-white">Welcome to Dream Market</h2>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Discover and participate in prediction markets. Place bets on future events and earn rewards for accurate predictions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/active">
              <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <h3 className="text-2xl font-bold text-white mb-4">Active Markets</h3>
                <p className="text-gray-300">Browse and participate in ongoing prediction markets</p>
              </div>
            </Link>
            
            <Link href="/resolved">
              <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <h3 className="text-2xl font-bold text-white mb-4">Resolved Markets</h3>
                <p className="text-gray-300">View completed markets and their outcomes</p>
              </div>
            </Link>
            
            <Link href="/create">
              <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <h3 className="text-2xl font-bold text-white mb-4">Create Market</h3>
                <p className="text-gray-300">Create a new prediction market for others to bet on</p>
              </div>
            </Link>
            
            <Link href="/protected">
              <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <h3 className="text-2xl font-bold text-white mb-4">Protected Site</h3>
                <p className="text-gray-300">Access exclusive content and features</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
