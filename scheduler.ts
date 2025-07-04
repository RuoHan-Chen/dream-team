import cron from 'node-cron';
import { database, Query } from './database';
import { searchAllProviders } from './search-providers';
import { sendSearchResultEmail } from './email';
import { OpenAI } from 'openai';
import { config } from 'dotenv';
import { resolveMarketFromScheduler } from './agent/market-resolver-agent';

// Load environment variables
config({ path: '.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class QueryScheduler {
  private task: cron.ScheduledTask | null = null;

  start() {
    // Run every minute to check for scheduled queries
    this.task = cron.schedule('* * * * *', async () => {
      await this.processScheduledQueries();
    });

    console.log('Query scheduler started');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Query scheduler stopped');
    }
  }

  private async processScheduledQueries() {
    try {
      const queries = await database.getQueriesForExecution();

      if (queries.length > 0) {
        console.log(`Found ${queries.length} queries to execute`);
      }

      for (const query of queries) {
        await this.executeQuery(query);
      }
    } catch (error) {
      console.error('Error processing scheduled queries:', error);
    }
  }

  private async executeQuery(query: Query) {
    console.log(`Executing scheduled query ${query.id}: "${query.query}"`);

    try {
      // Update status to running
      await database.updateQueryStatus(query.id, 'running');

      // Execute the search
      const allResults = await searchAllProviders(query.query);

      // Transform results to match frontend expectations (results -> sources)
      const transformedResults = allResults.map(result => ({
        provider: result.provider,
        sources: result.results, // Map 'results' to 'sources' for frontend compatibility
        error: result.error,
        answer: result.answer || 'No answer provided'
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
            content: `Based on these search results, answer the query "${query.query}":\n\n${combinedResults}`
          }
        ],
        max_tokens: 100
      });

      const summary = summaryResponse.choices[0]?.message?.content || 'No summary available';

      // Store results
      await database.createQueryResult(query.id, summary, transformedResults, null);
      await database.updateQueryStatus(query.id, 'completed');

      // Check if this query is associated with a market
      const market = await database.getMarketByQueryId(query.id);
      if (market) {
        console.log(`Query ${query.id} is associated with market ${market.market_contract_address}`);
        
        // Check if we have ORACLE_PRIVATE_KEY configured
        if (process.env.ORACLE_PRIVATE_KEY) {
          console.log('[Scheduler] ORACLE_PRIVATE_KEY is loaded (first 10 chars):', process.env.ORACLE_PRIVATE_KEY.substring(0, 10) + '...');
          try {
            console.log(`Attempting to resolve market ${market.market_contract_address}`);
            
            // Call the agent to resolve the market
            const resolveResult = await resolveMarketFromScheduler(
              market.market_contract_address,
              market.market_question,
              summary,
              transformedResults
            );
            
            if (resolveResult.success) {
              console.log(`Market resolved successfully! Outcome: ${resolveResult.outcome}`);
              console.log(`Resolution details:`, resolveResult.message);
              
              // Extract transaction hash from agent message if available
              const txHashMatch = resolveResult.message.match(/Transaction Hash:\*?\*?\s*([0-9a-fA-Fx]+)/);
              const txHash = txHashMatch ? txHashMatch[1] : '';
              
              // Store the agent's resolution data in the database
              if (resolveResult.outcome !== undefined) {
                await database.updateMarketResolution(
                  market.market_contract_address,
                  resolveResult.outcome,
                  txHash,
                  resolveResult.message
                );
                console.log(`Stored agent resolution data for market ${market.market_contract_address}`);
              } else {
                console.log('[Scheduler] WARNING: Agent outcome is undefined, not storing resolution');
              }
            } else {
              console.error(`Failed to resolve market:`, resolveResult.message);
            }
          } catch (resolveError) {
            console.error(`Failed to resolve market ${market.market_contract_address}:`, resolveError);
          }
        } else {
          console.log('ORACLE_PRIVATE_KEY not set - skipping automatic market resolution');
        }
      }

      // Send email notification if user provided an email
      if (query.user_email && query.scheduled_for) {
        try {
          console.log(`Sending email notification to ${query.user_email} for query ${query.id}`);
          
          const emailResult = await sendSearchResultEmail(query.user_email, {
            query: query.query,
            summary,
            results: transformedResults,
            executedAt: new Date().toISOString()
          });

          if (emailResult.success) {
            console.log(`Email sent successfully to ${query.user_email} for query ${query.id}`);
          } else {
            console.error(`Failed to send email for query ${query.id}:`, emailResult.error);
          }
        } catch (emailError) {
          console.error(`Error sending email for query ${query.id}:`, emailError);
        }
      }

      console.log(`Successfully executed query ${query.id}`);
    } catch (error) {
      console.error(`Error executing query ${query.id}:`, error);

      // Store error
      await database.createQueryResult(
        query.id,
        null,
        null,
        error instanceof Error ? error.message : 'Unknown error'
      );
      await database.updateQueryStatus(query.id, 'failed');
    }
  }

  // Manually execute a specific query (useful for testing)
  async executeQueryNow(queryId: number) {
    const query = await database.getQueryById(queryId);
    if (query) {
      await this.executeQuery(query);
    }
  }
}

// Create singleton instance
export const scheduler = new QueryScheduler(); 