import React, { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { FaBell, FaEnvelope, FaMobile, FaMoneyBillWave, FaTicketAlt, FaTrophy, FaMegaphone } from 'react-icons/fa';
import { fetchNotificationSettings, updateNotificationSettings } from '../../store/slices/notificationSlice';
import { useTheme } from '../../context/ThemeContext';
import PremiumButton from '../../components/PremiumButton';
import notificationService from '../../services/notificationService';

const NotificationSettings = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { settings, settingsLoading, error } = useSelector(state => state.notifications);
  
  const [formData, setFormData] = useState({
    email_notifications: true,
    push_notifications: true,
    draw_reminders: true,
    winning_notifications: true,
    promotional_notifications: true,
    transaction_notifications: true
  });
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [browserNotificationsSupported, setBrowserNotificationsSupported] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  
  // Check if browser notifications are supported and enabled
  useEffect(() => {
    // Check if browser supports notifications
    const isSupported = 'Notification' in window;
    setBrowserNotificationsSupported(isSupported);
    
    // Check if notifications are already enabled
    if (isSupported) {
      setBrowserNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);
  
  // Fetch notification settings on component mount
  useEffect(() => {
    dispatch(fetchNotificationSettings());
  }, [dispatch]);
  
  // Update local form state when settings are fetched
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // Reset success message when form is changed
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };
  
  // Request browser notification permission
  const requestBrowserPermission = async () => {
    const granted = await notificationService.requestNotificationPermission();
    setBrowserNotificationsEnabled(granted);
    
    if (granted) {
      setFormData(prev => ({
        ...prev,
        push_notifications: true
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    dispatch(updateNotificationSettings(formData))
      .unwrap()
      .then(() => {
        setSaveSuccess(true);
        
        // Reset success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      });
  };
  
  // Card style based on theme
  const cardStyle = {
    backgroundColor: theme?.name === 'dark' ? theme?.colors?.cardBg : '#fff',
    borderColor: theme?.colors?.border,
    boxShadow: theme?.name === 'dark' 
      ? '0 4px 6px rgba(0, 0, 0, 0.2)' 
      : '0 4px 6px rgba(0, 0, 0, 0.05)'
  };
  
  // Section heading style
  const sectionHeadingStyle = {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: theme?.colors?.text,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };
  
  return (
    <Container className="py-4">
      <h1 className="mb-4" style={{ color: theme?.colors?.text }}>Notification Settings</h1>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error.message || 'Failed to update notification settings. Please try again.'}
        </Alert>
      )}
      
      {/* Success Alert */}
      {saveSuccess && (
        <Alert variant="success" className="mb-4">
          Your notification settings have been saved successfully.
        </Alert>
      )}
      
      <Form onSubmit={handleSubmit}>
        {/* Notification Channels */}
        <Card className="mb-4" style={cardStyle}>
          <Card.Body>
            <div style={sectionHeadingStyle}>
              <FaBell />
              Notification Channels
            </div>
            
            <Row>
              {/* Email Notifications */}
              <Col md={6}>
                <Form.Group className="mb-3" controlId="emailNotifications">
                  <Form.Check 
                    type="switch"
                    label={
                      <div className="d-flex align-items-center">
                        <FaEnvelope className="me-2" style={{ color: theme?.colors?.primary }} />
                        Email Notifications
                      </div>
                    }
                    name="email_notifications"
                    checked={formData.email_notifications}
                    onChange={handleChange}
                  />
                  <Form.Text muted>
                    Receive notifications to your registered email address.
                  </Form.Text>
                </Form.Group>
              </Col>
              
              {/* Browser Push Notifications */}
              <Col md={6}>
                <Form.Group className="mb-3" controlId="pushNotifications">
                  <Form.Check 
                    type="switch"
                    label={
                      <div className="d-flex align-items-center">
                        <FaMobile className="me-2" style={{ color: theme?.colors?.secondary }} />
                        Browser Push Notifications
                      </div>
                    }
                    name="push_notifications"
                    checked={formData.push_notifications && browserNotificationsEnabled}
                    onChange={handleChange}
                    disabled={!browserNotificationsSupported || !browserNotificationsEnabled}
                  />
                  <Form.Text muted>
                    {!browserNotificationsSupported ? (
                      'Your browser does not support push notifications.'
                    ) : !browserNotificationsEnabled ? (
                      <>
                        Browser notifications are not enabled. 
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 ms-1"
                          onClick={requestBrowserPermission}
                          style={{ color: theme?.colors?.primary }}
                        >
                          Enable now
                        </Button>
                      </>
                    ) : (
                      'Receive real-time notifications in your browser.'
                    )}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Notification Types */}
        <Card className="mb-4" style={cardStyle}>
          <Card.Body>
            <div style={sectionHeadingStyle}>
              <FaBell />
              Notification Types
            </div>
            
            <Row>
              {/* Draw Reminders */}
              <Col md={6}>
                <Form.Group className="mb-3" controlId="drawReminders">
                  <Form.Check 
                    type="switch"
                    label={
                      <div className="d-flex align-items-center">
                        <FaTicketAlt className="me-2" style={{ color: theme?.colors?.primary }} />
                        Draw Reminders
                      </div>
                    }
                    name="draw_reminders"
                    checked={formData.draw_reminders}
                    onChange={handleChange}
                  />
                  <Form.Text muted>
                    Receive reminders about upcoming draws before they close.
                  </Form.Text>
                </Form.Group>
              </Col>
              
              {/* Winning Notifications */}
              <Col md={6}>
                <Form.Group className="mb-3" controlId="winningNotifications">
                  <Form.Check 
                    type="switch"
                    label={
                      <div className="d-flex align-items-center">
                        <FaTrophy className="me-2" style={{ color: theme?.colors?.success }} />
                        Winning Notifications
                      </div>
                    }
                    name="winning_notifications"
                    checked={formData.winning_notifications}
                    onChange={handleChange}
                  />
                  <Form.Text muted>
                    Receive notifications when you win in any lottery draw.
                  </Form.Text>
                </Form.Group>
              </Col>
              
              {/* Transaction Notifications */}
              <Col md={6}>
                <Form.Group className="mb-3" controlId="transactionNotifications">
                  <Form.Check 
                    type="switch"
                    label={
                      <div className="d-flex align-items-center">
                        <FaMoneyBillWave className="me-2" style={{ color: theme?.colors?.tertiary }} />
                        Transaction Notifications
                      </div>
                    }
                    name="transaction_notifications"
                    checked={formData.transaction_notifications}
                    onChange={handleChange}
                  />
                  <Form.Text muted>
                    Receive notifications about deposits, withdrawals, and other account transactions.
                  </Form.Text>
                </Form.Group>
              </Col>
              
              {/* Promotional Notifications */}
              <Col md={6}>
                <Form.Group className="mb-3" controlId="promotionalNotifications">
                  <Form.Check 
                    type="switch"
                    label={
                      <div className="d-flex align-items-center">
                        <FaMegaphone className="me-2" style={{ color: theme?.colors?.secondary }} />
                        Promotional Notifications
                      </div>
                    }
                    name="promotional_notifications"
                    checked={formData.promotional_notifications}
                    onChange={handleChange}
                  />
                  <Form.Text muted>
                    Receive updates about special offers, bonuses, and promotions.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Save Button */}
        <div className="text-end">
          <PremiumButton 
            type="submit" 
            size="lg" 
            disabled={settingsLoading}
          >
            {settingsLoading ? (
              <>
                <Spinner 
                  as="span" 
                  animation="border" 
                  size="sm" 
                  role="status" 
                  aria-hidden="true" 
                  className="me-2"
                />
                Saving...
              </>
            ) : 'Save Settings'}
          </PremiumButton>
        </div>
      </Form>
    </Container>
  );
};

export default NotificationSettings;