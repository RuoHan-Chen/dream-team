# Smart Contract Deployment Guide

## Prerequisites

1. **Private Key**: You need a private key with some Sepolia ETH for gas fees
2. **PYUSD**: Some PYUSD tokens on Sepolia for testing (you can get them from faucets)
3. **Environment Variables**: Set up your `.env.local` file

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Contract Deployment
DEPLOYER_PRIVATE_KEY=your_private_key_here
ORACLE_ADDRESS=your_oracle_address_here
STABLECOIN_ADDRESS=0x669e9c75C6AebBA41f86D39E727FCedd89D5Ea53

# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

## Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Deploy the Contract

```bash
node scripts/deploy.js
```

This will:
- Deploy the `BooleanPredictionEscrow` contract to Sepolia
- Use the ABI and bytecode from the `autodeploy` folder
- Output the contract address

### 3. Update Contract Address

After deployment, update `src/contracts/MarketContract.ts`:

```typescript
export const marketContractAddress = '0xYourDeployedContractAddress';
```

### 4. Test the Application

1. Start the development server: `npm run dev`
2. Connect your wallet
3. Create a new market
4. Place bets using PYUSD

## Contract Architecture

The `BooleanPredictionEscrow` contract:

- **One contract per market**: Each prediction market is a separate contract
- **Oracle-based resolution**: Only the oracle can resolve the market
- **PYUSD integration**: Uses PYUSD stablecoin for all transactions
- **Automatic payouts**: Winners are paid out automatically when the market is resolved

## Key Functions

- `placeBet(bool prediction, uint256 amount)`: Place a bet on YES/NO
- `resolveAndDistribute(bool outcome)`: Oracle resolves the market and distributes rewards
- `question()`: Get the market question
- `deadline()`: Get the betting deadline
- `totalTrue/totalFalse/totalPool`: Get betting statistics

## Testing

For testing purposes, the application currently uses mock contracts. To use real contracts:

1. Deploy the contract using the script above
2. Update the contract address in `MarketContract.ts`
3. Make sure you have PYUSD tokens in your wallet
4. The application will automatically switch to real contract interactions

## Troubleshooting

### "No matching key" Error
This error occurs when trying to interact with a contract that doesn't exist. Make sure:
1. The contract address is correct
2. The contract was deployed successfully
3. You're on the correct network (Sepolia)

### Transaction Failures
- Ensure you have enough Sepolia ETH for gas
- Ensure you have enough PYUSD tokens
- Check that you've approved the contract to spend your PYUSD

### Contract Not Found
- Verify the contract address in `MarketContract.ts`
- Check that the contract was deployed to Sepolia
- Ensure your wallet is connected to Sepolia network 