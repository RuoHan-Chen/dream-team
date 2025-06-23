import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { api, updateApiClient, type SearchResult, type ScheduledQuery, type QueryHistory, type MarketCreationResponse, type MarketStatus } from './services/api';
import './App.css';
import logo from './logo.png';

type Star = {
  id: number;
  style: React.CSSProperties;
};

type ShootingStar = {
  id: number;
  style: React.CSSProperties;
};

type PulsingStar = {
  id: number;
  style: React.CSSProperties;
};

function App() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  console.log('App component rendering...');
  console.log('Privy state:', { ready, authenticated, user: user?.wallet?.address });
  
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
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [pulsingStars, setPulsingStars] = useState<PulsingStar[]>([]);
  const [homeShootingStars, setHomeShootingStars] = useState<ShootingStar[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [overlayY, setOverlayY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSearchInterface, setShowSearchInterface] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const dragStartPos = React.useRef(0);

  // Get auth token when user authenticates
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getAccessToken();
        setAuthToken(token);
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
    };

    if (authenticated) {
      fetchToken();
    }
  }, [authenticated, getAccessToken]);

  // Generate stars and pulses on component mount
  useEffect(() => {
    const generateStars = () => {
      const newStars: Star[] = [];
      const numStars = 100;
      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 2 + 1;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;
        const animationDelay = Math.random() * 5;

        newStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
          },
        });
      }
      setStars(newStars);
    };

    const generateShootingStars = () => {
      const newShootingStars: ShootingStar[] = [];
      const numShootingStars = 12; // Increased number for more individual stars
      for (let i = 0; i < numShootingStars; i++) {
        const startX = Math.random() * 600; // Start from anywhere across the screen (0-600px)
        const startY = Math.random() * 200; // Start from top side (0-200px) - wider area
        const animationDuration = Math.random() * 3 + 5; // Faster animation (5-8s)
        const animationDelay = Math.random() * 4 + 0.2; // Spread out delays (0.2-4.2s) for more individual timing

        newShootingStars.push({
          id: i,
          style: {
            top: `${startY}px`,
            left: `${startX}px`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
          } as React.CSSProperties,
        });
      }
      setShootingStars(newShootingStars);
    };

    const generatePulsingStars = () => {
      const newPulsingStars: PulsingStar[] = [];
      const numPulsingStars = 25;
      for (let i = 0; i < numPulsingStars; i++) {
        const size = Math.random() * 2 + 1; // Smaller size range (1-3px)
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 4 + 3;
        const animationDelay = Math.random() * 6;

        newPulsingStars.push({
          id: i,
          style: {
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
          },
        });
      }
      setPulsingStars(newPulsingStars);
    };

    const generateHomeShootingStars = () => {
      const newHomeShootingStars: ShootingStar[] = [];
      const numHomeShootingStars = 8; // Fewer stars for home page
      for (let i = 0; i < numHomeShootingStars; i++) {
        const startX = Math.random() * 800; // Wider range for home page
        const startY = Math.random() * 300; // Start from top area
        const animationDuration = Math.random() * 4 + 6; // Slower animation (6-10s)
        const animationDelay = Math.random() * 8 + 2; // Longer delays (2-10s) for more sporadic appearance

        newHomeShootingStars.push({
          id: i + 1000, // Different ID range to avoid conflicts
          style: {
            top: `${startY}px`,
            left: `${startX}px`,
            animationDuration: `${animationDuration}s`,
            animationDelay: `${animationDelay}s`,
          } as React.CSSProperties,
        });
      }
      setHomeShootingStars(newHomeShootingStars);
    };

    generateStars();
    generateShootingStars();
    generatePulsingStars();
    generateHomeShootingStars();
  }, []);

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
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  // Update API client when auth token changes
  useEffect(() => {
    updateApiClient(authToken);
  }, [authToken]);

  // Load data based on active tab
  useEffect(() => {
    // Clear error and success messages when changing tabs
    setError(null);
    setSuccess(null);
    
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
    setCreatedMarket(null);

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
    setMarketStatus(null);

    try {
      const result = await api.getMarketStatus(checkingContractAddress);
      setMarketStatus(result);
    } catch (err: unknown) {
      let message = 'Failed to fetch market status';
      if (typeof err === 'object' && err !== null) {
        if ('response' in err && (err as any).response?.data?.error) {
          message = (err as any).response.data.error;
        } else if ('message' in err) {
          message = (err as { message: string }).message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderMarketStatus = () => {
    if (!marketStatus) return null;
    return (
      <div className="search-result">
        <h4>Market Status for {marketStatus.contractAddress}</h4>
        <p><strong>Question:</strong> {marketStatus.marketQuestion}</p>
        <p><strong>Status:</strong> <span className={`status-badge status-${marketStatus.status || 'unknown'}`}>{marketStatus.status || 'Unknown'}</span></p>
        <p><strong>Resolution Time:</strong> {formatDate(marketStatus.scheduledFor)}</p>
        <p><strong>Search Query:</strong> {marketStatus.searchQuery}</p>
        
        {marketStatus.summary && (
          <div className="result-details">
            <h5>Settlement Search Result:</h5>
            <p><strong>Summary:</strong> {marketStatus.summary}</p>
          </div>
        )}
      </div>
    );
  };

  // Drag handlers
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    dragStartPos.current = clientY - overlayY;
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const newY = clientY - dragStartPos.current;
    setOverlayY(Math.min(0, newY)); // Prevent dragging down
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Make it more sensitive - only need to drag 1/6 of screen height instead of 1/4
    if (overlayY < -window.innerHeight / 6) {
      setOverlayY(-window.innerHeight);
      setTimeout(() => setShowIntro(false), 500); // Animation duration
    } else {
      setOverlayY(0);
    }
  };

  // Add click handler to dismiss intro
  const handleIntroClick = () => {
    setOverlayY(-window.innerHeight);
    setIntroDismissed(true);
    setTimeout(() => setShowIntro(false), 500);
  };

  // Handler to show search interface
  const handleShowSearch = () => {
    setError(null);
    setSuccess(null);
    setActiveTab('search');
    setShowSearchInterface(true);
  };

  // Taskbar component
  const Taskbar = () => (
    <nav className="taskbar">
      <div className="taskbar-actions">
        <WalletConnect />
      </div>
    </nav>
  );

  // Wallet connect component using Privy
  const WalletConnect = () => (
    <div className="wallet-connect">
      {!authenticated ? (
        <button onClick={login} className="wallet-button">
          Connect Wallet
        </button>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-info">
            <span className="status-indicator">●</span>
            <span className="address">{user?.wallet?.address || 'Connected'}</span>
          </div>
          <button onClick={logout} className="wallet-button">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );

  // Show loading screen while Privy initializes
  if (!ready) {
    console.log('Privy not ready, showing loading screen...');
    return (
      <div className="loading-container">
        <div className="pulse-loader"></div>
        <p>Initializing Dream Market...</p>
      </div>
    );
  }

  console.log('Privy is ready, rendering main app...');
  
  return (
    <div className={`App ${showIntro ? 'intro-active' : ''}`}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={star.style}
        />
      ))}
      
      {/* Home Screen Content - Always rendered */}
      <div className="home-screen-content">
        {pulsingStars.map((pulsingStar) => (
          <div
            key={pulsingStar.id}
            className="pulsing-star"
            style={pulsingStar.style}
          />
        ))}
        
        {homeShootingStars.map((shootingStar) => (
          <div
            key={shootingStar.id}
            className="shooting-star home-shooting-star"
            style={shootingStar.style}
          />
        ))}
        
        <Taskbar />
        <div className="container">
          <div className={`welcome-section ${introDismissed ? 'fade-in' : ''}`}>
            <h1 className="welcome-title">Welcome to Dream Market</h1>
            <p className="welcome-description">
              Predict the future, earn rewards. Create and trade on prediction markets powered by real-time data and AI insights.
            </p>
            
            <div className={`action-grid ${introDismissed ? 'fade-in' : ''}`}>
              <div className="action-card">
                <h3>Search & Predict</h3>
                <p>Ask questions about the future and get AI-powered predictions with real-time data sources.</p>
                <button 
                  onClick={handleShowSearch} 
                  className="action-btn"
                >
                  Start Searching
                </button>
              </div>
              
              <div className="action-card">
                <h3>Create Markets</h3>
                <p>Create your own prediction markets and let others bet on real-world outcomes.</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setActiveTab('markets');
                  }} 
                  className="action-btn"
                >
                  Create Market
                </button>
              </div>
              
              <div className="action-card">
                <h3>Pending Queries</h3>
                <p>Check the status of your scheduled queries and view pending predictions.</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setActiveTab('pending');
                  }} 
                  className="action-btn"
                >
                  View Pending
                </button>
              </div>
              
              <div className="action-card">
                <h3>Query History</h3>
                <p>Review your past predictions and track your prediction accuracy over time.</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setActiveTab('history');
                  }} 
                  className="action-btn"
                >
                  View History
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="loading-container">
              <div className="pulse-loader"></div>
              <p>Processing...</p>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          {activeTab === 'search' && (
            <section className="search-section">
              {showSearchInterface && (
                <>
                  <div className="search-box">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter your settlement query..."
                      className="search-input"
                      disabled={loading}
                    />
                    <button onClick={handleSearch} className="btn" disabled={loading}>
                      {isScheduled ? `Schedule (${formatPrice(calculatePrice())})` : `Search (${formatPrice(calculatePrice())})`}
                    </button>
                  </div>
                  
                  <div className="search-options">
                    <div className="option">
                      <input
                        type="checkbox"
                        id="schedule-checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        disabled={loading}
                      />
                      <label htmlFor="schedule-checkbox">Schedule for later</label>
                    </div>

                    {isScheduled && (
                      <div className="schedule-inputs">
                        <div className="option">
                          <input
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="schedule-input"
                            disabled={loading}
                            min={getMinDateTime()}
                          />
                        </div>
                        <div className="option">
                          <input
                            type="email"
                            value={scheduleEmail}
                            onChange={(e) => setScheduleEmail(e.target.value)}
                            placeholder="Email for notifications (optional)"
                            className="schedule-input"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {searchResult && (
                    <div className="search-result">
                      <h4>Search Results</h4>
                      <div className="result-summary">
                        <p><strong>Query:</strong> {searchResult.query}</p>
                        <p><strong>Summary:</strong> {searchResult.summary}</p>
                      </div>
                      {searchResult.providers.map((provider, index) => (
                        <div key={index} className="provider-result">
                          <h5>{provider.name}</h5>
                          <p>{provider.answer}</p>
                          {provider.sources && provider.sources.length > 0 && (
                            <div className="sources">
                              {provider.sources.map((source, sourceIndex) => (
                                <a
                                  key={sourceIndex}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="source-link"
                                >
                                  {source.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeTab === 'pending' && (
            <section className="pending-section">
              <h3>Pending Queries</h3>
              {pendingQueries.length === 0 ? (
                <p>No pending queries.</p>
              ) : (
                <div className="query-list">
                  {pendingQueries.map((query) => (
                    <div key={query.id} className="query-item">
                      <p><strong>Query:</strong> {query.query}</p>
                      <p><strong>Scheduled for:</strong> {formatDate(query.scheduledFor)}</p>
                      <button
                        onClick={() => handleDeleteQuery(query.id)}
                        className="btn-delete"
                        disabled={loading}
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
                <p>No query history.</p>
              ) : (
                <div className="query-list">
                  {queryHistory.map((query) => (
                    <div key={query.id} className="query-item history-item">
                      <p><strong>Query:</strong> {query.query}</p>
                      <p><strong>Date:</strong> {formatDate(query.createdAt)}</p>
                      <p><strong>Status:</strong> {query.status}</p>
                      {query.summary && <p><strong>Summary:</strong> {query.summary}</p>}
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
                  <label htmlFor="market-question">Market Question:</label>
                  <input
                    type="text"
                    id="market-question"
                    value={marketQuestion}
                    onChange={(e) => setMarketQuestion(e.target.value)}
                    placeholder="e.g., Will Bitcoin reach $100k by end of 2024?"
                    className="market-input"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="market-search-query">Search Query for Resolution:</label>
                  <input
                    type="text"
                    id="market-search-query"
                    value={marketSearchQuery}
                    onChange={(e) => setMarketSearchQuery(e.target.value)}
                    placeholder="e.g., Bitcoin price December 31 2024"
                    className="market-input"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="market-resolution-date">Resolution Date:</label>
                  <input
                    type="date"
                    id="market-resolution-date"
                    value={marketResolutionDate}
                    onChange={(e) => setMarketResolutionDate(e.target.value)}
                    className="market-input"
                    disabled={loading}
                  />
                </div>
                <button onClick={handleCreateMarket} className="btn" disabled={loading}>
                  Create Market
                </button>
              </div>

              {createdMarket && (
                <div className="search-result">
                  <h4>Market Created Successfully!</h4>
                  <div className="market-details">
                    <p><strong>Market ID:</strong> <code>{createdMarket.marketId}</code></p>
                    <p><strong>Contract Address:</strong> <code>{createdMarket.contractAddress}</code></p>
                    <p><strong>Question:</strong> {createdMarket.question}</p>
                    <p><strong>Resolution Date:</strong> {createdMarket.resolutionDate}</p>
                  </div>
                </div>
              )}

              <hr className="divider" />

              <h3>Check Market Status</h3>
              <div className="market-status-checker">
                <input
                  type="text"
                  value={checkingContractAddress}
                  onChange={(e) => setCheckingContractAddress(e.target.value)}
                  placeholder="Enter contract address"
                  className="market-input"
                />
                <button onClick={handleCheckMarketStatus} className="btn" disabled={loading}>
                  Check Status
                </button>
              </div>

              {marketStatus && renderMarketStatus()}
            </section>
          )}
        </div>
        
        <footer className="app-footer">
          <p>
            Powered by{' '}
            <a 
              href="https://x402.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              x402 payment protocol
            </a>
          </p>
        </footer>
      </div>

      {showIntro && (
        <div
          className="intro-overlay"
          style={{ transform: `translateY(${overlayY}px)` }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onClick={handleIntroClick}
        >
          <div className="moonlight"></div>
          
          {shootingStars.map((shootingStar) => (
            <div
              key={shootingStar.id}
              className="shooting-star"
              style={shootingStar.style}
            />
          ))}

          <div className="intro-content">
            <h1 className="intro-title">Dream Big</h1>
          </div>

          <div className="swipe-indicator">
            <div className="arrow bounce">↑</div>
            <p>Swipe up</p>
            <p>or click to enter</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;