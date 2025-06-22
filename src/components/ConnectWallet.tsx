'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const buttonStyles = "bg-web3-purple/50 border border-web3-purple-light text-white font-bold py-2 px-4 rounded-lg hover:bg-web3-purple/70 transition-colors duration-300"

  if (isConnected) {
    const shortAddress = `${address?.substring(0, 6)}...${address?.substring(address.length - 4)}`
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm">Connected as {shortAddress}</p>
        <button onClick={() => disconnect()} className={`${buttonStyles} bg-red-500/50 border-red-500 hover:bg-red-500/70`}>
          Disconnect
        </button>
      </div>
    )
  }

  return <button onClick={() => connect({ connector: injected() })} className={buttonStyles}>Connect Wallet</button>
} 