import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/login/`, credentials);
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Login failed, please try again' });
      }
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/register/`, userData);
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Registration failed, please try again' });
      }
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await axios.post(`${API_URL}/users/logout/`, { refresh: refreshToken });
      }
      
      // Clear localStorage and axios headers regardless of API response
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      
      return { success: true };
    } catch (error) {
      // Even if API call fails, we still want to logout locally
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return { success: true };
      }
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return rejectWithValue({ message: 'No refresh token available' });
      }
      
      const response = await axios.post(`${API_URL}/users/token/refresh/`, {
        refresh: refreshToken
      });
      
      // Update access token in localStorage
      localStorage.setItem('accessToken', response.data.access);
      
      // If token rotation is enabled and a new refresh token is returned
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
      
      // Update auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      // Calculate token expiration time for proactive renewal
      const jwtPayload = JSON.parse(atob(response.data.access.split('.')[1]));
      if (jwtPayload && jwtPayload.exp) {
        // Set a timer to refresh the token before it expires (1 minute before)
        const expirationTime = jwtPayload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime - (60 * 1000); // Refresh 1 minute before expiry
        
        if (timeUntilExpiry > 0) {
          setTimeout(() => {
            dispatch(refreshToken());
          }, timeUntilExpiry);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If refresh token is invalid or expired, log the user out completely
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      
      // Force logout to update the entire application state
      dispatch(logoutUser());
      
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ 
          message: 'Your session has expired. Please log in again.',
          code: 'token_refresh_failed'
        });
      }
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/verify-email/${token}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Email verification failed' });
      }
    }
  }
);

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  tokenRefreshStatus: 'idle', // Status specific to token refresh operations
  lastTokenRefresh: null, // Timestamp of last successful token refresh
  tokenError: null, // Error related to token operations
  error: null,
  message: null
};

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    setLoggedIn: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.message = 'Successfully logged in';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Login failed' };
      })
      
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.message = action.payload.message || 'Successfully registered';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Registration failed' };
      })
      
      // Logout cases
      .addCase(logoutUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.message = 'Successfully logged out';
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even on API error, we still want to logout locally
        state.status = 'idle';
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.message = 'Successfully logged out';
      })
      
      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        state.tokenRefreshStatus = 'loading';
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access;
        state.tokenRefreshStatus = 'succeeded';
        state.lastTokenRefresh = Date.now();
        
        // Update refresh token if returned (token rotation)
        if (action.payload.refresh) {
          state.refreshToken = action.payload.refresh;
        }
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.tokenRefreshStatus = 'failed';
        state.tokenError = action.payload || { message: 'Session expired' };
      })
      
      // Verify email cases
      .addCase(verifyEmail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = action.payload.message || 'Email successfully verified';
        // If user is logged in, update verification status
        if (state.user) {
          state.user.is_verified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Email verification failed' };
      });
  }
});

// Export actions and reducer
export const { clearError, clearMessage, setLoggedIn } = authSlice.actions;
export default authSlice.reducer;