import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const DrawResults = () => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  // Simulate loading data from API
  useEffect(() => {
    // Mock data
    const mockResults = [
      {
        id: 100,
        lotteryId: 1,
        lotteryName: 'EuroMillions',
        drawDate: '2025-04-23T20:00:00',
        jackpot: '€115,000,000',
        winningNumbers: [3, 17, 24, 33, 46],
        luckyStars: [7, 11],
        status: 'completed',
        hasWinners: true,
        totalPrize: '€127,845,123'
      },
      {
        id: 99,
        lotteryId: 1,
        lotteryName: 'EuroMillions',
        drawDate: '2025-04-19T20:00:00',
        jackpot: '€100,000,000',
        winningNumbers: [5, 12, 23, 34, 45],
        luckyStars: [7, 9],
        status: 'completed',
        hasWinners: false,
        totalPrize: '€8,432,765'
      },
      {
        id: 200,
        lotteryId: 2,
        lotteryName: 'EuroJackpot',
        drawDate: '2025-04-22T20:00:00',
        jackpot: '€90,000,000',
        winningNumbers: [8, 19, 24, 36, 48],
        luckyStars: [3, 8],
        status: 'completed',
        hasWinners: true,
        totalPrize: '€97,154,322'
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      setResults(mockResults);
      setLoading(false);
    }, 1000);
  }, []);

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

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading draw results...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">Latest Draw Results</h1>
      
      {results.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="mb-4">No draw results available yet.</p>
            <Link to="/lotteries">
              <Button variant="primary">View Available Lotteries</Button>
            </Link>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} className="g-4">
          {results.map(result => (
            <Col key={result.id}>
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{result.lotteryName}</h5>
                  <span className="text-muted">{formatDate(result.drawDate)}</span>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <h6>Winning Numbers</h6>
                        <div className="d-flex flex-wrap">
                          {result.winningNumbers.map(num => (
                            <Badge bg="primary" className="me-2 mb-2 p-2" key={num}>
                              {num}
                            </Badge>
                          ))}
                          {result.luckyStars && (
                            <>
                              <span className="me-2 align-self-center">Lucky Stars:</span>
                              {result.luckyStars.map(num => (
                                <Badge bg="warning" text="dark" className="me-2 mb-2 p-2" key={num}>
                                  {num}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <Table bordered size="sm">
                        <tbody>
                          <tr>
                            <td>Jackpot</td>
                            <td>{result.jackpot}</td>
                          </tr>
                          <tr>
                            <td>Jackpot Winner</td>
                            <td>{result.hasWinners ? 'Yes' : 'No'}</td>
                          </tr>
                          <tr>
                            <td>Total Prize Fund</td>
                            <td>{result.totalPrize}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer className="text-center bg-white border-top-0">
                  <Link to={`/draws/${result.id}`}>
                    <Button variant="outline-primary">View Details</Button>
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default DrawResults;