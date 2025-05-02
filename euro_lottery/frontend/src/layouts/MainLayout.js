import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { 
  FaHome, FaTicketAlt, FaMoneyBillWave, FaUserAlt, 
  FaHistory, FaSignOutAlt, FaChartLine, FaUsers, 
  FaMoon, FaSun, FaBell
} from 'react-icons/fa';
import { logoutUser } from '../store/slices/authSlice';
import { useTheme } from '../context/ThemeContext';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { fetchUserNotifications } from '../store/slices/notificationSlice';

const MainLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { balance } = useSelector(state => state.user?.profile || { balance: 0 });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);
  const theme = useTheme();
  
  // Check authentication and fetch initial notifications
  useEffect(() => {
    if (!isAuthenticated && localStorage.getItem('isLoggedIn') !== 'true') {
      navigate('/login');
    } else if (isAuthenticated) {
      // Fetch notifications on initial load
      dispatch(fetchUserNotifications());
    }
  }, [isAuthenticated, navigate, dispatch]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        navigate('/login');
      })
      .catch(error => {
        console.error('Logout failed:', error);
        // Still redirect to login even if API fails
        navigate('/login');
      });
  };

  return (
    <div className="main-layout" style={{ 
      backgroundColor: theme?.colors?.background || '#f5f5f5',
      color: theme?.colors?.text || '#333333'
    }}>
      {/* Header */}
      <Navbar 
        bg={theme?.name === 'dark' ? 'dark' : 'light'} 
        variant={theme?.name === 'dark' ? 'dark' : 'light'}
        expand="lg" 
        className="main-header"
        style={{ 
          boxShadow: theme?.shadows?.sm || '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Container fluid>
          <Navbar.Brand 
            onClick={() => navigate('/')} 
            className="logo"
            style={{ cursor: 'pointer' }}
          >
            <FaTicketAlt className="me-2" /> Euro Lottery
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto">
              <div className="d-flex align-items-center">
                {/* Notification Center */}
                <NotificationCenter />
                
                {/* Theme Toggle */}
                {theme && (
                  <Button 
                    variant={theme.name === 'dark' ? 'outline-light' : 'outline-dark'} 
                    size="sm"
                    className="me-3"
                    onClick={theme.toggleTheme}
                    aria-label="Toggle theme"
                  >
                    {theme.name === 'dark' ? <FaSun /> : <FaMoon />}
                  </Button>
                )}
                
                {/* Balance Display */}
                <div 
                  className="balance-display me-3"
                  style={{
                    backgroundColor: theme?.colors?.primary || '#3f51b5',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  Balance: €{balance ? balance.toFixed(2) : '0.00'}
                </div>
                
                <Button 
                  variant="outline-primary" 
                  className="me-3"
                  onClick={() => navigate('/wallet')}
                >
                  Deposit
                </Button>
                
                <NavDropdown 
                  title={user?.username || 'Account'} 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item onClick={() => navigate('/profile')}>
                    <FaUserAlt className="me-2" /> My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/wallet')}>
                    <FaMoneyBillWave className="me-2" /> My Wallet
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/notifications')}>
                    <FaBell className="me-2" /> Notification Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <div className="d-flex flex-column flex-md-row">
        {/* Sidebar */}
        <div 
          className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileView ? 'mobile' : ''}`}
          style={{ 
            backgroundColor: theme?.colors?.card || 'white',
            boxShadow: theme?.shadows?.sm || '0 2px 4px rgba(0,0,0,0.1)',
            width: collapsed ? '64px' : (mobileView ? '100%' : '250px'),
            height: mobileView ? 'auto' : 'calc(100vh - 64px)',
            position: mobileView ? 'relative' : 'fixed',
            zIndex: 10
          }}
        >
          <div className={`sidebar-items ${mobileView ? 'd-flex flex-row overflow-auto' : 'd-flex flex-column'}`}>
            <Nav.Link 
              className="sidebar-item" 
              onClick={() => navigate('/')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaHome className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">Dashboard</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/lotteries')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaTicketAlt className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">Lotteries</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/draws')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaChartLine className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">Results</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/my-tickets')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaTicketAlt className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">My Tickets</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/wallet')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaMoneyBillWave className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">Wallet</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/transactions')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaHistory className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">History</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/profile')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaUserAlt className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">Profile</span>}
            </Nav.Link>
            
            <Nav.Link
              className="sidebar-item"
              onClick={() => navigate('/referrals')}
              style={{ 
                color: theme?.colors?.text || '#333333',
                padding: mobileView ? '10px 15px' : '12px 20px'
              }}
            >
              <FaUsers className="sidebar-icon" />
              {!collapsed && !mobileView && <span className="sidebar-text">Referrals</span>}
            </Nav.Link>
            
            {!mobileView && (
              <Nav.Link
                className="sidebar-item"
                onClick={handleLogout}
                style={{ 
                  color: theme?.colors?.text || '#333333',
                  padding: '12px 20px',
                  marginTop: 'auto'
                }}
              >
                <FaSignOutAlt className="sidebar-icon" />
                {!collapsed && <span className="sidebar-text">Logout</span>}
              </Nav.Link>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="main-content"
          style={{ 
            marginLeft: mobileView ? '0' : (collapsed ? '64px' : '250px'),
            padding: '20px',
            width: '100%',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Container fluid>
            <Outlet />
          </Container>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;