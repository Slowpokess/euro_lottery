import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchUserTickets = createAsyncThunk(
  'tickets/fetchUserTickets',
  async (params, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/lottery/tickets/`;
      
      if (params) {
        const queryParams = new URLSearchParams();
        
        if (params.draw_id) {
          queryParams.append('draw_id', params.draw_id);
        }
        
        if (params.result_status) {
          queryParams.append('result_status', params.result_status);
        }
        
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch user tickets' });
      }
    }
  }
);

export const fetchTicketDetails = createAsyncThunk(
  'tickets/fetchTicketDetails',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/tickets/${ticketId}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch ticket details' });
      }
    }
  }
);

export const purchaseTicket = createAsyncThunk(
  'tickets/purchaseTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/lottery/tickets/purchase/`, ticketData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to purchase ticket' });
      }
    }
  }
);

export const checkTicket = createAsyncThunk(
  'tickets/checkTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/tickets/check/${ticketId}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to check ticket' });
      }
    }
  }
);

export const fetchUserWinnings = createAsyncThunk(
  'tickets/fetchUserWinnings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/winnings/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch user winnings' });
      }
    }
  }
);

export const fetchWinningDetails = createAsyncThunk(
  'tickets/fetchWinningDetails',
  async (winningId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/winnings/${winningId}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch winning details' });
      }
    }
  }
);

export const fetchSavedCombinations = createAsyncThunk(
  'tickets/fetchSavedCombinations',
  async (lotteryId, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/lottery/saved-combinations/`;
      
      if (lotteryId) {
        url += `?lottery_id=${lotteryId}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch saved combinations' });
      }
    }
  }
);

export const createSavedCombination = createAsyncThunk(
  'tickets/createSavedCombination',
  async (combinationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/lottery/saved-combinations/create/`, combinationData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to save combination' });
      }
    }
  }
);

export const updateSavedCombination = createAsyncThunk(
  'tickets/updateSavedCombination',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/lottery/saved-combinations/${id}/`, data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to update saved combination' });
      }
    }
  }
);

export const deleteSavedCombination = createAsyncThunk(
  'tickets/deleteSavedCombination',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/lottery/saved-combinations/${id}/delete/`);
      return id;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to delete saved combination' });
      }
    }
  }
);

// Initial state
const initialState = {
  userTickets: [],
  currentTicket: null,
  userWinnings: [],
  currentWinning: null,
  savedCombinations: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  message: null,
  purchaseSuccess: false
};

// Create slice
const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearTicketError: (state) => {
      state.error = null;
    },
    clearTicketMessage: (state) => {
      state.message = null;
    },
    resetPurchaseSuccess: (state) => {
      state.purchaseSuccess = false;
    },
    resetTicketState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch user tickets cases
      .addCase(fetchUserTickets.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userTickets = action.payload;
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch user tickets' };
      })
      
      // Fetch ticket details cases
      .addCase(fetchTicketDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTicketDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch ticket details' };
      })
      
      // Purchase ticket cases
      .addCase(purchaseTicket.pending, (state) => {
        state.status = 'loading';
        state.purchaseSuccess = false;
      })
      .addCase(purchaseTicket.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = 'Ticket purchased successfully';
        state.purchaseSuccess = true;
        
        // Add purchased tickets to user tickets list
        if (action.payload.tickets && Array.isArray(action.payload.tickets)) {
          state.userTickets = [...state.userTickets, ...action.payload.tickets];
        }
      })
      .addCase(purchaseTicket.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to purchase ticket' };
        state.purchaseSuccess = false;
      })
      
      // Check ticket cases
      .addCase(checkTicket.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(checkTicket.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Update current ticket with check results
        if (action.payload.ticket) {
          state.currentTicket = action.payload.ticket;
        }
        
        // Add message if available
        if (action.payload.message) {
          state.message = action.payload.message;
        }
      })
      .addCase(checkTicket.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to check ticket' };
      })
      
      // Fetch user winnings cases
      .addCase(fetchUserWinnings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserWinnings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userWinnings = action.payload;
      })
      .addCase(fetchUserWinnings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch user winnings' };
      })
      
      // Fetch winning details cases
      .addCase(fetchWinningDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWinningDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentWinning = action.payload;
      })
      .addCase(fetchWinningDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch winning details' };
      })
      
      // Fetch saved combinations cases
      .addCase(fetchSavedCombinations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSavedCombinations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.savedCombinations = action.payload;
      })
      .addCase(fetchSavedCombinations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch saved combinations' };
      })
      
      // Create saved combination cases
      .addCase(createSavedCombination.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createSavedCombination.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.savedCombinations.push(action.payload);
        state.message = 'Combination saved successfully';
      })
      .addCase(createSavedCombination.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to save combination' };
      })
      
      // Update saved combination cases
      .addCase(updateSavedCombination.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateSavedCombination.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Update combination in the list
        const index = state.savedCombinations.findIndex(comb => comb.id === action.payload.id);
        if (index !== -1) {
          state.savedCombinations[index] = action.payload;
        }
        
        state.message = 'Combination updated successfully';
      })
      .addCase(updateSavedCombination.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to update combination' };
      })
      
      // Delete saved combination cases
      .addCase(deleteSavedCombination.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteSavedCombination.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Remove combination from the list
        state.savedCombinations = state.savedCombinations.filter(comb => comb.id !== action.payload);
        
        state.message = 'Combination deleted successfully';
      })
      .addCase(deleteSavedCombination.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to delete combination' };
      });
  }
});

// Export actions and reducer
export const { 
  clearTicketError, 
  clearTicketMessage, 
  resetPurchaseSuccess, 
  resetTicketState 
} = ticketSlice.actions;

export default ticketSlice.reducer;