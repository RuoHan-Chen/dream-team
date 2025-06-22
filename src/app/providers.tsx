'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from '@privy-io/wagmi'
import { PrivyProvider } from '@privy-io/react-auth'

import { config } from '@/wagmi'
import { privyConfig } from '@/privy'
import { MarketProvider } from '@/context/MarketContext'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <MarketProvider>{children}</MarketProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
} 