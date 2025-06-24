import { FastMCP } from "fastmcp";
import { z } from "zod";
import axios, { AxiosInstance } from "axios";
import { SiweMessage } from "siwe";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, publicActions } from "viem";
import { base, baseSepolia } from "viem/chains";
import type { Address, Hex, WalletClient } from "viem";
import { withPaymentInterceptor } from "x402-axios";

// Configuration
const BACKEND_URL = process.env.SETTLEMENT_SEARCH_BACKEND_URL || "http://localhost:3001";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as Hex | undefined;
const NETWORK = process.env.X402_NETWORK || "base-sepolia";
const COINBASE_ONRAMP_APP_ID = process.env.COINBASE_ONRAMP_APP_ID || "5509b221-a33d-4f8a-84e5-886f458569f4";

// Types matching the backend
interface SearchRequest {
  query: string;
  scheduleFor?: string;
  userEmail?: string;
}

interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

interface SearchProviderResult {
  provider: string;
  answer: string;
  sources: SearchSource[];
  error?: string;
}

interface CombinedSearchResult {
  id: string;
  query: string;
  results: SearchProviderResult[];
  summary: string;
  timestamp: string;
}

interface QueryHistoryItem {
  id: string;
  query: string;
  executedAt?: string;
  createdAt: string;
  status: string;
  summary?: string;
  sources?: any;
  error?: string;
}

// Session data for storing auth tokens
interface SessionData {
  jwtToken?: string;
  walletAddress?: Address;
  walletClient?: WalletClient;
  axiosClient?: AxiosInstance;
}

// Store session data in a Map (since we can't modify the session object directly)
const sessionStore = new Map<any, SessionData>();

// Initialize the MCP server
const server = new FastMCP({
  name: "Settlement Search MCP",
  version: "1.0.0",
  instructions: `MCP server for Settlement Search - Multi-source AI-powered web search with scheduling and crypto payments

This server allows you to:
1. Search across multiple AI search providers (Exa, Perplexity, Brave, Tavily)
2. Schedule searches for future execution
3. View search history and pending queries
4. All actions require wallet authentication and payment via x402

To get started:
- First use the 'authenticate' tool to connect your wallet
- Then use 'search' for immediate searches or 'scheduleSearch' for future queries
- Use 'viewHistory' to see past searches and 'viewPending' for scheduled queries`,
});

// Helper function to create axios client with auth and payment support
function createAuthenticatedClient(jwtToken: string, walletClient?: any): AxiosInstance {
  const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    },
  });

  // If wallet client is provided, add x402 payment interceptor
  if (walletClient) {
    return withPaymentInterceptor(axiosInstance, walletClient);
  }

  return axiosInstance;
}

// Helper to get wallet client with public actions for x402
async function getWalletClient(privateKey?: Hex) {
  const chain = NETWORK === "base" ? base : baseSepolia;
  
  // Use provided private key or generate a new one
  const pk = privateKey || generatePrivateKey();
  const account = privateKeyToAccount(pk);
  
  // Create wallet client with public actions (needed for x402-axios)
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  }).extend(publicActions);

  return { walletClient, address: account.address };
}

// Helper to generate Coinbase Onramp URL for buying USDC
function generateCoinbaseOnrampUrl(walletAddress: string, amount?: number): string {
  const baseUrl = "https://pay.coinbase.com/buy/select-asset";
  const params = new URLSearchParams({
    appId: COINBASE_ONRAMP_APP_ID,
    defaultAsset: "USDC",
    defaultPaymentMethod: "CARD",
    fiatCurrency: "USD",
  });

  // Add preset amount if specified
  if (amount) {
    params.append("presetFiatAmount", amount.toString());
  }

  // Add addresses using the new format
  const addressesObj: Record<string, string[]> = {};
  addressesObj[walletAddress] = ["base"]; // Always use "base" for the blockchain name
  params.append("addresses", JSON.stringify(addressesObj));

  // Add assets filter
  params.append("assets", JSON.stringify(["USDC"]));

  return `${baseUrl}?${params.toString()}`;
}

// Authenticate tool
server.addTool({
  name: "authenticate",
  description: "Authenticate with Settlement Search using your crypto wallet. This is required before performing any searches.",
  parameters: z.object({
    privateKey: z.string().optional().describe("Optional: Your wallet private key (hex format with 0x prefix). If not provided, uses WALLET_PRIVATE_KEY env var or generates a new wallet."),
  }),
  execute: async (args, { session }) => {
    try {
      // Use provided private key, env variable, or generate new one
      const privateKey = args.privateKey || PRIVATE_KEY;
      
      // Don't use console.log in MCP servers - it interferes with stdio communication
      
      // Get or create wallet
      const { walletClient, address } = await getWalletClient(privateKey as Hex | undefined);
      
      // Get nonce from backend
      const nonceResponse = await axios.get(`${BACKEND_URL}/auth/nonce`);
      const { nonce } = nonceResponse.data;

      // Create SIWE message
      const domain = new URL(BACKEND_URL).host;
      const origin = BACKEND_URL;
      const siweMessage = new SiweMessage({
        domain,
        address,
        statement: "Sign in to Settlement Search",
        uri: origin,
        version: "1",
        chainId: NETWORK === "base" ? base.id : baseSepolia.id,
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();

      // Sign the message
      const signature = await walletClient.signMessage({
        message: messageToSign,
      });

      // Verify with backend
      const verifyResponse = await axios.post(`${BACKEND_URL}/auth/verify`, {
        message: messageToSign,
        signature,
      });

      if (!verifyResponse.data.success) {
        throw new Error("Authentication failed");
      }

      // Store session data in our Map
      const sessionData: SessionData = {
        jwtToken: verifyResponse.data.token,
        walletAddress: address,
        walletClient: walletClient,
        axiosClient: createAuthenticatedClient(verifyResponse.data.token, walletClient)
      };
      sessionStore.set(session, sessionData);

      return `Successfully authenticated with wallet address: ${address}`;
    } catch (error: any) {
      // Don't use console.error in MCP servers - use proper error handling
      
      // Provide more helpful error messages
      if (error.code === 'ECONNREFUSED') {
        throw new Error("Cannot connect to backend. Please ensure the Settlement Search backend is running on " + BACKEND_URL);
      } else if (error.message?.includes('invalid private key')) {
        throw new Error("Invalid private key format. Please use hex format with 0x prefix (e.g., 0x123...)");
      }
      
      throw new Error(`Authentication failed: ${error.message || JSON.stringify(error)}`);
    }
  },
});

// Search tool
server.addTool({
  name: "search",
  description: "Perform an immediate multi-source AI-powered web search. Costs $0.05 USDC.",
  parameters: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async (args, { session, log }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.axiosClient || !sessionData?.walletClient) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    try {
      log.info("Performing search", { query: args.query });

      // The x402-axios interceptor will automatically handle payment
      const response = await sessionData.axiosClient.post("/api/search/answer", {
        query: args.query,
      });

      const result = response.data as CombinedSearchResult;

      // Format the response
      let formattedResponse = `# Search Results for: "${args.query}"\n\n`;
      formattedResponse += `**Summary:** ${result.summary}\n\n`;
      
      for (const providerResult of result.results) {
        if (!providerResult.error) {
          formattedResponse += `## ${providerResult.provider}\n`;
          formattedResponse += `**Answer:** ${providerResult.answer}\n\n`;
          
          if (providerResult.sources && providerResult.sources.length > 0) {
            formattedResponse += `**Sources:**\n`;
            for (const source of providerResult.sources.slice(0, 3)) {
              formattedResponse += `- [${source.title}](${source.url})\n`;
              formattedResponse += `  ${source.snippet}\n\n`;
            }
          }
        }
      }

      return formattedResponse;
    } catch (error: any) {
      log.error("Search failed", { error: error.message });
      
      // The x402 interceptor should handle payments automatically
      // If we still get a 402, it means payment failed
      if (error.response?.status === 402) {
        const walletAddress = sessionData.walletAddress;
        
        // Check if it's specifically an insufficient funds error
        const errorData = error.response?.data;
        if (errorData?.error?.includes('insufficient_funds') || errorData?.error?.includes('insufficient funds')) {
          throw new Error(`INSUFFICIENT_FUNDS: Your wallet doesn't have enough USDC to pay for this search ($0.05). Use the 'getCoinbaseOnrampLink' tool to get a link to buy USDC.`);
        }
        
        throw new Error(`PAYMENT_FAILED: Unable to process payment. Please ensure your wallet has sufficient USDC balance on ${NETWORK === "base" ? "Base" : "Base Sepolia"}.`);
      }
      
      throw new Error(`Search failed: ${error.message}`);
    }
  },
});

// Schedule search tool
server.addTool({
  name: "scheduleSearch",
  description: "Schedule a search query for future execution. Costs $0.10 USDC (or $0.15 with email notification).",
  parameters: z.object({
    query: z.string().describe("The search query to execute in the future"),
    scheduleFor: z.string().describe("When to execute the search in ISO format. Use 'Z' suffix for UTC (e.g., '2024-12-25T10:00:00Z') or timezone offset (e.g., '2024-12-25T10:00:00-04:00' for EDT)"),
    userEmail: z.string().email().optional().describe("Optional: Email address to send results to"),
  }),
  execute: async (args, { session, log }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.axiosClient) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    try {
      // Validate the schedule date
      const scheduledDate = new Date(args.scheduleFor);
      if (isNaN(scheduledDate.getTime())) {
        throw new Error("Invalid date format. Please use ISO format (e.g., '2024-12-25T10:00:00Z')");
      }
      
      if (scheduledDate <= new Date()) {
        throw new Error("Schedule date must be in the future");
      }

      log.info("Scheduling search", { 
        query: args.query, 
        scheduleFor: args.scheduleFor,
        withEmail: !!args.userEmail 
      });

      const response = await sessionData.axiosClient.post("/api/search/answer", {
        query: args.query,
        scheduleFor: args.scheduleFor,
        userEmail: args.userEmail,
      });

      const result = response.data;
      
      let message = `Successfully scheduled search!\n\n`;
      message += `**Query:** "${result.query}"\n`;
      
      // Show both UTC and local time for clarity
      const schedDate = new Date(result.scheduledFor);
      message += `**Scheduled for:**\n`;
      message += `  - UTC: ${schedDate.toISOString()}\n`;
      message += `  - Local: ${schedDate.toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})\n`;
      
      message += `**Query ID:** ${result.id}\n`;
      
      if (result.userEmail) {
        message += `**Email notification:** ${result.userEmail}\n`;
      }
      
      message += `\n${result.message}`;

      return message;
    } catch (error: any) {
      log.error("Failed to schedule search", { error: error.message });
      
      if (error.response?.status === 402) {
        // Calculate cost based on options
        let cost = "$0.10";
        if (args.userEmail) {
          cost = "$0.15";
        }
        
        // Check if it's specifically an insufficient funds error
        const errorData = error.response?.data;
        if (errorData?.error?.includes('insufficient_funds') || errorData?.error?.includes('insufficient funds')) {
          throw new Error(`INSUFFICIENT_FUNDS: Your wallet doesn't have enough USDC to schedule this search (${cost}). Use the 'getCoinbaseOnrampLink' tool to get a link to buy USDC.`);
        }
        
        throw new Error(`PAYMENT_FAILED: Unable to process payment. Please ensure your wallet has sufficient USDC balance on ${NETWORK === "base" ? "Base" : "Base Sepolia"}.`);
      }
      
      throw new Error(`Failed to schedule search: ${error.message}`);
    }
  },
});

// View history tool
server.addTool({
  name: "viewHistory",
  description: "View your search history including completed and failed queries",
  parameters: z.object({
    limit: z.number().min(1).max(100).default(10).describe("Number of recent queries to retrieve"),
  }),
  execute: async (args, { session }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.axiosClient) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    try {
      const response = await sessionData.axiosClient.get("/api/queries/history", {
        params: { limit: args.limit },
      });

      const queries = response.data.queries as QueryHistoryItem[];
      
      if (queries.length === 0) {
        return "No search history found.";
      }

      let formattedHistory = `# Search History (Last ${queries.length} queries)\n\n`;
      
      for (const query of queries) {
        formattedHistory += `## ${query.query}\n`;
        formattedHistory += `- **ID:** ${query.id}\n`;
        formattedHistory += `- **Status:** ${query.status}\n`;
        formattedHistory += `- **Created:** ${new Date(query.createdAt).toLocaleString()}\n`;
        
        if (query.executedAt) {
          formattedHistory += `- **Executed:** ${new Date(query.executedAt).toLocaleString()}\n`;
        }
        
        if (query.summary) {
          formattedHistory += `- **Summary:** ${query.summary}\n`;
        }
        
        if (query.error) {
          formattedHistory += `- **Error:** ${query.error}\n`;
        }
        
        formattedHistory += "\n";
      }

      return formattedHistory;
    } catch (error: any) {
      throw new Error(`Failed to retrieve history: ${error.message}`);
    }
  },
});

// View pending queries tool
server.addTool({
  name: "viewPending",
  description: "View your pending scheduled queries that haven't been executed yet",
  parameters: z.object({}),
  execute: async (args, { session }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.axiosClient) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    try {
      const response = await sessionData.axiosClient.get("/api/queries/pending");
      const queries = response.data.queries;
      
      if (queries.length === 0) {
        return "No pending queries found.";
      }

      let formattedPending = `# Pending Scheduled Queries\n\n`;
      
      for (const query of queries) {
        formattedPending += `## ${query.query}\n`;
        formattedPending += `- **ID:** ${query.id}\n`;
        formattedPending += `- **Scheduled for:** ${new Date(query.scheduledFor).toLocaleString()}\n`;
        formattedPending += `- **Created:** ${new Date(query.createdAt).toLocaleString()}\n`;
        formattedPending += `- **Status:** ${query.status}\n\n`;
      }

      return formattedPending;
    } catch (error: any) {
      throw new Error(`Failed to retrieve pending queries: ${error.message}`);
    }
  },
});

// Delete query tool
server.addTool({
  name: "deleteQuery",
  description: "Delete a scheduled query that hasn't been executed yet",
  parameters: z.object({
    queryId: z.string().describe("The ID of the query to delete"),
  }),
  execute: async (args, { session, log }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.axiosClient) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    try {
      log.info("Deleting query", { queryId: args.queryId });
      
      await sessionData.axiosClient.delete(`/api/queries/${args.queryId}`);
      
      return `Successfully deleted query ${args.queryId}`;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return "Query not found or already executed. You can only delete pending queries.";
      }
      throw new Error(`Failed to delete query: ${error.message}`);
    }
  },
});

// Get current time tool
server.addTool({
  name: "getCurrentTime",
  description: "Get the current server time in various formats. Useful for calculating relative scheduling times.",
  parameters: z.object({}),
  execute: async () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset <= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    
    return `Current server time:
- ISO UTC: ${now.toISOString()}
- ISO Local: ${now.toISOString().slice(0, -1)}${offsetString}
- Local: ${now.toLocaleString()}
- Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
- Unix timestamp: ${now.getTime()}

Use this to calculate relative times like "in 10 minutes" or "tomorrow at 3pm".`;
  },
});

// Get query details tool
server.addTool({
  name: "getQueryDetails",
  description: "Get detailed information about a specific query",
  parameters: z.object({
    queryId: z.string().describe("The ID of the query to retrieve"),
  }),
  execute: async (args, { session }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.axiosClient) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    try {
      const response = await sessionData.axiosClient.get(`/api/queries/${args.queryId}`);
      const query = response.data;
      
      let details = `# Query Details\n\n`;
      details += `**Query:** "${query.query}"\n`;
      details += `**ID:** ${query.id}\n`;
      details += `**Status:** ${query.status}\n`;
      details += `**Created:** ${new Date(query.createdAt).toLocaleString()}\n`;
      
      if (query.scheduledFor) {
        details += `**Scheduled for:** ${new Date(query.scheduledFor).toLocaleString()}\n`;
      }
      
      if (query.executedAt) {
        details += `**Executed:** ${new Date(query.executedAt).toLocaleString()}\n`;
      }
      
      if (query.summary) {
        details += `\n## Summary\n${query.summary}\n`;
      }
      
      if (query.sources && query.sources.length > 0) {
        details += `\n## Results by Provider\n`;
        for (const result of query.sources) {
          if (!result.error) {
            details += `\n### ${result.provider}\n`;
            details += `${result.answer || 'No answer provided'}\n`;
          }
        }
      }
      
      if (query.error) {
        details += `\n## Error\n${query.error}\n`;
      }

      return details;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return "Query not found.";
      }
      throw new Error(`Failed to retrieve query details: ${error.message}`);
    }
  },
});

// Get Coinbase Onramp link tool
server.addTool({
  name: "getCoinbaseOnrampLink",
  description: "Get a personalized Coinbase Onramp link to buy USDC for your authenticated wallet",
  parameters: z.object({
    suggestedAmount: z.number().min(1).max(1000).optional().describe("Suggested USD amount to purchase (default: $10)"),
  }),
  execute: async (args, { session }) => {
    const sessionData = sessionStore.get(session);
    
    if (!sessionData?.walletAddress) {
      throw new Error("Please authenticate first using the 'authenticate' tool");
    }

    const amount = args.suggestedAmount || 10;
    const onrampUrl = generateCoinbaseOnrampUrl(sessionData.walletAddress, amount);
    
    return `# Buy USDC with Coinbase

**Your wallet:** ${sessionData.walletAddress}
**Network:** ${NETWORK === "base" ? "Base" : "Base Sepolia"}
**Suggested amount:** $${amount} USD

[Click here to buy USDC →](${onrampUrl})

This link will:
- Open Coinbase Onramp
- Pre-select USDC on ${NETWORK === "base" ? "Base" : "Base Sepolia"}
- Send funds directly to your wallet
- Allow you to pay with card, Apple Pay, or bank transfer

**Note:** After purchasing USDC, you can use it to pay for searches ($0.05), scheduled searches ($0.10), or scheduled searches with email ($0.15).`;
  },
});

// Add a prompt for the example use case
server.addPrompt({
  name: "scheduleFutureSearch",
  description: "Schedule a search for future execution with natural language",
  arguments: [
    {
      name: "request",
      description: "Natural language request like 'remind me tomorrow what the score of tonight's NBA finals game is'",
      required: true,
    },
  ],
  load: async ({ request }) => {
    return `Parse this natural language request and use the appropriate tools to schedule a future search:

"${request}"

Steps:
1. First authenticate if not already authenticated
2. Use getCurrentTime to understand the current time
3. Parse the request to determine:
   - What information to search for
   - When to execute the search (calculate absolute time from relative expressions)
4. Use the scheduleSearch tool with the calculated ISO timestamp

Example: If the request is "remind me tomorrow what the score of tonight's NBA finals game is", you would:
1. Authenticate the user
2. Get current time to know what "tomorrow" means
3. Calculate tomorrow's date/time
4. Schedule a search for tomorrow with query "NBA finals game score [today's date]"
5. Confirm the scheduled search to the user

IMPORTANT: Always use getCurrentTime when the user gives relative times like:
- "in 10 minutes"
- "tomorrow"
- "next week"
- "in 2 hours"

This ensures you're scheduling based on the actual current time, not an assumed time.`;
  },
});

// Start the server
const isMainModule = process.argv[1]?.endsWith('mcp-server.ts') || process.argv[1]?.endsWith('mcp-server.js');
if (isMainModule) {
  server.start({
    transportType: "stdio",
  });
}

export default server; 