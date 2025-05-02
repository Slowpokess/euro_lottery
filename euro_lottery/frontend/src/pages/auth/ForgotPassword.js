import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    // In a real app, this would call an API endpoint
    console.log('Sending password reset to:', values.email);
    
    // Simulate API call
    setTimeout(() => {
      setSuccess(true);
      setSubmitting(false);
    }, 1000);
  };

  if (success) {
    return (
      <div className="forgot-password-page">
        <Alert variant="success">
          <h4>Password Reset Email Sent</h4>
          <p>We've sent instructions to reset your password to your email address.</p>
          <p>Please check your inbox and follow the instructions in the email.</p>
          <div className="mt-3">
            <Link to="/login" className="btn btn-primary">Return to Login</Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="forgot-password-page">
      <h2 className="auth-title">Reset Your Password</h2>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <p className="text-center mb-4">
        Enter your email address and we'll send you instructions to reset your password.
      </p>
      
      <Formik
        initialValues={{ email: '' }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting
        }) => (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.email && errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting}
              className="w-100 mb-3"
            >
              {isSubmitting ? 'Sending...' : 'Reset Password'}
            </Button>
            
            <div className="text-center mt-3">
              <Link to="/login">Back to Login</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ForgotPassword;