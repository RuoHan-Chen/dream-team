# Real End-to-End Testing Guide

## Current State vs What We Need

### ✅ What's Already Working
1. **Contract Deployment**: Backend deploys real BooleanPredictionEscrow contracts on Sepolia
2. **Search Execution**: Real searches run across multiple providers (Exa, Perplexity, Brave, Tavily)
3. **Agent Integration**: Agent receives real search results and makes real decisions
4. **Resolution Attempt**: Agent tries to resolve markets on-chain

### 🔧 What You Need to Configure

The system is **fully built** but needs proper configuration:

1. **ORACLE_ADDRESS**: The address that can resolve markets
2. **ORACLE_PRIVATE_KEY**: The private key that controls ORACLE_ADDRESS
3. **DEPLOYER_PRIVATE_KEY**: Private key with ETH to deploy contracts
4. **STABLECOIN_ADDRESS**: USDC address on Sepolia (0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)

## Step-by-Step Setup

### 1. Verify Your Configuration

```bash
npx tsx verify-config.ts
```

This will check:
- All required environment variables
- Oracle key matches oracle address
- Configuration is valid

### 2. Run the Backend

```bash
npm run dev
```

The backend will:
- Start the API server on port 3001
- Start the scheduler (runs every minute)
- Be ready to deploy contracts and execute searches

### 3. Run the Real Test

```bash
npx tsx test-real-market.ts
```

This test will:
1. **Deploy a real contract** on Sepolia
2. **Schedule a real search** for 2 minutes later
3. **Wait for real search execution**
4. **Watch the agent make a real decision**
5. **Verify the market is resolved on-chain**

## What Happens During the Test

### Phase 1: Market Creation (0-30 seconds)
- Deploys BooleanPredictionEscrow contract
- Links it to a scheduled search query
- Contract is live on Sepolia with your oracle

### Phase 2: Waiting (30 seconds - 2 minutes)
- Scheduler checks every minute
- Waits for resolution time

### Phase 3: Search Execution (at 2 minutes)
- Scheduler triggers search across all providers
- Gets real-time data (e.g., current ETH price)
- Stores results in database

### Phase 4: Agent Resolution (immediately after search)
- Scheduler detects market link
- Calls agent with real search results
- Agent analyzes: "Is ETH above $3000?"
- Agent determines TRUE or FALSE
- Agent sends transaction to resolve

### Phase 5: On-Chain Resolution
- Contract state changes from Open to Resolved
- Winners would receive payouts (if there were bets)
- Market is permanently settled

## Monitoring the Test

### Backend Logs
Watch for:
```
Created scheduled query 123 for market resolution
Executing scheduled query 123: "current ethereum ETH price USD"
Query 123 is associated with market 0x...
Attempting to resolve market 0x...
Market resolved successfully! Outcome: true/false
```

### Test Output
Shows:
- Configuration verification
- Contract deployment details
- Real-time search results
- Agent's decision
- Final on-chain state

### Etherscan
View your contract at:
```
https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]
```

## Common Issues

### "ORACLE_PRIVATE_KEY does not match ORACLE_ADDRESS"
- The private key must control the oracle address
- Use the same wallet for both

### "Contract deployment failed"
- Deployer needs ETH on Sepolia
- Get from: https://sepoliafaucet.com/

### "Market not resolved after search"
- Check backend logs for agent errors
- Verify ORACLE_PRIVATE_KEY is set
- Ensure oracle matches contract

## Using Real Markets via UI

Instead of the test script, you can:

1. Open the React UI
2. Go to Markets → Create
3. Enter a question like "Is Bitcoin above $50,000?"
4. Set resolution 2+ minutes in future
5. Watch it resolve automatically

## Architecture Flow

```
User Creates Market → Deploy Contract → Schedule Search
                                              ↓
Agent Resolves ← Send to Agent ← Execute Search (at resolution time)
      ↓
Contract Resolved → Winners Paid
```

## Next Steps

Once this test passes:
1. ✅ Your system is fully operational
2. ✅ Markets deploy and resolve automatically
3. ✅ Ready to implement betting (Step 3)
4. ✅ Can deploy to production

## Tips

- Use questions with clear TRUE/FALSE answers
- Set resolution times at least 2 minutes out
- Monitor backend logs for detailed flow
- Check Etherscan for on-chain verification 