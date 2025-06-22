import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="absolute top-8 right-8">
        <ConnectWallet />
      </div>
      <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
        Dream Market
      </h1>
      <div className="flex flex-col gap-4 items-center">
        <Link href="/create" className="bg-web3-purple/50 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple/70 transition-colors duration-300 w-64 text-center">
          Create Market
        </Link>
        <Link href="/market/1" className="bg-web3-purple/50 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple/70 transition-colors duration-300 w-64 text-center">
          Market Detail
        </Link>
        <Link href="/wallet" className="bg-web3-purple/50 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple/70 transition-colors duration-300 w-64 text-center">
          Wallet
        </Link>
      </div>
    </main>
  );
}
