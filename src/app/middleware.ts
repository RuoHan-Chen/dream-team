import { Address } from "viem";
import { paymentMiddleware, Network, Resource } from "x402-next";

const facilitatorUrl = process.env.NEXT_PUBLIC_FACILITATOR_URL as Resource;
const payTo = process.env.RESOURCE_WALLET_ADDRESS as Address;
const network = process.env.NETWORK as Network;

export const middleware = paymentMiddleware(
  payTo,
  {
    "/protected": {
      price: "$1",
      network,
      config: {
        description: "Access to protected content",
      },
    },
  },
  {
    url: facilitatorUrl,
  },
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/protected/:path*"],
};


// type RoutesConfig = Record<string, Price | RouteConfig>;

// interface RouteConfig {
//   price: Price;           // Price in USD or token amount
//   network: Network;       // "base" or "base-sepolia"
//   config?: PaymentMiddlewareConfig;
// }

// interface PaymentMiddlewareConfig {
//     description?: string;               // Description of the payment
//     mimeType?: string;                  // MIME type of the resource
//     maxTimeoutSeconds?: number;         // Maximum time for payment (default: 60)
//     outputSchema?: Record<string, any>; // JSON schema for the response
//     customPaywallHtml?: string;         // Custom HTML for the paywall
//     resource?: string;                  // Resource URL (defaults to request URL)
// }

// type FacilitatorConfig = {
//     url: string;                        // URL of the x402 facilitator service
//     createAuthHeaders?: CreateHeaders;  // Optional function to create authentication headers
// };

