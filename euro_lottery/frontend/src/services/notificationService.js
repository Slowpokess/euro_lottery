// Notification service to handle WebSocket connection and push notifications
import { fetchUserNotifications, addNotification } from '../store/slices/notificationSlice';
import socketService from './socketService';

class NotificationService {
  constructor() {
    this.connected = false;
    this.handlers = {};
    this.store = null;
    this.userId = null;
    this.token = null;
  }

  // Initialize the service with Redux store
  init(store) {
    this.store = store;
    
    // Register socket event handlers
    socketService.on('connect', this.handleSocketConnect.bind(this));
    socketService.on('notification', this.handleNotification.bind(this));
    socketService.on('error', this.handleSocketError.bind(this));
    socketService.on('disconnect', this.handleSocketDisconnect.bind(this));
    
    // Listen for auth state changes
    store.subscribe(() => {
      const state = store.getState();
      const { user, isAuthenticated } = state.auth;
      
      if (isAuthenticated && user && user.id !== this.userId) {
        // User logged in or changed, connect to WebSocket
        this.userId = user.id;
        this.token = localStorage.getItem('accessToken');
        this.connect();
      } else if (!isAuthenticated && this.connected) {
        // User logged out, disconnect WebSocket
        this.disconnect();
        this.userId = null;
        this.token = null;
      }
    });
    
    // Initial check for authenticated user
    const { auth } = store.getState();
    if (auth.isAuthenticated && auth.user) {
      this.userId = auth.user.id;
      this.token = localStorage.getItem('accessToken');
      this.connect();
    }
    
    // Request push notification permission
    this.requestNotificationPermission();
    
    return this;
  }

  // Connect to WebSocket server
  connect() {
    if (!this.userId || !this.token) {
      return this;
    }
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = process.env.REACT_APP_WS_URL || 
        (process.env.REACT_APP_API_URL 
          ? process.env.REACT_APP_API_URL.replace(/^https?:\/\//, '') 
          : window.location.host);
          
      const wsUrl = `${protocol}://${host}/ws/notifications/?token=${this.token}`;
      
      // Connect using socket service
      socketService.connect(wsUrl);
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
    
    return this;
  }

  // Disconnect from WebSocket server
  disconnect() {
    socketService.disconnect();
    this.connected = false;
    return this;
  }

  // Socket event handlers
  handleSocketConnect() {
    console.log('WebSocket connection established');
    this.connected = true;
    
    // Trigger event
    this.triggerEvent('connection', { connected: true });
  }

  handleSocketDisconnect(data) {
    this.connected = false;
    console.log(`WebSocket connection closed: ${data?.reason || 'Unknown reason'}`);
    
    // Trigger event
    this.triggerEvent('connection', { connected: false });
  }

  handleSocketError(error) {
    console.error('WebSocket error:', error);
    this.triggerEvent('error', error);
  }

  handleNotification(data) {
    try {
      if (data && data.notification) {
        // Add notification to Redux store
        this.store.dispatch(addNotification(data.notification));
        
        // Fetch all notifications to ensure correct count
        this.store.dispatch(fetchUserNotifications());
        
        // Show browser notification if enabled
        this.showBrowserNotification(data.notification);
        
        // Trigger notification event for components
        this.triggerEvent('notification', data.notification);
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  // Request browser push notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support push notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  // Show browser notification
  async showBrowserNotification(notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    // Don't show notifications if the user is currently viewing the app
    if (document.visibilityState === 'visible') {
      return;
    }
    
    try {
      const title = notification.title || 'Euro Lottery';
      const options = {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/favicon.ico',
        data: notification,
        tag: `notification-${notification.id}`,
        renotify: true,
        requireInteraction: notification.priority === 'high'
      };
      
      const browserNotification = new Notification(title, options);
      
      browserNotification.onclick = () => {
        window.focus();
        
        // Navigate to relevant page based on notification type
        if (notification.related_object_type === 'draw') {
          window.location.href = `/draws/${notification.related_object_id}`;
        } else if (notification.notification_type === 'winning') {
          window.location.href = `/my-tickets/${notification.data?.ticket_id || ''}`;
        } else if (notification.notification_type.includes('deposit') || 
                   notification.notification_type.includes('withdrawal')) {
          window.location.href = '/wallet';
        } else if (notification.notification_type === 'ticket_purchased') {
          window.location.href = `/my-tickets/${notification.data?.ticket_id || ''}`;
        }
        
        // Close the notification
        browserNotification.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  // Register event handler
  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    
    this.handlers[event].push(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler);
    };
  }

  // Trigger event handlers
  triggerEvent(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in notification event handler for ${event}:`, error);
        }
      });
    }
  }
  
  // Subscribe to push notifications on the server
  async subscribeToNotifications(subscription) {
    // Convert subscription to string if it's an object
    const subscriptionString = typeof subscription === 'object' 
      ? JSON.stringify(subscription) 
      : subscription;
    
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ subscription: subscriptionString })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }
}

export default new NotificationService();