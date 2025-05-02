import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const NotFound = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  return (
    <Container className="not-found-page py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h1 className="display-1 text-primary">404</h1>
          <h2 className="mb-4">Page Not Found</h2>
          <p className="lead mb-5">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <div>
            {isAuthenticated ? (
              <Link to="/">
                <Button variant="primary" size="lg">
                  Return to Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="lg">
                  Go to Login
                </Button>
              </Link>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;