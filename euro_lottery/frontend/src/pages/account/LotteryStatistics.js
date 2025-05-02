import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Form, Nav, Spinner, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaTrophy, FaTicketAlt, FaChartBar, FaCalendarAlt, FaRegStar, FaStar } from 'react-icons/fa';
import Chart from 'chart.js/auto';
import { format, parseISO, differenceInDays } from 'date-fns';

// Mock data generator for lottery play history
const generateLotteryHistory = () => {
  const lotteries = [
    { id: 1, name: 'EuroMillions', type: 'euromillions', color: '#4A3AFF' },
    { id: 2, name: 'EuroJackpot', type: 'eurojackpot', color: '#FF4E50' },
    { id: 3, name: 'PowerBall', type: 'powerball', color: '#00C853' },
    { id: 4, name: 'MegaMillions', type: 'megamillions', color: '#FFBD00' }
  ];
  
  const now = new Date();
  const history = [];
  const favoriteNumbers = {};
  const matchesByCategory = {};
  let totalTickets = 0;
  let totalWinningTickets = 0;
  let totalSpent = 0;
  let totalWon = 0;
  
  // Generate random tickets for the past year
  for (let i = 0; i < 200; i++) {
    const lottery = lotteries[Math.floor(Math.random() * lotteries.length)];
    const daysAgo = Math.floor(Math.random() * 365);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Generate random numbers
    const mainNumbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 50) + 1);
    const extraNumbers = Array.from({ length: 2 }, () => Math.floor(Math.random() * 12) + 1);
    
    // Track favorite numbers
    mainNumbers.forEach(num => {
      if (!favoriteNumbers[num]) {
        favoriteNumbers[num] = 0;
      }
      favoriteNumbers[num]++;
    });
    
    // Determine if winning (20% chance)
    const isWinning = Math.random() < 0.2;
    let matchCategory = null;
    let winAmount = 0;
    
    if (isWinning) {
      // Generate random match category and winning amount
      const matchTypes = [
        { category: 'Match 5+2', probability: 0.01, minAmount: 1000000, maxAmount: 100000000 },
        { category: 'Match 5+1', probability: 0.03, minAmount: 100000, maxAmount: 500000 },
        { category: 'Match 5', probability: 0.05, minAmount: 10000, maxAmount: 100000 },
        { category: 'Match 4+2', probability: 0.1, minAmount: 1000, maxAmount: 5000 },
        { category: 'Match 4+1', probability: 0.15, minAmount: 100, maxAmount: 1000 },
        { category: 'Match 4', probability: 0.18, minAmount: 50, maxAmount: 200 },
        { category: 'Match 3+2', probability: 0.22, minAmount: 30, maxAmount: 100 },
        { category: 'Match 3+1', probability: 0.3, minAmount: 10, maxAmount: 50 },
        { category: 'Match 3', probability: 0.4, minAmount: 5, maxAmount: 20 },
        { category: 'Match 2+2', probability: 0.5, minAmount: 5, maxAmount: 10 },
        { category: 'Match 2+1', probability: 0.7, minAmount: 3, maxAmount: 8 },
        { category: 'Match 2', probability: 0.9, minAmount: 2, maxAmount: 5 }
      ];
      
      const rand = Math.random();
      let cumulativeProbability = 0;
      
      for (const match of matchTypes) {
        cumulativeProbability += match.probability;
        if (rand < cumulativeProbability) {
          matchCategory = match.category;
          winAmount = Math.floor(Math.random() * (match.maxAmount - match.minAmount + 1)) + match.minAmount;
          break;
        }
      }
      
      // Default if no match was selected
      if (!matchCategory) {
        matchCategory = 'Match 2';
        winAmount = Math.floor(Math.random() * 3) + 2;
      }
      
      // Track matches by category
      if (!matchesByCategory[matchCategory]) {
        matchesByCategory[matchCategory] = { count: 0, totalAmount: 0 };
      }
      matchesByCategory[matchCategory].count++;
      matchesByCategory[matchCategory].totalAmount += winAmount;
      
      totalWinningTickets++;
      totalWon += winAmount;
    }
    
    const ticketPrice = 2.5;
    totalSpent += ticketPrice;
    totalTickets++;
    
    history.push({
      id: `ticket-${i}`,
      lotteryId: lottery.id,
      lotteryName: lottery.name,
      lotteryType: lottery.type,
      lotteryColor: lottery.color,
      date: date.toISOString(),
      mainNumbers,
      extraNumbers,
      isWinning,
      matchCategory,
      winAmount,
      ticketPrice
    });
  }
  
  // Sort history by date (recent first)
  history.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Get top 5 favorite numbers
  const favoriteNumbersArray = Object.entries(favoriteNumbers)
    .map(([number, count]) => ({ number: parseInt(number), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Get winning statistics by category
  const matchesArray = Object.entries(matchesByCategory)
    .map(([category, data]) => ({
      category,
      count: data.count,
      totalAmount: data.totalAmount,
      averageAmount: data.totalAmount / data.count
    }))
    .sort((a, b) => {
      // Sort by match level (5+2 first, then 5+1, etc.)
      const matchLevelA = parseInt(a.category.match(/Match (\d)\+?(\d)?/)[1]);
      const matchLevelB = parseInt(b.category.match(/Match (\d)\+?(\d)?/)[1]);
      
      if (matchLevelA !== matchLevelB) {
        return matchLevelB - matchLevelA;
      }
      
      const extraA = a.category.includes('+') ? parseInt(a.category.match(/\+(\d)/)[1]) : 0;
      const extraB = b.category.includes('+') ? parseInt(b.category.match(/\+(\d)/)[1]) : 0;
      
      return extraB - extraA;
    });
  
  return {
    tickets: history,
    favoriteNumbers: favoriteNumbersArray,
    winningStats: matchesArray,
    summary: {
      totalTickets,
      totalWinningTickets,
      totalSpent,
      totalWon,
      winRate: (totalWinningTickets / totalTickets) * 100,
      roi: (totalWon / totalSpent) * 100
    }
  };
};

const LotteryStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedLottery, setSelectedLottery] = useState('all');
  const [lotteryData, setLotteryData] = useState(null);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Chart refs
  const winningsChartRef = useRef(null);
  const ticketsChartRef = useRef(null);
  const lotteryDistributionRef = useRef(null);
  const numberFrequencyRef = useRef(null);
  const monthlyActivityRef = useRef(null);
  
  // Charts
  const winningsChartInstance = useRef(null);
  const ticketsChartInstance = useRef(null);
  const lotteryDistributionInstance = useRef(null);
  const numberFrequencyInstance = useRef(null);
  const monthlyActivityInstance = useRef(null);
  
  // Load data on mount
  useEffect(() => {
    setTimeout(() => {
      const data = generateLotteryHistory();
      setLotteryData(data);
      setFilteredTickets(data.tickets);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Apply filters when they change
  useEffect(() => {
    if (!lotteryData) return;
    
    let filtered = [...lotteryData.tickets];
    
    // Filter by lottery
    if (selectedLottery !== 'all') {
      filtered = filtered.filter(ticket => ticket.lotteryType === selectedLottery);
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999); // End of day
            
            filtered = filtered.filter(ticket => {
              const ticketDate = new Date(ticket.date);
              return ticketDate >= start && ticketDate <= end;
            });
          }
          break;
        default:
          startDate = null;
      }
      
      if (startDate && dateRange !== 'custom') {
        filtered = filtered.filter(ticket => {
          const ticketDate = new Date(ticket.date);
          return ticketDate >= startDate;
        });
      }
    }
    
    setFilteredTickets(filtered);
  }, [lotteryData, selectedLottery, dateRange, customStartDate, customEndDate]);
  
  // Update charts when data changes
  useEffect(() => {
    if (!loading && activeTab === 'charts') {
      renderCharts();
    }
  }, [filteredTickets, activeTab, loading]);
  
  // Clean up charts when component unmounts
  useEffect(() => {
    return () => {
      if (winningsChartInstance.current) {
        winningsChartInstance.current.destroy();
      }
      if (ticketsChartInstance.current) {
        ticketsChartInstance.current.destroy();
      }
      if (lotteryDistributionInstance.current) {
        lotteryDistributionInstance.current.destroy();
      }
      if (numberFrequencyInstance.current) {
        numberFrequencyInstance.current.destroy();
      }
      if (monthlyActivityInstance.current) {
        monthlyActivityInstance.current.destroy();
      }
    };
  }, []);
  
  // Calculate summary stats
  const calculateSummary = () => {
    if (filteredTickets.length === 0) {
      return {
        totalTickets: 0,
        totalWinningTickets: 0,
        totalSpent: 0,
        totalWon: 0,
        winRate: 0,
        roi: 0
      };
    }
    
    const totalTickets = filteredTickets.length;
    const totalWinningTickets = filteredTickets.filter(ticket => ticket.isWinning).length;
    const totalSpent = filteredTickets.reduce((sum, ticket) => sum + ticket.ticketPrice, 0);
    const totalWon = filteredTickets.reduce((sum, ticket) => sum + (ticket.winAmount || 0), 0);
    
    return {
      totalTickets,
      totalWinningTickets,
      totalSpent,
      totalWon,
      winRate: (totalWinningTickets / totalTickets) * 100,
      roi: (totalWon / totalSpent) * 100
    };
  };
  
  // Get favorite numbers from filtered tickets
  const getFavoriteNumbers = () => {
    const numbers = {};
    
    filteredTickets.forEach(ticket => {
      ticket.mainNumbers.forEach(num => {
        if (!numbers[num]) {
          numbers[num] = 0;
        }
        numbers[num]++;
      });
    });
    
    return Object.entries(numbers)
      .map(([number, count]) => ({ number: parseInt(number), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };
  
  // Get winning stats by category
  const getWinningStats = () => {
    const matches = {};
    
    filteredTickets.filter(ticket => ticket.isWinning).forEach(ticket => {
      if (!matches[ticket.matchCategory]) {
        matches[ticket.matchCategory] = { count: 0, totalAmount: 0 };
      }
      matches[ticket.matchCategory].count++;
      matches[ticket.matchCategory].totalAmount += ticket.winAmount;
    });
    
    return Object.entries(matches)
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalAmount: data.totalAmount,
        averageAmount: data.totalAmount / data.count
      }))
      .sort((a, b) => {
        // Sort by match level (5+2 first, then 5+1, etc.)
        const matchLevelA = parseInt(a.category.match(/Match (\d)\+?(\d)?/)[1]);
        const matchLevelB = parseInt(b.category.match(/Match (\d)\+?(\d)?/)[1]);
        
        if (matchLevelA !== matchLevelB) {
          return matchLevelB - matchLevelA;
        }
        
        const extraA = a.category.includes('+') ? parseInt(a.category.match(/\+(\d)/)[1]) : 0;
        const extraB = b.category.includes('+') ? parseInt(b.category.match(/\+(\d)/)[1]) : 0;
        
        return extraB - extraA;
      });
  };
  
  // Get tickets by lottery
  const getTicketsByLottery = () => {
    const lotteries = {};
    
    filteredTickets.forEach(ticket => {
      if (!lotteries[ticket.lotteryName]) {
        lotteries[ticket.lotteryName] = {
          count: 0,
          spent: 0,
          won: 0,
          winningTickets: 0,
          color: ticket.lotteryColor
        };
      }
      
      lotteries[ticket.lotteryName].count++;
      lotteries[ticket.lotteryName].spent += ticket.ticketPrice;
      
      if (ticket.isWinning) {
        lotteries[ticket.lotteryName].won += ticket.winAmount;
        lotteries[ticket.lotteryName].winningTickets++;
      }
    });
    
    return Object.entries(lotteries)
      .map(([name, data]) => ({
        name,
        count: data.count,
        spent: data.spent,
        won: data.won,
        winningTickets: data.winningTickets,
        winRate: (data.winningTickets / data.count) * 100,
        roi: (data.won / data.spent) * 100,
        color: data.color
      }))
      .sort((a, b) => b.count - a.count);
  };
  
  // Get monthly activity
  const getMonthlyActivity = () => {
    const months = {};
    
    filteredTickets.forEach(ticket => {
      const date = new Date(ticket.date);
      const monthKey = format(date, 'MMM yyyy');
      
      if (!months[monthKey]) {
        months[monthKey] = {
          totalTickets: 0,
          winningTickets: 0,
          spent: 0,
          won: 0,
          date
        };
      }
      
      months[monthKey].totalTickets++;
      months[monthKey].spent += ticket.ticketPrice;
      
      if (ticket.isWinning) {
        months[monthKey].winningTickets++;
        months[monthKey].won += ticket.winAmount;
      }
    });
    
    // Sort by date
    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.date - b.date);
  };
  
  // Render charts
  const renderCharts = () => {
    // Destroy previous charts
    if (winningsChartInstance.current) {
      winningsChartInstance.current.destroy();
    }
    if (ticketsChartInstance.current) {
      ticketsChartInstance.current.destroy();
    }
    if (lotteryDistributionInstance.current) {
      lotteryDistributionInstance.current.destroy();
    }
    if (numberFrequencyInstance.current) {
      numberFrequencyInstance.current.destroy();
    }
    if (monthlyActivityInstance.current) {
      monthlyActivityInstance.current.destroy();
    }
    
    // Only proceed if the refs exist
    if (!winningsChartRef.current || !ticketsChartRef.current || !lotteryDistributionRef.current || 
        !numberFrequencyRef.current || !monthlyActivityRef.current) {
      return;
    }
    
    // Prepare data for charts
    const winningStats = getWinningStats();
    const favoriteNumbers = getFavoriteNumbers();
    const ticketsByLottery = getTicketsByLottery();
    const monthlyActivity = getMonthlyActivity();
    
    // Winnings by category chart
    winningsChartInstance.current = new Chart(winningsChartRef.current, {
      type: 'bar',
      data: {
        labels: winningStats.map(stat => stat.category),
        datasets: [
          {
            label: 'Total Amount (€)',
            data: winningStats.map(stat => stat.totalAmount),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Number of Wins',
            data: winningStats.map(stat => stat.count),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Winnings by Category'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                if (label.includes('Amount')) {
                  return `${label}: €${context.parsed.y.toFixed(2)}`;
                }
                return `${label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Total Amount (€)'
            },
            ticks: {
              callback: function(value) {
                return `€${value}`;
              }
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Count'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    
    // Number frequency chart
    numberFrequencyInstance.current = new Chart(numberFrequencyRef.current, {
      type: 'bar',
      data: {
        labels: favoriteNumbers.map(num => num.number.toString()),
        datasets: [{
          label: 'Frequency',
          data: favoriteNumbers.map(num => num.count),
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Most Frequently Played Numbers'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        }
      }
    });
    
    // Lottery distribution chart
    lotteryDistributionInstance.current = new Chart(lotteryDistributionRef.current, {
      type: 'doughnut',
      data: {
        labels: ticketsByLottery.map(lottery => lottery.name),
        datasets: [{
          label: 'Tickets',
          data: ticketsByLottery.map(lottery => lottery.count),
          backgroundColor: ticketsByLottery.map(lottery => lottery.color),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Tickets by Lottery'
          },
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // Tickets and ROI chart
    ticketsChartInstance.current = new Chart(ticketsChartRef.current, {
      type: 'bar',
      data: {
        labels: ticketsByLottery.map(lottery => lottery.name),
        datasets: [
          {
            label: 'Tickets Purchased',
            data: ticketsByLottery.map(lottery => lottery.count),
            backgroundColor: ticketsByLottery.map(lottery => lottery.color),
            borderColor: ticketsByLottery.map(lottery => lottery.color),
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'ROI (%)',
            data: ticketsByLottery.map(lottery => lottery.roi),
            backgroundColor: 'rgba(153, 102, 255, 0.7)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Tickets and ROI by Lottery'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                if (label.includes('ROI')) {
                  return `${label}: ${context.parsed.y.toFixed(1)}%`;
                }
                return `${label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Tickets'
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'ROI (%)'
            },
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              callback: function(value) {
                return `${value}%`;
              }
            }
          }
        }
      }
    });
    
    // Monthly activity chart
    monthlyActivityInstance.current = new Chart(monthlyActivityRef.current, {
      type: 'line',
      data: {
        labels: monthlyActivity.map(month => month.month),
        datasets: [
          {
            label: 'Money Spent (€)',
            data: monthlyActivity.map(month => month.spent),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Money Won (€)',
            data: monthlyActivity.map(month => month.won),
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Tickets Purchased',
            data: monthlyActivity.map(month => month.totalTickets),
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Activity'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                if (label.includes('€')) {
                  return `${label}: €${context.parsed.y.toFixed(2)}`;
                }
                return `${label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: 'Amount (€)'
            },
            ticks: {
              callback: function(value) {
                return `€${value}`;
              }
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Tickets'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading lottery statistics...</p>
      </Container>
    );
  }
  
  // Calculate current summary statistics
  const summary = calculateSummary();
  const favoriteNumbers = getFavoriteNumbers();
  const winningStats = getWinningStats();
  const ticketsByLottery = getTicketsByLottery();
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Lottery Statistics</h1>
        <Link to="/my-tickets" className="btn btn-outline-primary">
          View My Tickets
        </Link>
      </div>
      
      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Filter Statistics</h5>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Lottery</Form.Label>
                <Form.Select
                  value={selectedLottery}
                  onChange={(e) => setSelectedLottery(e.target.value)}
                >
                  <option value="all">All Lotteries</option>
                  <option value="euromillions">EuroMillions</option>
                  <option value="eurojackpot">EuroJackpot</option>
                  <option value="powerball">PowerBall</option>
                  <option value="megamillions">MegaMillions</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Date Range</Form.Label>
                <Form.Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                  <option value="year">Last 365 Days</option>
                  <option value="custom">Custom Range</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <div className="d-flex align-items-end h-100 mb-3">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSelectedLottery('all');
                    setDateRange('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="w-100"
                >
                  Reset Filters
                </Button>
              </div>
            </Col>
          </Row>
          
          {dateRange === 'custom' && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {/* Tabs */}
      <Nav
        variant="tabs"
        activeKey={activeTab}
        onSelect={(eventKey) => setActiveTab(eventKey)}
        className="mb-4"
      >
        <Nav.Item>
          <Nav.Link eventKey="summary">
            <FaTrophy className="me-2" /> Summary
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="charts">
            <FaChartBar className="me-2" /> Charts
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="tickets">
            <FaTicketAlt className="me-2" /> Tickets
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="luckyNumbers">
            <FaStar className="me-2" /> Lucky Numbers
          </Nav.Link>
        </Nav.Item>
      </Nav>
      
      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <>
          <Row className="mb-4">
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 bg-light">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaTicketAlt size={28} className="text-primary" />
                  </div>
                  <h6 className="text-muted">Total Tickets</h6>
                  <h3>{summary.totalTickets}</h3>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 bg-light">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaTrophy size={28} className="text-success" />
                  </div>
                  <h6 className="text-muted">Winning Tickets</h6>
                  <h3>{summary.totalWinningTickets}</h3>
                  <Badge bg={summary.winRate >= 20 ? 'success' : 'warning'} className="mt-2">
                    {summary.winRate.toFixed(1)}% Win Rate
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 bg-light">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaCalendarAlt size={28} className="text-info" />
                  </div>
                  <h6 className="text-muted">Total Spent</h6>
                  <h3>€{summary.totalSpent.toFixed(2)}</h3>
                  <small className="text-muted">
                    Avg. €{(summary.totalSpent / summary.totalTickets).toFixed(2)} per ticket
                  </small>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3} sm={6} className="mb-4">
              <Card className="h-100 bg-light">
                <Card.Body className="text-center">
                  <div className="mb-3">
                    <FaRegStar size={28} className="text-warning" />
                  </div>
                  <h6 className="text-muted">Total Won</h6>
                  <h3>€{summary.totalWon.toFixed(2)}</h3>
                  <Badge 
                    bg={summary.roi >= 100 ? 'success' : summary.roi >= 50 ? 'warning' : 'danger'} 
                    className="mt-2"
                  >
                    {summary.roi.toFixed(1)}% ROI
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Lottery Participation</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong>Return on Investment</strong>
                      </div>
                      <div>
                        <Badge 
                          bg={summary.roi >= 100 ? 'success' : summary.roi >= 50 ? 'warning' : 'danger'} 
                          className="p-2"
                        >
                          {summary.roi.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <ProgressBar 
                      now={Math.min(summary.roi, 100)} 
                      variant={summary.roi >= 100 ? 'success' : summary.roi >= 50 ? 'warning' : 'danger'} 
                      style={{ height: '10px' }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <strong>Win Rate</strong>
                      </div>
                      <div>
                        <Badge 
                          bg={summary.winRate >= 20 ? 'success' : 'warning'} 
                          className="p-2"
                        >
                          {summary.winRate.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <ProgressBar 
                      now={summary.winRate} 
                      variant={summary.winRate >= 20 ? 'success' : 'warning'} 
                      style={{ height: '10px' }}
                    />
                  </div>
                  
                  <Table bordered>
                    <thead className="bg-light">
                      <tr>
                        <th>Lottery</th>
                        <th className="text-center">Tickets</th>
                        <th className="text-center">Winnings</th>
                        <th className="text-center">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketsByLottery.map(lottery => (
                        <tr key={lottery.name}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="me-2 rounded-circle" 
                                style={{ 
                                  width: '15px', 
                                  height: '15px', 
                                  backgroundColor: lottery.color 
                                }}
                              ></div>
                              {lottery.name}
                            </div>
                          </td>
                          <td className="text-center">
                            {lottery.count}
                            <small className="d-block text-muted">
                              (€{lottery.spent.toFixed(2)})
                            </small>
                          </td>
                          <td className="text-center">
                            {lottery.winningTickets}
                            <small className="d-block text-success">
                              €{lottery.won.toFixed(2)}
                            </small>
                          </td>
                          <td className="text-center">
                            <Badge 
                              bg={lottery.roi >= 100 ? 'success' : lottery.roi >= 50 ? 'warning' : 'danger'} 
                            >
                              {lottery.roi.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={6} className="mb-4">
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Winning Statistics</h5>
                </Card.Header>
                <Card.Body>
                  {winningStats.length > 0 ? (
                    <Table bordered>
                      <thead className="bg-light">
                        <tr>
                          <th>Prize Category</th>
                          <th className="text-center">Wins</th>
                          <th className="text-center">Total Amount</th>
                          <th className="text-center">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {winningStats.map(stat => (
                          <tr key={stat.category}>
                            <td>{stat.category}</td>
                            <td className="text-center">{stat.count}</td>
                            <td className="text-center text-success">€{stat.totalAmount.toFixed(2)}</td>
                            <td className="text-center">€{stat.averageAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                        
                        {/* Add a total row */}
                        <tr className="table-light fw-bold">
                          <td>Total</td>
                          <td className="text-center">
                            {winningStats.reduce((sum, stat) => sum + stat.count, 0)}
                          </td>
                          <td className="text-center text-success">
                            €{winningStats.reduce((sum, stat) => sum + stat.totalAmount, 0).toFixed(2)}
                          </td>
                          <td className="text-center">
                            €{(winningStats.reduce((sum, stat) => sum + stat.totalAmount, 0) / 
                               winningStats.reduce((sum, stat) => sum + stat.count, 0)).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">
                      <FaTrophy className="text-muted mb-3" size={32} />
                      <h5>No Winnings Yet</h5>
                      <p>Keep playing to see your winning statistics here.</p>
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <h6>Most Recent Wins</h6>
                    {filteredTickets.filter(ticket => ticket.isWinning).length > 0 ? (
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {filteredTickets
                          .filter(ticket => ticket.isWinning)
                          .slice(0, 5)
                          .map(ticket => (
                            <div 
                              key={ticket.id} 
                              className="d-flex justify-content-between align-items-center p-2 border-bottom"
                            >
                              <div>
                                <div>{ticket.lotteryName} - {ticket.matchCategory}</div>
                                <small className="text-muted">{formatDate(ticket.date)}</small>
                              </div>
                              <Badge bg="success" className="p-2">€{ticket.winAmount.toFixed(2)}</Badge>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-light rounded">
                        <small className="text-muted">No recent wins to display</small>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
      
      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <h5 className="mb-3">Winnings by Category</h5>
                <div style={{ height: '300px' }}>
                  <canvas ref={winningsChartRef}></canvas>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <h5 className="mb-3">Tickets and ROI by Lottery</h5>
                <div style={{ height: '300px' }}>
                  <canvas ref={ticketsChartRef}></canvas>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <h5 className="mb-3">Lottery Distribution</h5>
                <div style={{ height: '300px' }}>
                  <canvas ref={lotteryDistributionRef}></canvas>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <h5 className="mb-3">Frequently Played Numbers</h5>
                <div style={{ height: '300px' }}>
                  <canvas ref={numberFrequencyRef}></canvas>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={12} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-3">Monthly Activity</h5>
                <div style={{ height: '300px' }}>
                  <canvas ref={monthlyActivityRef}></canvas>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <Card>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Ticket History</h5>
              <div>
                <small className="text-muted">
                  Showing {filteredTickets.length} tickets
                </small>
              </div>
            </div>
            
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lottery</th>
                  <th>Numbers</th>
                  <th>Status</th>
                  <th className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.slice(0, 20).map(ticket => (
                  <tr key={ticket.id}>
                    <td>{formatDate(ticket.date)}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div 
                          className="me-2 rounded-circle" 
                          style={{ 
                            width: '10px', 
                            height: '10px', 
                            backgroundColor: ticket.lotteryColor 
                          }}
                        ></div>
                        {ticket.lotteryName}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div>
                          {ticket.mainNumbers.join(', ')}
                          {ticket.extraNumbers.length > 0 && (
                            <span className="text-muted"> | {ticket.extraNumbers.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {ticket.isWinning ? (
                        <Badge bg="success">
                          Winner ({ticket.matchCategory})
                        </Badge>
                      ) : (
                        <Badge bg="secondary">No Win</Badge>
                      )}
                    </td>
                    <td className="text-end">
                      {ticket.isWinning ? (
                        <span className="text-success fw-bold">
                          +€{ticket.winAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted">
                          -€{ticket.ticketPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <FaTicketAlt className="text-muted mb-3" size={32} />
                      <h5>No Tickets Found</h5>
                      <p>No tickets match your current filter criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            
            {filteredTickets.length > 20 && (
              <div className="text-center mt-3">
                <Button variant="outline-primary">
                  View All {filteredTickets.length} Tickets
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Lucky Numbers Tab */}
      {activeTab === 'luckyNumbers' && (
        <Row>
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Most Frequently Played Numbers</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="d-flex flex-wrap">
                    {favoriteNumbers.map(num => (
                      <div 
                        key={num.number} 
                        className="m-2 text-center"
                      >
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            backgroundColor: `rgba(74, 58, 255, ${0.3 + (0.7 * (num.count / favoriteNumbers[0].count))})`,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '18px'
                          }}
                        >
                          {num.number}
                        </div>
                        <small className="d-block text-muted">
                          {num.count} times
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-top pt-3">
                  <h6>Hot Numbers Analysis</h6>
                  <p className="small text-muted">
                    These are your most frequently played numbers. Consider using these numbers in your future tickets or creating a combination with them.
                  </p>
                  
                  <Button 
                    variant="outline-primary" 
                    className="mt-2"
                    as={Link}
                    to="/play"
                  >
                    Play These Numbers
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={6} className="mb-4">
            <Card className="h-100">
              <Card.Header>
                <h5 className="mb-0">Winning Number Analysis</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <h6>Your Winning Numbers</h6>
                  <div className="d-flex flex-wrap mb-4">
                    {Array.from(new Set(
                      filteredTickets
                        .filter(ticket => ticket.isWinning)
                        .flatMap(ticket => ticket.mainNumbers)
                    ))
                      .sort((a, b) => a - b)
                      .slice(0, 10)
                      .map(number => (
                        <div 
                          key={number} 
                          className="m-2 text-center"
                        >
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center mb-1"
                            style={{ 
                              width: '50px', 
                              height: '50px', 
                              backgroundColor: 'rgba(0, 200, 83, 0.7)',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '18px'
                            }}
                          >
                            {number}
                          </div>
                        </div>
                      ))}
                      
                    {filteredTickets.filter(ticket => ticket.isWinning).length === 0 && (
                      <div className="text-center w-100 py-3">
                        <small className="text-muted">No winning numbers to display</small>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-top pt-3">
                  <h6>Lucky Number Combinations</h6>
                  <Table bordered size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>Combination</th>
                        <th className="text-center">Wins</th>
                        <th className="text-end">Total Won</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...new Set(
                        filteredTickets
                          .filter(ticket => ticket.isWinning)
                          .map(ticket => JSON.stringify(ticket.mainNumbers.sort((a, b) => a - b)))
                      )]
                        .slice(0, 5)
                        .map(combinationJson => {
                          const combination = JSON.parse(combinationJson);
                          const matchingTickets = filteredTickets.filter(ticket => 
                            ticket.isWinning && 
                            JSON.stringify(ticket.mainNumbers.sort((a, b) => a - b)) === combinationJson
                          );
                          const totalWon = matchingTickets.reduce((sum, ticket) => sum + ticket.winAmount, 0);
                          
                          return (
                            <tr key={combinationJson}>
                              <td>{combination.join(', ')}</td>
                              <td className="text-center">{matchingTickets.length}</td>
                              <td className="text-end text-success">€{totalWon.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                        
                      {filteredTickets.filter(ticket => ticket.isWinning).length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-3">
                            <small className="text-muted">No winning combinations to display</small>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                  
                  <div className="mt-3">
                    <Button 
                      variant="outline-success" 
                      className="me-2"
                      as={Link}
                      to="/saved-numbers"
                    >
                      View Saved Numbers
                    </Button>
                    <Button 
                      variant="outline-primary"
                      as={Link}
                      to="/number-generator"
                    >
                      Number Generator
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default LotteryStatistics;