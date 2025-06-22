'use client';

import Link from "next/link";
import Image from "next/image";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function ProtectedPage() {
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

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
              <h1 className="text-4xl font-bold mb-4 text-white text-center">Protected Content</h1>
              <p className="text-lg text-gray-200 text-center mb-6">
                Your payment was successful! Enjoy this banger song.
              </p>
              <div className="bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <iframe 
                  width="100%" 
                  height="300" 
                  scrolling="no" 
                  frameBorder="no" 
                  allow="autoplay" 
                  src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2044190296&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
                  className="rounded-lg"
                ></iframe>
                <div className="mt-2 text-center" style={{ fontSize: '10px', color: '#cccccc', lineBreak: 'anywhere', wordBreak: 'normal', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontFamily: 'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif', fontWeight: '100' }}>
                  <a href="https://soundcloud.com/dan-kim-675678711" title="danXkim" target="_blank" style={{ color: '#cccccc', textDecoration: 'none' }}>danXkim</a> · <a href="https://soundcloud.com/dan-kim-675678711/x402" title="x402 (DJ Reppel Remix)" target="_blank" style={{ color: '#cccccc', textDecoration: 'none' }}>x402 (DJ Reppel Remix)</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}