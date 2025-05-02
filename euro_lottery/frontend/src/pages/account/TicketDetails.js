import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Nav } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LotteryTicketVisualizer from '../../components/ticket/LotteryTicketVisualizer';
import { FaTicketAlt, FaInfoCircle, FaHistory } from 'react-icons/fa';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('visual');

  // Simulate loading data from API
  useEffect(() => {
    // Mock data for a specific ticket
    const fetchTicketDetails = () => {
      // Simulate API delay
      setTimeout(() => {
        // Hard-coded data for demo
        if (id === '1') {
          setTicket({
            id: 1,
            lotteryId: 1,
            lotteryName: 'EuroMillions',
            lotteryType: 'euromillions',
            drawId: 101,
            drawDate: '2025-04-26T20:00:00',
            numbers: [5, 12, 23, 34, 45],
            extraNumbers: [7, 9],
            status: 'active', // active, completed, winning
            purchaseDate: '2025-04-22T15:30:22',
            ticketPrice: 2.50,
            winningAmount: 0,
            drawStatus: 'upcoming',
            ticketImage: 'https://via.placeholder.com/400x600?text=EuroMillions+Ticket'
          });
        } else if (id === '4') {
          setTicket({
            id: 4,
            lotteryId: 1,
            lotteryName: 'EuroMillions',
            lotteryType: 'euromillions',
            drawId: 100,
            drawDate: '2025-04-23T20:00:00',
            numbers: [3, 17, 24, 33, 46],
            extraNumbers: [7, 11],
            status: 'winning',
            purchaseDate: '2025-04-21T12:15:42',
            ticketPrice: 2.50,
            winningAmount: 55.50,
            winningCategory: 'Match 3+1',
            drawStatus: 'completed',
            winningNumbers: [3, 17, 24, 33, 46],
            winningExtraNumbers: [7, 11],
            ticketImage: 'https://via.placeholder.com/400x600?text=Winning+Ticket'
          });
        } else {
          setError('Ticket not found');
        }
        setLoading(false);
      }, 1000);
    };

    fetchTicketDetails();
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading ticket details...</p>
      </Container>
    );
  }

  if (error || !ticket) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || 'Could not find the requested ticket'}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link to="/my-tickets">
              <Button variant="outline-danger">
                Back to My Tickets
              </Button>
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Ticket Details</h1>
        <Link to="/my-tickets" className="btn btn-outline-primary">
          &laquo; Back to My Tickets
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header className={`${ticket.status === 'winning' ? 'bg-success' : 'bg-primary'} text-white`}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <FaTicketAlt className="me-2" />
              {ticket.lotteryName} Ticket #{ticket.id}
            </h5>
            <Badge bg={ticket.status === 'winning' ? 'light' : 'light'} text="dark">
              {ticket.drawStatus === 'upcoming' ? 'Upcoming Draw' : 'Completed Draw'}
            </Badge>
          </div>
        </Card.Header>

        <Card.Body>
          <Nav variant="tabs" className="mb-4" activeKey={activeTab}>
            <Nav.Item>
              <Nav.Link 
                eventKey="visual" 
                onClick={() => handleTabChange('visual')}
                className="d-flex align-items-center"
              >
                <FaTicketAlt className="me-2" /> Ticket
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="details" 
                onClick={() => handleTabChange('details')}
                className="d-flex align-items-center"
              >
                <FaInfoCircle className="me-2" /> Details
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {activeTab === 'visual' && (
            <Row className="justify-content-center">
              <Col md={10} lg={8}>
                <LotteryTicketVisualizer 
                  ticket={ticket}
                  winningNumbers={ticket.winningNumbers || []}
                  winningExtraNumbers={ticket.winningExtraNumbers || []}
                  lotteryType={ticket.lotteryType}
                  showAnimation={ticket.status === 'winning'}
                  highlightMode="auto"
                  showDetails={true}
                />
              </Col>
            </Row>
          )}

          {activeTab === 'details' && (
            <Row>
              <Col lg={6} className="mb-4">
                <Card>
                  <Card.Header>Ticket Information</Card.Header>
                  <Card.Body>
                    <Table bordered>
                      <tbody>
                        <tr>
                          <td className="fw-bold">Ticket ID</td>
                          <td>{ticket.id}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Lottery</td>
                          <td>{ticket.lotteryName}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Purchase Date</td>
                          <td>{formatDate(ticket.purchaseDate)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Price</td>
                          <td>€{ticket.ticketPrice.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Status</td>
                          <td>
                            {ticket.status === 'winning' ? (
                              <Badge bg="success">Winning</Badge>
                            ) : ticket.status === 'active' ? (
                              <Badge bg="primary">Active</Badge>
                            ) : (
                              <Badge bg="secondary">Checked</Badge>
                            )}
                          </td>
                        </tr>
                        {ticket.status === 'winning' && (
                          <tr>
                            <td className="fw-bold">Prize Amount</td>
                            <td className="text-success fw-bold">€{ticket.winningAmount.toFixed(2)}</td>
                          </tr>
                        )}
                        {ticket.status === 'winning' && ticket.winningCategory && (
                          <tr>
                            <td className="fw-bold">Prize Category</td>
                            <td>{ticket.winningCategory}</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            
              <Col lg={6}>
                <Card>
                  <Card.Header>Draw Information</Card.Header>
                  <Card.Body>
                    <Table bordered>
                      <tbody>
                        <tr>
                          <td className="fw-bold">Draw ID</td>
                          <td>{ticket.drawId}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Draw Date</td>
                          <td>{formatDate(ticket.drawDate)}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Draw Status</td>
                          <td>
                            {ticket.drawStatus === 'upcoming' ? (
                              <Badge bg="info">Upcoming</Badge>
                            ) : (
                              <Badge bg="success">Completed</Badge>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    
                    {ticket.drawStatus === 'completed' && (
                      <div className="mt-3">
                        <h6>Winning Numbers</h6>
                        <div className="d-flex flex-wrap mb-2">
                          {ticket.winningNumbers && ticket.winningNumbers.map(num => (
                            <Badge 
                              bg="primary" 
                              className="me-2 mb-2 p-2 rounded-circle" 
                              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              key={num}
                            >
                              {num}
                            </Badge>
                          ))}
                        </div>
                        
                        {ticket.winningExtraNumbers && (
                          <>
                            <h6>Lucky Stars</h6>
                            <div className="d-flex flex-wrap">
                              {ticket.winningExtraNumbers.map(num => (
                                <Badge 
                                  bg="warning" 
                                  text="dark" 
                                  className="me-2 mb-2 p-2 rounded-circle" 
                                  style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  key={num}
                                >
                                  {num}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                        
                        <Button 
                          variant="outline-primary" 
                          className="mt-3"
                          as={Link}
                          to={`/draws/${ticket.drawId}`}
                        >
                          <FaHistory className="me-2" /> View Full Draw Details
                        </Button>
                      </div>
                    )}
                    
                    {ticket.drawStatus === 'upcoming' && (
                      <div className="alert alert-info mt-3">
                        <p>The draw for this ticket will take place on: <strong>{formatDate(ticket.drawDate)}</strong></p>
                        <p className="mb-0">Check back after the draw to see if you've won!</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Card.Body>
        
        <Card.Footer>
          <div className="d-flex justify-content-between align-items-center">
            {ticket.status === 'winning' ? (
              <Button 
                variant="success" 
                onClick={() => navigate('/wallet')}
              >
                View Prize in My Wallet
              </Button>
            ) : ticket.drawStatus === 'upcoming' ? (
              <Link to={`/lotteries/${ticket.lotteryId}`}>
                <Button variant="primary">Buy More Tickets</Button>
              </Link>
            ) : (
              <Link to="/lotteries">
                <Button variant="outline-primary">Try Again</Button>
              </Link>
            )}
            
            <Link to="/my-tickets">
              <Button variant="outline-secondary">
                All My Tickets
              </Button>
            </Link>
          </div>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default TicketDetails;