import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { clearError, setLoggedIn } from '../../store/slices/authSlice';

// Validation schema
const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  password_confirm: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  first_name: Yup.string()
    .required('First name is required'),
  last_name: Yup.string()
    .required('Last name is required'),
  date_of_birth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old'),
  phone_number: Yup.string()
    .required('Phone number is required'),
  referral_code: Yup.string()
    .nullable(),
  terms_accepted: Yup.boolean()
    .required('You must accept the terms and conditions')
    .oneOf([true], 'You must accept the terms and conditions')
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector(state => state.auth);
  const [localError, setLocalError] = useState(null);
  
  // Get referral code from URL query params if present
  const queryParams = new URLSearchParams(location.search);
  const referralCode = queryParams.get('ref');

  // Clear errors when component mounts or unmounts
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    // DEMO MODE: Skip API call and simulate registration
    // In a real app, we would dispatch registerUser(values) here
    
    try {
      // Simulate successful registration with a demo user
      dispatch(setLoggedIn({
        user: {
          id: 1,
          name: values.first_name + ' ' + values.last_name,
          email: values.email,
          username: values.username,
          balance: 0
        },
        access: 'demo-access-token',
        refresh: 'demo-refresh-token'
      }));
      
      // Set localStorage for persistent state
      window.isLoggedIn = true;
      localStorage.setItem('isLoggedIn', 'true');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      setLocalError('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <h2 className="auth-title">Create Your Account</h2>
      
      {(error || localError) && (
        <Alert variant="danger" onClose={() => setLocalError(null)} dismissible>
          {error?.message || localError}
        </Alert>
      )}
      
      <Formik
        initialValues={{
          email: '',
          username: '',
          password: '',
          password_confirm: '',
          first_name: '',
          last_name: '',
          date_of_birth: '',
          phone_number: '',
          referral_code: referralCode || '',
          terms_accepted: false
        }}
        validationSchema={RegisterSchema}
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
            <Row>
              <Col md={6}>
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
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.username && errors.username}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.username}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Create a password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password && errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password_confirm"
                    placeholder="Confirm your password"
                    value={values.password_confirm}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.password_confirm && errors.password_confirm}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password_confirm}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    placeholder="Enter your first name"
                    value={values.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.first_name && errors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    placeholder="Enter your last name"
                    value={values.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.last_name && errors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={values.date_of_birth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.date_of_birth && errors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.date_of_birth}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    You must be at least 18 years old to register.
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone_number"
                    placeholder="Enter your phone number"
                    value={values.phone_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.phone_number && errors.phone_number}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone_number}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label>Referral Code (Optional)</Form.Label>
              <Form.Control
                type="text"
                name="referral_code"
                placeholder="Enter referral code if you have one"
                value={values.referral_code}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.referral_code && errors.referral_code}
              />
              <Form.Control.Feedback type="invalid">
                {errors.referral_code}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check
                type="checkbox"
                name="terms_accepted"
                label="I accept the Terms of Service and Privacy Policy"
                checked={values.terms_accepted}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.terms_accepted && errors.terms_accepted}
                feedback={errors.terms_accepted}
                feedbackType="invalid"
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting || status === 'loading'}
              className="w-100 mb-3"
            >
              {status === 'loading' ? 'Registering...' : 'Register'}
            </Button>
            
            <div className="text-center mt-4">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default Register;