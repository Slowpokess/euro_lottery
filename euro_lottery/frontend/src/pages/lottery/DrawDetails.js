import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Nav } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import DrawVisualizer from '../../components/draw/DrawVisualizer';
import LotteryTicketVisualizer from '../../components/ticket/LotteryTicketVisualizer';
import { FaEye, FaTable, FaPlay, FaTicketAlt } from 'react-icons/fa';

const DrawDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [drawData, setDrawData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('results');
  const [userTickets, setUserTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Simulate loading data from API
  useEffect(() => {
    // Mock data for a specific draw
    const fetchDrawDetails = () => {
      // Simulate API delay
      setTimeout(() => {
        // Hard-coded data for demo
        if (id === '100') {
          setDrawData({
            id: 100,
            lotteryId: 1,
            lotteryName: 'EuroMillions',
            lotteryType: 'euromillions',
            drawDate: '2025-04-23T20:00:00',
            jackpot: '€115,000,000',
            winningNumbers: [3, 17, 24, 33, 46],
            luckyStars: [7, 11],
            status: 'completed',
            hasJackpotWinner: true,
            totalPrize: '€127,845,123',
            totalWinners: 3245672,
            prizeCategories: [
              { tier: 1, match: 'Match 5 + 2 Stars', winners: 1, amount: '€115,000,000' },
              { tier: 2, match: 'Match 5 + 1 Star', winners: 5, amount: '€583,724' },
              { tier: 3, match: 'Match 5', winners: 14, amount: '€41,695' },
              { tier: 4, match: 'Match 4 + 2 Stars', winners: 98, amount: '€2,962' },
              { tier: 5, match: 'Match 4 + 1 Star', winners: 1865, amount: '€155' },
              { tier: 6, match: 'Match 3 + 2 Stars', winners: 5519, amount: '€84' },
              { tier: 7, match: 'Match 4', winners: 3850, amount: '€60' },
              { tier: 8, match: 'Match 2 + 2 Stars', winners: 87310, amount: '€20' },
              { tier: 9, match: 'Match 3 + 1 Star', winners: 89598, amount: '€14' },
              { tier: 10, match: 'Match 3', winners: 183563, amount: '€12' },
              { tier: 11, match: 'Match 1 + 2 Stars', winners: 472021, amount: '€10' },
              { tier: 12, match: 'Match 2 + 1 Star', winners: 1372952, amount: '€8' },
              { tier: 13, match: 'Match 2', winners: 2739776, amount: '€4' },
            ]
          });
        } else if (id === '200') {
          setDrawData({
            id: 200,
            lotteryId: 2,
            lotteryName: 'EuroJackpot',
            lotteryType: 'eurojackpot',
            drawDate: '2025-04-22T20:00:00',
            jackpot: '€90,000,000',
            winningNumbers: [8, 19, 24, 36, 48],
            luckyStars: [3, 8],
            status: 'completed',
            hasJackpotWinner: true,
            totalPrize: '€97,154,322',
            totalWinners: 2137254,
            prizeCategories: [
              { tier: 1, match: 'Match 5 + 2 Stars', winners: 2, amount: '€45,000,000' },
              { tier: 2, match: 'Match 5 + 1 Star', winners: 8, amount: '€318,947' },
              { tier: 3, match: 'Match 5', winners: 12, amount: '€92,481' },
              { tier: 4, match: 'Match 4 + 2 Stars', winners: 72, amount: '€3,854' },
              { tier: 5, match: 'Match 4 + 1 Star', winners: 1241, amount: '€212' },
              { tier: 6, match: 'Match 4', winners: 2258, amount: '€97' },
              { tier: 7, match: 'Match 3 + 2 Stars', winners: 3587, amount: '€56' },
              { tier: 8, match: 'Match 2 + 2 Stars', winners: 53259, amount: '€19' },
              { tier: 9, match: 'Match 3 + 1 Star', winners: 60254, amount: '€16' },
              { tier: 10, match: 'Match 3', winners: 107387, amount: '€14' },
              { tier: 11, match: 'Match 1 + 2 Stars', winners: 287932, amount: '€9' },
              { tier: 12, match: 'Match 2 + 1 Star', winners: 892174, amount: '€7' },
            ]
          });
        } else {
          setError('Draw not found');
        }
        setLoading(false);
      }, 1000);
    };

    fetchDrawDetails();
  }, [id]);

  // Load user's tickets for this draw
  useEffect(() => {
    if (drawData) {
      setTicketsLoading(true);
      
      // Simulate API call to get user's tickets for this draw
      setTimeout(() => {
        // Mock tickets data
        if (id === '100') {
          setUserTickets([
            {
              id: 4,
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
              jackpotAmount: 115000000
            },
            {
              id: 5,
              lotteryName: 'EuroMillions',
              lotteryType: 'euromillions',
              drawId: 100,
              drawDate: '2025-04-23T20:00:00',
              numbers: [3, 10, 22, 31, 49],
              extraNumbers: [7, 9],
              status: 'winning',
              purchaseDate: '2025-04-21T14:30:11',
              ticketPrice: 2.50,
              winningAmount: 10.00,
              winningCategory: 'Match 1+2',
              jackpotAmount: 115000000
            },
            {
              id: 6,
              lotteryName: 'EuroMillions',
              lotteryType: 'euromillions',
              drawId: 100,
              drawDate: '2025-04-23T20:00:00',
              numbers: [5, 12, 24, 37, 40],
              extraNumbers: [2, 9],
              status: 'checked',
              purchaseDate: '2025-04-22T09:15:22',
              ticketPrice: 2.50,
              winningAmount: 0,
              jackpotAmount: 115000000
            }
          ]);
        } else if (id === '200') {
          setUserTickets([
            {
              id: 7,
              lotteryName: 'EuroJackpot',
              lotteryType: 'eurojackpot',
              drawId: 200,
              drawDate: '2025-04-22T20:00:00',
              numbers: [8, 19, 24, 36, 48],
              extraNumbers: [3, 8],
              status: 'winning',
              purchaseDate: '2025-04-20T10:11:33',
              ticketPrice: 2.00,
              winningAmount: 45000000,
              winningCategory: 'Match 5+2',
              jackpotAmount: 90000000
            }
          ]);
        } else {
          setUserTickets([]);
        }
        
        setTicketsLoading(false);
      }, 1500);
    }
  }, [drawData, id]);

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

  // Handle draw visualization completion
  const handleDrawComplete = (results) => {
    console.log('Draw completed with results:', results);
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading draw details...</p>
      </Container>
    );
  }

  if (error || !drawData) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || 'Could not find the requested draw'}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link to="/draws">
              <Button variant="outline-danger">
                Back to All Draws
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
        <h1>{drawData.lotteryName} Draw Results</h1>
        <Link to="/draws" className="btn btn-outline-primary">
          &laquo; Back to All Draws
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Draw #{drawData.id}</h3>
            <span>{formatDate(drawData.drawDate)}</span>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Nav variant="tabs" className="mb-4" activeKey={activeTab}>
            <Nav.Item>
              <Nav.Link 
                eventKey="results" 
                onClick={() => handleTabChange('results')}
                className="d-flex align-items-center"
              >
                <FaTable className="me-2" /> Results
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="visualizer" 
                onClick={() => handleTabChange('visualizer')}
                className="d-flex align-items-center"
              >
                <FaPlay className="me-2" /> Replay Draw
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="mytickets" 
                onClick={() => handleTabChange('mytickets')}
                className="d-flex align-items-center"
              >
                <FaTicketAlt className="me-2" /> My Tickets
                {userTickets.length > 0 && (
                  <Badge pill bg="primary" className="ms-2">
                    {userTickets.length}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {activeTab === 'results' && (
            <>
              <Row className="mb-4">
                <Col md={6} className="mb-4 mb-md-0">
                  <div className="mb-3">
                    <h4>Winning Numbers</h4>
                    <div className="d-flex flex-wrap">
                      {drawData.winningNumbers.map(num => (
                        <Badge 
                          bg="primary" 
                          className="me-2 mb-2 p-3 rounded-circle" 
                          style={{ width: '50px', height: '50px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          key={num}
                        >
                          {num}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {drawData.luckyStars && (
                    <div>
                      <h5>Lucky Stars</h5>
                      <div className="d-flex flex-wrap">
                        {drawData.luckyStars.map(num => (
                          <Badge 
                            bg="warning" 
                            text="dark" 
                            className="me-2 mb-2 p-3 rounded-circle" 
                            style={{ width: '50px', height: '50px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            key={num}
                          >
                            {num}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <h4>Draw Summary</h4>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td>Jackpot</td>
                            <td className="text-end fw-bold">{drawData.jackpot}</td>
                          </tr>
                          <tr>
                            <td>Jackpot Winner</td>
                            <td className="text-end">
                              {drawData.hasJackpotWinner ? (
                                <Badge bg="success">Yes</Badge>
                              ) : (
                                <Badge bg="danger">No</Badge>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td>Total Prize Fund</td>
                            <td className="text-end fw-bold">{drawData.totalPrize}</td>
                          </tr>
                          <tr>
                            <td>Total Winners</td>
                            <td className="text-end">{drawData.totalWinners.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h4>Prize Breakdown</h4>
              <Table responsive striped bordered>
                <thead className="bg-light">
                  <tr>
                    <th>Tier</th>
                    <th>Match</th>
                    <th className="text-end">Winners</th>
                    <th className="text-end">Prize Per Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {drawData.prizeCategories.map(category => (
                    <tr key={category.tier}>
                      <td>{category.tier}</td>
                      <td>{category.match}</td>
                      <td className="text-end">{category.winners.toLocaleString()}</td>
                      <td className="text-end">{category.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}

          {activeTab === 'visualizer' && (
            <div className="draw-visualizer-container">
              <DrawVisualizer 
                lotteryType={drawData.lotteryType}
                winningNumbers={drawData.winningNumbers}
                extraNumbers={drawData.luckyStars}
                mode="replay"
                autoPlay={false}
                onDrawComplete={handleDrawComplete}
              />
            </div>
          )}

          {activeTab === 'mytickets' && (
            <div className="my-tickets-container">
              {ticketsLoading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading your tickets...</p>
                </div>
              ) : userTickets.length > 0 ? (
                <>
                  <h4 className="mb-4">Your Tickets for This Draw</h4>
                  <Row>
                    {userTickets.map(ticket => (
                      <Col lg={6} xl={4} key={ticket.id} className="mb-4">
                        <LotteryTicketVisualizer 
                          ticket={ticket}
                          winningNumbers={drawData.winningNumbers}
                          winningExtraNumbers={drawData.luckyStars}
                          lotteryType={drawData.lotteryType}
                          showAnimation={false}
                          highlightMode="auto"
                          showDetails={true}
                        />
                      </Col>
                    ))}
                  </Row>
                </>
              ) : (
                <Alert variant="info">
                  <div className="text-center py-4">
                    <FaTicketAlt size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h4>No Tickets Found</h4>
                    <p>You don't have any tickets for this draw.</p>
                    <Link to="/lotteries">
                      <Button variant="primary" className="mt-2">Buy Tickets for Next Draw</Button>
                    </Link>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Check your tickets CTA - Only show on results tab and if user hasn't checked 'mytickets' tab */}
      {activeTab === 'results' && (
        <Card className="text-center bg-light">
          <Card.Body>
            <h3>Check Your Tickets</h3>
            <p>See if you've won a prize in this draw</p>
            <Button 
              variant="success" 
              size="lg"
              onClick={() => handleTabChange('mytickets')}
            >
              <FaEye className="me-2" /> View My Tickets
            </Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default DrawDetails;