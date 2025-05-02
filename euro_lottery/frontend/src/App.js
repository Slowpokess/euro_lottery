import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider } from './context/ThemeContext';
import store from './store';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import notificationService from './services/notificationService';
import networkService from './services/networkService';
import tokenMonitor from './services/tokenMonitor';
import { LoadingProvider, GlobalLoadingOverlay, MinimalLoadingIndicator } from './components/LoadingOverlay';
import NetworkStatusBar from './components/NetworkStatusBar';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Main Pages
import Dashboard from './pages/dashboard/Dashboard';
import LotteryList from './pages/lottery/LotteryList';
import LotteryDetails from './pages/lottery/LotteryDetails';
import BuyTickets from './pages/lottery/BuyTickets';
import DrawResults from './pages/lottery/DrawResults';
import DrawDetails from './pages/lottery/DrawDetails';
import MyTickets from './pages/account/MyTickets';
import TicketDetails from './pages/account/TicketDetails';
import Wallet from './pages/account/Wallet';
import TransactionHistory from './pages/account/TransactionHistory';
import LotteryStatistics from './pages/account/LotteryStatistics';
import NotificationSettings from './pages/account/NotificationSettings';
import NotFound from './pages/NotFound';

// Private Route Component with token validation
const PrivateRoute = ({ children }) => {
  // Access directly from Redux store for component rendering
  const isAuthenticated = store.getState().auth.isAuthenticated;
  
  // Also check if tokens exist
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // Ensure both Redux state and tokens are valid
  const isValidSession = isAuthenticated && accessToken && refreshToken;
  
  // Validate current session
  useEffect(() => {
    if (isValidSession) {
      // Check tokens and refresh if needed
      tokenMonitor.checkTokens();
    }
  }, [isValidSession]);
  
  return isValidSession ? children : <Navigate to="/login" replace />;
};

// Prop types validation
PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function App() {
  // Initialize services
  useEffect(() => {
    // Инициализация сервиса уведомлений
    notificationService.init(store);
    
    // Инициализация сетевого сервиса
    networkService.init();
    
    // Инициализация мониторинга токенов
    tokenMonitor.startMonitoring();
    
    // Cleanup function for unmounting
    return () => {
      tokenMonitor.stopMonitoring();
    };
  }, []);
  
  return (
    <Provider store={store}>
      <ThemeProvider>
        <LoadingProvider>
          <Router>
            {/* Индикаторы загрузки */}
            <GlobalLoadingOverlay />
            <MinimalLoadingIndicator position="top-right" />
            
            {/* Индикатор сетевого статуса */}
            <NetworkStatusBar />
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
            </Route>
            
            {/* Main Application Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              
              {/* Lottery Routes */}
              <Route path="/lotteries" element={
                <PrivateRoute>
                  <LotteryList />
                </PrivateRoute>
              } />
              <Route path="/lotteries/:id" element={
                <PrivateRoute>
                  <LotteryDetails />
                </PrivateRoute>
              } />
              <Route path="/lotteries/:id/buy-tickets/:drawId" element={
                <PrivateRoute>
                  <BuyTickets />
                </PrivateRoute>
              } />
              
              {/* Lottery Draws Routes */}
              <Route path="/draws" element={
                <PrivateRoute>
                  <DrawResults />
                </PrivateRoute>
              } />
              <Route path="/draws/:id" element={
                <PrivateRoute>
                  <DrawDetails />
                </PrivateRoute>
              } />
              
              {/* Account Routes */}
              <Route path="/my-tickets" element={
                <PrivateRoute>
                  <MyTickets />
                </PrivateRoute>
              } />
              <Route path="/my-tickets/:id" element={
                <PrivateRoute>
                  <TicketDetails />
                </PrivateRoute>
              } />
              <Route path="/wallet" element={
                <PrivateRoute>
                  <Wallet />
                </PrivateRoute>
              } />
              <Route path="/transaction-history" element={
                <PrivateRoute>
                  <TransactionHistory />
                </PrivateRoute>
              } />
              <Route path="/lottery-statistics" element={
                <PrivateRoute>
                  <LotteryStatistics />
                </PrivateRoute>
              } />
              <Route path="/notifications" element={
                <PrivateRoute>
                  <NotificationSettings />
                </PrivateRoute>
              } />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Router>
        </LoadingProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;