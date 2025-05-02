import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Alert, Spinner, Button } from 'react-bootstrap';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    // In a real app, this would call an API endpoint to verify the token
    console.log('Verifying email with token:', token);
    
    // Simulate API call
    const timeoutId = setTimeout(() => {
      // Simulate successful verification
      setStatus('success');
      setMessage('Your email has been successfully verified!');
      
      // If needed, simulate an error instead:
      // setStatus('error');
      // setMessage('Invalid or expired verification token.');
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [token]);

  return (
    <div className="verify-email-page">
      <h2 className="auth-title">Email Verification</h2>
      
      {status === 'verifying' && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Verifying your email address...</p>
        </div>
      )}
      
      {status === 'success' && (
        <Alert variant="success">
          <h4>Email Verified!</h4>
          <p>{message}</p>
          <div className="mt-3">
            <Link to="/login" className="btn btn-primary">Login to Your Account</Link>
          </div>
        </Alert>
      )}
      
      {status === 'error' && (
        <Alert variant="danger">
          <h4>Verification Failed</h4>
          <p>{message}</p>
          <div className="mt-3">
            <Link to="/login" className="btn btn-outline-primary">Back to Login</Link>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default VerifyEmail;