import { http, createConfig } from '@wagmi/core'
import { sepolia } from 'wagmi/chains'
//config used for reading onchain data
export const config = createConfig({
    chains: [sepolia],
    transports: {
      // RPC URL for each chain
      [sepolia.id]: http(
        "https://sepolia.infura.io/v3/"+process.env.NEXT_PUBLIC_INFURA_API_KEY,
      ),
    },
  });