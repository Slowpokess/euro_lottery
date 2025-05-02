import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

const MyTickets = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - in a real app, this would come from Redux
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const ticketsData = [
        {
          id: 1,
          lotteryId: 1,
          lotteryName: 'EuroMillions',
          drawId: 101,
          drawDate: '2025-04-26T20:00:00',
          numbers: [5, 12, 23, 34, 45],
          luckyStars: [7, 9],
          status: 'active', // active, completed, winning
          purchaseDate: '2025-04-22T15:30:22',
          price: 2.50,
          winningAmount: 0
        },
        {
          id: 2,
          lotteryId: 1,
          lotteryName: 'EuroMillions',
          drawId: 101,
          drawDate: '2025-04-26T20:00:00',
          numbers: [6, 13, 27, 35, 47],
          luckyStars: [2, 8],
          status: 'active',
          purchaseDate: '2025-04-22T15:30:22',
          price: 2.50,
          winningAmount: 0
        },
        {
          id: 3,
          lotteryId: 2,
          lotteryName: 'EuroJackpot',
          drawId: 201,
          drawDate: '2025-04-25T20:00:00',
          numbers: [3, 14, 25, 36, 48],
          luckyStars: [4, 10],
          status: 'active',
          purchaseDate: '2025-04-23T09:45:12',
          price: 2.00,
          winningAmount: 0
        },
        {
          id: 4,
          lotteryId: 1,
          lotteryName: 'EuroMillions',
          drawId: 100,
          drawDate: '2025-04-23T20:00:00',
          numbers: [3, 17, 24, 33, 46],
          luckyStars: [7, 11],
          status: 'winning',
          purchaseDate: '2025-04-21T12:15:42',
          price: 2.50,
          winningAmount: 55.50,
          prizeCategory: 'Match 3+1'
        }
      ];
      
      setTickets(ticketsData);
      setFilteredTickets(ticketsData);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Filter and sort tickets
  useEffect(() => {
    let filtered = [...tickets];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterStatus);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.lotteryName.toLowerCase().includes(term) ||
        ticket.id.toString().includes(term)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.drawDate) - new Date(b.drawDate));
        break;
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.drawDate) - new Date(a.drawDate));
        break;
      case 'lottery':
        filtered.sort((a, b) => a.lotteryName.localeCompare(b.lotteryName));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    
    setFilteredTickets(filtered);
  }, [tickets, filterStatus, sortBy, searchTerm]);
  
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
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="primary">Active</Badge>;
      case 'winning':
        return <Badge bg="success">Winning</Badge>;
      case 'completed':
        return <Badge bg="secondary">Completed</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your tickets...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">My Tickets</h1>
      
      {tickets.length === 0 ? (
        <Alert variant="info">
          <p>You haven't purchased any tickets yet.</p>
          <Link to="/lotteries">
            <Button variant="primary">Browse Lotteries</Button>
          </Link>
        </Alert>
      ) : (
        <>
          {/* Filter and sort controls */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={4}>
                  <Form.Group className="mb-md-0 mb-3">
                    <Form.Label>Filter by Status</Form.Label>
                    <Form.Select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Tickets</option>
                      <option value="active">Active</option>
                      <option value="winning">Winning</option>
                      <option value="completed">Completed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-md-0 mb-3">
                    <Form.Label>Sort By</Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="date-desc">Draw Date (Newest First)</option>
                      <option value="date-asc">Draw Date (Oldest First)</option>
                      <option value="lottery">Lottery Name</option>
                      <option value="price-desc">Price (High to Low)</option>
                      <option value="price-asc">Price (Low to High)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-md-0 mb-3">
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <Form.Control
                        placeholder="Search by lottery or ticket ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <Button 
                          variant="outline-secondary"
                          onClick={() => setSearchTerm('')}
                        >
                          ✕
                        </Button>
                      )}
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Tickets list */}
          {filteredTickets.length === 0 ? (
            <Alert variant="info">
              No tickets match your filter criteria.
            </Alert>
          ) : (
            <Row xs={1} md={2} className="g-4">
              {filteredTickets.map(ticket => (
                <Col key={ticket.id}>
                  <Card className="h-100">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <span>Ticket #{ticket.id}</span>
                      {getStatusBadge(ticket.status)}
                    </Card.Header>
                    <Card.Body>
                      <Card.Title>{ticket.lotteryName}</Card.Title>
                      <div className="mb-3">
                        <strong>Draw Date:</strong> {formatDate(ticket.drawDate)}
                      </div>
                      <div className="mb-3">
                        <strong>Your Numbers:</strong>
                        <div className="mt-1">
                          {ticket.numbers.map(num => (
                            <Badge bg="light" text="dark" className="me-1 p-2" key={num}>
                              {num}
                            </Badge>
                          ))}
                          {ticket.luckyStars && ' Lucky Stars: '}
                          {ticket.luckyStars?.map(num => (
                            <Badge bg="warning" text="dark" className="me-1 p-2" key={num}>
                              {num}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong>Purchase Date:</strong> {formatDate(ticket.purchaseDate)}
                      </div>
                      <div className="mb-3">
                        <strong>Price:</strong> €{ticket.price.toFixed(2)}
                      </div>
                      {ticket.status === 'winning' && (
                        <div className="mb-3">
                          <strong>Prize:</strong> €{ticket.winningAmount.toFixed(2)} ({ticket.prizeCategory})
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="text-center bg-white border-top-0">
                      <Link to={`/my-tickets/${ticket.id}`}>
                        <Button variant="outline-primary">View Details</Button>
                      </Link>
                    </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
      
      <div className="text-center mt-4">
        <Link to="/lotteries">
          <Button variant="primary">Buy More Tickets</Button>
        </Link>
      </div>
    </Container>
  );
};

export default MyTickets;