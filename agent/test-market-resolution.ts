import { resolveMarketWithSearchResults } from './market-resolver-agent.js';
import { loadEnv } from './load-env.js';

// Load environment variables
loadEnv();

async function testMarketResolution() {
  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is required');
    process.exit(1);
  }

  if (!process.env.ORACLE_PRIVATE_KEY) {
    console.error('⚠️  Warning: ORACLE_PRIVATE_KEY not set - resolution will be simulated only');
  }

  // Get contract address from command line
  const contractAddress = process.argv[2];
  
  if (!contractAddress) {
    console.log(`
Usage: tsx agent/test-market-resolution.ts <CONTRACT_ADDRESS>

Example:
  tsx agent/test-market-resolution.ts 0xf176657dbac9181bbe954f059631eda74e3a40ed

This script will:
1. Check the contract state
2. Simulate search results
3. Attempt to resolve the market based on those results
`);
    process.exit(1);
  }

  console.log('🎯 Testing Market Resolution');
  console.log('📍 Contract Address:', contractAddress);
  console.log('🔑 Oracle Private Key:', process.env.ORACLE_PRIVATE_KEY ? 'Set ✓' : 'Not set ⚠️');
  console.log('');

  // Example search results - you can modify these to test different scenarios
  const scenarios = [
    {
      name: 'Bitcoin Price Check',
      marketQuestion: 'Will Bitcoin be above $100,000 by end of 2024?',
      searchSummary: 'Current Bitcoin price is $67,500 as of December 2024. The price has not exceeded $100,000.',
      searchResults: [
        {
          provider: 'CoinMarketCap',
          answer: 'Bitcoin is currently trading at $67,500, well below the $100,000 mark',
          sources: [
            { title: 'BTC/USD Price', url: 'https://coinmarketcap.com/currencies/bitcoin/', snippet: 'Bitcoin (BTC) price: $67,500 USD' }
          ]
        },
        {
          provider: 'CoinGecko',
          answer: 'Bitcoin price today is $67,489.00 USD with a 24-hour trading volume of $28,721,456,789 USD',
          sources: [
            { title: 'Bitcoin Price', url: 'https://www.coingecko.com/en/coins/bitcoin', snippet: 'BTC price: $67,489 (-2.1% 24h)' }
          ]
        }
      ]
    },
    {
      name: 'Ethereum Merge Success',
      marketQuestion: 'Will Ethereum successfully complete the merge by September 2022?',
      searchSummary: 'Ethereum successfully completed the merge on September 15, 2022.',
      searchResults: [
        {
          provider: 'Ethereum.org',
          answer: 'The Merge was completed successfully on September 15, 2022',
          sources: [
            { title: 'The Merge', url: 'https://ethereum.org/en/upgrades/merge/', snippet: 'The Merge was executed on September 15, 2022' }
          ]
        }
      ]
    }
  ];

  // Let user choose scenario or use custom
  const scenarioIndex = parseInt(process.argv[3] || '0');
  const scenario = scenarios[scenarioIndex] || scenarios[0];

  console.log('📊 Using scenario:', scenario.name);
  console.log('❓ Market Question:', scenario.marketQuestion);
  console.log('📝 Search Summary:', scenario.searchSummary);
  console.log('');

  try {
    console.log('🤖 Running market resolver agent...\n');
    
    const result = await resolveMarketWithSearchResults(
      contractAddress,
      scenario.marketQuestion,
      scenario.searchSummary,
      scenario.searchResults
    );

    console.log('📋 Agent Output:');
    console.log('='.repeat(80));
    console.log(result.finalOutput);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testMarketResolution().catch(console.error); 