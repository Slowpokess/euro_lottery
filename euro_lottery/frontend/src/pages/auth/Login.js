import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Validation schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
});

const Login = () => {
  const navigate = useNavigate();
  const [localError, setLocalError] = useState(null);

  // Handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    console.log('Login with:', values);
    
    try {
      // Demo credentials for testing
      if (values.email === 'demo@example.com' && values.password === 'password123') {
        // Set global auth state for demo
        window.isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        // Demo mode - accept any credentials for ease of testing
        window.isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (error) {
      setLocalError('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <h2 className="auth-title">Login to Your Account</h2>
      
      {localError && (
        <Alert variant="danger" onClose={() => setLocalError(null)} dismissible>
          {localError}
        </Alert>
      )}
      
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
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
            <Form.Group className="mb-3">
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
            
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Enter your password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.password && errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
              <div className="mt-2 text-end">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting}
              className="w-100 mb-3"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
            
            <div className="text-center mt-4">
              <p>
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Login;