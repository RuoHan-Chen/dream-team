# Settlement Search MCP Server

This MCP (Model Context Protocol) server provides access to Settlement Search's multi-source AI-powered web search functionality through Claude Desktop or other MCP clients.

## Features

- **Multi-source Search**: Query Exa, Perplexity, Brave, and Tavily simultaneously
- **Scheduled Searches**: Schedule queries for future execution
- **Email Notifications**: Optionally receive search results via email
- **Search History**: View past searches and pending queries
- **Crypto Payments**: Pay for searches using USDC via x402 standard
- **Wallet Authentication**: Secure authentication using Sign-In with Ethereum (SIWE)

## Prerequisites

1. Node.js 18+ installed
2. Settlement Search backend running (default: http://localhost:3001)
3. A crypto wallet with USDC on Base or Base Sepolia
   - For testing: Use Base Sepolia testnet
   - Get test USDC from a faucet
   - Need enough for gas fees + search costs ($0.05-$0.15 per search)
4. (Optional) Claude Desktop for testing

## Installation

1. Install dependencies (including the new x402-axios package):
```bash
npm install
```

**Important:** Make sure all dependencies are installed, especially `x402-axios` which handles automatic payment signing.

2. Create a `.env` file with your configuration:
```env
# Backend URL (default: http://localhost:3001)
SETTLEMENT_SEARCH_BACKEND_URL=http://localhost:3001

# Optional: Your wallet private key (if not provided, a new wallet will be generated)
WALLET_PRIVATE_KEY=0x...

# Network: "base" or "base-sepolia" (default: base-sepolia)
X402_NETWORK=base-sepolia

# Optional: Coinbase Onramp App ID (default: 5509b221-a33d-4f8a-84e5-886f458569f4)
COINBASE_ONRAMP_APP_ID=5509b221-a33d-4f8a-84e5-886f458569f4
```

## Usage

### Testing with FastMCP CLI

The easiest way to test the MCP server:

```bash
npm run mcp:dev
```

This will launch an interactive CLI where you can test all the tools.

### Inspecting with Web UI

To use the MCP Inspector web interface:

```bash
npm run mcp:inspect
```

### Using with Claude Desktop

1. Add the following to your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "settlement-search": {
      "command": "npx",
      "args": ["tsx", "/path/to/your/settlement-search/mcp-server.ts"],
      "env": {
        "SETTLEMENT_SEARCH_BACKEND_URL": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "0x...",  // Your private key WITH 0x prefix
        "X402_NETWORK": "base-sepolia",
        "COINBASE_ONRAMP_APP_ID": "5509b221-a33d-4f8a-84e5-886f458569f4"  // Optional
      }
    }
  }
}
```

**Important:** 
- The private key MUST include the `0x` prefix
- Example: `"WALLET_PRIVATE_KEY": "0x24e390588eb790531879cb56757c99d12ab38a44af6cbc1dd3d2a90cda408280"`

2. Restart Claude Desktop

## Available Tools

### 1. `authenticate`
Authenticate with your crypto wallet. This is required before using any other tools.

**Parameters:**
- `privateKey` (optional): Your wallet private key in hex format with 0x prefix

**Priority order:**
1. Private key passed to the tool
2. `WALLET_PRIVATE_KEY` environment variable
3. Generate a new wallet

**Examples:**
```
// Use environment variable wallet
Use the authenticate tool to connect my wallet

// Use specific wallet
Use the authenticate tool with private key 0x...
```

### 2. `search`
Perform an immediate multi-source web search.

**Cost:** $0.05 USDC

**Parameters:**
- `query`: The search query

**Example:**
```
Search for "latest developments in AI"
```

### 3. `scheduleSearch`
Schedule a search for future execution.

**Cost:** 
- $0.10 USDC (basic scheduling)
- $0.15 USDC (with email notification)

**Parameters:**
- `query`: The search query
- `scheduleFor`: When to execute (ISO date format)
- `userEmail` (optional): Email for notifications

**Timezone Handling:**
- Use UTC with 'Z' suffix: `2024-12-25T15:00:00Z`
- Use local time with offset: `2024-12-25T10:00:00-05:00` (EST)
- The response will show both UTC and your local time

**Example:**
```
Schedule a search for "NBA finals score" tomorrow at 10am
```

### 4. `viewHistory`
View your search history.

**Parameters:**
- `limit`: Number of queries to retrieve (1-100, default: 10)

### 5. `viewPending`
View pending scheduled queries.

### 6. `deleteQuery`
Delete a scheduled query that hasn't executed yet.

**Parameters:**
- `queryId`: The ID of the query to delete

### 7. `getQueryDetails`
Get detailed information about a specific query.

**Parameters:**
- `queryId`: The ID of the query

### 8. `getCurrentTime`
Get the current server time in various formats. Essential for calculating relative scheduling times.

**No parameters required**

**Returns:**
- ISO UTC time
- ISO Local time with offset
- Human-readable local time
- Timezone information
- Unix timestamp

**Use this tool when:**
- User says "in 10 minutes"
- User says "tomorrow"
- User says "next week"
- Any relative time expression

### 9. `getCoinbaseOnrampLink`
Get a personalized Coinbase Onramp link to buy USDC for your authenticated wallet.

**Parameters:**
- `suggestedAmount` (optional): USD amount to suggest (1-1000, default: $10)

**Example:**
```
Get me a link to buy USDC
Get me a link to buy $50 worth of USDC
```

**Returns:** A formatted response with a direct link to Coinbase Onramp, pre-configured for your wallet.

## Natural Language Examples

The MCP server includes a prompt template for natural language scheduling:

```
"Remind me tomorrow what the score of tonight's NBA finals game is"
```

This will:
1. Authenticate your wallet (if needed)
2. Parse the request to determine the search query and timing
3. Schedule the search appropriately
4. Confirm the scheduled search

## Timezone Quick Reference

When scheduling searches, here are common timezone conversions:

| Your Local Time | UTC (Z suffix) | With Timezone Offset |
|-----------------|----------------|---------------------|
| 10:00 AM EST | 3:00 PM UTC | 10:00:00-05:00 |
| 10:00 AM EDT | 2:00 PM UTC | 10:00:00-04:00 |
| 10:00 AM PST | 6:00 PM UTC | 10:00:00-08:00 |
| 10:00 AM PDT | 5:00 PM UTC | 10:00:00-07:00 |

## Example Console Output

When making a paid search, you'll see:

```
[info] Performing search { query: 'latest AI news' }
[x402-axios] Received 402 response, parsing payment requirements...
[x402-axios] Creating payment for 0.05 USDC to 0x...
[x402-axios] Payment signed, retrying request...
[info] Search completed successfully
```

## Payment Flow

The server uses x402 for micropayments with automatic payment handling:

1. **Authentication**: Connect your wallet using SIWE
2. **Request**: Make a search or schedule request
3. **Automatic Payment**: The x402-axios interceptor automatically:
   - Detects 402 Payment Required responses
   - Parses payment requirements from the backend
   - Signs the payment with your wallet
   - Retries the request with the payment header
4. **Service**: The search is executed and results returned

The payment process is completely transparent - you just call the search tools and payments happen automatically!

### Pricing
- **Immediate search**: $0.05 USDC
- **Scheduled search**: $0.10 USDC  
- **Scheduled search with email**: $0.15 USDC

### Insufficient Funds Handling

If your wallet doesn't have enough USDC:
1. The search will fail with an `INSUFFICIENT_FUNDS` error
2. The error message will tell you to use the `getCoinbaseOnrampLink` tool
3. Using this tool will give you a personalized link to buy USDC
4. The link is pre-configured to:
   - Buy USDC on the correct network (Base or Base Sepolia)
   - Send funds directly to your wallet address
   - Suggest an appropriate amount based on your needs

**Example flow:**
```
User: "Search for latest AI news"
Assistant: "I'll search for that... Error: INSUFFICIENT_FUNDS"
Assistant: "Let me get you a link to buy USDC..."
[Uses getCoinbaseOnrampLink tool]
Assistant: "Here's your personalized link to buy USDC: [link]"
```

## Troubleshooting

### "Cannot find module" errors
Run `npm install` to install all dependencies.

### Authentication fails
- Ensure your wallet has the correct network selected
- Check that the backend is running
- Verify your private key format (should start with 0x)

### Payment fails
- Ensure your wallet has sufficient USDC balance
- Check you're on the correct network (Base or Base Sepolia)
- Verify the backend's x402 configuration
- Check that your wallet has enough ETH/native token for gas fees
- The x402-axios interceptor logs payment details - check console for debugging

### Backend connection errors
- Verify the backend is running at the configured URL
- Check CORS settings if running from a different origin
- Ensure all environment variables are set correctly

## Development

To modify the MCP server:

1. Edit `mcp-server.ts`
2. Test with `npm run mcp:dev`
3. Build with `npm run build`

## Security Notes

- Never commit your private key to version control
- Use environment variables for sensitive configuration
- The server stores authentication tokens in memory only
- Each session requires fresh authentication

## Known Limitations & Future Improvements

### Timezone Handling
- **Current:** All times are processed in server timezone
- **Workaround:** Use the `getCurrentTime` tool for relative scheduling
- **Future:** Accept user timezone preference and convert accordingly

### Payment Integration
- **Current:** x402-axios handles payment signing automatically
- **Future:** Add payment history tracking and receipts

### Scheduling
- **Current:** Minimum 5 minutes in the future
- **Future:** Support more granular scheduling (e.g., every hour, daily) 