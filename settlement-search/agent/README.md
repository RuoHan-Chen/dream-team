# Settlement Search OpenAI Agent

This directory contains the OpenAI Agent integration for the Settlement Search MCP Server.

## Important: Wallet Configuration

**To avoid authentication issues, you MUST set a WALLET_PRIVATE_KEY environment variable.** Without it, a new wallet will be generated for each authentication, causing searches to fail.

## Quick Start

```bash
# 1. Install dependencies
cd agent
npm install

# 2. Generate a wallet (if you don't have one)
npm run generate-wallet

# 3. Add your OpenAI API key to the .env file
# Edit ../.env and replace 'your-openai-api-key-here' with your actual key

# 4. Start the backend (in another terminal, from project root)
npm run backend

# 5. Run the agent
npm run chat
```

## Detailed Setup

1. **Install dependencies:**
   ```bash
   cd agent
   npm install
   ```

2. **Set up your OpenAI API key:**

   You need an OpenAI API key to use the agent. Get one from https://platform.openai.com/api-keys

   Set it using one of these methods:

   **Option A: Create a .env file** (recommended)
   ```bash
   # In the project root, create a .env file:
   echo "OPENAI_API_KEY=sk-your-key-here" > ../.env
   echo "WALLET_PRIVATE_KEY=0x-your-private-key-here" >> ../.env
   ```

   **Option B: Export in terminal** (temporary)
   ```bash
   export OPENAI_API_KEY="sk-your-key-here"
   export WALLET_PRIVATE_KEY="0x-your-private-key-here"
   ```

   **Option C: Pass when running** (one-time)
   ```bash
   OPENAI_API_KEY="sk-your-key-here" WALLET_PRIVATE_KEY="0x-your-key" npm run chat
   ```

3. **Get a wallet private key:**

   If you don't have a wallet private key, you can:
   - Use an existing wallet's private key (MetaMask, etc.)
   - Generate one using: `npx viem generate-privatekey`
   - Let the system generate one (but save it for reuse!)

4. **Ensure the Settlement Search backend is running:**
   ```bash
   # In the project root
   npm run backend
   ```

## Running the Agent

### Interactive Chat Mode
```bash
npm run chat
```

This will:
- Check for required environment variables
- Connect to your MCP server
- Start an interactive chat session

### Direct Mode (without environment checks)
```bash
npm run chat:direct
```

### Forced Tool Mode (if tools aren't being called)
```bash
npm run chat:forced
```

This mode uses more aggressive prompting to ensure tools are called.

### Debug Mode
```bash
npm run debug
```

This runs diagnostics to verify the MCP server connection and tool discovery.

## Environment Variables

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `SETTLEMENT_SEARCH_BACKEND_URL` (optional): Backend URL, defaults to `http://localhost:3001`
- `WALLET_PRIVATE_KEY` (optional): Your wallet private key (0x...). If not provided, a new wallet will be generated
- `X402_NETWORK` (optional): Network to use (`base` or `base-sepolia`), defaults to `base-sepolia`

## Usage Examples

Once the chat is running, you can:

1. **Authenticate:**
   ```
   You: Please authenticate me
   ```

2. **Search immediately:**
   ```
   You: Search for information about OpenAI's latest models
   ```

3. **Schedule a search:**
   ```
   You: Schedule a search for tomorrow at 9am asking "What are today's top AI news?"
   ```

4. **View history:**
   ```
   You: Show me my search history
   ```

5. **Get USDC:**
   ```
   You: I need help getting USDC to pay for searches
   ```

## Troubleshooting

### "OPENAI_API_KEY environment variable is missing"
- Make sure you've set your OpenAI API key as described above
- Verify it's set: `echo $OPENAI_API_KEY`

### "Cannot connect to backend"
- Ensure the Settlement Search backend is running: `npm run backend`
- Check the backend URL in your environment variables

### "INSUFFICIENT_FUNDS" errors
- Ask the agent: "Help me get USDC"
- The agent will provide a Coinbase Onramp link for your wallet

### Agent not calling tools (just talking about them)
This is a known issue where the OpenAI model sometimes prefers conversational responses over tool calls. Solutions:

1. **Use the forced mode:**
   ```bash
   npm run chat:forced
   ```
   This uses more aggressive prompting to ensure tools are called.

2. **Be more explicit in your requests:**
   - Instead of: "authenticate me"
   - Try: "Use the authenticate tool to authenticate me now"

3. **Run debug mode to verify tools are available:**
   ```bash
   npm run debug
   ```
   This will verify the MCP server is connected and tools are discoverable.

4. **Check MCP server is running:**
   - The MCP server must be able to start as a subprocess
   - Ensure `tsx` is installed: `npm install -g tsx`
   - Verify the backend is running: `npm run backend`

### MCP Server Connection Failed
If you see "Failed to connect to MCP server":

1. **Check the backend is running:**
   ```bash
   # In another terminal, from project root
   npm run backend
   ```

2. **Verify tsx is available:**
   ```bash
   which tsx
   # If not found:
   npm install -g tsx
   ```

3. **Check file paths:**
   - The agent expects `mcp-server.ts` to be in the parent directory
   - Verify: `ls ../mcp-server.ts`

4. **Run the MCP server directly to test:**
   ```bash
   cd ..
   tsx mcp-server.ts
   ```
   You should see it start and wait for input (Ctrl+C to exit)

### TypeScript errors
- Make sure you've installed dependencies: `npm install`
- Use the npm scripts which run through tsx: `npm run chat` 