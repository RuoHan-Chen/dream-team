# Market Creation UI Guide

## Overview

The client-react frontend now includes a "Markets" tab that allows users to:

1. **Create prediction markets** with automated resolution via settlement search
2. **Check the status** of existing markets

## Features Added

### 1. Market Creation Form

In the "Markets" tab, you'll find a form with three fields:

- **Market Question**: The yes/no question for your prediction market (e.g., "Will ETH price be above $3000 by end of year?")
- **Resolution Search Query**: The search query that will be executed at resolution time to determine the outcome (e.g., "current ETH price in USD")
- **Resolution Date & Time**: When the market should be resolved (must be at least 5 minutes in the future)

Clicking "Create Market ($0.25)" will:
1. Create a scheduled settlement search
2. Deploy a BooleanPredictionEscrow contract on Sepolia
3. Link them together for automated resolution

### 2. Market Status Checker

Below the creation form, you can check the status of any market by entering its contract address. This shows:
- Market question and search query
- Current status (pending, running, completed, failed)
- Resolution time
- Search results and summary (once executed)

## How to Use

1. **Connect your wallet** using the wallet connect button
2. **Ensure you have**:
   - ETH on Sepolia for gas fees
   - USDC for the x402 payment ($0.25 per market)
3. **Navigate to the Markets tab**
4. **Fill in the market creation form** and click "Create Market"
5. **Save the contract address** that's returned
6. **Check status anytime** by entering the contract address

## Testing Flow

1. Create a market with a resolution time 10-15 minutes in the future
2. Note the contract address
3. Wait for the resolution time
4. Check the market status to see the search results
5. The agent will automatically resolve the contract based on these results

## Payment

- Market creation costs $0.25 via x402 protocol
- This covers both the settlement search and contract deployment
- Payment is processed automatically if your wallet has sufficient USDC

## Contract Details

The deployed BooleanPredictionEscrow contract:
- Allows users to bet TRUE/FALSE with stablecoins
- Can only be resolved by the designated oracle (the agent)
- Automatically distributes winnings after resolution

## Troubleshooting

**"Contract deployment not configured on server"**
- The backend needs proper environment variables set (see backend setup)

**Payment errors**
- Ensure you have sufficient USDC balance
- Check that x402 is properly configured on the backend

**Market not found**
- Make sure you're using the correct contract address
- Verify you're connected with the same wallet that created the market 