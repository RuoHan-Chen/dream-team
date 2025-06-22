import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useWallet } from './contexts/WalletContext';
import { api, updateApiClient, type SearchResult, type ScheduledQuery, type QueryHistory, type MarketCreationResponse, type MarketStatus } from './services/api';
import './App.css';

function App() {
  const { walletClient, authToken, isConnected, authenticate } = useWallet();
  const [activeTab, setActiveTab] = useState<'search' | 'pending' | 'history' | 'markets'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [pendingQueries, setPendingQueries] = useState<ScheduledQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Market creation state
  const [marketQuestion, setMarketQuestion] = useState('');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketResolutionDate, setMarketResolutionDate] = useState('');
  const [createdMarket, setCreatedMarket] = useState<MarketCreationResponse | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [checkingContractAddress, setCheckingContractAddress] = useState('');

  // Calculate dynamic price based on selections
  const calculatePrice = () => {
    let price = 0.05; // Base price
    if (isScheduled) {
      price += 0.05; // Add $0.05 for scheduling
      if (scheduleEmail) {
        price += 0.05; // Add $0.05 for email notification
      }
    }
    return price;
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Update API client when wallet or auth changes
  useEffect(() => {
    updateApiClient(walletClient, authToken);
  }, [walletClient, authToken]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && !authToken && walletClient) {
      console.log('Starting authentication...', { isConnected, authToken, walletClient });
      authenticate()
        .then(() => {
          console.log('Authentication successful!');
        })
        .catch(err => {
          console.error('Authentication error:', err);
          setError(`Authentication failed: ${err.message}`);
        });
    }
  }, [isConnected, authToken, walletClient, authenticate]);

  // Load data based on active tab
  useEffect(() => {
    if (authToken) {
      if (activeTab === 'pending') {
        loadPendingQueries();
      } else if (activeTab === 'history') {
        loadQueryHistory();
      }
    }
  }, [activeTab, authToken]);

  const loadPendingQueries = async () => {
    try {
      const { queries } = await api.getPendingQueries();
      setPendingQueries(queries);
    } catch (err: any) {
      console.error('Failed to load pending queries:', err);
    }
  };

  const loadQueryHistory = async () => {
    try {
      const { queries } = await api.getQueryHistory();
      setQueryHistory(queries);
    } catch (err: any) {
      console.error('Failed to load query history:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const currentPrice = calculatePrice();

      if (isScheduled) {
        if (!scheduleDate) {
          setError('Please provide schedule date');
          setLoading(false);
          return;
        }

        // Email is optional for scheduling
        const result = await api.scheduleSearch(searchQuery, scheduleDate, scheduleEmail);
        const message = scheduleEmail
          ? `Query scheduled successfully! Check your email at ${scheduleEmail} for confirmation.`
          : `Query scheduled successfully!`;
        setSuccess(`${message} Payment of ${formatPrice(currentPrice)} USDC processed.`);
        setSearchQuery('');
        setScheduleDate('');
        setScheduleEmail('');
        setIsScheduled(false);
        if (activeTab === 'pending') {
          loadPendingQueries();
        }
      } else {
        const result = await api.searchNow(searchQuery);
        setSearchResult(result);
        setSuccess(`Search completed successfully! Payment of ${formatPrice(currentPrice)} USDC processed.`);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { error?: string } } };
        if (error.response?.status === 402) {
          setError(`Payment required: ${error.response.data?.error || 'Please ensure you have sufficient USDC balance'}`);
        } else if (error.response?.status === 400 && error.response.data?.error) {
          // Show specific validation error from server
          setError(error.response.data.error);
        } else if ('message' in err) {
          setError((err as { message: string }).message || 'Search failed');
        } else {
          setError('Search failed');
        }
      } else {
        setError('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    try {
      await api.deleteQuery(id);
      setSuccess('Query cancelled successfully');
      loadPendingQueries();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
          setError('Query not found or may have already been executed');
        } else if (error.message) {
          setError(error.message);
        } else {
          setError('Failed to cancel query');
        }
      } else {
        setError('Failed to cancel query');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Add 5 minutes buffer
    return now.toISOString().slice(0, 16);
  };

  const handleCreateMarket = async () => {
    if (!marketQuestion.trim() || !marketSearchQuery.trim() || !marketResolutionDate) {
      setError('Please fill in all market fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.createMarket({
        marketQuestion,
        searchQuery: marketSearchQuery,
        resolutionDate: new Date(marketResolutionDate).toISOString()
      });
      
      setCreatedMarket(result);
      setSuccess(`Market created successfully! Contract: ${result.marketContractAddress}. Payment of $0.25 USDC processed.`);
      
      // Clear form
      setMarketQuestion('');
      setMarketSearchQuery('');
      setMarketResolutionDate('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { error?: string; details?: string } } };
        if (error.response?.status === 402) {
          setError(`Payment required: ${error.response.data?.error || 'Please ensure you have sufficient USDC balance'}`);
        } else if (error.response?.data?.error) {
          setError(`${error.response.data.error}${error.response.data.details ? `: ${error.response.data.details}` : ''}`);
        } else if ('message' in err) {
          setError((err as { message: string }).message || 'Market creation failed');
        } else {
          setError('Market creation failed');
        }
      } else {
        setError('Market creation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMarketStatus = async () => {
    if (!checkingContractAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const status = await api.getMarketStatus(checkingContractAddress);
      setMarketStatus(status);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { error?: string } } };
        if (error.response?.status === 404) {
          setError('Market not found');
        } else if (error.response?.data?.error) {
          setError(error.response.data.error);
        } else {
          setError('Failed to fetch market status');
        }
      } else {
        setError('Failed to fetch market status');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Settlement Search</h1>
        <p>Multi-source AI-powered search with x402 micropayments</p>
        <div className="x402-info">
          <span className="price-tag">{formatPrice(calculatePrice())}</span>
          <span className="settlement-info">2 second settlement • No fees</span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <button
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:3001/health');
                const data = await response.json();
                alert(`Backend status: ${JSON.stringify(data)}`);
              } catch (err) {
                alert(`Backend error: ${err.message}`);
              }
            }}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            Test Backend
          </button>
        </div>
      </header>

      <main>
        <section className="wallet-section">
          <h2>Connect Wallet</h2>
          <WalletConnect />
          {isConnected && !authToken && (
            <p className="auth-hint">Authenticating...</p>
          )}
          {authToken && (
            <p className="auth-success">✅ Authenticated and ready to search!</p>
          )}
        </section>

        {authToken && (
          <>
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                Search
              </button>
              <button
                className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending ({pendingQueries.length})
              </button>
              <button
                className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
              <button
                className={`tab ${activeTab === 'markets' ? 'active' : ''}`}
                onClick={() => setActiveTab('markets')}
              >
                Markets
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {activeTab === 'search' && (
              <section className="search-section">
                <div className="search-form">
                  <input
                    type="text"
                    placeholder="What would you like to search for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
                    className="search-input"
                    disabled={loading}
                  />

                  <div className="schedule-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                      />
                      Schedule for later (+$0.05)
                    </label>
                  </div>

                  {isScheduled && (
                    <div className="schedule-fields">
                      <input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={getMinDateTime()}
                        className="schedule-input"
                        placeholder="When to execute"
                      />
                      <input
                        type="email"
                        placeholder="Email for notification (optional, +$0.05)"
                        value={scheduleEmail}
                        onChange={(e) => setScheduleEmail(e.target.value)}
                        className="email-input"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="search-button"
                  >
                    {loading ? 'Processing...' : `${isScheduled ? 'Schedule' : 'Search Now'} (${formatPrice(calculatePrice())})`}
                  </button>
                </div>

                {searchResult && (
                  <div className="search-results">
                    <h3>Search Results</h3>
                    <div className="summary">
                      <h4>Summary</h4>
                      <p>{searchResult.summary}</p>
                    </div>

                    {searchResult.results.map((provider, index) => (
                      <div key={index} className="provider-results">
                        <h4>{provider.provider}</h4>
                        {provider.error ? (
                          <p className="provider-error">{provider.error}</p>
                        ) : (
                          <>
                            <p className="provider-answer">{provider.answer}</p>
                            <div className="sources">
                              {provider.sources.map((source, idx) => (
                                <div key={idx} className="source">
                                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                                    {source.title}
                                  </a>
                                  <p>{source.snippet}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'pending' && (
              <section className="pending-section">
                <h3>Pending Queries</h3>
                {pendingQueries.length === 0 ? (
                  <p>No pending queries</p>
                ) : (
                  <div className="query-list">
                    {pendingQueries.map((query) => (
                      <div key={query.id} className="query-item">
                        <div className="query-info">
                          <strong>{query.query}</strong>
                          <span className="schedule-time">
                            Scheduled for: {formatDate(query.scheduledFor)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'history' && (
              <section className="history-section">
                <h3>Query History</h3>
                {queryHistory.length === 0 ? (
                  <p>No query history</p>
                ) : (
                  <div className="history-list">
                    {queryHistory.map((query) => (
                      <div key={query.id} className="history-item">
                        <div className="history-header">
                          <strong>{query.query}</strong>
                          <span className="history-date">
                            {formatDate(query.executedAt || query.createdAt)}
                          </span>
                        </div>
                        {query.summary && (
                          <p className="history-summary">{query.summary}</p>
                        )}
                        {query.error && (
                          <p className="history-error">Error: {query.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'markets' && (
              <section className="markets-section">
                <h3>Create Prediction Market</h3>
                <div className="market-form">
                  <div className="form-group">
                    <label>Market Question</label>
                    <input
                      type="text"
                      placeholder="e.g., Will ETH price be above $3000 by end of year?"
                      value={marketQuestion}
                      onChange={(e) => setMarketQuestion(e.target.value)}
                      className="market-input"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Resolution Search Query</label>
                    <input
                      type="text"
                      placeholder="e.g., current ETH price in USD"
                      value={marketSearchQuery}
                      onChange={(e) => setMarketSearchQuery(e.target.value)}
                      className="market-input"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Resolution Date & Time</label>
                    <input
                      type="datetime-local"
                      value={marketResolutionDate}
                      onChange={(e) => setMarketResolutionDate(e.target.value)}
                      min={getMinDateTime()}
                      className="market-input"
                      disabled={loading}
                    />
                  </div>
                  
                  <button
                    onClick={handleCreateMarket}
                    disabled={loading}
                    className="market-button"
                  >
                    {loading ? 'Creating...' : 'Create Market ($0.25)'}
                  </button>
                </div>

                {createdMarket && (
                  <div className="market-result">
                    <h4>Market Created Successfully!</h4>
                    <div className="market-details">
                      <p><strong>Contract Address:</strong> <code>{createdMarket.marketContractAddress}</code></p>
                      <p><strong>Transaction Hash:</strong> <code>{createdMarket.transactionHash}</code></p>
                      <p><strong>Query ID:</strong> {createdMarket.queryId}</p>
                      <p><strong>Resolution Scheduled:</strong> {formatDate(createdMarket.scheduledFor)}</p>
                    </div>
                  </div>
                )}

                <div className="market-status-check">
                  <h4>Check Market Status</h4>
                  <div className="status-form">
                    <input
                      type="text"
                      placeholder="Enter contract address (0x...)"
                      value={checkingContractAddress}
                      onChange={(e) => setCheckingContractAddress(e.target.value)}
                      className="market-input"
                      disabled={loading}
                    />
                    <button
                      onClick={handleCheckMarketStatus}
                      disabled={loading}
                      className="status-button"
                    >
                      {loading ? 'Checking...' : 'Check Status'}
                    </button>
                  </div>

                  {marketStatus && (
                    <div className="market-status">
                      <h5>Market Status</h5>
                      <div className="status-details">
                        <p><strong>Question:</strong> {marketStatus.marketQuestion}</p>
                        <p><strong>Search Query:</strong> {marketStatus.searchQuery}</p>
                        <p><strong>Status:</strong> <span className={`status-badge ${marketStatus.status}`}>{marketStatus.status}</span></p>
                        <p><strong>Scheduled For:</strong> {formatDate(marketStatus.scheduledFor)}</p>
                        {marketStatus.executedAt && (
                          <p><strong>Executed At:</strong> {formatDate(marketStatus.executedAt)}</p>
                        )}
                        {marketStatus.summary && (
                          <div className="market-summary">
                            <p><strong>Result Summary:</strong></p>
                            <p>{marketStatus.summary}</p>
                          </div>
                        )}
                        {marketStatus.error && (
                          <p className="market-error"><strong>Error:</strong> {marketStatus.error}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer>
        <p>
          Powered by x402 payment protocol •
          <a href="https://x402.org" target="_blank" rel="noopener noreferrer"> Learn more</a>
        </p>
      </footer>
    </div>
  );
}

export default App;