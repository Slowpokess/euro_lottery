import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/profile/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch user profile' });
      }
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/users/profile/update/`, userData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to update user profile' });
      }
    }
  }
);

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/change-password/`, passwordData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to change password' });
      }
    }
  }
);

export const uploadKYCDocument = createAsyncThunk(
  'user/uploadKYCDocument',
  async (documentData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('document_type', documentData.document_type);
      formData.append('document_file', documentData.document_file);
      
      const response = await axios.post(`${API_URL}/users/kyc/upload-document/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to upload document' });
      }
    }
  }
);

export const fetchKYCStatus = createAsyncThunk(
  'user/fetchKYCStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/kyc/status/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch KYC status' });
      }
    }
  }
);

export const fetchReferrals = createAsyncThunk(
  'user/fetchReferrals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/referrals/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch referrals' });
      }
    }
  }
);

export const fetchReferralCode = createAsyncThunk(
  'user/fetchReferralCode',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/referral-code/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch referral code' });
      }
    }
  }
);

export const updateGamingLimits = createAsyncThunk(
  'user/updateGamingLimits',
  async (limitsData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/responsible-gaming/limits/`, limitsData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to update gaming limits' });
      }
    }
  }
);

export const setSelfExclusion = createAsyncThunk(
  'user/setSelfExclusion',
  async (exclusionData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/users/responsible-gaming/self-exclusion/`, exclusionData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to set self-exclusion' });
      }
    }
  }
);

export const fetchUserActivity = createAsyncThunk(
  'user/fetchActivity',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users/activity/`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue({ message: 'Failed to fetch user activity' });
      }
    }
  }
);

// Initial state
const initialState = {
  profile: null,
  kycStatus: null,
  kycDocuments: [],
  referrals: [],
  referralCode: null,
  userActivity: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  message: null
};

// Create slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserMessage: (state) => {
      state.message = null;
    },
    resetUserState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch profile' };
      })
      
      // Update profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
        state.message = 'Profile updated successfully';
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to update profile' };
      })
      
      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = action.payload.message || 'Password changed successfully';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to change password' };
      })
      
      // KYC document upload cases
      .addCase(uploadKYCDocument.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(uploadKYCDocument.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = 'Document uploaded successfully';
        // Update KYC documents list if available
        if (state.kycDocuments && Array.isArray(state.kycDocuments)) {
          state.kycDocuments.push(action.payload);
        }
      })
      .addCase(uploadKYCDocument.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to upload document' };
      })
      
      // Fetch KYC status cases
      .addCase(fetchKYCStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchKYCStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.kycStatus = action.payload.kyc_status;
        state.kycDocuments = action.payload.documents;
      })
      .addCase(fetchKYCStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch KYC status' };
      })
      
      // Fetch referrals cases
      .addCase(fetchReferrals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReferrals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.referrals = action.payload;
      })
      .addCase(fetchReferrals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch referrals' };
      })
      
      // Fetch referral code cases
      .addCase(fetchReferralCode.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReferralCode.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.referralCode = action.payload;
      })
      .addCase(fetchReferralCode.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch referral code' };
      })
      
      // Update gaming limits cases
      .addCase(updateGamingLimits.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateGamingLimits.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = action.payload.message || 'Gaming limits updated successfully';
        if (state.profile) {
          state.profile.daily_limit = action.payload.daily_limit;
          state.profile.weekly_limit = action.payload.weekly_limit;
          state.profile.monthly_limit = action.payload.monthly_limit;
        }
      })
      .addCase(updateGamingLimits.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to update gaming limits' };
      })
      
      // Set self-exclusion cases
      .addCase(setSelfExclusion.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(setSelfExclusion.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.message = action.payload.message || 'Self-exclusion set successfully';
        if (state.profile) {
          state.profile.is_self_excluded = action.payload.is_self_excluded;
          state.profile.self_exclusion_end_date = action.payload.self_exclusion_end_date;
        }
      })
      .addCase(setSelfExclusion.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to set self-exclusion' };
      })
      
      // Fetch user activity cases
      .addCase(fetchUserActivity.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userActivity = action.payload;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Failed to fetch user activity' };
      });
  }
});

// Export actions and reducer
export const { clearUserError, clearUserMessage, resetUserState } = userSlice.actions;
export default userSlice.reducer;