import { PrivyClientConfig } from '@privy-io/react-auth';
import { sepolia } from 'viem/chains';

export const privyConfig: PrivyClientConfig = {
  // Replace this with your Privy config
  loginMethods: ['wallet', 'email', 'sms', 'google'],
  appearance: {
    theme: 'dark',
    accentColor: '#676FFF',
  },
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: true,
  },
  defaultChain: sepolia,
  supportedChains: [sepolia],
}; 