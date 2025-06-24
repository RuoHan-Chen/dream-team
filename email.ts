import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend('re_7NEpLPc1_FHPKJS88u5LD3JTM1adtm5Xb');

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

interface EmailSearchResult {
  query: string;
  summary: string;
  results: SearchProviderResult[];
  executedAt: string;
}

export function createSearchResultEmailHTML(searchResult: EmailSearchResult): string {
  const validResults = searchResult.results.filter(r => !r.error);
  const hasErrors = searchResult.results.some(r => r.error);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Search Results: ${searchResult.query}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .header h1 {
            color: #007bff;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .query {
            background: #e8f5e9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #4caf50;
        }
        .query h2 {
            color: #1b5e20;
            margin: 0 0 10px 0;
            font-size: 18px;
        }
        .query-text {
            font-size: 16px;
            font-weight: 600;
            color: #2e7d32;
            margin-bottom: 10px;
        }
        .summary {
            background: #f0f8ff;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #007bff;
        }
        .summary h3 {
            color: #0056b3;
            margin: 0 0 15px 0;
            font-size: 20px;
        }
        .summary-text {
            font-size: 16px;
            color: #1a472a;
            line-height: 1.6;
        }
        .provider-section {
            margin-bottom: 30px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
        }
        .provider-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
        }
        .provider-name {
            font-size: 18px;
            font-weight: 600;
            color: #007bff;
            margin: 0;
        }
        .provider-content {
            padding: 20px;
        }
        .provider-answer {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 15px;
            line-height: 1.6;
        }
        .sources-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin: 0 0 15px 0;
        }
        .source-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        .source-title {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .source-url {
            color: #6c757d;
            font-size: 12px;
            margin-bottom: 8px;
            word-break: break-all;
        }
        .source-url a {
            color: #007bff;
            text-decoration: none;
        }
        .source-url a:hover {
            text-decoration: underline;
        }
        .source-snippet {
            color: #495057;
            font-size: 14px;
            line-height: 1.5;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .timestamp {
            color: #6c757d;
            font-size: 14px;
            text-align: center;
            margin-bottom: 20px;
        }
        .error-notice {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .no-sources {
            color: #6c757d;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Settlement Search Results</h1>
            <div class="timestamp">
                Executed at ${new Date(searchResult.executedAt).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
            </div>
        </div>

        <div class="query">
            <h2>Your Query</h2>
            <div class="query-text">"${searchResult.query}"</div>
        </div>

        <div class="summary">
            <h3>📋 Summary</h3>
            <div class="summary-text">${searchResult.summary}</div>
        </div>

        ${hasErrors ? `
        <div class="error-notice">
            <strong>Note:</strong> Some search providers encountered errors. Results shown are from available sources.
        </div>
        ` : ''}

        <h3 style="color: #333; margin-bottom: 20px;">📚 Detailed Results by Source</h3>

        ${validResults.map(result => `
        <div class="provider-section">
            <div class="provider-header">
                <h4 class="provider-name">${result.provider}</h4>
            </div>
            <div class="provider-content">
                ${result.answer ? `
                <div class="provider-answer">
                    ${result.answer}
                </div>
                ` : ''}
                
                ${result.sources && result.sources.length > 0 ? `
                <div class="sources-title">Sources (${result.sources.length})</div>
                ${result.sources.slice(0, 5).map(source => `
                <div class="source-item">
                    <div class="source-title">${source.title}</div>
                    ${source.url ? `<div class="source-url"><a href="${source.url}" target="_blank">${source.url}</a></div>` : ''}
                    <div class="source-snippet">${source.snippet}</div>
                </div>
                `).join('')}
                ${result.sources.length > 5 ? `<div style="text-align: center; color: #6c757d; font-style: italic; margin-top: 10px;">... and ${result.sources.length - 5} more sources</div>` : ''}
                ` : '<div class="no-sources">No sources available from this provider</div>'}
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <p>This email was generated by Settlement Search, powered by x402 payments protocol.</p>
            <p style="margin-top: 10px; font-size: 12px;">
                🔗 Multi-source search powered by Exa, Perplexity, Brave Search, and Tavily<br>
                🤖 Summary generated by OpenAI GPT-4o
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

export async function sendSearchResultEmail(
  userEmail: string,
  searchResult: EmailSearchResult
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = createSearchResultEmailHTML(searchResult);
    
    // Create a simple text version for email clients that don't support HTML
    const textContent = `
Settlement Search Results

Query: "${searchResult.query}"
Executed at: ${new Date(searchResult.executedAt).toLocaleString()}

Summary:
${searchResult.summary}

Detailed Results:
${searchResult.results
  .filter(r => !r.error)
  .map(result => `
${result.provider}:
${result.answer || 'No answer provided'}

Sources:
${result.sources.slice(0, 3).map(source => `- ${source.title}: ${source.url || 'No URL'}`).join('\n')}
`).join('\n---\n')}

Powered by Settlement Search and x402 payments protocol.
    `.trim();

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: `🔍 Search Results: "${searchResult.query}"`,
      html: htmlContent,
      text: textContent
    });

    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function sendScheduledQueryNotification(
  userEmail: string,
  query: string,
  scheduledFor: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Query Scheduled</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f8f9fa; padding: 30px; border-radius: 8px; }
        .header { color: #007bff; font-size: 24px; margin-bottom: 20px; }
        .query { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">📅 Search Query Scheduled</h1>
        <p>Your search query has been successfully scheduled and will be executed automatically.</p>
        
        <div class="query">
            <strong>Query:</strong> "${query}"<br>
            <strong>Scheduled for:</strong> ${scheduledFor.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
        </div>
        
        <p>You'll receive your search results via email when the query is executed.</p>
        
        <div class="timestamp">
            Scheduled at ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
    `;

    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: userEmail,
      subject: `📅 Query Scheduled: "${query}"`,
      html: htmlContent,
      text: `Search Query Scheduled\n\nQuery: "${query}"\nScheduled for: ${scheduledFor.toLocaleString()}\n\nYou'll receive your search results via email when the query is executed.`
    });

    console.log('Scheduled notification email sent:', response);
    return { success: true };
  } catch (error) {
    console.error('Failed to send scheduled notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}