# Dream Market

A multi-source AI-powered search application with x402 micropayments and SIWE authentication. Search across multiple providers (Exa, Perplexity, Brave Search, Tavily) and get AI-generated summaries - all powered by cryptocurrency micropayments.

# Flow Blockchain Integration

Locked PYUSD is bridged from the betting escrow contract to Flow Testnet to earn yield.

## User Flow

1. **Place Bet**  
   Users stake PYUSD into the escrow contract.

2. **Bridge & Lend**  
   Escrowed PYUSD is bridged to Flow Testnet and lent out to earn yield.

3. **Resolve Market**  
   Once the outcome is determined, the market is resolved.

4. **Unlend & Return**  
   Lent PYUSD is unbridged back to the escrow contract.

5. **Distribute Funds**  
   Users receive their original stake plus any earned yield.


## 🌟 Features

- **Multi-Source Search**: Queries Exa, Perplexity, Brave Search, and Tavily simultaneously
- **AI-Powered Summaries**: GPT-4o synthesizes results from all sources
- **x402 Micropayments**: Pay-per-search using PYUSD on Base Sepolia
- **SIWE Authentication**: Secure wallet-based authentication
- **Scheduled Queries**: Schedule searches for future execution
- **Email Notifications**: Get results delivered to your inbox
- **Dynamic Pricing**: $0.05 base + $0.05 for scheduling + $0.05 for email notifications
- **Flow + PYUSD **: Built on the Flow blockchain and uses PYUSD transactions

## 🛠️ Tech Stack

### Backend
- **Hono** - Fast web framework
- **x402** - Micropayment protocol
- **viem** - Ethereum interactions
- **SIWE** - Sign-In with Ethereum
- **SQLite** - Local database
- **OpenAI GPT-4o** - AI summarization

### Frontend
- **React + TypeScript** - Modern UI framework
- **Vite** - Fast development server
- **x402-axios** - Automatic payment handling
- **Base Sepolia** - Ethereum L2 network

### Search Providers
- **Exa** - Neural search
- **Perplexity** - AI-powered search
- **Brave Search** - Privacy-focused web search
- **Tavily** - LLM-optimized search

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- Sepolia PYUSD for payments (min 0.05 PYUSD)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/murrlincoln/settlement-search.git
   cd settlement-search
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Get API Keys**
   - [Exa API](https://exa.ai) - Neural search
   - [Perplexity API](https://docs.perplexity.ai) - AI search
   - [Brave Search API](https://brave.com/search/api/) - Web search
   - [Tavily API](https://tavily.com) - LLM search
   - [OpenAI API](https://platform.openai.com) - GPT-4o summaries
   - [Resend API](https://resend.com) - Email notifications (optional)

5. **Configure Wallet**
   - Set your `BUSINESS_WALLET_ADDRESS` in `.env`
   - This wallet will receive PYUSD payments

### Development

```bash
# Start both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:client   # Frontend on http://localhost:8080
```

### Production

```bash
npm run build
npm start
```

## 💰 x402 Payments

Settlement Search uses the x402 protocol for instant micropayments:

- **Base Price**: $0.05 PYUSD per search
- **Scheduled Search**: +$0.05 (execute search at specific time)
- **Email Notification**: +$0.05 (get results via email)
- **Maximum Price**: $0.15 PYUSD (all features)

### Payment Flow

1. Connect your wallet (MetaMask)
2. Authenticate with SIWE
3. Make a search request
4. Sign payment transaction (handled automatically by x402-axios)
5. Receive instant results

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3001
JWT_SECRET=your-secret-key

# Search API Keys
EXASEARCH_API_KEY=your-exa-key
PERPLEXITY_API_KEY=your-perplexity-key
BRAVE_API_KEY=your-brave-key
TAVILY_API_KEY=your-tavily-key
OPENAI_API_KEY=your-openai-key

# x402 Payments
FACILITATOR_URL=https://x402.org/facilitator
BUSINESS_WALLET_ADDRESS=0xYourWalletAddress
X402_NETWORK=base-sepolia

# Optional: Email notifications
RESEND_API_KEY=your-resend-key
```

### Network Setup

**Base Sepolia Testnet**
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Block Explorer: https://sepolia.basescan.org
- USDC Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

Get testnet funds:
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

## 📖 Usage

### Immediate Search
1. Connect wallet and authenticate
2. Enter your search query
3. Click "Search Now ($0.05)"
4. Approve payment in wallet
5. View AI-generated summary and sources

### Scheduled Search
1. Check "Schedule for later"
2. Select date/time (min 5 minutes future)
3. Optionally add email for notifications
4. Click "Schedule Search ($0.10-$0.15)"
5. Results will be processed automatically

### Query Management
- **Pending**: View and cancel scheduled queries
- **History**: Browse past search results

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │    │   Hono Backend   │    │  Search APIs    │
│                 │    │                  │    │                 │
│ • Wallet UI     │◄──►│ • x402 Payments  │◄──►│ • Exa           │
│ • SIWE Auth     │    │ • SIWE Auth      │    │ • Perplexity    │
│ • Search Forms  │    │ • Query Scheduler│    │ • Brave Search  │
│ • Results Display│   │ • Email Service  │    │ • Tavily        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                        ┌───────▼───────┐
                        │   SQLite DB   │
                        │               │
                        │ • Users       │
                        │ • Queries     │
                        │ • Results     │
                        └───────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Socials
- Lincoln Murr @murrlincoln (Telegram)
- Ruohan Chen @ruohanchen (Telegram)
- Hannah Wang @hannahw95 (Telegram)
- Justin Yoo @Justinyoo17 (Telegram)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [x402 Protocol](https://x402.org)
- [Base Network](https://base.org)
- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [Exa Search API](https://exa.ai)

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Only use testnet funds during development. 
