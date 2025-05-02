import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchLotteryGames = createAsyncThunk(
  'lottery/fetchGames',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/games/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch lottery games' });
      }
    }
  }
);

export const fetchLotteryDetails = createAsyncThunk(
  'lottery/fetchDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/games/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch lottery details' });
      }
    }
  }
);

export const fetchDraws = createAsyncThunk(
  'lottery/fetchDraws',
  async (params, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/lottery/draws/`;
      
      if (params) {
        const queryParams = new URLSearchParams();
        
        if (params.lottery_id) {
          queryParams.append('lottery_id', params.lottery_id);
        }
        
        if (params.status) {
          queryParams.append('status', params.status);
        }
        
        url += `?${queryParams.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch draws' });
      }
    }
  }
);

export const fetchUpcomingDraws = createAsyncThunk(
  'lottery/fetchUpcomingDraws',
  async (lotteryId, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/lottery/draws/upcoming/`;
      
      if (lotteryId) {
        url += `?lottery_id=${lotteryId}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch upcoming draws' });
      }
    }
  }
);

export const fetchDrawResults = createAsyncThunk(
  'lottery/fetchDrawResults',
  async (lotteryId, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/lottery/draws/results/`;
      
      if (lotteryId) {
        url += `?lottery_id=${lotteryId}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch draw results' });
      }
    }
  }
);

export const fetchDrawDetails = createAsyncThunk(
  'lottery/fetchDrawDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/lottery/draws/${id}/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch draw details' });
      }
    }
  }
);

export const fetchLotteryStatistics = createAsyncThunk(
  'lottery/fetchStatistics',
  async (lotteryId, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/lottery/statistics/`;
      
      if (lotteryId) {
        url += `?lottery_id=${lotteryId}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch lottery statistics' });
      }
    }
  }
);

export const fetchHotNumbers = createAsyncThunk(
  'lottery/fetchHotNumbers',
  async (lotteryId, { rejectWithValue }) => {
    try {
      if (!lotteryId) {
        return rejectWithValue({ message: 'Lottery ID is required' });
      }
      
      const response = await axios.get(`${API_URL}/lottery/hot-numbers/?lottery_id=${lotteryId}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch hot numbers' });
      }
    }
  }
);

// Initial state
const initialState = {
  games: [],
  currentGame: null,
  draws: [],
  upcomingDraws: [],
  drawResults: [],
  currentDraw: null,
  statistics: null,
  hotNumbers: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

// Create slice
const lotterySlice = createSlice({
  name: 'lottery',
  initialState,
  reducers: {
    clearLotteryError: (state) => {
      state.error = null;
    },
    resetLotteryState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch lottery games cases
      .addCase(fetchLotteryGames.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLotteryGames.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.games = action.payload;
      })
      .addCase(fetchLotteryGames.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch lottery games' };
      })
      
      // Fetch lottery details cases
      .addCase(fetchLotteryDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLotteryDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentGame = action.payload;
      })
      .addCase(fetchLotteryDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch lottery details' };
      })
      
      // Fetch draws cases
      .addCase(fetchDraws.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDraws.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.draws = action.payload;
      })
      .addCase(fetchDraws.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch draws' };
      })
      
      // Fetch upcoming draws cases
      .addCase(fetchUpcomingDraws.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUpcomingDraws.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.upcomingDraws = action.payload;
      })
      .addCase(fetchUpcomingDraws.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch upcoming draws' };
      })
      
      // Fetch draw results cases
      .addCase(fetchDrawResults.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDrawResults.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.drawResults = action.payload;
      })
      .addCase(fetchDrawResults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch draw results' };
      })
      
      // Fetch draw details cases
      .addCase(fetchDrawDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDrawDetails.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentDraw = action.payload;
      })
      .addCase(fetchDrawDetails.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch draw details' };
      })
      
      // Fetch lottery statistics cases
      .addCase(fetchLotteryStatistics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLotteryStatistics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.statistics = action.payload;
      })
      .addCase(fetchLotteryStatistics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch lottery statistics' };
      })
      
      // Fetch hot numbers cases
      .addCase(fetchHotNumbers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHotNumbers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hotNumbers = action.payload;
      })
      .addCase(fetchHotNumbers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch hot numbers' };
      });
  }
});

// Export actions and reducer
export const { clearLotteryError, resetLotteryState } = lotterySlice.actions;
export default lotterySlice.reducer;