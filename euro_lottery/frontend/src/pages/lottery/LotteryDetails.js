import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Table, Alert } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

const LotteryDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [lottery, setLottery] = useState(null);
  const [draws, setDraws] = useState([]);
  
  // Mock lottery data - in a real app, this would come from Redux
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Find lottery by id
      const lotteryData = {
        id: parseInt(id),
        name: 'EuroMillions',
        description: 'Play Europe\'s biggest lottery game with huge jackpots!',
        currentJackpot: '€130,000,000',
        nextDrawDate: '2025-04-26T20:00:00',
        ticketPrice: 2.50,
        image: 'https://via.placeholder.com/800x400?text=EuroMillions',
        status: 'active',
        longDescription: 'EuroMillions is a transnational lottery that requires players to match 5 main numbers from a range of 1-50 and 2 Lucky Star numbers from a range of 1-12. Draws take place on Tuesday and Friday evenings, offering players the chance to win life-changing jackpots that can reach up to €190 million!',
        rulesAndOdds: 'Match 5 + 2 Lucky Stars: Jackpot (1:139,838,160)\nMatch 5 + 1 Lucky Star: €500,000 (1:6,991,908)\nMatch 5: €50,000 (1:3,107,515)\nMatch 4 + 2 Lucky Stars: €2,500 (1:621,503)\nMatch 4 + 1 Lucky Star: €150 (1:31,075)\nMatch 3 + 2 Lucky Stars: €75 (1:14,125)\nMatch 4: €60 (1:13,811)\nMatch 2 + 2 Lucky Stars: €15 (1:985)\nMatch 3 + 1 Lucky Star: €10 (1:706)\nMatch 3: €8 (1:314)\nMatch 1 + 2 Lucky Stars: €7 (1:188)\nMatch 2 + 1 Lucky Star: €5 (1:49)'
      };
      
      const drawsData = [
        {
          id: 101,
          lotteryId: parseInt(id),
          drawDate: '2025-04-26T20:00:00',
          status: 'upcoming',
          jackpot: '€130,000,000',
          ticketsAvailable: true
        },
        {
          id: 102,
          lotteryId: parseInt(id),
          drawDate: '2025-04-30T20:00:00',
          status: 'upcoming',
          jackpot: '€150,000,000',
          ticketsAvailable: true
        },
        {
          id: 100,
          lotteryId: parseInt(id),
          drawDate: '2025-04-23T20:00:00',
          status: 'completed',
          jackpot: '€115,000,000',
          ticketsAvailable: false,
          winningNumbers: [3, 17, 24, 33, 46],
          luckyStars: [7, 11],
          winner: true
        }
      ];
      
      setLottery(lotteryData);
      setDraws(drawsData);
      setLoading(false);
    }, 1000);
  }, [id]);
  
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
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading lottery details...</p>
      </Container>
    );
  }
  
  if (!lottery) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Lottery Not Found</Alert.Heading>
          <p>
            Sorry, we couldn&apos;t find the lottery you&apos;re looking for.
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link to="/lotteries">
              <Button variant="outline-danger">
                Back to Lotteries
              </Button>
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }
  
  // Sort draws: upcoming first, then past
  const sortedDraws = [...draws].sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    return new Date(b.drawDate) - new Date(a.drawDate);
  });
  
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Link to="/lotteries" className="btn btn-outline-primary mb-3">
            &laquo; Back to Lotteries
          </Link>
          <h1>{lottery.name}</h1>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col md={6}>
          <img 
            src={lottery.image} 
            alt={lottery.name} 
            className="img-fluid rounded shadow mb-4"
          />
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title as="h2">Game Information</Card.Title>
              <p className="lead">{lottery.description}</p>
              <hr />
              <div className="mb-3">
                <strong>Current Jackpot:</strong> {lottery.currentJackpot}
              </div>
              <div className="mb-3">
                <strong>Next Draw:</strong> {formatDate(lottery.nextDrawDate)}
              </div>
              <div className="mb-3">
                <strong>Ticket Price:</strong> €{lottery.ticketPrice.toFixed(2)}
              </div>
              <div className="mt-4">
                {sortedDraws.filter(draw => draw.status === 'upcoming')[0] && (
                  <Link to={`/lotteries/${lottery.id}/buy-tickets/${sortedDraws.filter(draw => draw.status === 'upcoming')[0].id}`}>
                    <Button variant="success" size="lg" className="w-100">
                      Buy Tickets for Next Draw
                    </Button>
                  </Link>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col>
          <h2>About {lottery.name}</h2>
          <p>{lottery.longDescription}</p>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col>
          <h2>Prize Structure and Odds</h2>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Match</th>
                <th>Prize</th>
                <th>Odds</th>
              </tr>
            </thead>
            <tbody>
              {lottery.rulesAndOdds.split('\n').map((line, index) => {
                const [match, prizeAndOdds] = line.split(':');
                const [prize, odds] = prizeAndOdds.trim().split('(');
                return (
                  <tr key={index}>
                    <td>{match}</td>
                    <td>{prize.trim()}</td>
                    <td>{odds ? odds.replace(')', '') : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
      
      <Row className="mb-5">
        <Col>
          <h2>Upcoming Draws</h2>
          <Table responsive>
            <thead>
              <tr>
                <th>Draw Date</th>
                <th>Jackpot</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedDraws.filter(draw => draw.status === 'upcoming').map(draw => (
                <tr key={draw.id}>
                  <td>{formatDate(draw.drawDate)}</td>
                  <td>{draw.jackpot}</td>
                  <td>
                    <Badge bg="primary">Upcoming</Badge>
                  </td>
                  <td>
                    {draw.ticketsAvailable ? (
                      <Link to={`/lotteries/${lottery.id}/buy-tickets/${draw.id}`}>
                        <Button variant="success" size="sm">Buy Tickets</Button>
                      </Link>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>Closed</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <h2>Past Results</h2>
          <Table responsive>
            <thead>
              <tr>
                <th>Draw Date</th>
                <th>Winning Numbers</th>
                <th>Jackpot</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedDraws.filter(draw => draw.status === 'completed').map(draw => (
                <tr key={draw.id}>
                  <td>{formatDate(draw.drawDate)}</td>
                  <td>
                    {draw.winningNumbers?.map(num => (
                      <Badge bg="light" text="dark" className="me-1" key={num}>
                        {num}
                      </Badge>
                    ))}
                    {draw.luckyStars && ' Lucky Stars: '}
                    {draw.luckyStars?.map(num => (
                      <Badge bg="warning" text="dark" className="me-1" key={num}>
                        {num}
                      </Badge>
                    ))}
                  </td>
                  <td>{draw.jackpot}</td>
                  <td>
                    <Link to={`/draws/${draw.id}`}>
                      <Button variant="info" size="sm">View Results</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default LotteryDetails;