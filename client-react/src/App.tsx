import React, { useState, useEffect } from 'react';
import { useWallet } from './contexts/WalletContext';
import { api, updateApiClient, type SearchResult, type SearchSource, type SearchProviderResult, type ScheduledQuery, type QueryHistory, type MarketCreationResponse, type MarketStatus, type MarketListItem } from './services/api';
import './App.css';

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
  const { walletClient, isConnected, connect, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState<'search' | 'pending' | 'history' | 'markets' | undefined>(undefined);
  const [marketView, setMarketView] = useState<'browse' | 'create'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [pendingQueries, setPendingQueries] = useState<ScheduledQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [marketQuestion, setMarketQuestion] = useState('');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [marketResolutionDate, setMarketResolutionDate] = useState('');
  const [createdMarket, setCreatedMarket] = useState<MarketCreationResponse | null>(null);
  const [checkingContractAddress, setCheckingContractAddress] = useState('');
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [allMarkets, setAllMarkets] = useState<MarketListItem[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketListItem | null>(null);
  const [showMarketDetails, setShowMarketDetails] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [betOutcome, setBetOutcome] = useState<'true' | 'false' | null>(null);
  const [bettingHistory, setBettingHistory] = useState<any[]>([]);
  const [marketOdds, setMarketOdds] = useState({ true: 0, false: 0 });
  const [marketCreationLoading, setMarketCreationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Animation states
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [pulsingStars, setPulsingStars] = useState<PulsingStar[]>([]);
  const [homeShootingStars, setHomeShootingStars] = useState<ShootingStar[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [overlayY, setOverlayY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSearchInterface, setShowSearchInterface] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [showMarketTabs, setShowMarketTabs] = useState(false);
  const [showSearchFadeIn, setShowSearchFadeIn] = useState(false);
  const dragStartPos = React.useRef(0);

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

  // Update API client when wallet changes
  useEffect(() => {
    updateApiClient(walletClient);
  }, [walletClient]);

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
      const numShootingStars = 12;
      for (let i = 0; i < numShootingStars; i++) {
        const startX = Math.random() * 600;
        const startY = Math.random() * 200;
        const animationDuration = Math.random() * 3 + 5;
        const animationDelay = Math.random() * 4 + 0.2;

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
        const size = Math.random() * 2 + 1;
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
      const numHomeShootingStars = 8;
      for (let i = 0; i < numHomeShootingStars; i++) {
        const startX = Math.random() * 800;
        const startY = Math.random() * 300;
        const animationDuration = Math.random() * 4 + 6;
        const animationDelay = Math.random() * 8 + 2;

        newHomeShootingStars.push({
          id: i + 1000,
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

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingQueries();
    } else if (activeTab === 'history') {
      loadQueryHistory();
    } else if (activeTab === 'markets') {
      loadAllMarkets();
    }
  }, [activeTab]);

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

  const loadAllMarkets = async () => {
    try {
      const { markets } = await api.getAllMarkets();
      setAllMarkets(markets);
    } catch (err: any) {
      console.error('Failed to load markets:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearchLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;
      if (isScheduled) {
        if (!scheduleDate) {
          setError('Please select a schedule date');
          setSearchLoading(false);
          return;
        }
        result = await api.scheduleSearch(searchQuery, scheduleDate, scheduleEmail || undefined);
        setSuccess(`Search scheduled for ${formatDate(scheduleDate)}`);
        setSearchQuery('');
        setScheduleDate('');
        setScheduleEmail('');
        setIsScheduled(false);
        loadPendingQueries();
      } else {
        result = await api.searchNow(searchQuery);
        setSearchResult(result);
        setSuccess('Search completed successfully!');
        setSearchQuery('');
        loadQueryHistory();
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { error?: string } } };
        if (error.response?.status === 402) {
          setError(`Payment required: ${error.response.data?.error || 'Please ensure you have sufficient USDC balance'}`);
        } else if (error.response?.status === 400 && error.response.data?.error) {
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
      setSearchLoading(false);
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

  const handleCreateMarket = async () => {
    if (!marketQuestion.trim() || !marketSearchQuery.trim() || !marketResolutionDate) {
      setError('Please fill in all fields');
      return;
    }

    setMarketCreationLoading(true);
    setError(null);
    try {
      const result = await api.createMarket({
        marketQuestion,
        searchQuery: marketSearchQuery,
        resolutionDate: new Date(marketResolutionDate).toISOString()
      });
      setCreatedMarket(result);
      setSuccess('Market created successfully!');
      setMarketQuestion('');
      setMarketSearchQuery('');
      setMarketResolutionDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to create market');
    } finally {
      setMarketCreationLoading(false);
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
      setSuccess('Market status retrieved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to check market status');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Add 5 minutes buffer
    return now.toISOString().slice(0, 16);
  };

  const renderAgentResolution = (market: MarketStatus | MarketListItem) => {
    if (!market.agentResolved) return null;
    
    return (
      <div className="agent-resolution">
        <h5>🤖 Agent Resolution</h5>
        <div className="resolution-details">
          <div className="resolution-outcome">
            <span>Outcome:</span>
            <span className={`outcome-badge ${market.agentOutcome ? 'true' : 'false'}`}>
              {market.agentOutcome ? 'TRUE' : 'FALSE'}
            </span>
          </div>
          {market.agentResolutionTx && (
            <p>
              <a 
                href={`https://sepolia.basescan.org/tx/${market.agentResolutionTx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View Transaction
              </a>
            </p>
          )}
          <details className="agent-analysis">
            <summary>View Analysis</summary>
            <pre>{market.agentAnalysis}</pre>
          </details>
        </div>
      </div>
    );
  };

  // Add click handler to dismiss intro
  const handleIntroClick = () => {
    setOverlayY(-window.innerHeight);
    setIntroDismissed(true);
    setTimeout(() => {
      setShowIntro(false);
      // Ensure the page scrolls to top when intro is dismissed
      window.scrollTo(0, 0);
    }, 500);
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
    if (!isDragging) return;
    
    setIsDragging(false);
    // Make it more sensitive - only need to drag 1/6 of screen height instead of 1/4
    if (overlayY < -window.innerHeight / 6) {
      setOverlayY(-window.innerHeight);
      setIntroDismissed(true);
      setTimeout(() => {
        setShowIntro(false);
        // Ensure the page scrolls to top when intro is dismissed
        window.scrollTo(0, 0);
      }, 500); // Animation duration
    } else {
      setOverlayY(0);
    }
  };

  // Handler to show search interface
  const handleShowSearch = () => {
    setError(null);
    setSuccess(null);
    setActiveTab('search');
    setShowSearchInterface(true);
    setShowSearchFadeIn(true);
  };

  const handleShowMarkets = () => {
    setError(null);
    setSuccess(null);
    setActiveTab('markets');
    setShowMarketTabs(false);
    setShowSearchFadeIn(false);
  };

  const handleCreateMarketClick = () => {
    setShowMarketTabs(true);
    setShowSearchFadeIn(false);
  };

  const handleTabChange = (tab: 'search' | 'pending' | 'history' | 'markets') => {
    setError(null);
    setSuccess(null);
    setActiveTab(tab);
    if (tab === 'search') {
      setShowSearchInterface(true);
      setShowSearchFadeIn(true);
    } else {
      setShowSearchFadeIn(false);
    }
  };

  const handleViewMarketDetails = async (market: MarketListItem) => {
    setSelectedMarket(market);
    setShowMarketDetails(true);
    setBetAmount('');
    setBetOutcome(null);
    
    // Simulate fetching betting history and odds
    // In a real implementation, this would come from your API
    const mockBettingHistory = [
      { id: 1, user: '0x1234567890abcdef1234567890abcdef12345678', outcome: 'true', amount: '0.1', timestamp: new Date().toISOString() },
      { id: 2, user: '0x876543210fedcba9876543210fedcba987654321', outcome: 'false', amount: '0.05', timestamp: new Date().toISOString() },
      { id: 3, user: '0xabcdef1234567890abcdef1234567890abcdef12', outcome: 'true', amount: '0.2', timestamp: new Date().toISOString() },
    ];
    setBettingHistory(mockBettingHistory);
    
    // Calculate odds based on betting history
    const trueBets = mockBettingHistory.filter(bet => bet.outcome === 'true').reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    const falseBets = mockBettingHistory.filter(bet => bet.outcome === 'false').reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    const totalPool = trueBets + falseBets;
    
    setMarketOdds({
      true: totalPool > 0 ? (totalPool / (trueBets + 0.01)) * 0.95 : 1, // 5% fee
      false: totalPool > 0 ? (totalPool / (falseBets + 0.01)) * 0.95 : 1
    });
  };

  const handlePlaceBet = async () => {
    if (!betOutcome || !betAmount || !selectedMarket) {
      setError('Please select an outcome and enter bet amount');
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would call your smart contract
      console.log(`Placing bet: ${amount} ETH on ${betOutcome} for market ${selectedMarket.contractAddress}`);
      
      // Simulate successful bet
      const newBet = {
        id: bettingHistory.length + 1,
        user: walletClient?.account?.address || '0x0000000000000000000000000000000000000000',
        outcome: betOutcome,
        amount: betAmount,
        timestamp: new Date().toISOString()
      };
      
      setBettingHistory([newBet, ...bettingHistory]);
      setBetAmount('');
      setBetOutcome(null);
      setSuccess('Bet placed successfully!');
      
      // Recalculate odds
      const updatedHistory = [newBet, ...bettingHistory];
      const trueBets = updatedHistory.filter(bet => bet.outcome === 'true').reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
      const falseBets = updatedHistory.filter(bet => bet.outcome === 'false').reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
      const totalPool = trueBets + falseBets;
      
      setMarketOdds({
        true: totalPool > 0 ? (totalPool / (trueBets + 0.01)) * 0.95 : 1,
        false: totalPool > 0 ? (totalPool / (falseBets + 0.01)) * 0.95 : 1
      });
    } catch (err: any) {
      setError(err.message || 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMarketDetails = () => {
    setShowMarketDetails(false);
    setSelectedMarket(null);
    setBetAmount('');
    setBetOutcome(null);
    setBettingHistory([]);
    setMarketOdds({ true: 0, false: 0 });
  };

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
        
        {/* Wallet Connection - Top Right */}
        <div className={`home-wallet-connect ${introDismissed ? 'fade-in' : ''}`}>
          {!isConnected ? (
            <button onClick={connect} className="home-connect-btn">
              Connect Wallet
            </button>
          ) : (
            <div className="home-wallet-info">
              <div className="home-wallet-status">
                <span className="home-status-dot connected"></span>
                <span className="home-wallet-address">
                  {walletClient?.account?.address ? 
                    formatAddress(walletClient.account.address) : 
                    'Connected'
                  }
                </span>
              </div>
              <button onClick={disconnect} className="home-disconnect-btn">
                Disconnect
              </button>
            </div>
          )}
        </div>
        
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
                  onClick={handleCreateMarketClick} 
                  className="action-btn"
                >
                  Create Market
                </button>
              </div>
              
              <div className="action-card">
                <h3>Pending Queries</h3>
                <p>Check the status of your scheduled queries and view pending predictions.</p>
                <button 
                  onClick={() => handleTabChange('pending')} 
                  className="action-btn"
                >
                  View Pending
                </button>
              </div>
              
              <div className="action-card">
                <h3>Query History</h3>
                <p>Review your past predictions and track your prediction accuracy over time.</p>
                <button 
                  onClick={() => handleTabChange('history')} 
                  className="action-btn"
                >
                  View History
                </button>
              </div>
            </div>
          </div>

          {showMarketTabs && (
            <div className="market-tabs-transition">
              <div className="market-tabs-container">
                <h2>Choose Market Action</h2>
                <div className="market-tabs-buttons">
                  <button 
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setActiveTab('markets');
                      setMarketView('browse');
                      setShowMarketTabs(false);
                    }} 
                    className="market-tab-btn browse-btn"
                  >
                    Browse Markets
                  </button>
                  <button 
                    onClick={() => {
                      setError(null);
                      setSuccess(null);
                      setActiveTab('markets');
                      setMarketView('create');
                      setShowMarketTabs(false);
                    }} 
                    className="market-tab-btn create-btn"
                  >
                    Create Market
                  </button>
                </div>
                <button 
                  onClick={() => setShowMarketTabs(false)} 
                  className="back-btn"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

          {showMarketDetails && selectedMarket && (
            <div className="market-details-overlay">
              <div className="market-details-container">
                <div className="market-details-header">
                  <h2>Market Details</h2>
                  <button onClick={handleCloseMarketDetails} className="close-btn">
                    ×
                  </button>
                </div>
                
                <div className="market-details-content">
                  <div className="market-info-section">
                    <h3>{selectedMarket.marketQuestion}</h3>
                    <div className="market-meta">
                      <p><strong>Resolution Date:</strong> {formatDate(selectedMarket.scheduledFor)}</p>
                      <p><strong>Contract:</strong> <code>{selectedMarket.contractAddress}</code></p>
                      <p><strong>Status:</strong> <span className={`status-badge status-${selectedMarket.status}`}>{selectedMarket.status}</span></p>
                    </div>
                  </div>

                  <div className="odds-section">
                    <h3>Current Odds</h3>
                    <div className="odds-display">
                      <div 
                        className={`odds-card true-odds ${betOutcome === 'true' ? 'selected' : ''}`}
                        onClick={() => setBetOutcome('true')}
                      >
                        <span className="odds-label">TRUE</span>
                        <span className="odds-value">{marketOdds.true.toFixed(2)}x</span>
                      </div>
                      <div 
                        className={`odds-card false-odds ${betOutcome === 'false' ? 'selected' : ''}`}
                        onClick={() => setBetOutcome('false')}
                      >
                        <span className="odds-label">FALSE</span>
                        <span className="odds-value">{marketOdds.false.toFixed(2)}x</span>
                      </div>
                    </div>
                  </div>

                  <div className="betting-section">
                    <h3>Place Your Bet</h3>
                    <div className="betting-form">
                      <div className="bet-amount-input">
                        <label>Bet Amount</label>
                        <input
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          placeholder="0.01"
                          min="0.001"
                          step="0.001"
                          className="bet-input"
                        />
                      </div>
                      
                      <button 
                        onClick={handlePlaceBet} 
                        className="place-bet-btn"
                        disabled={!betOutcome || !betAmount || loading}
                      >
                        {loading ? 'Placing Bet...' : 'Place Bet'}
                      </button>
                    </div>
                  </div>

                  <div className="betting-history-section">
                    <h3>Betting History</h3>
                    <div className="betting-history">
                      {bettingHistory.length === 0 ? (
                        <p className="no-bets">No bets placed yet. Be the first!</p>
                      ) : (
                        <div className="history-list">
                          {bettingHistory.map((bet) => (
                            <div key={bet.id} className="history-item">
                              <div className="bet-info">
                                <span className="bet-user">{formatAddress(bet.user)}</span>
                                <span className={`bet-outcome ${bet.outcome}`}>
                                  {bet.outcome.toUpperCase()}
                                </span>
                                <span className="bet-amount">{bet.amount} ETH</span>
                              </div>
                              <span className="bet-time">{formatDate(bet.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="pulse-loader"></div>
              <p>Processing...</p>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          {activeTab === 'search' && (
            <section className={`search-section ${showSearchFadeIn ? 'fade-in' : ''}`}>
              {showSearchInterface && (
                <>
                  {searchLoading ? (
                    <div className="search-loading">
                      <div className="loading-container">
                        <div className="pulse-loader"></div>
                        <p>Processing settlement search...</p>
                        <p className="loading-subtitle">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="search-box">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Enter your settlement query..."
                          className="search-input"
                          disabled={searchLoading}
                        />
                        <button onClick={handleSearch} className="btn" disabled={searchLoading}>
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
                            disabled={searchLoading}
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
                                disabled={searchLoading}
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
                                disabled={searchLoading}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {searchResult && (
                    <div className="search-result">
                      <h4>Search Results</h4>
                      <div className="result-summary">
                        <p><strong>Query:</strong> {searchResult.query}</p>
                        <p><strong>Summary:</strong> {searchResult.summary}</p>
                      </div>
                      {searchResult.results.map((provider: SearchProviderResult, index: number) => (
                        <div key={index} className="provider-result">
                          <h5>{provider.provider}</h5>
                          <p>{provider.answer}</p>
                          {provider.sources && provider.sources.length > 0 && (
                            <div className="sources">
                              {provider.sources.map((source: SearchSource, sourceIndex: number) => (
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
                        disabled={searchLoading}
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
                  {queryHistory.map((query) => {
                    const isCompact = query.query.length < 15;
                    return (
                      <div key={query.id} className={`query-item history-item${isCompact ? ' compact' : ''}`}>
                        <div className={`history-header${isCompact ? ' compact' : ''}`}>
                          <h4 className="history-query">{query.query}</h4>
                          <span className={`history-status status-${query.status.toLowerCase()}`}>{query.status}</span>
                          {isCompact && (
                            <span className="meta-value history-date-inline">{formatDate(query.createdAt)}</span>
                          )}
                        </div>
                        <div className="history-details">
                          <div className="history-meta">
                            {!isCompact && (
                              <div className="meta-item">
                                <span className="meta-label">Date:</span>
                                <span className="meta-value">{formatDate(query.createdAt)}</span>
                              </div>
                            )}
                            {query.summary && (
                              <div className="meta-item">
                                <span className="meta-label">Summary:</span>
                                <span className="meta-value">{query.summary}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'markets' && (
            <section className="markets-section">
              {marketView === 'browse' && (
                <div className="markets-browse">
                  {allMarkets.length === 0 ? (
                    <div className="no-markets">
                      <p>No markets found. Be the first to create one!</p>
                    </div>
                  ) : (
                    <div className="markets-list">
                      {allMarkets.map((market) => (
                        <div key={market.contractAddress} className={`market-card ${market.isOwnMarket ? 'own-market' : ''}`}>
                          <div className="market-header">
                            <h4>{market.marketQuestion}</h4>
                            {market.isOwnMarket && (
                              <span className="own-badge">Your Market</span>
                            )}
                          </div>
                          <div className="market-info">
                            <p><strong>Resolution:</strong> {formatDate(market.scheduledFor)}</p>
                            <p><strong>Contract:</strong> <code>{market.contractAddress}</code></p>
                            <p><strong>Status:</strong> <span className={`status-badge status-${market.status}`}>{market.status}</span></p>
                          </div>
                          {market.summary && (
                            <div className="market-result-summary">
                              <p><strong>Result:</strong> {market.summary}</p>
                            </div>
                          )}
                          {renderAgentResolution(market)}
                          <div className="market-actions">
                            <button 
                              onClick={() => handleViewMarketDetails(market)} 
                              className="view-details-btn"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {marketView === 'create' && (
                <>
                  <h3>Create Prediction Market</h3>
                  {marketCreationLoading ? (
                    <div className="market-creation-loading">
                      <div className="loading-container">
                        <div className="pulse-loader"></div>
                        <p>Creating market on blockchain...</p>
                        <p className="loading-subtitle">This may take a few moments</p>
                      </div>
                    </div>
                  ) : (
                    <div className="market-form">
                      <div className="form-group">
                        <label>Market Question</label>
                        <input
                          type="text"
                          placeholder="e.g., Will ETH price be above $3000 by end of year?"
                          value={marketQuestion}
                          onChange={(e) => setMarketQuestion(e.target.value)}
                          className="market-input"
                          disabled={marketCreationLoading}
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
                          disabled={marketCreationLoading}
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
                          disabled={marketCreationLoading}
                        />
                      </div>
                      
                      <button onClick={handleCreateMarket} className="btn" disabled={marketCreationLoading}>
                        Create Market ($0.25)
                      </button>
                    </div>
                  )}

                  {createdMarket && (
                    <div className="search-result">
                      <h4>Market Created Successfully!</h4>
                      <div className="market-details">
                        <p><strong>Query ID:</strong> <code>{createdMarket.queryId}</code></p>
                        <p><strong>Contract Address:</strong> <code>{createdMarket.marketContractAddress}</code></p>
                        <p><strong>Transaction Hash:</strong> <code>{createdMarket.transactionHash}</code></p>
                        <p><strong>Resolution Date:</strong> {formatDate(createdMarket.scheduledFor)}</p>
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
                    <button onClick={handleCheckMarketStatus} className="btn" disabled={searchLoading}>
                      Check Status
                    </button>
                  </div>

                  {marketStatus && (
                    <div className="search-result">
                      <h4>Market Status for {marketStatus.contractAddress}</h4>
                      <div className="market-details">
                        <p><strong>Question:</strong> {marketStatus.marketQuestion}</p>
                        <p><strong>Status:</strong> <span className={`status-badge status-${marketStatus.status || 'unknown'}`}>{marketStatus.status || 'Unknown'}</span></p>
                        <p><strong>Resolution Time:</strong> {formatDate(marketStatus.scheduledFor)}</p>
                        <p><strong>Search Query:</strong> {marketStatus.searchQuery}</p>
                        
                        {marketStatus.summary && (
                          <div className="market-summary">
                            <p><strong>Settlement Search Result:</strong></p>
                            <p><strong>Summary:</strong> {marketStatus.summary}</p>
                          </div>
                        )}
                      </div>
                      {renderAgentResolution(marketStatus)}
                    </div>
                  )}
                </>
              )}
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