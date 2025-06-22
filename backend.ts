import { serve } from "@hono/node-server";
import { Hono, Context } from "hono";
import { cors } from "hono/cors";
import { SiweMessage } from "siwe";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import Exa from "exa-js";
import OpenAI from "openai";
import axios from "axios";
import { tavily } from "@tavily/core";
import { config } from "dotenv";
import type { Address, Hex } from "viem";
import { database } from "./database";
import { scheduler } from "./scheduler";
import { searchAllProviders } from "./search-providers";
import { sendScheduledQueryNotification } from "./email";
import {
  PaymentRequirements,
  Price as X402Price,
  Network as X402Network,
  Resource as X402Resource,
  PaymentPayload,
  settleResponseHeader
} from 'x402/types';
import { useFacilitator } from 'x402/verify';
import { exact } from 'x402/schemes';
import { processPriceToAtomicAmount } from 'x402/shared';
// Removed @coinbase/x402 facilitator - will use URL-based facilitator instead

// Contract deployment dependencies
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: ".env" });

// Initialize API clients
const exa = new Exa(process.env.EXA_API_KEY!);

// Perplexity client (using OpenAI SDK)
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY!,
  baseURL: "https://api.perplexity.ai"
});

// OpenAI client for summarization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Tavily client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

// Contract deployment setup
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const oracleAddress = process.env.ORACLE_ADDRESS;
const stablecoinAddress = process.env.STABLECOIN_ADDRESS;

let walletClient: any = null;
let contractArtifact: any = null;

if (deployerPrivateKey && oracleAddress && stablecoinAddress) {
  // Set up wallet client for contract deployment
  const account = privateKeyToAccount(deployerPrivateKey.startsWith('0x') ? deployerPrivateKey as `0x${string}` : `0x${deployerPrivateKey}` as `0x${string}`);
  walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(process.env.SEPOLIA_RPC_URL)
  }).extend(publicActions);

  // Load contract artifact
  try {
    const artifactPath = join(process.cwd(), 'dream-team/autodeploy/BooleanPredictionEscrow.json');
    contractArtifact = JSON.parse(
      readFileSync(artifactPath, 'utf-8')
    );
    console.log('Contract deployment configured successfully');
    console.log('Contract artifact loaded from:', artifactPath);
  } catch (error) {
    console.error('Failed to load contract artifact:', error);
  }
} else {
  console.warn('Contract deployment not configured. Missing DEPLOYER_PRIVATE_KEY, ORACLE_ADDRESS, or STABLECOIN_ADDRESS');
}

// x402 configuration
const payTo = process.env.BUSINESS_WALLET_ADDRESS as `0x${string}`;
const network = (process.env.X402_NETWORK as X402Network) || "base-sepolia";
const X402_VERSION = 1; // Standard x402 version
const FACILITATOR_URL = (process.env.FACILITATOR_URL || 'https://x402.org/facilitator') as X402Resource;

// Initialize x402 facilitator client for payment verification and settlement
const { verify: verifyX402Payment, settle: settleX402Payment } = useFacilitator({ url: FACILITATOR_URL });

if (!payTo) {
  console.error("❌ Please set your wallet BUSINESS_WALLET_ADDRESS in the .env file");
  // Don't exit - allow the app to run without x402 for development
}

console.log('x402 Configuration:');
console.log('  Facilitator URL:', FACILITATOR_URL);
console.log('  Network:', network);
console.log('  Business Wallet:', payTo || 'Not configured');

// Types
interface NonceStore {
  [nonce: string]: number; // timestamp
}

interface SearchRequest {
  query: string;
  scheduleFor?: string; // ISO date string for scheduled execution
  userEmail?: string; // Email for notifications (required for scheduled queries)
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

// In-memory stores (use Redis/DB in production)
const nonceStore: NonceStore = {};
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");
const NONCE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired nonces periodically
setInterval(() => {
  const now = Date.now();
  Object.entries(nonceStore).forEach(([nonce, timestamp]) => {
    if (now - timestamp > NONCE_VALIDITY_MS) {
      delete nonceStore[nonce];
    }
  });
}, 60 * 1000); // Every minute

// Create Hono app
const app = new Hono();

// --- Helper: Create x402 Exact Payment Requirements ---
function createExactPaymentRequirements(
  price: X402Price,
  resource: X402Resource,
  description = "",
): PaymentRequirements {
  const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
  if ("error" in atomicAmountForAsset) {
    console.error("[X402Svc] Error processing price to atomic amount:", atomicAmountForAsset.error);
    throw new Error(`Failed to process price: ${atomicAmountForAsset.error}`);
  }
  const { maxAmountRequired, asset } = atomicAmountForAsset;
  return {
    scheme: "exact",
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType: "application/json",
    payTo,
    maxTimeoutSeconds: 60,
    asset: asset.address,
    outputSchema: undefined,
    extra: { name: asset.eip712.name, version: asset.eip712.version },
  };
}

// --- Helper: Handle x402 Payment Flow ---
interface X402HandlingResult {
  success: boolean;
  response?: Response;
  decodedPayment?: PaymentPayload;
  verifiedPayer?: Hex;
}

async function handleX402PaymentVerification(
  c: Context,
  paymentRequirements: PaymentRequirements[],
): Promise<X402HandlingResult> {
  const paymentHeader = c.req.header('X-PAYMENT');

  // If no payment header, issue a 402 challenge with payment requirements
  if (!paymentHeader) {
    console.log('[X402Svc] No X-PAYMENT header. Responding with 402 challenge.');
    return {
      success: false,
      response: c.json({
        x402Version: X402_VERSION,
        error: "X-PAYMENT header is required",
        accepts: paymentRequirements
      }, 402)
    };
  }

  // Decode the payment header
  let decodedPayment: PaymentPayload;
  try {
    decodedPayment = exact.evm.decodePayment(paymentHeader);
  } catch (error: any) {
    console.error('[X402Svc] Error decoding X-PAYMENT header:', error.message);
    return {
      success: false,
      response: c.json({
        x402Version: X402_VERSION,
        error: error.message || "Invalid or malformed X-PAYMENT header",
        accepts: paymentRequirements
      }, 402)
    };
  }

  // Verify the decoded payment with the facilitator
  try {
    console.log('[X402Svc] Verifying payment with facilitator:', FACILITATOR_URL);
    console.log('[X402Svc] Payment details:', {
      scheme: decodedPayment.scheme,
      network: decodedPayment.network,
      payload: {
        from: decodedPayment.payload.authorization.from,
        to: decodedPayment.payload.authorization.to,
        value: decodedPayment.payload.authorization.value,
      }
    });

    const verificationResponse = await verifyX402Payment(decodedPayment, paymentRequirements[0]);

    if (!verificationResponse.isValid) {
      console.warn('[X402Svc] Payment verification failed by facilitator:', verificationResponse.invalidReason);
      return {
        success: false,
        response: c.json({
          x402Version: X402_VERSION,
          error: verificationResponse.invalidReason,
          accepts: paymentRequirements,
          payer: verificationResponse.payer
        }, 402)
      };
    }
    console.log('[X402Svc] Payment verified successfully by facilitator for payer:', verificationResponse.payer);
    return {
      success: true,
      decodedPayment: decodedPayment,
      verifiedPayer: verificationResponse.payer as Hex
    };
  } catch (error: any) {
    console.error('[X402Svc] Critical error during facilitator payment verification process:', error);
    console.error('[X402Svc] Error stack:', error.stack);
    return {
      success: false,
      response: c.json({
        x402Version: X402_VERSION,
        error: error.message || "Facilitator verification process failed",
        accepts: paymentRequirements
      }, 500)
    };
  }
}

// Enable CORS
app.use(
  "*",
  cors({
    origin: ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-PAYMENT", "X-PAYMENT-RESPONSE", "Access-Control-Expose-Headers"],
    allowMethods: ["GET", "POST", "OPTIONS", "DELETE"],
    exposeHeaders: ["X-PAYMENT-RESPONSE"], // Important for client to read payment response
  })
);

// Note: x402 payment handling is done manually in the search endpoint

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// SIWE Authentication Routes
app.get("/auth/nonce", (c) => {
  // Generate alphanumeric nonce for SIWE (no underscores or hyphens)
  const nonce = nanoid().replace(/[_-]/g, '').substring(0, 16);
  nonceStore[nonce] = Date.now();
  return c.json({ nonce });
});

app.post("/auth/verify", async (c) => {
  try {
    const { message, signature } = await c.req.json();
    console.log("SIWE verification request received:", { message, signatureLength: signature?.length });

    if (!message || !signature) {
      return c.json({ error: "Missing message or signature" }, 400);
    }

    const siweMessage = new SiweMessage(message);
    console.log("Parsed SIWE message:", {
      address: siweMessage.address,
      domain: siweMessage.domain,
      nonce: siweMessage.nonce,
      chainId: siweMessage.chainId,
      uri: siweMessage.uri
    });

    // Verify the nonce exists and is valid
    const nonceTimestamp = nonceStore[siweMessage.nonce];
    if (!nonceTimestamp || Date.now() - nonceTimestamp > NONCE_VALIDITY_MS) {
      console.error("Nonce validation failed:", { nonce: siweMessage.nonce, exists: !!nonceTimestamp });
      return c.json({ error: "Invalid or expired nonce" }, 400);
    }

    // Verify the signature
    const verifyResult = await siweMessage.verify({ signature });
    console.log("SIWE verification result:", verifyResult);

    if (!verifyResult.success) {
      console.error("SIWE signature verification failed:", verifyResult.error);
      return c.json({ error: "Invalid signature" }, 401);
    }

    // Clean up used nonce
    delete nonceStore[siweMessage.nonce];

    // Create user in database if new
    await database.createUser(siweMessage.address);

    // Create JWT
    const jwt = await new SignJWT({
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      issuedAt: new Date().toISOString(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    return c.json({
      success: true,
      token: jwt,
      address: siweMessage.address,
    });
  } catch (error) {
    console.error("SIWE verification error:", error);
    return c.json({ error: "Verification failed" }, 500);
  }
});

// Middleware to verify JWT
async function verifyAuth(c: any, next: any) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid authorization header" }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Store user in request object
    (c.req as any).user = payload;
    await next();
  } catch (error) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}

// Search functions for each provider
async function searchWithExa(query: string): Promise<SearchProviderResult> {
  try {
    const result = await exa.searchAndContents(query, {
      type: "neural",
      useAutoprompt: true,
      numResults: 5,
      text: true,
    });

    // Also get answer from Exa
    const answerResult = await exa.answer(query, { text: true });

    return {
      provider: "Exa",
      answer: typeof answerResult.answer === 'string' ? answerResult.answer : JSON.stringify(answerResult.answer),
      sources: result.results.map((r: any) => ({
        title: r.title || "Untitled",
        url: r.url,
        snippet: r.text?.substring(0, 300) + "..." || "",
      }))
    };
  } catch (error) {
    console.error("Exa search error:", error);
    return {
      provider: "Exa",
      answer: "",
      sources: [],
      error: "Failed to fetch results from Exa"
    };
  }
}

async function searchWithPerplexity(query: string): Promise<SearchProviderResult> {
  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You are a helpful search assistant. Provide a comprehensive answer to the user's query based on web search results."
        },
        {
          role: "user",
          content: query
        }
      ],
    });

    const answer = response.choices[0]?.message?.content || "";

    // Perplexity doesn't return sources in the same way, so we'll just return the answer
    return {
      provider: "Perplexity",
      answer,
      sources: [] // Perplexity embeds sources in the answer text
    };
  } catch (error) {
    console.error("Perplexity search error:", error);
    return {
      provider: "Perplexity",
      answer: "",
      sources: [],
      error: "Failed to fetch results from Perplexity"
    };
  }
}

async function searchWithBrave(query: string): Promise<SearchProviderResult> {
  try {
    const params = new URLSearchParams({
      q: query,
      count: "5"
    });

    const response = await axios.get(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY!,
      },
    });

    const data = response.data;

    // Extract answer from Brave's response if available
    let answer = "";
    if (data.discussions?.results?.length > 0) {
      answer = data.discussions.results[0].text || "";
    } else if (data.web?.results?.length > 0) {
      // Create a simple answer from the first few results
      answer = `Based on search results: ${data.web.results.slice(0, 3).map((r: any) => r.description).join(" ")}`;
    }

    return {
      provider: "Brave Search",
      answer,
      sources: (data.web?.results || []).map((r: any) => ({
        title: r.title || "Untitled",
        url: r.url,
        snippet: r.description || "",
      }))
    };
  } catch (error) {
    console.error("Brave search error:", error);
    return {
      provider: "Brave Search",
      answer: "",
      sources: [],
      error: "Failed to fetch results from Brave"
    };
  }
}

async function searchWithTavily(query: string): Promise<SearchProviderResult> {
  try {
    const result = await tavilyClient.search(query, {
      includeAnswer: true,
      maxResults: 5
    });

    return {
      provider: "Tavily",
      answer: result.answer || "",
      sources: (result.results || []).map((r: any) => ({
        title: r.title || "Untitled",
        url: r.url,
        snippet: r.content || "",
      }))
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    return {
      provider: "Tavily",
      answer: "",
      sources: [],
      error: "Failed to fetch results from Tavily"
    };
  }
}

async function summarizeResults(query: string, results: SearchProviderResult[]): Promise<string> {
  try {
    // Filter out results with errors
    const validResults = results.filter(r => !r.error && r.answer);

    if (validResults.length === 0) {
      return "Unable to generate a summary due to search errors.";
    }

    const prompt = `Given these search results for "${query}", provide a single, comprehensive sentence that directly answers the query.

${validResults.map(r => `${r.provider}: ${r.answer}`).join("\n\n")}

Provide ONLY one clear, factual sentence that answers the query. No additional formatting or explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return response.choices[0]?.message?.content || "Unable to generate summary.";
  } catch (error) {
    console.error("OpenAI summarization error:", error);
    return "Failed to generate summary due to an error.";
  }
}

// Payment verification and settlement is now handled automatically by x402-hono middleware

// Combined search endpoint that queries all providers
app.post("/api/search/answer", verifyAuth, async (c) => {
  try {
    const { query, scheduleFor, userEmail }: SearchRequest = await c.req.json();
    const user = (c.req as any).user;

    if (!query || query.trim().length === 0) {
      return c.json({ error: "Query is required" }, 400);
    }

    // Determine dynamic price based on features
    let priceString: X402Price = "$0.05"; // Base price
    let priceDescription = 'Multi-source AI-powered search query';

    if (scheduleFor) {
      priceString = "$0.10"; // Add $0.05 for scheduling
      priceDescription = 'Scheduled multi-source AI-powered search query';

      if (userEmail) {
        priceString = "$0.15"; // Add another $0.05 for email notification
        priceDescription = 'Scheduled search with email notification';
      }
    }

    // Handle x402 payment for all queries (including scheduled ones)
    if (payTo) {
      const resourceUrl = c.req.url as X402Resource;

      // Create payment requirements with dynamic price
      let paymentRequirements: PaymentRequirements[];
      try {
        paymentRequirements = [createExactPaymentRequirements(
          priceString,
          resourceUrl,
          priceDescription
        )];
      } catch (error: any) {
        console.error('[X402Svc] Error creating payment requirements:', error.message);
        return c.json({ error: 'Server error: Could not create payment requirements.' }, 500);
      }

      // Handle x402 Payment Flow
      const x402Result = await handleX402PaymentVerification(c, paymentRequirements);

      // If payment verification failed or a challenge was issued, return the 402 response
      if (!x402Result.success || !x402Result.decodedPayment || !x402Result.verifiedPayer) {
        return x402Result.response!;
      }

      // Settle Payment after successful verification
      try {
        const settlement = await settleX402Payment(x402Result.decodedPayment, paymentRequirements[0]);
        const paymentResponseHeaderVal = settleResponseHeader(settlement);
        c.header('X-PAYMENT-RESPONSE', paymentResponseHeaderVal);
        console.log('[X402Svc] Payment settled. X-PAYMENT-RESPONSE header set. Price paid:', priceString);
      } catch (error: any) {
        console.error('[X402Svc] Payment settlement failed (after verification):', error.message);
        // Note: Content is still served as payment was verified. Settlement failure is logged.
      }
    }

    // Handle scheduled queries
    if (scheduleFor) {
      console.log('[ScheduleSvc] Processing scheduled query:', {
        scheduleFor,
        userEmail,
        currentTime: new Date().toISOString(),
        user: user.address
      });

      const scheduledDate = new Date(scheduleFor);
      console.log('[ScheduleSvc] Parsed scheduled date:', {
        scheduledDate: scheduledDate.toISOString(),
        isValid: !isNaN(scheduledDate.getTime()),
        currentTime: new Date().toISOString(),
        isFuture: scheduledDate > new Date()
      });

      if (isNaN(scheduledDate.getTime())) {
        console.error('[ScheduleSvc] Invalid date format:', scheduleFor);
        return c.json({ error: "Invalid schedule date format" }, 400);
      }
      if (scheduledDate <= new Date()) {
        console.error('[ScheduleSvc] Date is not in the future:', {
          scheduledDate: scheduledDate.toISOString(),
          currentTime: new Date().toISOString(),
          difference: scheduledDate.getTime() - new Date().getTime()
        });
        return c.json({ error: "Schedule date must be in the future" }, 400);
      }

      // TODO: Add timezone support
      // Currently all dates are processed in server timezone
      // Future enhancement: Accept user timezone preference and convert accordingly
      // For now, users should use ISO format with timezone offset or UTC

      // Ensure scheduled date is at least 5 minutes in the future to account for processing time
      const minFutureTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      if (scheduledDate < minFutureTime) {
        console.error('[ScheduleSvc] Date is too close to current time:', {
          scheduledDate: scheduledDate.toISOString(),
          minRequired: minFutureTime.toISOString(),
          difference: scheduledDate.getTime() - minFutureTime.getTime()
        });
        return c.json({ error: "Schedule date must be at least 5 minutes in the future" }, 400);
      }

      // Validate email for scheduled queries with email notification
      if (userEmail && !userEmail.includes('@')) {
        console.error('[ScheduleSvc] Invalid email format:', userEmail);
        return c.json({ error: "Valid email address is required for email notifications" }, 400);
      }

      // Create scheduled query with optional email
      const queryId = await database.createQuery(user.address, query, scheduledDate, userEmail || undefined);
      console.log(`Scheduled query ${queryId} for user ${user.address} at ${scheduleFor}${userEmail ? ` with email ${userEmail}` : ''}`);

      // Send confirmation email if provided
      if (userEmail) {
        try {
          const emailResult = await sendScheduledQueryNotification(userEmail, query, scheduledDate);
          if (emailResult.success) {
            console.log(`Confirmation email sent to ${userEmail} for query ${queryId}`);
          } else {
            console.error(`Failed to send confirmation email:`, emailResult.error);
          }
        } catch (emailError) {
          console.error(`Error sending confirmation email:`, emailError);
          // Don't fail the request if email fails
        }
      }

      return c.json({
        id: queryId,
        query,
        scheduledFor: scheduleFor,
        userEmail: userEmail || undefined,
        status: "pending",
        message: userEmail
          ? "Query scheduled successfully. You'll receive a confirmation email shortly."
          : "Query scheduled successfully.",
        pricePaid: priceString
      });
    }

    console.log(`Processing multi-source search for user ${user?.address}: "${query}"`);

    // Execute all searches in parallel
    const allResults = await searchAllProviders(query);

    // Transform results to match frontend expectations (results -> sources)
    const transformedResults = allResults.map(result => ({
      provider: result.provider,
      sources: result.results, // Map 'results' to 'sources' for frontend compatibility
      error: result.error,
      answer: result.answer || 'No answer provided' // Use the answer from the provider
    }));

    // Filter out errors
    const validResults = transformedResults.filter(r => !r.error);

    // Generate summary using GPT-4o
    const combinedResults = validResults
      .map(r => `${r.provider} results:\n${r.sources.slice(0, 3).map((item: any) =>
        `- ${item.title || item.name || 'No title'}: ${item.snippet || item.content || 'No content'}`
      ).join('\n')}`)
      .join('\n\n');

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides clear, concise answers based on search results from multiple sources. Provide only ONE clear sentence that directly answers the user\'s query.'
        },
        {
          role: 'user',
          content: `Based on these search results, answer the query "${query}":\n\n${combinedResults}`
        }
      ],
      max_tokens: 100
    });

    const summary = summaryResponse.choices[0]?.message?.content || 'No summary available';

    // Save to database (for immediate execution)
    const queryId = await database.createQuery(user.address, query);
    await database.updateQueryStatus(queryId, 'completed');
    await database.createQueryResult(queryId, summary, transformedResults, null);

    // Format the combined response
    const searchResult = {
      id: queryId,
      query,
      results: transformedResults,
      summary,
      timestamp: new Date().toISOString(),
    };

    return c.json(searchResult);
  } catch (error) {
    console.error("Multi-source search error:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

// Market creation endpoint
app.post("/api/markets/create", verifyAuth, async (c) => {
  try {
    const { marketQuestion, searchQuery, resolutionDate } = await c.req.json();
    const user = (c.req as any).user;

    // Validate inputs
    if (!marketQuestion || !searchQuery || !resolutionDate) {
      return c.json({ error: "Market question, search query, and resolution date are required" }, 400);
    }

    const scheduledDate = new Date(resolutionDate);
    if (isNaN(scheduledDate.getTime())) {
      return c.json({ error: "Invalid resolution date format" }, 400);
    }
    if (scheduledDate <= new Date()) {
      return c.json({ error: "Resolution date must be in the future" }, 400);
    }

    // Ensure resolution date is at least 5 minutes in the future
    const minFutureTime = new Date(Date.now() + 5 * 60 * 1000);
    if (scheduledDate < minFutureTime) {
      return c.json({ error: "Resolution date must be at least 5 minutes in the future" }, 400);
    }

    // Check if contract deployment is configured
    if (!walletClient || !contractArtifact) {
      return c.json({ error: "Contract deployment not configured on server" }, 500);
    }

    // Handle x402 payment for market creation (higher price than regular search)
    const priceString: X402Price = "$0.25"; // Base price for market creation
    const priceDescription = 'Create prediction market with automated resolution';

    if (payTo) {
      const resourceUrl = c.req.url as X402Resource;

      // Create payment requirements
      let paymentRequirements: PaymentRequirements[];
      try {
        paymentRequirements = [createExactPaymentRequirements(
          priceString,
          resourceUrl,
          priceDescription
        )];
      } catch (error: any) {
        console.error('[X402Svc] Error creating payment requirements:', error.message);
        return c.json({ error: 'Server error: Could not create payment requirements.' }, 500);
      }

      // Handle x402 Payment Flow
      const x402Result = await handleX402PaymentVerification(c, paymentRequirements);

      // If payment verification failed or a challenge was issued, return the 402 response
      if (!x402Result.success || !x402Result.decodedPayment || !x402Result.verifiedPayer) {
        return x402Result.response!;
      }

      // Settle Payment after successful verification
      try {
        const settlement = await settleX402Payment(x402Result.decodedPayment, paymentRequirements[0]);
        const paymentResponseHeaderVal = settleResponseHeader(settlement);
        c.header('X-PAYMENT-RESPONSE', paymentResponseHeaderVal);
        console.log('[X402Svc] Market creation payment settled. Price paid:', priceString);
      } catch (error: any) {
        console.error('[X402Svc] Payment settlement failed:', error.message);
      }
    }

    // Create scheduled query first
    const queryId = await database.createQuery(user.address, searchQuery, scheduledDate);
    console.log(`Created scheduled query ${queryId} for market resolution`);

    // Deploy the escrow contract
    try {
      console.log('Deploying BooleanPredictionEscrow contract...');
      
      const txHash = await walletClient.deployContract({
        abi: contractArtifact.abi,
        bytecode: contractArtifact.bytecode,
        args: [
          marketQuestion,
          BigInt(Math.floor(scheduledDate.getTime() / 1000)), // Convert to Unix timestamp
          oracleAddress,
          stablecoinAddress
        ],
      });

      console.log(`Contract deployment tx hash: ${txHash}`);

      // Wait for the transaction to be mined and get the contract address
      const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        throw new Error('Contract deployment failed');
      }

      const contractAddress = receipt.contractAddress;
      console.log(`Contract deployed at: ${contractAddress}`);

      // Link the market to the query
      await database.createMarketQuery(contractAddress, queryId, marketQuestion);

      return c.json({
        success: true,
        marketContractAddress: contractAddress,
        queryId: queryId,
        scheduledFor: resolutionDate,
        transactionHash: txHash,
        message: "Market created successfully. The settlement search will execute at the resolution time.",
        pricePaid: priceString
      });

    } catch (deployError) {
      console.error('Contract deployment error:', deployError);
      
      // Clean up the query if deployment failed
      await database.deleteQuery(queryId, user.address);
      
      return c.json({ 
        error: "Failed to deploy market contract", 
        details: deployError instanceof Error ? deployError.message : 'Unknown error' 
      }, 500);
    }

  } catch (error) {
    console.error("Market creation error:", error);
    return c.json({ error: "Market creation failed" }, 500);
  }
});

// Get market status by contract address
app.get("/api/markets/:contractAddress", verifyAuth, async (c) => {
  try {
    const contractAddress = c.req.param("contractAddress");
    const user = (c.req as any).user;

    // Get market data from database
    const marketQuery = await database.getMarketByContractAddress(contractAddress);
    if (!marketQuery) {
      return c.json({ error: "Market not found" }, 404);
    }

    // Get associated query data
    const query = await database.getQueryById(marketQuery.query_id);
    if (!query) {
      return c.json({ error: "Associated query not found" }, 404);
    }

    // Only return data if user owns the query
    if (query.user_address !== user.address) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    return c.json({
      contractAddress: marketQuery.market_contract_address,
      marketQuestion: marketQuery.market_question,
      queryId: marketQuery.query_id,
      searchQuery: query.query,
      scheduledFor: query.scheduled_for,
      status: query.status,
      executedAt: query.executed_at,
      summary: query.summary,
      sources: query.sources ? JSON.parse(query.sources) : null,
      error: query.error
    });
  } catch (error) {
    console.error("Error fetching market status:", error);
    return c.json({ error: "Failed to fetch market status" }, 500);
  }
});

// Legacy single-source search endpoint (kept for backwards compatibility)
app.post("/api/search", verifyAuth, async (c) => {
  try {
    const { query }: SearchRequest = await c.req.json();
    const user = (c.req as any).user;

    if (!query || query.trim().length === 0) {
      return c.json({ error: "Query is required" }, 400);
    }

    console.log(`Processing search for user ${user?.address}: "${query}"`);

    const exaResult = await searchWithExa(query);

    return c.json({
      id: nanoid(),
      query,
      answer: exaResult.answer,
      sources: exaResult.sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Search error:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

// Get pending queries
app.get("/api/queries/pending", verifyAuth, async (c) => {
  try {
    const user = (c.req as any).user;
    const queries = await database.getPendingQueries(user.address);

    return c.json({
      queries: queries.map((q: any) => ({
        id: q.id,
        query: q.query,
        scheduledFor: q.scheduled_for,
        createdAt: q.created_at,
        status: q.status
      }))
    });
  } catch (error) {
    console.error("Error fetching pending queries:", error);
    return c.json({ error: "Failed to fetch pending queries" }, 500);
  }
});

// Get query history
app.get("/api/queries/history", verifyAuth, async (c) => {
  try {
    const user = (c.req as any).user;
    const limit = parseInt(c.req.query("limit") || "50");
    const queries = await database.getQueryHistory(user.address, limit);

    return c.json({
      queries: queries.map((q: any) => ({
        id: q.id,
        query: q.query,
        executedAt: q.executed_at,
        createdAt: q.created_at,
        status: q.status,
        summary: q.summary,
        sources: q.sources ? JSON.parse(q.sources) : null,
        error: q.error
      }))
    });
  } catch (error) {
    console.error("Error fetching query history:", error);
    return c.json({ error: "Failed to fetch query history" }, 500);
  }
});

// Get specific query result
app.get("/api/queries/:id", verifyAuth, async (c) => {
  try {
    const user = (c.req as any).user;
    const queryId = parseInt(c.req.param("id"));

    const query = await database.getQueryById(queryId);
    if (!query) {
      return c.json({ error: "Query not found" }, 404);
    }

    // Verify ownership
    if (query.user_address !== user.address) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    return c.json({
      id: query.id,
      query: query.query,
      scheduledFor: query.scheduled_for,
      executedAt: query.executed_at,
      createdAt: query.created_at,
      status: query.status,
      summary: query.summary,
      sources: query.sources ? JSON.parse(query.sources) : null,
      error: query.error
    });
  } catch (error) {
    console.error("Error fetching query:", error);
    return c.json({ error: "Failed to fetch query" }, 500);
  }
});

// Delete scheduled query
app.delete("/api/queries/:id", verifyAuth, async (c) => {
  try {
    const user = (c.req as any).user;
    const queryId = parseInt(c.req.param("id"));

    console.log(`Delete request: queryId=${queryId}, userAddress=${user.address}`);

    // Get the query first to debug
    const query = await database.getQueryById(queryId);
    console.log(`Query found:`, query ? { id: query.id, user_address: query.user_address, status: query.status } : 'null');

    const success = await database.deleteQuery(queryId, user.address);
    console.log(`Delete result: ${success}`);

    if (!success) {
      return c.json({ error: "Query not found or unauthorized" }, 404);
    }

    return c.json({ success: true, message: "Query deleted successfully" });
  } catch (error) {
    console.error("Error deleting query:", error);
    return c.json({ error: "Failed to delete query" }, 500);
  }
});

// Admin endpoint to manually trigger scheduled queries (for testing)
app.post("/api/admin/execute-scheduled", async (c) => {
  try {
    console.log("Manually triggering scheduled query execution...");
    const queries = await database.getQueriesForExecution();
    console.log(`Found ${queries.length} queries ready for execution`);

    if (queries.length > 0) {
      for (const query of queries) {
        console.log(`Executing query ${query.id}: "${query.query}" scheduled for ${query.scheduled_for}`);
        await scheduler.executeQueryNow(query.id);
      }
      return c.json({ message: `Executed ${queries.length} queries` });
    } else {
      return c.json({ message: "No queries ready for execution" });
    }
  } catch (error) {
    console.error("Error in manual execution:", error);
    return c.json({ error: "Failed to execute queries" }, 500);
  }
});

// Start scheduler
scheduler.start();

// Start server
const port = parseInt(process.env.PORT || "3001");
console.log(`Settlement Search Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
console.log(`Expecting client at ${process.env.CLIENT_URL || "http://localhost:8080"}`); 