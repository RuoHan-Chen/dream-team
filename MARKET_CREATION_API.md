# Market Creation API Documentation

## Overview

The market creation API allows users to create prediction markets that are automatically resolved using settlement search results. When a market is created:

1. A scheduled settlement search is created
2. A BooleanPredictionEscrow contract is deployed on Sepolia
3. The contract and search are linked in the database
4. At resolution time, the search executes and the agent resolves the contract

## Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
# Contract deployment
DEPLOYER_PRIVATE_KEY=0x... # Private key with ETH on Sepolia for gas
ORACLE_ADDRESS=0x...       # Address of the agent that will resolve markets
STABLECOIN_ADDRESS=0x...   # PYUSD or other stablecoin address on Sepolia
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Existing settlement search vars
BUSINESS_WALLET_ADDRESS=0x... # For x402 payments
X402_NETWORK=base-sepolia    # or your preferred network
FACILITATOR_URL=https://x402.org/facilitator
```

### Database Migration

The database schema is automatically updated when you start the server. New tables added:

- `market_queries`: Links markets to settlement search queries

## API Endpoint

### POST /api/markets/create

Creates a new prediction market with automated resolution.

**Authentication Required**: Yes (Bearer token from SIWE auth)

**Request Body**:
```json
{
  "marketQuestion": "Will ETH price be above $3000 on December 31, 2024?",
  "searchQuery": "current ETH price in USD",
  "resolutionDate": "2024-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "success": true,
  "marketContractAddress": "0x...",
  "queryId": 123,
  "scheduledFor": "2024-12-31T23:59:59Z",
  "transactionHash": "0x...",
  "message": "Market created successfully. The settlement search will execute at the resolution time.",
  "pricePaid": "$0.25"
}
```

**X402 Payment**: This endpoint requires a $0.25 payment via x402.

## Testing

1. **Start the backend server**:
   ```bash
   npm run dev:backend
   ```

2. **Run the test script**:
   ```bash
   npx tsx test-market-creation.ts
   ```

   The test script will:
   - Generate a test wallet
   - Authenticate via SIWE
   - Create a market scheduled for 10 minutes in the future
   - Handle the x402 payment flow (will show 402 error if payment not configured)

3. **For testing without x402 payment**, temporarily comment out the payment section in the endpoint or set `BUSINESS_WALLET_ADDRESS` to empty in `.env`.

## Contract Details

The deployed BooleanPredictionEscrow contract:
- Allows users to bet TRUE or FALSE with stablecoins
- Can only be resolved by the designated oracle address
- Distributes the pool to winners after resolution

Constructor parameters:
- `question`: The market question
- `deadline`: Unix timestamp when betting closes and resolution can happen
- `oracle`: Address that can resolve the market (your agent)
- `stablecoin`: ERC20 token address for betting

## Next Steps

After testing this endpoint:

1. **Update the scheduler** to check for market-linked queries and notify the agent
2. **Create agent webhook** to receive resolution requests
3. **Update frontend** to use this API instead of local market creation

## Troubleshooting

**Contract deployment fails**:
- Ensure DEPLOYER_PRIVATE_KEY has ETH on Sepolia
- Check SEPOLIA_RPC_URL is valid
- Verify contract artifact path is correct

**x402 payment issues**:
- Ensure BUSINESS_WALLET_ADDRESS is set
- Check x402 facilitator URL is accessible
- For testing, disable x402 by removing BUSINESS_WALLET_ADDRESS

**Database errors**:
- Delete `data/settlement-search.db` and restart to recreate schema
- Check write permissions on `data/` directory 