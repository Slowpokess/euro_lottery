// WebSocket service for managing connections
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectInterval = 1000;
    this.events = {};
    this.pendingMessages = [];
    this.url = null;
    this.options = {};
  }

  // Initialize the socket connection
  connect(url, options = {}) {
    if (this.socket) {
      this.disconnect();
    }

    this.url = url;
    this.options = options;
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
    
    return this;
  }

  // Disconnect the socket
  disconnect() {
    if (this.socket) {
      // Clear event handlers to avoid memory leaks
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      // Close the connection
      if (this.socket.readyState === WebSocket.OPEN || 
          this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
    this.clearReconnectTimer();
    this.emit('disconnect', { reason: 'Disconnected by client' });
    
    return this;
  }

  // Send a message if connected or queue it
  send(data) {
    if (!data) return false;
    
    // Convert data to string if it's an object
    const message = typeof data === 'object' ? JSON.stringify(data) : data;
    
    if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    } else {
      // Queue the message to send when connected
      this.pendingMessages.push(message);
      
      // If not connected, try to reconnect
      if (!this.isConnected) {
        this.reconnect();
      }
      
      return false;
    }
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback);
    
    return this;
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (this.events[event]) {
      if (callback) {
        this.events[event] = this.events[event].filter(cb => cb !== callback);
      } else {
        delete this.events[event];
      }
    }
    
    return this;
  }

  // Emit an event
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket ${event} handler:`, error);
        }
      });
    }
    
    // Always emit to the 'all' event
    if (event !== 'all' && this.events['all']) {
      this.events['all'].forEach(callback => {
        try {
          callback({ event, data });
        } catch (error) {
          console.error('Error in WebSocket "all" event handler:', error);
        }
      });
    }
    
    return this;
  }

  // Force a reconnection attempt
  reconnect() {
    this.clearReconnectTimer();
    
    if (this.socket && 
        (this.socket.readyState === WebSocket.OPEN || 
         this.socket.readyState === WebSocket.CONNECTING)) {
      return this;
    }
    
    if (this.url) {
      this.connect(this.url, this.options);
    }
    
    return this;
  }

  // WebSocket event handlers
  handleOpen() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Send any pending messages
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      this.send(message);
    }
    
    this.emit('connect', { timestamp: Date.now() });
  }

  handleMessage(event) {
    try {
      let data = event.data;
      
      // Try to parse JSON data
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        // If it's not JSON, leave as is
      }
      
      // Emit message event
      this.emit('message', data);
      
      // If the message has a type field, emit an event for that type
      if (data && data.type) {
        this.emit(data.type, data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  handleClose(event) {
    this.isConnected = false;
    
    const wasClean = event.wasClean;
    const code = event.code;
    const reason = event.reason;
    
    // Emit close event
    this.emit('close', { wasClean, code, reason });
    
    // Don't reconnect if it was a clean closure (code 1000)
    if (!wasClean && code !== 1000) {
      this.scheduleReconnect();
    }
  }

  handleError(error) {
    this.emit('error', error);
  }

  // Helper methods
  scheduleReconnect() {
    this.clearReconnectTimer();
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed', { 
        attempts: this.reconnectAttempts,
        max: this.maxReconnectAttempts
      });
      return;
    }
    
    // Exponential backoff for reconnection
    const delay = Math.min(
      30000, // Max 30 seconds
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts)
    );
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.emit('reconnect_attempt', { attempt: this.reconnectAttempts });
      
      if (this.url) {
        this.connect(this.url, this.options);
      }
    }, delay);
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Check connection state
  isConnecting() {
    return this.socket && this.socket.readyState === WebSocket.CONNECTING;
  }

  isOpen() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  isClosing() {
    return this.socket && this.socket.readyState === WebSocket.CLOSING;
  }

  isClosed() {
    return !this.socket || this.socket.readyState === WebSocket.CLOSED;
  }
}

// Export a singleton instance
export default new SocketService();