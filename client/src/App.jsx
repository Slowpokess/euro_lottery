import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from './contexts';

// Common UI components loaded eagerly
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import NotificationsContainer from './components/ui/NotificationsContainer';
import Modal from './components/ui/Modal';
// Импортируем компонент LoadingSpinner
import LoadingSpinner from './components/ui/LoadingSpinner';

// Error boundary components
import ErrorBoundary from './components/ErrorBoundary';
import AdminErrorBoundary from './components/admin/AdminErrorBoundary';

// Auth components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Core styles
import './styles/global.css';
import './styles/admin.css';
import './App.css';

// Lazy load page components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Spaces = lazy(() => import('./pages/Spaces'));
const Residents = lazy(() => import('./pages/Residents'));
const Rent = lazy(() => import('./pages/Rent'));
const Promotion = lazy(() => import('./pages/Promotion'));
const Events = lazy(() => import('./pages/Events'));
const Contacts = lazy(() => import('./pages/Contacts'));

// Admin pages - lazy loaded
const Login = lazy(() => import('./pages/Admin/Login'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminEvents = lazy(() => import('./pages/Admin/Events/EventsList'));
const EventForm = lazy(() => import('./pages/Admin/Events/EventForm'));
const AdminEquipment = lazy(() => import('./pages/Admin/Equipment'));
const News = lazy(() => import('./pages/Admin/News'));
const RentRequests = lazy(() => import('./pages/Admin/RentRequests'));
const AdminPromotion = lazy(() => import('./pages/Admin/Promotion'));

// Loading fallback component
const PageLoader = () => {
  return (
    <div className="page-loader">
      <LoadingSpinner />
    </div>
  );
};

// Standard page layout wrapper
const PageLayout = ({ children }) => (
  <div className="app">
    <Navbar />
    <main className="main-content">
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </main>
    <Footer />
  </div>
);

function App() {
  // Error handler
  const handleError = (error) => {
    console.error('Caught app error:', error);
  }

  return (
    <ErrorBoundary onError={handleError} fallback={<div>Произошла ошибка приложения. Пожалуйста, перезагрузите страницу.</div>}>
      <AppProviders>
        <NotificationsContainer />
        <Modal />
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PageLayout>
                <Home />
              </PageLayout>
            } />
            
            <Route path="/about" element={
              <PageLayout>
                <About />
              </PageLayout>
            } />
            
            <Route path="/spaces" element={
              <PageLayout>
                <Spaces />
              </PageLayout>
            } />
            
            <Route path="/residents" element={
              <PageLayout>
                <Residents />
              </PageLayout>
            } />
            
            <Route path="/rent" element={
              <PageLayout>
                <Rent />
              </PageLayout>
            } />
            
            <Route path="/promotion" element={
              <PageLayout>
                <Promotion />
              </PageLayout>
            } />
            
            <Route path="/events" element={
              <PageLayout>
                <Events />
              </PageLayout>
            } />
            
            <Route path="/contacts" element={
              <PageLayout>
                <Contacts />
              </PageLayout>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={
              <ErrorBoundary name="AdminLogin">
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              </ErrorBoundary>
            } />
            
            {/* Dashboard */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminDashboard">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Events */}
            <Route path="/admin/events" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminEvents">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <AdminEvents />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/events/create" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminEventForm">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <EventForm />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            <Route path="/admin/events/edit/:id" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminEventEdit">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <EventForm />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Equipment using the index.jsx */}
            <Route path="/admin/equipment/*" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminEquipment">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <AdminEquipment />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* News */}
            <Route path="/admin/news/*" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminNews">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <News />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Rent Requests */}
            <Route path="/admin/rent-requests/*" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminRentRequests">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <RentRequests />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Promotion */}
            <Route path="/admin/promotion/*" element={
              <ProtectedRoute>
                <AdminErrorBoundary name="AdminPromotion">
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard>
                      <AdminPromotion />
                    </Dashboard>
                  </Suspense>
                </AdminErrorBoundary>
              </ProtectedRoute>
            } />
            
            {/* Not found route */}
            <Route path="*" element={
              <Navigate to="/" replace />
            } />
          </Routes>
        </Suspense>
      </Router>
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;