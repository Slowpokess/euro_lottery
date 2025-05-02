import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { Container, Image } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { FaTicketAlt } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

const AuthLayout = () => {
  const { isAuthenticated } = useSelector(state => state.auth || { isAuthenticated: false });
  const theme = useTheme();
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated || localStorage.getItem('isLoggedIn') === 'true') {
    return <Navigate to="/" replace />;
  }

  return (
    <div 
      className="auth-layout" 
      style={{ 
        backgroundColor: theme?.colors?.background || '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Container className="auth-container">
        <div 
          className="auth-card"
          style={{
            backgroundColor: theme?.colors?.card || 'white',
            borderRadius: theme?.borderRadius || '8px',
            boxShadow: theme?.shadows?.md || '0 4px 6px rgba(0,0,0,0.1)',
            padding: '30px',
            maxWidth: '450px',
            margin: '0 auto',
            transition: 'box-shadow 0.3s ease'
          }}
        >
          <div className="auth-logo text-center mb-4">
            <Link to="/" className="text-decoration-none">
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <FaTicketAlt 
                  size={32} 
                  style={{ 
                    color: theme?.colors?.primary || '#3f51b5',
                    marginRight: '10px'
                  }} 
                />
                <h1 
                  style={{ 
                    color: theme?.colors?.primary || '#3f51b5',
                    margin: 0,
                    fontSize: '28px'
                  }}
                >
                  Euro Lottery
                </h1>
              </div>
            </Link>
            <p 
              className="mt-2 text-muted"
              style={{ 
                color: theme?.colors?.textLight || '#757575'
              }}
            >
              Your gateway to European lotteries
            </p>
          </div>
          <Outlet />
        </div>
      </Container>
    </div>
  );
};

export default AuthLayout;