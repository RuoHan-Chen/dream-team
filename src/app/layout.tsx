'use client';

import { useState } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { LogoScreen } from "@/components/LogoScreen";
import { SearchBar } from "@/components/SearchBar";
import { useMarkets } from "@/context/MarketContext";
import { TwinklingStars } from "@/components/TwinklingStars";
import Link from "next/link";
import Image from "next/image";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showLogoScreen, setShowLogoScreen] = useState(true);

  const handleLogoScreenComplete = () => {
    setShowLogoScreen(false);
  };

  return (
    <html lang="en">
      <head>
        <title>Dream Market</title>
        <meta name="description" content="Predict the future, earn rewards" />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: '"Suisse Int\'l", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <Providers>
          <div className="min-h-screen">
            <TwinklingStars />
            <SearchBarWrapper />
            {children}
          </div>
          {showLogoScreen && (
            <LogoScreen onComplete={handleLogoScreenComplete}>
              {children}
            </LogoScreen>
          )}
        </Providers>
      </body>
    </html>
  );
}

// Separate component to use the useMarkets hook
function SearchBarWrapper() {
  const { markets } = useMarkets();
  
  return (
    <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="block hover:scale-105 transition-transform duration-200">
              <Image
                src="/logo.png"
                alt="Dream Market Logo"
                width={200}
                height={60}
                className="h-12 md:h-16 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/create" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-3 md:px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl text-sm">
                Create
              </Link>
              <Link href="/active" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-3 md:px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl text-sm">
                Active
              </Link>
              <Link href="/resolved" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold py-2 px-3 md:px-4 rounded-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center shadow-lg hover:shadow-xl text-sm">
                Resolved
              </Link>
            </div>
          </div>
          <div className="flex-1 max-w-2xl mx-auto w-full">
            <SearchBar markets={markets} />
          </div>
          <div className="flex items-center justify-end">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </div>
  );
}
