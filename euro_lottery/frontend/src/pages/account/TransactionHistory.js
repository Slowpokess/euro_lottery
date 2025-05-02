import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, InputGroup, Tabs, Tab, Alert, Spinner, Dropdown, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaDownload, FaInfoCircle, FaFileExport, FaPrint, FaExclamationTriangle, FaFileInvoice } from 'react-icons/fa';
import Chart from 'chart.js/auto';
import { format, parseISO, subDays, subMonths, isAfter, isBefore, isWithinInterval } from 'date-fns';

// Mock transaction data
const generateMockTransactions = (count = 50) => {
  const types = ['deposit', 'withdrawal', 'purchase', 'winning', 'refund', 'fee'];
  const statuses = ['completed', 'pending', 'failed', 'cancelled'];
  const methods = ['credit_card', 'bank_transfer', 'paypal', 'skrill', 'crypto', 'wallet'];
  const lotteryGames = ['EuroMillions', 'EuroJackpot', 'PowerBall', 'MegaMillions'];
  
  const transactions = [];
  const now = new Date();
  
  for (let i = 1; i <= count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const lottery = lotteryGames[Math.floor(Math.random() * lotteryGames.length)];
    
    // Set some logic for amounts based on transaction type
    let amount;
    let description;
    
    switch(type) {
      case 'deposit':
        amount = Math.floor(Math.random() * 500) + 10;
        description = `Deposit via ${methods[Math.floor(Math.random() * methods.length)].replace('_', ' ')}`;
        break;
      case 'withdrawal':
        amount = -(Math.floor(Math.random() * 300) + 10);
        description = `Withdrawal to ${methods[Math.floor(Math.random() * methods.length)].replace('_', ' ')}`;
        break;
      case 'purchase':
        amount = -(Math.floor(Math.random() * 30) + 2);
        description = `Purchase of ${Math.floor(Math.random() * 10) + 1} ${lottery} tickets`;
        break;
      case 'winning':
        amount = Math.floor(Math.random() * 2000) + 4;
        description = `${lottery} winnings (Match ${Math.floor(Math.random() * 5) + 1}+${Math.floor(Math.random() * 2) + 1})`;
        break;
      case 'refund':
        amount = Math.floor(Math.random() * 15) + 2;
        description = 'Refund for cancelled tickets';
        break;
      case 'fee':
        amount = -(Math.floor(Math.random() * 5) + 1);
        description = 'Processing fee';
        break;
      default:
        amount = Math.floor(Math.random() * 100) - 50;
        description = 'Transaction';
    }
    
    // Generate a random date within the last 12 months
    const dateDaysAgo = Math.floor(Math.random() * 365);
    const date = subDays(now, dateDaysAgo).toISOString();
    
    // Generate transaction reference
    const txRef = `TX${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`;
    
    transactions.push({
      id: i,
      type,
      amount,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      method: type === 'deposit' || type === 'withdrawal' ? methods[Math.floor(Math.random() * methods.length)] : null,
      date,
      description,
      reference: txRef,
      details: {
        lottery: type === 'purchase' || type === 'winning' ? lottery : null,
        tickets: type === 'purchase' ? Math.floor(Math.random() * 10) + 1 : null,
        matchCategory: type === 'winning' ? `Match ${Math.floor(Math.random() * 5) + 1}+${Math.floor(Math.random() * 2) + 1}` : null,
        fee: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
      }
    });
  }
  
  // Sort by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return transactions;
};

const TransactionHistory = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    types: [],
    statuses: [],
    minAmount: '',
    maxAmount: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1
  });
  const [activeTab, setActiveTab] = useState('list');
  const [chartData, setChartData] = useState({
    income: [],
    expenses: [],
    balance: []
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  // Chart references
  const incomeChartRef = useRef(null);
  const expensesChartRef = useRef(null);
  const balanceChartRef = useRef(null);
  const transactionTypeChartRef = useRef(null);
  const incomeExpenseChartRef = useRef(null);
  
  // Charts
  const incomeChartInstance = useRef(null);
  const expensesChartInstance = useRef(null);
  const balanceChartInstance = useRef(null);
  const transactionTypeChartInstance = useRef(null);
  const incomeExpenseChartInstance = useRef(null);
  
  // Load mock data
  useEffect(() => {
    setTimeout(() => {
      const data = generateMockTransactions(75);
      setTransactions(data);
      setFilteredTransactions(data);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(data.length / prev.itemsPerPage)
      }));
      setLoading(false);
      prepareChartData(data);
    }, 1000);
  }, []);
  
  // Apply filters when filter state changes
  useEffect(() => {
    if (transactions.length > 0) {
      applyFilters();
    }
  }, [filters, searchTerm, transactions]);
  
  // Update charts when filtered data or active tab changes
  useEffect(() => {
    if (activeTab === 'analytics' && filteredTransactions.length > 0) {
      renderCharts();
    }
  }, [filteredTransactions, activeTab]);
  
  // Clean up charts when component unmounts
  useEffect(() => {
    return () => {
      if (incomeChartInstance.current) {
        incomeChartInstance.current.destroy();
      }
      if (expensesChartInstance.current) {
        expensesChartInstance.current.destroy();
      }
      if (balanceChartInstance.current) {
        balanceChartInstance.current.destroy();
      }
      if (transactionTypeChartInstance.current) {
        transactionTypeChartInstance.current.destroy();
      }
      if (incomeExpenseChartInstance.current) {
        incomeExpenseChartInstance.current.destroy();
      }
    };
  }, []);

  // Prepare chart data
  const prepareChartData = (data) => {
    // Group by month
    const months = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 0; i < 12; i++) {
      const month = subMonths(now, i);
      const monthKey = format(month, 'MMM yyyy');
      months[monthKey] = {
        income: 0,
        expenses: 0,
        balance: 0,
        date: month
      };
    }
    
    // Aggregate data
    data.forEach(tx => {
      const txDate = parseISO(tx.date);
      const monthKey = format(txDate, 'MMM yyyy');
      
      // Only process transactions from the last 12 months
      if (txDate >= subMonths(now, 12)) {
        if (!months[monthKey]) {
          months[monthKey] = {
            income: 0,
            expenses: 0,
            balance: 0,
            date: txDate
          };
        }
        
        if (tx.amount > 0) {
          months[monthKey].income += tx.amount;
        } else {
          months[monthKey].expenses += Math.abs(tx.amount);
        }
        
        months[monthKey].balance += tx.amount;
      }
    });
    
    // Convert to arrays and sort by date
    const monthsArray = Object.entries(months)
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => a.date - b.date);
    
    setChartData({
      income: monthsArray.map(m => ({ label: m.label, value: m.income })),
      expenses: monthsArray.map(m => ({ label: m.label, value: m.expenses })),
      balance: monthsArray.map(m => ({ label: m.label, value: m.balance }))
    });
  };
  
  // Apply filters to transactions
  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(term) ||
        tx.reference.toLowerCase().includes(term) ||
        tx.type.toLowerCase().includes(term) ||
        (tx.method && tx.method.toLowerCase().includes(term))
      );
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = subDays(now, 1);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        case 'quarter':
          startDate = subDays(now, 90);
          break;
        case 'year':
          startDate = subDays(now, 365);
          break;
        case 'custom':
          if (filters.customStartDate && filters.customEndDate) {
            const start = new Date(filters.customStartDate);
            const end = new Date(filters.customEndDate);
            end.setHours(23, 59, 59, 999); // End of day
            
            filtered = filtered.filter(tx => {
              const txDate = new Date(tx.date);
              return isWithinInterval(txDate, { start, end });
            });
          }
          break;
        default:
          startDate = null;
      }
      
      if (startDate && filters.dateRange !== 'custom') {
        filtered = filtered.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= startDate;
        });
      }
    }
    
    // Apply type filters
    if (filters.types.length > 0) {
      filtered = filtered.filter(tx => filters.types.includes(tx.type));
    }
    
    // Apply status filters
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(tx => filters.statuses.includes(tx.status));
    }
    
    // Apply amount filters
    if (filters.minAmount !== '') {
      filtered = filtered.filter(tx => Math.abs(tx.amount) >= Number(filters.minAmount));
    }
    
    if (filters.maxAmount !== '') {
      filtered = filtered.filter(tx => Math.abs(tx.amount) <= Number(filters.maxAmount));
    }
    
    setFilteredTransactions(filtered);
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalPages: Math.ceil(filtered.length / prev.itemsPerPage)
    }));
  };
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle type filter toggle
  const handleTypeFilterToggle = (type) => {
    setFilters(prev => {
      const types = [...prev.types];
      
      if (types.includes(type)) {
        return {
          ...prev,
          types: types.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          types: [...types, type]
        };
      }
    });
  };
  
  // Handle status filter toggle
  const handleStatusFilterToggle = (status) => {
    setFilters(prev => {
      const statuses = [...prev.statuses];
      
      if (statuses.includes(status)) {
        return {
          ...prev,
          statuses: statuses.filter(s => s !== status)
        };
      } else {
        return {
          ...prev,
          statuses: [...statuses, status]
        };
      }
    });
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      types: [],
      statuses: [],
      minAmount: '',
      maxAmount: '',
    });
    setSearchTerm('');
  };
  
  // Get paginated transactions
  const getPaginatedTransactions = () => {
    const { currentPage, itemsPerPage } = pagination;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    return filteredTransactions.slice(start, end);
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
  
  // Show transaction details
  const showTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };
  
  // Handle export
  const handleExport = (format) => {
    setExportFormat(format);
    alert(`Exporting transactions in ${format.toUpperCase()} format...`);
    // In a real app, this would trigger the download
  };
  
  // Render charts
  const renderCharts = () => {
    // Destroy previous chart instances
    if (incomeChartInstance.current) {
      incomeChartInstance.current.destroy();
    }
    if (expensesChartInstance.current) {
      expensesChartInstance.current.destroy();
    }
    if (balanceChartInstance.current) {
      balanceChartInstance.current.destroy();
    }
    if (transactionTypeChartInstance.current) {
      transactionTypeChartInstance.current.destroy();
    }
    if (incomeExpenseChartInstance.current) {
      incomeExpenseChartInstance.current.destroy();
    }
    
    // Only proceed if the refs exist
    if (incomeChartRef.current && expensesChartRef.current && balanceChartRef.current && 
        transactionTypeChartRef.current && incomeExpenseChartRef.current) {
      
      // Income Chart
      incomeChartInstance.current = new Chart(incomeChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.income.map(item => item.label),
          datasets: [{
            label: 'Income',
            data: chartData.income.map(item => item.value),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Income'
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `€${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
              }
            }
          }
        }
      });
      
      // Expenses Chart
      expensesChartInstance.current = new Chart(expensesChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.expenses.map(item => item.label),
          datasets: [{
            label: 'Expenses',
            data: chartData.expenses.map(item => item.value),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Expenses'
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `€${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
              }
            }
          }
        }
      });
      
      // Balance Chart
      balanceChartInstance.current = new Chart(balanceChartRef.current, {
        type: 'line',
        data: {
          labels: chartData.balance.map(item => item.label),
          datasets: [{
            label: 'Net Balance',
            data: chartData.balance.map(item => item.value),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Balance'
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `€${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            y: {
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
              }
            }
          }
        }
      });
      
      // Transaction Type Distribution Chart
      const typeData = {};
      filteredTransactions.forEach(tx => {
        if (!typeData[tx.type]) {
          typeData[tx.type] = 0;
        }
        typeData[tx.type]++;
      });
      
      const typeColors = {
        deposit: 'rgba(40, 167, 69, 0.7)',
        withdrawal: 'rgba(255, 193, 7, 0.7)',
        purchase: 'rgba(13, 110, 253, 0.7)',
        winning: 'rgba(23, 162, 184, 0.7)',
        refund: 'rgba(108, 117, 125, 0.7)',
        fee: 'rgba(220, 53, 69, 0.7)'
      };
      
      transactionTypeChartInstance.current = new Chart(transactionTypeChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(typeData).map(key => key.charAt(0).toUpperCase() + key.slice(1)),
          datasets: [{
            data: Object.values(typeData),
            backgroundColor: Object.keys(typeData).map(key => typeColors[key] || 'rgba(0, 0, 0, 0.2)'),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Transaction Type Distribution'
            },
            legend: {
              position: 'right'
            }
          }
        }
      });
      
      // Income vs Expenses Chart
      const monthlyData = {};
      
      // Initialize months
      chartData.income.forEach(item => {
        monthlyData[item.label] = {
          income: item.value,
          expenses: 0
        };
      });
      
      chartData.expenses.forEach(item => {
        if (monthlyData[item.label]) {
          monthlyData[item.label].expenses = item.value;
        } else {
          monthlyData[item.label] = {
            income: 0,
            expenses: item.value
          };
        }
      });
      
      const labels = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });
      
      incomeExpenseChartInstance.current = new Chart(incomeExpenseChartRef.current, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Income',
              data: labels.map(label => monthlyData[label].income),
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Expenses',
              data: labels.map(label => monthlyData[label].expenses),
              backgroundColor: 'rgba(255, 99, 132, 0.7)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Income vs Expenses'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: false
            },
            y: {
              stacked: false,
              ticks: {
                callback: function(value) {
                  return `€${value}`;
                }
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
        <p className="mt-3">Loading transaction history...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Transaction History</h1>
        <div>
          <Dropdown className="d-inline-block me-2">
            <Dropdown.Toggle variant="outline-secondary" id="export-dropdown">
              <FaFileExport className="me-2" /> Export
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleExport('pdf')}>
                PDF Document
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('csv')}>
                CSV Spreadsheet
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleExport('excel')}>
                Excel Spreadsheet
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => window.print()}>
                <FaPrint className="me-2" /> Print
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Link to="/wallet" className="btn btn-outline-primary">
            Back to Wallet
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="list" title="Transaction List">
          <Card className="mb-4">
            <Card.Body>
              {/* Search and Filters */}
              <Row className="mb-4 align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search Transactions</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search by description or reference..."
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Date Range</Form.Label>
                    <Form.Select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="quarter">Last 90 Days</option>
                      <option value="year">Last 365 Days</option>
                      <option value="custom">Custom Range</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <div className="d-flex justify-content-end">
                    <Dropdown className="me-2">
                      <Dropdown.Toggle variant="outline-primary" id="filter-dropdown">
                        <FaFilter className="me-2" /> Filters
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="p-3" style={{ width: '300px', maxHeight: '400px', overflow: 'auto' }}>
                        <h6>Transaction Types</h6>
                        <div className="mb-3">
                          {['deposit', 'withdrawal', 'purchase', 'winning', 'refund', 'fee'].map(type => (
                            <Form.Check
                              key={type}
                              type="checkbox"
                              id={`type-${type}`}
                              label={type.charAt(0).toUpperCase() + type.slice(1)}
                              checked={filters.types.includes(type)}
                              onChange={() => handleTypeFilterToggle(type)}
                              className="mb-1"
                            />
                          ))}
                        </div>
                        
                        <h6>Transaction Status</h6>
                        <div className="mb-3">
                          {['completed', 'pending', 'failed', 'cancelled'].map(status => (
                            <Form.Check
                              key={status}
                              type="checkbox"
                              id={`status-${status}`}
                              label={status.charAt(0).toUpperCase() + status.slice(1)}
                              checked={filters.statuses.includes(status)}
                              onChange={() => handleStatusFilterToggle(status)}
                              className="mb-1"
                            />
                          ))}
                        </div>
                        
                        <h6>Amount Range</h6>
                        <Row className="mb-3">
                          <Col>
                            <Form.Control
                              type="number"
                              placeholder="Min €"
                              value={filters.minAmount}
                              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                            />
                          </Col>
                          <Col>
                            <Form.Control
                              type="number"
                              placeholder="Max €"
                              value={filters.maxAmount}
                              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                            />
                          </Col>
                        </Row>
                        
                        <div className="d-grid">
                          <Button variant="outline-secondary" onClick={clearFilters}>
                            Clear All Filters
                          </Button>
                        </div>
                      </Dropdown.Menu>
                    </Dropdown>
                    
                    <Button variant="outline-dark" onClick={clearFilters}>Reset</Button>
                  </div>
                </Col>
              </Row>
              
              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.customStartDate}
                        onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={filters.customEndDate}
                        onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              )}
              
              {/* Filter Summary */}
              {(filters.types.length > 0 || filters.statuses.length > 0 || filters.minAmount || filters.maxAmount || searchTerm || filters.dateRange !== 'all') && (
                <div className="mb-3 p-2 bg-light rounded">
                  <div className="d-flex align-items-center">
                    <FaFilter className="me-2 text-primary" />
                    <strong>Active Filters:</strong>
                    <div className="ms-2">
                      {filters.dateRange !== 'all' && (
                        <Badge bg="info" className="me-2">
                          Date: {filters.dateRange === 'custom' ? 'Custom Range' : filters.dateRange}
                        </Badge>
                      )}
                      
                      {filters.types.map(type => (
                        <Badge key={type} bg={getTransactionBadge(type)} className="me-2">
                          {type}
                        </Badge>
                      ))}
                      
                      {filters.statuses.map(status => (
                        <Badge key={status} bg="secondary" className="me-2">
                          {status}
                        </Badge>
                      ))}
                      
                      {filters.minAmount && (
                        <Badge bg="dark" className="me-2">
                          Min: €{filters.minAmount}
                        </Badge>
                      )}
                      
                      {filters.maxAmount && (
                        <Badge bg="dark" className="me-2">
                          Max: €{filters.maxAmount}
                        </Badge>
                      )}
                      
                      {searchTerm && (
                        <Badge bg="primary" className="me-2">
                          Search: {searchTerm}
                        </Badge>
                      )}
                    </div>
                    <Button variant="link" size="sm" onClick={clearFilters} className="ms-auto">
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Transactions Table */}
              {filteredTransactions.length === 0 ? (
                <Alert variant="info">
                  <FaExclamationTriangle className="me-2" />
                  No transactions found matching your filters.
                </Alert>
              ) : (
                <>
                  <div className="mb-3">
                    <small className="text-muted">
                      Showing {getPaginatedTransactions().length} of {filteredTransactions.length} transactions
                    </small>
                  </div>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th className="text-end">Amount</th>
                        <th>Status</th>
                        <th className="text-center">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedTransactions().map(transaction => (
                        <tr 
                          key={transaction.id}
                          className={transaction.amount >= 0 ? 'border-start border-3 border-success' : 'border-start border-3 border-danger'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => showTransactionDetails(transaction)}
                        >
                          <td>{format(parseISO(transaction.date), 'dd MMM yyyy HH:mm')}</td>
                          <td><small className="text-muted">{transaction.reference}</small></td>
                          <td>{transaction.description}</td>
                          <td>
                            <Badge bg={getTransactionBadge(transaction.type)}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </Badge>
                          </td>
                          <td className={`text-end fw-bold ${transaction.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatAmount(transaction.amount)}
                          </td>
                          <td>
                            <Badge 
                              bg={
                                transaction.status === 'completed' 
                                  ? 'success' 
                                  : transaction.status === 'pending' 
                                    ? 'warning' 
                                    : transaction.status === 'failed' 
                                      ? 'danger' 
                                      : 'secondary'
                              }
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button 
                              variant="link" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                showTransactionDetails(transaction);
                              }}
                            >
                              <FaInfoCircle />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div>
                        <Form.Select 
                          className="d-inline-block" 
                          style={{ width: 'auto' }}
                          value={pagination.itemsPerPage}
                          onChange={(e) => setPagination(prev => ({
                            ...prev,
                            itemsPerPage: Number(e.target.value),
                            totalPages: Math.ceil(filteredTransactions.length / Number(e.target.value)),
                            currentPage: 1
                          }))}
                        >
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </Form.Select>
                      </div>
                      
                      <ul className="pagination mb-0">
                        <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                          <Button 
                            variant="link" 
                            className="page-link"
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.currentPage === 1}
                          >
                            First
                          </Button>
                        </li>
                        <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                          <Button 
                            variant="link" 
                            className="page-link"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                          >
                            Previous
                          </Button>
                        </li>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNumber;
                          
                          if (pagination.totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (pagination.currentPage >= pagination.totalPages - 2) {
                            pageNumber = pagination.totalPages - 4 + i;
                          } else {
                            pageNumber = pagination.currentPage - 2 + i;
                          }
                          
                          return (
                            <li key={i} className={`page-item ${pageNumber === pagination.currentPage ? 'active' : ''}`}>
                              <Button 
                                variant="link" 
                                className="page-link"
                                onClick={() => handlePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </Button>
                            </li>
                          );
                        })}
                        
                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                          <Button 
                            variant="link" 
                            className="page-link"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                          >
                            Next
                          </Button>
                        </li>
                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                          <Button 
                            variant="link" 
                            className="page-link"
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.currentPage === pagination.totalPages}
                          >
                            Last
                          </Button>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="analytics" title="Financial Analytics">
          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-4">Financial Overview</h4>
              
              <Row>
                <Col lg={4} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Income Summary</h5>
                        <Badge bg="success" className="p-2">
                          €{chartData.income.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
                        </Badge>
                      </div>
                      <canvas ref={incomeChartRef} height="220"></canvas>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={4} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Expense Summary</h5>
                        <Badge bg="danger" className="p-2">
                          €{chartData.expenses.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
                        </Badge>
                      </div>
                      <canvas ref={expensesChartRef} height="220"></canvas>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={4} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Balance Trend</h5>
                        <Badge bg="primary" className="p-2">
                          Net: €{chartData.balance.reduce((sum, item) => sum + item.value, 0).toFixed(2)}
                        </Badge>
                      </div>
                      <canvas ref={balanceChartRef} height="220"></canvas>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Row>
                <Col lg={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Transaction Type Distribution</h5>
                      <div style={{ height: '300px' }}>
                        <canvas ref={transactionTypeChartRef}></canvas>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col lg={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Income vs Expenses</h5>
                      <div style={{ height: '300px' }}>
                        <canvas ref={incomeExpenseChartRef}></canvas>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              {/* Summary stats */}
              <Row>
                <Col md={3} className="mb-4">
                  <Card className="text-center h-100 border-success">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Total Income</h6>
                      <h4 className="text-success">
                        €{filteredTransactions
                          .filter(tx => tx.amount > 0)
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)}
                      </h4>
                      <div className="small text-muted mt-2">
                        {filteredTransactions.filter(tx => tx.amount > 0).length} transactions
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                  <Card className="text-center h-100 border-danger">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Total Expenses</h6>
                      <h4 className="text-danger">
                        €{Math.abs(filteredTransactions
                          .filter(tx => tx.amount < 0)
                          .reduce((sum, tx) => sum + tx.amount, 0))
                          .toFixed(2)}
                      </h4>
                      <div className="small text-muted mt-2">
                        {filteredTransactions.filter(tx => tx.amount < 0).length} transactions
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                  <Card className="text-center h-100 border-info">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Total Winnings</h6>
                      <h4 className="text-info">
                        €{filteredTransactions
                          .filter(tx => tx.type === 'winning')
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)}
                      </h4>
                      <div className="small text-muted mt-2">
                        {filteredTransactions.filter(tx => tx.type === 'winning').length} winnings
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={3} className="mb-4">
                  <Card className="text-center h-100 border-primary">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Net Balance</h6>
                      <h4 className={filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0) >= 0 ? 'text-success' : 'text-danger'}>
                        €{filteredTransactions
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)}
                      </h4>
                      <div className="small text-muted mt-2">
                        {filteredTransactions.length} total transactions
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="lotteryStats" title="Lottery Statistics">
          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-4">Lottery Participation & Winnings</h4>
              
              {/* Lottery participation stats */}
              <Row>
                {['EuroMillions', 'EuroJackpot', 'PowerBall', 'MegaMillions'].map(lottery => {
                  const lotteryTx = filteredTransactions.filter(tx => 
                    (tx.type === 'purchase' || tx.type === 'winning') && 
                    tx.details.lottery === lottery
                  );
                  
                  const purchases = lotteryTx.filter(tx => tx.type === 'purchase');
                  const winnings = lotteryTx.filter(tx => tx.type === 'winning');
                  
                  const spent = Math.abs(purchases.reduce((sum, tx) => sum + tx.amount, 0));
                  const won = winnings.reduce((sum, tx) => sum + tx.amount, 0);
                  const totalTickets = purchases.reduce((sum, tx) => sum + (tx.details.tickets || 0), 0);
                  
                  const roi = spent > 0 ? (won / spent * 100).toFixed(1) : 0;
                  
                  return (
                    <Col lg={6} key={lottery} className="mb-4">
                      <Card className="h-100">
                        <Card.Header className="bg-light">
                          <h5 className="mb-0">{lottery}</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col sm={6} className="mb-3">
                              <div className="border rounded p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div>Total Spent</div>
                                  <Badge bg="danger" className="p-2">€{spent.toFixed(2)}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div>Total Won</div>
                                  <Badge bg="success" className="p-2">€{won.toFixed(2)}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div>Total Tickets</div>
                                  <Badge bg="info" className="p-2">{totalTickets}</Badge>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>ROI</div>
                                  <Badge 
                                    bg={roi >= 100 ? 'success' : roi >= 50 ? 'warning' : 'danger'} 
                                    className="p-2"
                                  >
                                    {roi}%
                                  </Badge>
                                </div>
                              </div>
                            </Col>
                            
                            <Col sm={6} className="mb-3">
                              <div className="border rounded p-3 h-100">
                                <h6 className="mb-3">Win Categories</h6>
                                {winnings.length === 0 ? (
                                  <div className="text-center text-muted">
                                    <small>No winnings yet</small>
                                  </div>
                                ) : (
                                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {Array.from(new Set(winnings.map(tx => tx.details.matchCategory)))
                                      .sort()
                                      .map(category => {
                                        const categoryWinnings = winnings.filter(tx => tx.details.matchCategory === category);
                                        const totalAmount = categoryWinnings.reduce((sum, tx) => sum + tx.amount, 0);
                                        
                                        return (
                                          <div key={category} className="d-flex justify-content-between align-items-center mb-2">
                                            <small>{category}</small>
                                            <div>
                                              <Badge bg="secondary" className="me-1">
                                                {categoryWinnings.length}
                                              </Badge>
                                              <Badge bg="success">
                                                €{totalAmount.toFixed(2)}
                                              </Badge>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            </Col>
                          </Row>
                          
                          <Row>
                            <Col>
                              <div className="border-top pt-3 d-flex align-items-center">
                                <div className="me-3">
                                  <strong>Net Result:</strong>
                                </div>
                                <h5 className={won - spent >= 0 ? 'text-success mb-0' : 'text-danger mb-0'}>
                                  €{(won - spent).toFixed(2)}
                                </h5>
                                <div className="ms-auto">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    as={Link}
                                    to={`/lotteries/${lottery.toLowerCase()}`}
                                  >
                                    View Lottery
                                  </Button>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
              
              {/* Recent winnings */}
              <h5 className="mb-3">Recent Winnings</h5>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lottery</th>
                    <th>Category</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions
                    .filter(tx => tx.type === 'winning')
                    .slice(0, 5)
                    .map(tx => (
                      <tr key={tx.id}>
                        <td>{format(parseISO(tx.date), 'dd MMM yyyy')}</td>
                        <td>{tx.details.lottery}</td>
                        <td>{tx.details.matchCategory}</td>
                        <td className="text-end text-success fw-bold">€{tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    
                  {filteredTransactions.filter(tx => tx.type === 'winning').length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-3">
                        No winnings to display
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Transaction Details Modal */}
      <Modal 
        show={showTransactionModal} 
        onHide={() => setShowTransactionModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Transaction Details
            {selectedTransaction && (
              <Badge 
                bg={getTransactionBadge(selectedTransaction.type)}
                className="ms-2"
              >
                {selectedTransaction?.type.charAt(0).toUpperCase() + selectedTransaction?.type.slice(1)}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTransaction && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Transaction Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td className="fw-bold">Reference</td>
                            <td>{selectedTransaction.reference}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Date & Time</td>
                            <td>{formatDate(selectedTransaction.date)}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Description</td>
                            <td>{selectedTransaction.description}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Status</td>
                            <td>
                              <Badge 
                                bg={
                                  selectedTransaction.status === 'completed' 
                                    ? 'success' 
                                    : selectedTransaction.status === 'pending' 
                                      ? 'warning' 
                                      : selectedTransaction.status === 'failed' 
                                        ? 'danger' 
                                        : 'secondary'
                                }
                              >
                                {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                              </Badge>
                            </td>
                          </tr>
                          {selectedTransaction.method && (
                            <tr>
                              <td className="fw-bold">Payment Method</td>
                              <td>{selectedTransaction.method.replace('_', ' ')}</td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card 
                    className={`h-100 border-${selectedTransaction.amount >= 0 ? 'success' : 'danger'}`}
                  >
                    <Card.Body className="d-flex flex-column justify-content-between">
                      <div>
                        <h5 className="mb-3">Financial Details</h5>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="fw-bold">Amount:</div>
                          <h3 className={selectedTransaction.amount >= 0 ? 'text-success mb-0' : 'text-danger mb-0'}>
                            {formatAmount(selectedTransaction.amount)}
                          </h3>
                        </div>
                        
                        {selectedTransaction.details.fee > 0 && (
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="fw-bold">Fee:</div>
                            <div className="text-danger">
                              €{selectedTransaction.details.fee.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {(selectedTransaction.type === 'purchase' || selectedTransaction.type === 'winning') && (
                        <div className="p-3 bg-light rounded mt-4">
                          <h6>Lottery Information</h6>
                          <Table borderless size="sm" className="mb-0">
                            <tbody>
                              <tr>
                                <td>Game:</td>
                                <td>{selectedTransaction.details.lottery}</td>
                              </tr>
                              {selectedTransaction.type === 'purchase' && (
                                <tr>
                                  <td>Tickets:</td>
                                  <td>{selectedTransaction.details.tickets}</td>
                                </tr>
                              )}
                              {selectedTransaction.type === 'winning' && (
                                <tr>
                                  <td>Category:</td>
                                  <td>{selectedTransaction.details.matchCategory}</td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <div className="border-top pt-3 d-flex justify-content-between">
                <Link to={`/transaction-receipt/${selectedTransaction.id}`}>
                  <Button variant="outline-primary">
                    <FaFileInvoice className="me-2" /> View Receipt
                  </Button>
                </Link>
                
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" id="export-dropdown">
                    <FaFileExport className="me-2" /> Export
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleExport('pdf')}>
                      PDF Receipt
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleExport('email')}>
                      Email Receipt
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => window.print()}>
                      <FaPrint className="me-2" /> Print
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TransactionHistory;