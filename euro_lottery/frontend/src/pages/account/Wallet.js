import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner, Form, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaChartLine, FaExchangeAlt, FaList, FaFileDownload, FaCreditCard, FaHistory, FaRegCreditCard, FaArrowUp, FaArrowDown, FaWallet, FaEuroSign, FaRegCalendarAlt, FaFilter } from 'react-icons/fa';
import Chart from 'chart.js/auto';
import { format, parseISO, subDays, subMonths } from 'date-fns';

const Wallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [walletLimits, setWalletLimits] = useState({
    deposit: { daily: 1000, weekly: 5000, monthly: 10000 },
    withdrawal: { daily: 5000, weekly: 20000, monthly: 50000 }
  });
  const [walletStats, setWalletStats] = useState({
    deposits: { daily: 0, weekly: 0, monthly: 0, total: 0 },
    withdrawals: { daily: 0, weekly: 0, monthly: 0, total: 0 },
    winnings: { total: 0 }
  });
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Chart refs
  const balanceChartRef = useRef(null);
  const transactionChartRef = useRef(null);

  // Create more realistic data for the demo
  const generateMockData = () => {
    const mockBalance = 1275.50;
    
    // Generate transactions for the past 3 months
    const mockTransactions = [];
    const today = new Date();
    
    // Initial deposit
    mockTransactions.push({
      id: 1,
      type: 'deposit',
      amount: 500.00,
      status: 'completed',
      method: 'credit_card',
      date: subDays(today, 90).toISOString(),
      description: 'Initial deposit via Visa ****4242'
    });
    
    // Generate various transaction types
    for (let i = 2; i < 50; i++) {
      const types = ['deposit', 'withdrawal', 'purchase', 'winning', 'refund', 'fee'];
      const typeWeights = [0.2, 0.1, 0.4, 0.2, 0.05, 0.05]; // Probabilities for each type
      
      // Select transaction type based on weights
      let type;
      const rand = Math.random();
      let cumulative = 0;
      for (let j = 0; j < types.length; j++) {
        cumulative += typeWeights[j];
        if (rand < cumulative) {
          type = types[j];
          break;
        }
      }
      
      // Randomize days in the past (more recent transactions more likely)
      const daysAgo = Math.floor(Math.random() * Math.random() * 90);
      const date = subDays(today, daysAgo).toISOString();
      
      // Generate amount and description based on type
      let amount, description, method, status;
      
      switch (type) {
        case 'deposit':
          amount = Math.floor(Math.random() * 300) + 50;
          method = ['credit_card', 'bank_transfer', 'paypal'][Math.floor(Math.random() * 3)];
          description = `Deposit via ${method.replace('_', ' ')}`;
          break;
        case 'withdrawal':
          amount = -1 * (Math.floor(Math.random() * 200) + 50);
          method = ['credit_card', 'bank_transfer', 'paypal'][Math.floor(Math.random() * 3)];
          description = `Withdrawal to ${method.replace('_', ' ')}`;
          break;
        case 'purchase':
          amount = -1 * (Math.floor(Math.random() * 15) + 5);
          const tickets = Math.floor(Math.random() * 10) + 1;
          const lotteries = ['EuroMillions', 'EuroJackpot', 'PowerBall'];
          const lottery = lotteries[Math.floor(Math.random() * lotteries.length)];
          description = `Purchase of ${tickets} ${lottery} tickets`;
          break;
        case 'winning':
          // More small winnings, fewer large ones
          const winSize = Math.random();
          if (winSize > 0.98) {
            amount = Math.floor(Math.random() * 10000) + 1000;
          } else if (winSize > 0.9) {
            amount = Math.floor(Math.random() * 500) + 100;
          } else if (winSize > 0.7) {
            amount = Math.floor(Math.random() * 90) + 10;
          } else {
            amount = Math.floor(Math.random() * 9) + 2;
          }
          
          const lotteryGame = ['EuroMillions', 'EuroJackpot', 'PowerBall'][Math.floor(Math.random() * 3)];
          const category = `Match ${Math.floor(Math.random() * 5) + 1}+${Math.floor(Math.random() * 2) + 1}`;
          description = `${lotteryGame} winnings (${category})`;
          break;
        case 'refund':
          amount = Math.floor(Math.random() * 15) + 5;
          description = 'Refund for cancelled tickets';
          break;
        case 'fee':
          amount = -1 * (Math.floor(Math.random() * 5) + 1);
          description = 'Processing fee';
          break;
        default:
          amount = Math.floor(Math.random() * 100) - 50;
          description = 'Transaction';
      }
      
      // Random status (completed more likely)
      const statusRand = Math.random();
      if (statusRand > 0.9) {
        status = 'pending';
      } else if (statusRand > 0.95) {
        status = 'failed';
      } else {
        status = 'completed';
      }
      
      mockTransactions.push({
        id: i,
        type,
        amount,
        status,
        method: type === 'deposit' || type === 'withdrawal' ? method : null,
        date,
        description
      });
    }
    
    // Sort by date (newest first)
    mockTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate stats
    const deposits = mockTransactions.filter(tx => tx.type === 'deposit' && tx.status === 'completed');
    const withdrawals = mockTransactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'completed');
    const winnings = mockTransactions.filter(tx => tx.type === 'winning' && tx.status === 'completed');
    
    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    const oneWeekAgo = subDays(now, 7);
    const oneMonthAgo = subDays(now, 30);
    
    const depositStats = {
      daily: deposits.filter(tx => new Date(tx.date) >= oneDayAgo).reduce((sum, tx) => sum + tx.amount, 0),
      weekly: deposits.filter(tx => new Date(tx.date) >= oneWeekAgo).reduce((sum, tx) => sum + tx.amount, 0),
      monthly: deposits.filter(tx => new Date(tx.date) >= oneMonthAgo).reduce((sum, tx) => sum + tx.amount, 0),
      total: deposits.reduce((sum, tx) => sum + tx.amount, 0)
    };
    
    const withdrawalStats = {
      daily: Math.abs(withdrawals.filter(tx => new Date(tx.date) >= oneDayAgo).reduce((sum, tx) => sum + tx.amount, 0)),
      weekly: Math.abs(withdrawals.filter(tx => new Date(tx.date) >= oneWeekAgo).reduce((sum, tx) => sum + tx.amount, 0)),
      monthly: Math.abs(withdrawals.filter(tx => new Date(tx.date) >= oneMonthAgo).reduce((sum, tx) => sum + tx.amount, 0)),
      total: Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0))
    };
    
    return {
      balance: mockBalance,
      transactions: mockTransactions,
      stats: {
        deposits: depositStats,
        withdrawals: withdrawalStats,
        winnings: {
          total: winnings.reduce((sum, tx) => sum + tx.amount, 0)
        }
      }
    };
  };
  
  // Mock data - in a real app, this would come from Redux
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockData();
      setBalance(mockData.balance);
      setTransactions(mockData.transactions);
      setWalletStats(mockData.stats);
      setLoading(false);
      
      // Initialize charts after data is loaded
      renderCharts(mockData.transactions);
    }, 1200);
  }, []);
  
  // Filter transactions
  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(tx => new Date(tx.date) >= startDate);
      }
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }
    
    return filtered;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format transaction amount with sign
  const formatAmount = (amount, type) => {
    if (amount >= 0) {
      return `+€${Math.abs(amount).toFixed(2)}`;
    } else {
      return `-€${Math.abs(amount).toFixed(2)}`;
    }
  };
  
  // Get badge color for transaction type
  const getTransactionBadge = (type) => {
    switch (type) {
      case 'deposit':
        return 'success';
      case 'withdrawal':
        return 'warning';
      case 'purchase':
        return 'primary';
      case 'winning':
        return 'info';
      case 'refund':
        return 'secondary';
      case 'fee':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Render transaction history chart
  const renderCharts = (txData) => {
    // Prepare monthly data
    const months = {};
    
    // Get the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      months[monthKey] = {
        deposits: 0,
        withdrawals: 0,
        purchases: 0,
        winnings: 0,
        net: 0,
        date
      };
    }
    
    // Aggregate transaction data by month
    txData.forEach(tx => {
      const date = parseISO(tx.date);
      const monthKey = format(date, 'MMM yyyy');
      
      if (months[monthKey]) {
        if (tx.status === 'completed') {
          if (tx.type === 'deposit') {
            months[monthKey].deposits += tx.amount;
            months[monthKey].net += tx.amount;
          } else if (tx.type === 'withdrawal') {
            months[monthKey].withdrawals += Math.abs(tx.amount);
            months[monthKey].net += tx.amount;
          } else if (tx.type === 'purchase') {
            months[monthKey].purchases += Math.abs(tx.amount);
            months[monthKey].net += tx.amount;
          } else if (tx.type === 'winning') {
            months[monthKey].winnings += tx.amount;
            months[monthKey].net += tx.amount;
          } else {
            months[monthKey].net += tx.amount;
          }
        }
      }
    });
    
    // Sort months chronologically
    const sortedMonths = Object.entries(months)
      .map(([key, value]) => ({ month: key, ...value }))
      .sort((a, b) => a.date - b.date);
    
    // Render balance chart
    if (balanceChartRef.current) {
      const balanceCtx = balanceChartRef.current.getContext('2d');
      
      // Clear previous chart
      if (balanceChartRef.current.chart) {
        balanceChartRef.current.chart.destroy();
      }
      
      // Calculate running balance
      let runningBalance = 0;
      const balanceData = sortedMonths.map(month => {
        runningBalance += month.net;
        return runningBalance;
      });
      
      balanceChartRef.current.chart = new Chart(balanceCtx, {
        type: 'line',
        data: {
          labels: sortedMonths.map(month => month.month),
          datasets: [
            {
              label: 'Balance',
              data: balanceData,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              tension: 0.2,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Balance: €${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
    
    // Render income/expense chart
    if (transactionChartRef.current) {
      const transactionCtx = transactionChartRef.current.getContext('2d');
      
      // Clear previous chart
      if (transactionChartRef.current.chart) {
        transactionChartRef.current.chart.destroy();
      }
      
      transactionChartRef.current.chart = new Chart(transactionCtx, {
        type: 'bar',
        data: {
          labels: sortedMonths.map(month => month.month),
          datasets: [
            {
              label: 'Deposits',
              data: sortedMonths.map(month => month.deposits),
              backgroundColor: 'rgba(40, 167, 69, 0.7)',
              borderColor: 'rgba(40, 167, 69, 1)',
              borderWidth: 1
            },
            {
              label: 'Winnings',
              data: sortedMonths.map(month => month.winnings),
              backgroundColor: 'rgba(23, 162, 184, 0.7)',
              borderColor: 'rgba(23, 162, 184, 1)',
              borderWidth: 1
            },
            {
              label: 'Purchases',
              data: sortedMonths.map(month => month.purchases),
              backgroundColor: 'rgba(220, 53, 69, 0.7)',
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 1
            },
            {
              label: 'Withdrawals',
              data: sortedMonths.map(month => month.withdrawals),
              backgroundColor: 'rgba(255, 193, 7, 0.7)',
              borderColor: 'rgba(255, 193, 7, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              stacked: false,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      });
    }
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading wallet information...</p>
      </Container>
    );
  }
  
  // Get filtered transactions
  const filteredTransactions = getFilteredTransactions();
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">My Wallet</h1>
        <div>
          <Link to="/lottery-statistics" className="btn btn-outline-primary me-2">
            <FaChartLine className="me-2" /> Lottery Statistics
          </Link>
          <Link to="/transaction-history" className="btn btn-primary">
            <FaHistory className="me-2" /> Transaction History
          </Link>
        </div>
      </div>
      
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <Card className="h-100 wallet-card">
            <Card.Body className="text-center">
              <Card.Title className="text-muted mb-4">Current Balance</Card.Title>
              <div className="balance-display mb-4">
                <FaWallet className="text-primary mb-2" size={36} />
                <h2 className="display-4">€{balance.toFixed(2)}</h2>
              </div>
              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  size="lg" 
                  className="deposit-btn mb-2"
                  onClick={() => navigate('/deposit')}
                >
                  <FaArrowUp className="me-2" /> Deposit Funds
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="lg" 
                  className="withdrawal-btn"
                  onClick={() => navigate('/withdrawal')}
                >
                  <FaArrowDown className="me-2" /> Withdraw Funds
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Row className="h-100">
            <Col md={6} className="mb-3 mb-md-0">
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <Card.Title>Account Summary</Card.Title>
                    <Badge bg="success" className="balance-badge p-2">
                      <FaEuroSign className="me-1" /> {balance.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div style={{ height: '180px' }}>
                    <canvas ref={balanceChartRef}></canvas>
                  </div>
                  
                  <hr />
                  
                  <Row className="text-center">
                    <Col xs={4}>
                      <div className="summary-stat">
                        <div className="stat-value text-success">€{walletStats.deposits.total.toFixed(2)}</div>
                        <div className="stat-label text-muted">Total Deposits</div>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="summary-stat">
                        <div className="stat-value text-warning">€{walletStats.withdrawals.total.toFixed(2)}</div>
                        <div className="stat-label text-muted">Total Withdrawals</div>
                      </div>
                    </Col>
                    <Col xs={4}>
                      <div className="summary-stat">
                        <div className="stat-value text-info">€{walletStats.winnings.total.toFixed(2)}</div>
                        <div className="stat-label text-muted">Total Winnings</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3">
                    <Card.Title>Transaction Overview</Card.Title>
                    <Badge bg="primary" className="transaction-badge p-2">
                      <FaExchangeAlt className="me-1" /> {transactions.length} Transactions
                    </Badge>
                  </div>
                  
                  <div style={{ height: '180px' }}>
                    <canvas ref={transactionChartRef}></canvas>
                  </div>
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={() => navigate('/transaction-history')}
                    >
                      <FaList className="me-1" /> View All Transactions
                    </Button>
                    
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => navigate('/transaction-history?export=true')}
                    >
                      <FaFileDownload className="me-1" /> Export Statement
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Recent Transactions</Card.Title>
            <div className="d-flex align-items-center">
              <Form.Group controlId="dateFilter" className="me-2 mb-0">
                <Form.Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  size="sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group controlId="typeFilter" className="me-2 mb-0">
                <Form.Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  size="sm"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="purchase">Purchases</option>
                  <option value="winning">Winnings</option>
                  <option value="refund">Refunds</option>
                </Form.Select>
              </Form.Group>
              
              <Link to="/transaction-history" className="btn btn-link">
                View All
              </Link>
            </div>
          </div>
          
          {filteredTransactions.length === 0 ? (
            <Alert variant="info">
              No transactions to display for the selected filters.
            </Alert>
          ) : (
            <Table responsive hover className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 10).map(transaction => (
                  <tr 
                    key={transaction.id}
                    className={transaction.status === 'completed' ? '' : 'table-secondary'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/transaction-details/${transaction.id}`)}
                  >
                    <td>
                      <div className="d-flex align-items-center">
                        <div className={`transaction-icon me-2 bg-${getTransactionBadge(transaction.type)}`}>
                          {transaction.type === 'deposit' && <FaArrowUp />}
                          {transaction.type === 'withdrawal' && <FaArrowDown />}
                          {transaction.type === 'purchase' && <FaTicketAlt />}
                          {transaction.type === 'winning' && <FaTrophy />}
                          {transaction.type === 'refund' && <FaExchangeAlt />}
                          {transaction.type === 'fee' && <FaEuroSign />}
                        </div>
                        <div>
                          <div>{format(parseISO(transaction.date), 'dd MMM yyyy')}</div>
                          <small className="text-muted">{format(parseISO(transaction.date), 'HH:mm')}</small>
                        </div>
                      </div>
                    </td>
                    <td>{transaction.description}</td>
                    <td>
                      <Badge bg={getTransactionBadge(transaction.type)}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <Badge 
                        bg={
                          transaction.status === 'completed' 
                            ? 'success' 
                            : transaction.status === 'pending' 
                              ? 'warning' 
                              : 'danger'
                        }
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </td>
                    <td className={`text-end fw-bold ${transaction.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatAmount(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          
          <div className="text-center mt-4">
            <Link to="/transaction-history" className="btn btn-outline-primary">
              <FaHistory className="me-2" /> View All Transactions
            </Link>
          </div>
        </Card.Body>
      </Card>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Payment Methods</h5>
            </Card.Header>
            <Card.Body>
              <div className="payment-method-container">
                <div className="d-flex align-items-center p-3 border rounded mb-3 payment-method-card">
                  <div className="payment-icon me-3">
                    <FaRegCreditCard size={24} className="text-primary" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-0">Visa ending in 4242</h6>
                    <small className="text-muted">Expires 04/2026</small>
                  </div>
                  <div>
                    <Badge bg="success">Default</Badge>
                  </div>
                </div>
                
                <div className="d-flex align-items-center p-3 border rounded mb-3 payment-method-card">
                  <div className="payment-icon me-3">
                    <FaCreditCard size={24} className="text-info" />
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-0">MasterCard ending in 8790</h6>
                    <small className="text-muted">Expires 11/2025</small>
                  </div>
                  <div>
                    <Badge bg="light" text="dark">Backup</Badge>
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-3">
                <Button variant="outline-primary" onClick={() => navigate('/payment-methods')}>
                  <FaCreditCard className="me-2" /> Manage Payment Methods
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Account Limits</h5>
            </Card.Header>
            <Card.Body>
              <div className="limits-container">
                <h6>Deposit Limits</h6>
                <Row className="mb-3">
                  <Col sm={4}>
                    <div className="limit-item">
                      <small className="d-block text-muted mb-1">Daily Limit</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>€{walletStats.deposits.daily.toFixed(2)}</span>
                        <span className="text-muted">of €{walletLimits.deposit.daily.toFixed(2)}</span>
                      </div>
                      <ProgressBar 
                        now={(walletStats.deposits.daily / walletLimits.deposit.daily) * 100} 
                        variant="success" 
                        style={{ height: '6px' }}
                      />
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="limit-item">
                      <small className="d-block text-muted mb-1">Weekly Limit</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>€{walletStats.deposits.weekly.toFixed(2)}</span>
                        <span className="text-muted">of €{walletLimits.deposit.weekly.toFixed(2)}</span>
                      </div>
                      <ProgressBar 
                        now={(walletStats.deposits.weekly / walletLimits.deposit.weekly) * 100} 
                        variant="success" 
                        style={{ height: '6px' }}
                      />
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="limit-item">
                      <small className="d-block text-muted mb-1">Monthly Limit</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>€{walletStats.deposits.monthly.toFixed(2)}</span>
                        <span className="text-muted">of €{walletLimits.deposit.monthly.toFixed(2)}</span>
                      </div>
                      <ProgressBar 
                        now={(walletStats.deposits.monthly / walletLimits.deposit.monthly) * 100} 
                        variant="success" 
                        style={{ height: '6px' }}
                      />
                    </div>
                  </Col>
                </Row>
                
                <h6 className="mt-4">Withdrawal Limits</h6>
                <Row>
                  <Col sm={4}>
                    <div className="limit-item">
                      <small className="d-block text-muted mb-1">Daily Limit</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>€{walletStats.withdrawals.daily.toFixed(2)}</span>
                        <span className="text-muted">of €{walletLimits.withdrawal.daily.toFixed(2)}</span>
                      </div>
                      <ProgressBar 
                        now={(walletStats.withdrawals.daily / walletLimits.withdrawal.daily) * 100} 
                        variant="warning" 
                        style={{ height: '6px' }}
                      />
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="limit-item">
                      <small className="d-block text-muted mb-1">Weekly Limit</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>€{walletStats.withdrawals.weekly.toFixed(2)}</span>
                        <span className="text-muted">of €{walletLimits.withdrawal.weekly.toFixed(2)}</span>
                      </div>
                      <ProgressBar 
                        now={(walletStats.withdrawals.weekly / walletLimits.withdrawal.weekly) * 100} 
                        variant="warning" 
                        style={{ height: '6px' }}
                      />
                    </div>
                  </Col>
                  <Col sm={4}>
                    <div className="limit-item">
                      <small className="d-block text-muted mb-1">Monthly Limit</small>
                      <div className="d-flex justify-content-between mb-1">
                        <span>€{walletStats.withdrawals.monthly.toFixed(2)}</span>
                        <span className="text-muted">of €{walletLimits.withdrawal.monthly.toFixed(2)}</span>
                      </div>
                      <ProgressBar 
                        now={(walletStats.withdrawals.monthly / walletLimits.withdrawal.monthly) * 100} 
                        variant="warning" 
                        style={{ height: '6px' }}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
              
              <div className="text-center mt-4">
                <Button variant="outline-secondary" onClick={() => navigate('/account-limits')}>
                  <FaRegCalendarAlt className="me-2" /> Adjust Limits
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <style jsx>{`
        .wallet-card {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-radius: 10px;
          border: none;
        }
        
        .balance-display {
          padding: 20px 0;
        }
        
        .transaction-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .payment-method-card {
          transition: all 0.2s ease;
        }
        
        .payment-method-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .limit-item {
          padding: 8px 0;
        }
        
        .summary-stat {
          padding: 10px 0;
        }
        
        .stat-value {
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .stat-label {
          font-size: 0.8rem;
        }
        
        .transaction-table tr:hover {
          background-color: rgba(0,0,0,0.03);
        }
      `}</style>
    </Container>
  );
};

export default Wallet;