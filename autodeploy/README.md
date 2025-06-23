# Dream Market Lending API

This service exposes a simple HTTP API for minting, lending, fast‑forwarding, withdrawing, and burning USDF tokens in a single-contract MVP. An AI “agent” can call these endpoints to manage escrowed stablecoins, simulate interest accrual, and handle collateral flows.

---

## Prerequisites

1. **Node.js** >=14 installed
2. Install dependencies:

   ```bash
   npm install express cors viem dotenv
   ```
3. Create a `.env` in the project root with the following configuration:

   ```ini
   # Deployer and agent keys
   DEPLOYER_PRIVATE_KEY=795a460792f3c8a45367b0c61831c80c9942349abb88e8482ae7fcce2ef729df
   ORACLE_ADDRESS=0x3595DC37466f180F34df108bAf7E1F12036CcF0b
   STABLECOIN_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9

   # User keys (for testing)
   USER1_PRIVATE_KEY=cf22bd1cd4891ccef721b69d0a93116e55bd5f16a0255cb4e168cf5f9ae0304d
   USER2_PRIVATE_KEY=ba267688182c517cd4ad41b2e67aba6e2258816cb816e189f720c93ffefcc885

   # Network configuration
   CHAIN=sepolia             # or flowTestnet
   RPC_URL=https://sepolia.infura.io/v3/0ac6b5c1a7be46118d0c3968e7d9e82a

   # Contract and agent addresses
   CONTRACT_ADDRESS=0x1b393b624F94D04d9dFa92ed2201B197A8620CE7
   AGENT_ADDRESS=0x6DcdF2D57F55953ee170373bdb41b749a645C91e

   PORT=4202                # optional
   ```

---

## Endpoints

Each endpoint listens on `http://localhost:$PORT/api/<route>` and uses JSON.

| Route             | Method | Body Params       | Description                                                  |
| ----------------- | ------ | ----------------- | ------------------------------------------------------------ |
| `/api/mint`       | POST   | `amount` (number) | Mint `amount` USDF (in tokens, auto-converted to 1e18 units) |
| `/api/lend`       | POST   | `amount` (number) | Lend `amount` from agent’s balance into the contract         |
| `/api/add-year`   | POST   | `loanId` (number) | Fast-forward specified loan by one year (testing only)       |
| `/api/unsend`     | POST   | `loanId` (number) | Withdraw principal + interest for a given loan               |
| `/api/burn`       | POST   | `amount` (number) | Burn `amount` USDF from the agent’s balance                  |
| `/api/balance-of` | GET    | *none*            | Read agent’s token balance and active loan IDs               |

### JSON Response Format

```json
{
  "status": "ok",    // or "error"
  "<tx|balance|loanIds>": ...
}
```

---

## Curl Examples

```bash
# 1) Mint 1,000 USDF
ec=1000 tokens => 1000 * 1e18 units
curl -X POST http://localhost:4202/api/mint \
  -H "Content-Type: application/json" \
  -d '{"amount":1000}'

# 2) Lend 1,000 USDF
curl -X POST http://localhost:4202/api/lend \
  -H "Content-Type: application/json" \
  -d '{"amount":1000}'

# 3) Fast-forward Loan #1 by 1 year
curl -X POST http://localhost:4202/api/add-year \
  -H "Content-Type: application/json" \
  -d '{"loanId":1}'

# 4) Unsend (withdraw) Loan #1
curl -X POST http://localhost:4202/api/unsend \
  -H "Content-Type: application/json" \
  -d '{"loanId":1}'

# 5) Burn 1,000 USDF from agent
curl -X POST http://localhost:4202/api/burn \
  -H "Content-Type: application/json" \
  -d '{"amount":1000}'

# 6) Query agent balance & loans
curl http://localhost:4202/api/balance-of
```

---

## Example Agent Workflow

An AI agent automates the following sequence for a new market:

1. **Mint & escrow** 5,000 USDF to the agent:

   ```bash
   curl -X POST /api/mint -d '{"amount":5000}'
   ```
2. **Lend** the full 5,000 for yield:

   ```bash
   curl -X POST /api/lend -d '{"amount":5000}'
   ```
3. **Wait** for market resolution...
4. **Fast-forward** the loan to accrue one year interest:

   ```bash
   curl -X POST /api/add-year -d '{"loanId":1}'
   ```
5. **Withdraw** principal + interest:

   ```bash
   curl -X POST /api/unsend -d '{"loanId":1}'
   ```
6. **Burn** the original 5,000 principal, leaving only profit in circulation:

   ```bash
   curl -X POST /api/burn -d '{"amount":5000}'
   ```

The agent can loop this workflow for multiple users/markets by tracking `loanId`s returned on each `lend` call.\`\`\`
