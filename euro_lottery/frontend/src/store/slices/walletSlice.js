import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (params, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/payments/transactions/`;
      
      if (params) {
        const queryParams = new URLSearchParams();
        
        if (params.type) {
          queryParams.append('type', params.type);
        }
        
        if (params.status) {
          queryParams.append('status', params.status);
        }
        
        if (params.start_date) {
          queryParams.append('start_date', params.start_date);
        }
        
        if (params.end_date) {
          queryParams.append('end_date', params.end_date);
        }
        
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch transactions' });
      }
    }
  }
);

export const fetchTransactionDetails = createAsyncThunk(
  'wallet/fetchTransactionDetails',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/payments/transactions/${transactionId}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch transaction details' });
      }
    }
  }
);

export const fetchPaymentMethods = createAsyncThunk(
  'wallet/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/payments/payment-methods/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch payment methods' });
      }
    }
  }
);

export const addPaymentMethod = createAsyncThunk(
  'wallet/addPaymentMethod',
  async (methodData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/payment-methods/add/`, methodData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to add payment method' });
      }
    }
  }
);

export const deletePaymentMethod = createAsyncThunk(
  'wallet/deletePaymentMethod',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/payments/payment-methods/${id}/delete/`);
      return id;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to delete payment method' });
      }
    }
  }
);

export const setDefaultPaymentMethod = createAsyncThunk(
  'wallet/setDefaultPaymentMethod',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/payment-methods/${id}/set-default/`);
      return { id, response: response.data };
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to set default payment method' });
      }
    }
  }
);

export const initiateDeposit = createAsyncThunk(
  'wallet/initiateDeposit',
  async (depositData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/deposit/initiate/`, depositData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to initiate deposit' });
      }
    }
  }
);

export const confirmDeposit = createAsyncThunk(
  'wallet/confirmDeposit',
  async (confirmData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/deposit/confirm/`, confirmData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to confirm deposit' });
      }
    }
  }
);

export const cancelDeposit = createAsyncThunk(
  'wallet/cancelDeposit',
  async (cancelData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/deposit/cancel/`, cancelData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to cancel deposit' });
      }
    }
  }
);

export const requestWithdrawal = createAsyncThunk(
  'wallet/requestWithdrawal',
  async (withdrawalData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/withdrawal/request/`, withdrawalData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to request withdrawal' });
      }
    }
  }
);

export const fetchWithdrawalStatus = createAsyncThunk(
  'wallet/fetchWithdrawalStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/payments/withdrawal/status/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch withdrawal status' });
      }
    }
  }
);

export const cancelWithdrawal = createAsyncThunk(
  'wallet/cancelWithdrawal',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/payments/withdrawal/cancel/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to cancel withdrawal' });
      }
    }
  }
);

// Initial state
const initialState = {
  transactions: [],
  currentTransaction: null,
  paymentMethods: [],
  depositData: null,
  withdrawalData: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  message: null
};

// Create slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    clearWalletMessage: (state) => {
      state.message = null;
    },
    resetWalletState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions cases
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch transactions' };
      })
      
      // Fetch transaction details cases
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch transaction details' };
      })
      
      // Fetch payment methods cases
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.paymentMethods = action.payload;
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch payment methods' };
      })
      
      // Add payment method cases
      .addCase(addPaymentMethod.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.paymentMethods.push(action.payload);
        state.message = 'Payment method added successfully';
      })
      .addCase(addPaymentMethod.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to add payment method' };
      })
      
      // Delete payment method cases
      .addCase(deletePaymentMethod.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload);
        state.message = 'Payment method deleted successfully';
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to delete payment method' };
      })
      
      // Set default payment method cases
      .addCase(setDefaultPaymentMethod.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(setDefaultPaymentMethod.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Update all payment methods to non-default
        state.paymentMethods = state.paymentMethods.map(method => ({
          ...method,
          is_default: method.id === action.payload.id
        }));
        
        state.message = 'Default payment method updated successfully';
      })
      .addCase(setDefaultPaymentMethod.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to set default payment method' };
      })
      
      // Initiate deposit cases
      .addCase(initiateDeposit.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initiateDeposit.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.depositData = action.payload;
        state.message = 'Deposit initiated successfully';
      })
      .addCase(initiateDeposit.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to initiate deposit' };
      })
      
      // Confirm deposit cases
      .addCase(confirmDeposit.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(confirmDeposit.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.depositData = null; // Clear deposit data after completion
        
        // Add transaction to list if not already there
        const transactionId = action.payload.transaction_id;
        const exists = state.transactions.some(t => t.transaction_id === transactionId);
        
        if (!exists && state.transactions.length > 0) {
          state.transactions.unshift({
            transaction_id: transactionId,
            amount: action.payload.amount,
            status: 'completed',
            transaction_type: 'deposit',
            created_at: new Date().toISOString()
          });
        }
        
        state.message = 'Deposit completed successfully';
      })
      .addCase(confirmDeposit.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to confirm deposit' };
      })
      
      // Cancel deposit cases
      .addCase(cancelDeposit.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(cancelDeposit.fulfilled, (state) => {
        state.status = 'succeeded';
        state.depositData = null; // Clear deposit data after cancellation
        state.message = 'Deposit cancelled successfully';
      })
      .addCase(cancelDeposit.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to cancel deposit' };
      })
      
      // Request withdrawal cases
      .addCase(requestWithdrawal.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.withdrawalData = action.payload;
        
        // Add transaction to list if not already there
        const transactionId = action.payload.transaction_id;
        const exists = state.transactions.some(t => t.transaction_id === transactionId);
        
        if (!exists && state.transactions.length > 0) {
          state.transactions.unshift({
            transaction_id: transactionId,
            amount: action.payload.amount,
            status: 'pending',
            transaction_type: 'withdrawal',
            created_at: new Date().toISOString()
          });
        }
        
        state.message = 'Withdrawal request submitted successfully';
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to request withdrawal' };
      })
      
      // Fetch withdrawal status cases
      .addCase(fetchWithdrawalStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWithdrawalStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.withdrawalData = action.payload;
      })
      .addCase(fetchWithdrawalStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch withdrawal status' };
      })
      
      // Cancel withdrawal cases
      .addCase(cancelWithdrawal.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(cancelWithdrawal.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.withdrawalData = null; // Clear withdrawal data after cancellation
        
        // Update transaction in list if exists
        if (state.transactions.length > 0) {
          state.transactions = state.transactions.map(t => {
            if (t.transaction_id === action.payload.transaction_id) {
              return { ...t, status: 'cancelled' };
            }
            return t;
          });
        }
        
        state.message = 'Withdrawal cancelled successfully';
      })
      .addCase(cancelWithdrawal.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to cancel withdrawal' };
      })
  }
});

// Export actions and reducer
export const { clearWalletError, clearWalletMessage, resetWalletState } = walletSlice.actions;
export default walletSlice.reducer;