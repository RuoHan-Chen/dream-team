'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Start fade-in animation immediately when component mounts
    // This ensures content starts fading in as soon as the logo screen begins sliding
    setShowContent(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="w-full max-w-5xl">
        <div className={`text-center py-16 transition-all duration-1000 ease-out transform ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className={`text-3xl font-semibold mb-8 text-white transition-all duration-1000 ease-out delay-200 transform ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Welcome to Dream Market
          </h2>
          <p className={`text-xl text-gray-300 mb-12 max-w-2xl mx-auto transition-all duration-1000 ease-out delay-400 transform ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Discover and participate in prediction markets. Place bets on future events and earn rewards for accurate predictions.
          </p>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto transition-all duration-1000 ease-out delay-600 transform ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <Link href="/active">
              <div className={`bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: showContent ? '800ms' : '0ms' }}>
                <h3 className="text-2xl font-bold text-white mb-4">Active Markets</h3>
                <p className="text-gray-300">Browse and participate in ongoing prediction markets</p>
              </div>
            </Link>
            
            <Link href="/resolved">
              <div className={`bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: showContent ? '900ms' : '0ms' }}>
                <h3 className="text-2xl font-bold text-white mb-4">Resolved Markets</h3>
                <p className="text-gray-300">View completed markets and their outcomes</p>
              </div>
            </Link>
            
            <Link href="/create">
              <div className={`bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: showContent ? '1000ms' : '0ms' }}>
                <h3 className="text-2xl font-bold text-white mb-4">Create Market</h3>
                <p className="text-gray-300">Create a new prediction market for others to bet on</p>
              </div>
            </Link>
            
            <Link href="/protected">
              <div className={`bg-white/10 p-8 rounded-lg backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`} style={{ transitionDelay: showContent ? '1100ms' : '0ms' }}>
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
