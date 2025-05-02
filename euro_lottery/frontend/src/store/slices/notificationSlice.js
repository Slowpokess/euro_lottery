import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchUserNotifications = createAsyncThunk(
  'notifications/fetchUserNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/notifications/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch notifications' });
      }
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}/users/notifications/${notificationId}/mark-read/`);
      return notificationId;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to mark notification as read' });
      }
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}/users/notifications/mark-all-read/`);
      return true;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to mark all notifications as read' });
      }
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/users/notification-settings/`, settings);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to update notification settings' });
      }
    }
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  'notifications/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/notification-settings/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch notification settings' });
      }
    }
  }
);

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    email_notifications: true,
    push_notifications: true,
    draw_reminders: true,
    winning_notifications: true,
    promotional_notifications: true,
    transaction_notifications: true
  },
  loading: false,
  settingsLoading: false,
  error: null
};

// Create slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      // Add new notification from WebSocket
      state.notifications.unshift(action.payload);
      
      // If not read, increment unread count
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications cases
      .addCase(fetchUserNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unread_count || 0;
      })
      .addCase(fetchUserNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to fetch notifications' };
      })
      
      // Mark notification as read cases
      .addCase(markNotificationAsRead.pending, (state) => {
        // No state changes needed, handled optimistically
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        // Update the notification's read status optimistically
        const notificationId = action.payload;
        
        // Find notification and mark as read
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          notification.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload || { message: 'Failed to mark notification as read' };
      })
      
      // Mark all notifications as read cases
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        // No state changes needed, handled optimistically
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        // Mark all notifications as read
        state.notifications.forEach(notification => {
          notification.is_read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload || { message: 'Failed to mark all notifications as read' };
      })
      
      // Update notification settings cases
      .addCase(updateNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.error = action.payload || { message: 'Failed to update notification settings' };
      })
      
      // Fetch notification settings cases
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.error = action.payload || { message: 'Failed to fetch notification settings' };
      })
  }
});

// Export actions and reducer
export const { clearNotificationError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;