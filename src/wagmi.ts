import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'
import { sepolia } from 'viem/chains'

export const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
}) 