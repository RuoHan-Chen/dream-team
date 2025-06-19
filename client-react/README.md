# Settlement Search React Client

This is a React-based frontend for the Settlement Search application, implementing x402 micropayments using the same pattern as the browser-wallet-example.

## Features

- **React + TypeScript** with Vite for fast development
- **Wallet Context** for managing wallet connections
- **x402-axios** integration for automatic payment handling
- **SIWE authentication** for secure login
- Clean separation of concerns with services/contexts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

The client will start on http://localhost:8080

## Key Differences from Vanilla JS Client

1. **Better Type Safety**: Full TypeScript support with proper types
2. **Wallet Management**: Centralized wallet context handles all wallet operations
3. **API Service**: Clean API client with automatic x402 payment handling
4. **Modern Build System**: Vite provides fast HMR and optimized builds
5. **Component Architecture**: Reusable components for better maintainability

## Architecture

- `src/contexts/WalletContext.tsx` - Manages wallet connection and authentication
- `src/services/api.ts` - API client with x402 payment interceptor
- `src/components/WalletConnect.tsx` - Wallet connection UI component
- `src/App.tsx` - Main application component

## Testing

1. Connect your wallet (MetaMask or similar)
2. Ensure you're on Base Sepolia network
3. Have some Base Sepolia USDC for payments
4. Try searching - each search costs $0.05 USDC

## Troubleshooting

If you encounter issues:
1. Check the browser console for errors
2. Ensure the backend is running on port 3001
3. Verify you have USDC balance on Base Sepolia
4. Check that MetaMask is on the correct network 