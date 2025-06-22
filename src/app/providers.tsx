'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, State } from 'wagmi'
import { config } from '@/wagmi'
import { MarketProvider } from '@/context/MarketContext'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ClientOnly } from '@/components/ClientOnly';

const queryClient = new QueryClient()

export function Providers({ 
  children,
  initialState
}: { 
  children: React.ReactNode,
  initialState?: State 
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ClientOnly>
          <RainbowKitProvider theme={darkTheme()}>
            <MarketProvider>
              {children}
            </MarketProvider>
          </RainbowKitProvider>
        </ClientOnly>
      </QueryClientProvider>
    </WagmiProvider>
  )
} 