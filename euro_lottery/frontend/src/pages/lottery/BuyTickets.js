import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';

const BuyTickets = () => {
  const { id: lotteryId, drawId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lottery, setLottery] = useState(null);
  const [draw, setDraw] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [selectedLuckyStars, setSelectedLuckyStars] = useState([]);
  const [numTickets, setNumTickets] = useState(1);
  const [randomSelection, setRandomSelection] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Mock user balance from Redux
  const userBalance = 100; // This would come from Redux state
  
  // Mock lottery data - in a real app, this would come from Redux
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Find lottery by id
      const lotteryData = {
        id: parseInt(lotteryId),
        name: 'EuroMillions',
        description: 'Play Europe\'s biggest lottery game with huge jackpots!',
        currentJackpot: '€130,000,000',
        ticketPrice: 2.50,
        image: 'https://via.placeholder.com/300x200?text=EuroMillions',
        status: 'active',
        selectionRange: {
          main: { min: 1, max: 50, required: 5 },
          luckyStars: { min: 1, max: 12, required: 2 }
        }
      };
      
      const drawData = {
        id: parseInt(drawId),
        lotteryId: parseInt(lotteryId),
        drawDate: '2025-04-26T20:00:00',
        status: 'upcoming',
        jackpot: '€130,000,000',
        ticketsAvailable: true
      };
      
      setLottery(lotteryData);
      setDraw(drawData);
      setLoading(false);
    }, 1000);
  }, [lotteryId, drawId]);
  
  // Format date nicely
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
  
  // Handle number selection
  const toggleMainNumber = (number) => {
    if (randomSelection) return;
    
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else {
      if (selectedNumbers.length < lottery.selectionRange.main.required) {
        setSelectedNumbers([...selectedNumbers, number]);
      }
    }
  };
  
  // Handle lucky star selection
  const toggleLuckyStar = (number) => {
    if (randomSelection) return;
    
    if (selectedLuckyStars.includes(number)) {
      setSelectedLuckyStars(selectedLuckyStars.filter(n => n !== number));
    } else {
      if (selectedLuckyStars.length < lottery.selectionRange.luckyStars.required) {
        setSelectedLuckyStars([...selectedLuckyStars, number]);
      }
    }
  };
  
  // Generate random selection
  const generateRandomNumbers = () => {
    const main = [];
    const stars = [];
    
    // Generate main numbers
    while (main.length < lottery.selectionRange.main.required) {
      const random = Math.floor(Math.random() * lottery.selectionRange.main.max) + lottery.selectionRange.main.min;
      if (!main.includes(random)) {
        main.push(random);
      }
    }
    
    // Generate lucky stars
    while (stars.length < lottery.selectionRange.luckyStars.required) {
      const random = Math.floor(Math.random() * lottery.selectionRange.luckyStars.max) + lottery.selectionRange.luckyStars.min;
      if (!stars.includes(random)) {
        stars.push(random);
      }
    }
    
    setSelectedNumbers(main.sort((a, b) => a - b));
    setSelectedLuckyStars(stars.sort((a, b) => a - b));
    setRandomSelection(true);
  };
  
  // Clear selections
  const clearSelections = () => {
    setSelectedNumbers([]);
    setSelectedLuckyStars([]);
    setRandomSelection(false);
  };
  
  // Calculate total cost
  const totalCost = numTickets * lottery?.ticketPrice || 0;
  
  // Check if selection is complete
  const isSelectionComplete = selectedNumbers.length === lottery?.selectionRange.main.required &&
                             selectedLuckyStars.length === lottery?.selectionRange.luckyStars.required;
  
  // Handle purchase
  const handlePurchase = () => {
    // Validate balance
    if (userBalance < totalCost) {
      setErrorMessage('Insufficient funds. Please add money to your wallet.');
      return;
    }
    
    // Validate selection
    if (!isSelectionComplete) {
      setErrorMessage('Please complete your number selection before purchasing tickets.');
      return;
    }
    
    // Simulate API call to purchase tickets
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage(`Successfully purchased ${numTickets} ticket(s) for the draw on ${formatDate(draw.drawDate)}.`);
      
      // Redirect to tickets page after a delay
      setTimeout(() => {
        navigate('/my-tickets');
      }, 3000);
    }, 1500);
  };
  
  if (loading && !lottery) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading ticket purchase page...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Link to={`/lotteries/${lotteryId}`} className="btn btn-outline-primary mb-3">
            &laquo; Back to Lottery Details
          </Link>
          <h1>Buy Tickets - {lottery?.name}</h1>
          <p className="lead">
            Draw date: {formatDate(draw?.drawDate)}
          </p>
        </Col>
      </Row>
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          <Alert.Heading>Purchase Successful!</Alert.Heading>
          <p>{successMessage}</p>
          <div className="d-flex justify-content-end">
            <Link to="/my-tickets">
              <Button variant="outline-success">View My Tickets</Button>
            </Link>
          </div>
        </Alert>
      )}
      
      {errorMessage && (
        <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
          {errorMessage}
        </Alert>
      )}
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Select Your Numbers</Card.Title>
              <p>
                Choose {lottery?.selectionRange.main.required} numbers from 1-{lottery?.selectionRange.main.max} and {lottery?.selectionRange.luckyStars.required} Lucky Stars from 1-{lottery?.selectionRange.luckyStars.max}.
              </p>
              
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  variant="outline-primary" 
                  className="me-2" 
                  onClick={generateRandomNumbers}
                >
                  Quick Pick
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={clearSelections}
                  disabled={selectedNumbers.length === 0 && selectedLuckyStars.length === 0}
                >
                  Clear
                </Button>
              </div>
              
              <h5>Main Numbers</h5>
              <div className="number-grid mb-4">
                <Row xs={5} md={10} className="g-2">
                  {Array.from({ length: lottery?.selectionRange.main.max || 0 }, (_, i) => i + 1).map(number => (
                    <Col key={number} className="text-center">
                      <Button
                        variant={selectedNumbers.includes(number) ? "primary" : "outline-primary"}
                        className="number-button rounded-circle"
                        onClick={() => toggleMainNumber(number)}
                        disabled={!selectedNumbers.includes(number) && selectedNumbers.length >= lottery?.selectionRange.main.required}
                        style={{ width: '40px', height: '40px', padding: '0' }}
                      >
                        {number}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
              
              <h5>Lucky Stars</h5>
              <div className="lucky-star-grid">
                <Row xs={6} md={12} className="g-2">
                  {Array.from({ length: lottery?.selectionRange.luckyStars.max || 0 }, (_, i) => i + 1).map(number => (
                    <Col key={number} className="text-center">
                      <Button
                        variant={selectedLuckyStars.includes(number) ? "warning" : "outline-warning"}
                        className="number-button rounded-circle"
                        onClick={() => toggleLuckyStar(number)}
                        disabled={!selectedLuckyStars.includes(number) && selectedLuckyStars.length >= lottery?.selectionRange.luckyStars.required}
                        style={{ width: '40px', height: '40px', padding: '0' }}
                      >
                        {number}
                      </Button>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Your Selection</Card.Title>
              
              <div className="mb-3">
                <h6>Main Numbers:</h6>
                {selectedNumbers.length > 0 ? (
                  <div>
                    {selectedNumbers.map(number => (
                      <Badge bg="primary" className="me-1 p-2" key={number}>
                        {number}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No numbers selected</p>
                )}
              </div>
              
              <div className="mb-4">
                <h6>Lucky Stars:</h6>
                {selectedLuckyStars.length > 0 ? (
                  <div>
                    {selectedLuckyStars.map(number => (
                      <Badge bg="warning" text="dark" className="me-1 p-2" key={number}>
                        {number}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No lucky stars selected</p>
                )}
              </div>
              
              <div className="mb-3">
                <Form.Group>
                  <Form.Label>Number of Tickets</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="10"
                    value={numTickets}
                    onChange={(e) => setNumTickets(parseInt(e.target.value) || 1)}
                  />
                  <Form.Text className="text-muted">
                    Maximum 10 tickets per purchase
                  </Form.Text>
                </Form.Group>
              </div>
              
              <div className="mb-3">
                <h5>Total Cost: €{totalCost.toFixed(2)}</h5>
                <p className="text-muted">Your balance: €{userBalance.toFixed(2)}</p>
              </div>
              
              <div className="d-grid">
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={handlePurchase}
                  disabled={loading || !isSelectionComplete || userBalance < totalCost}
                >
                  {loading ? 'Processing...' : 'Purchase Tickets'}
                </Button>
              </div>
              
              {userBalance < totalCost && (
                <div className="mt-3 text-center">
                  <Link to="/deposit">
                    <Button variant="outline-primary">Add Funds</Button>
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Game Details</Card.Title>
              <p><strong>Lottery:</strong> {lottery?.name}</p>
              <p><strong>Draw Date:</strong> {formatDate(draw?.drawDate)}</p>
              <p><strong>Jackpot:</strong> {draw?.jackpot}</p>
              <p><strong>Ticket Price:</strong> €{lottery?.ticketPrice.toFixed(2)}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BuyTickets;