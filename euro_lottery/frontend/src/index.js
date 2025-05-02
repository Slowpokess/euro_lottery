import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './store';
import { initAuth } from './services/authInit';
import './index.css';
import './styles/global.css';

// Render function that we'll call after auth initialization
const renderApp = () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
};

// Initialize authentication first, then render app
// This ensures our auth state is properly set up before rendering
initAuth().then((isAuthenticated) => {
  console.log('Auth initialization complete, authenticated:', isAuthenticated);
  renderApp();
}).catch(error => {
  console.error('Auth initialization error:', error);
  // Still render app even if auth initialization fails
  renderApp();
});