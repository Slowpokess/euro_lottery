import React, { createContext, useContext, useReducer } from 'react';
import { 
  createRentRequest, 
  getRentRequests, 
  getRentRequest,
  updateRentRequestStatus,
  deleteRentRequest,
  getRentRequestsStats
} from '../services/rentRequests';

// Initial state
const initialState = {
  rentRequests: [],
  currentRentRequest: null,
  stats: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    sort: '-createdAt'
  }
};

// Action types
const RENT_REQUESTS_REQUEST = 'RENT_REQUESTS_REQUEST';
const RENT_REQUESTS_SUCCESS = 'RENT_REQUESTS_SUCCESS';
const RENT_REQUESTS_FAILURE = 'RENT_REQUESTS_FAILURE';
const RENT_REQUEST_ITEM_SUCCESS = 'RENT_REQUEST_ITEM_SUCCESS';
const RENT_REQUEST_CREATE_SUCCESS = 'RENT_REQUEST_CREATE_SUCCESS';
const RENT_REQUEST_UPDATE_SUCCESS = 'RENT_REQUEST_UPDATE_SUCCESS';
const RENT_REQUEST_DELETE_SUCCESS = 'RENT_REQUEST_DELETE_SUCCESS';
const RENT_REQUESTS_STATS_SUCCESS = 'RENT_REQUESTS_STATS_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const rentRequestsReducer = (state, action) => {
  switch (action.type) {
    case RENT_REQUESTS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case RENT_REQUESTS_SUCCESS:
      return {
        ...state,
        rentRequests: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case RENT_REQUESTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case RENT_REQUEST_ITEM_SUCCESS:
      return {
        ...state,
        currentRentRequest: action.payload,
        loading: false,
        error: null
      };
    case RENT_REQUEST_CREATE_SUCCESS:
      return {
        ...state,
        rentRequests: [action.payload, ...state.rentRequests],
        loading: false,
        error: null
      };
    case RENT_REQUEST_UPDATE_SUCCESS:
      return {
        ...state,
        rentRequests: state.rentRequests.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentRentRequest: action.payload,
        loading: false,
        error: null
      };
    case RENT_REQUEST_DELETE_SUCCESS:
      return {
        ...state,
        rentRequests: state.rentRequests.filter(item => item._id !== action.payload),
        loading: false,
        error: null
      };
    case RENT_REQUESTS_STATS_SUCCESS:
      return {
        ...state,
        stats: action.payload,
        loading: false,
        error: null
      };
    case SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    default:
      return state;
  }
};

// Create context
const RentRequestsContext = createContext();

// Context provider
export const RentRequestsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rentRequestsReducer, initialState);

  // Actions
  const fetchRentRequests = async (params = {}) => {
    dispatch({ type: RENT_REQUESTS_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getRentRequests(mergedParams);
      dispatch({ 
        type: RENT_REQUESTS_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RENT_REQUESTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке заявок' 
      });
      throw error;
    }
  };

  const fetchRentRequestById = async (id) => {
    dispatch({ type: RENT_REQUESTS_REQUEST });
    try {
      const response = await getRentRequest(id);
      dispatch({ 
        type: RENT_REQUEST_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RENT_REQUESTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке заявки' 
      });
      throw error;
    }
  };

  const submitRentRequest = async (requestData) => {
    dispatch({ type: RENT_REQUESTS_REQUEST });
    try {
      const response = await createRentRequest(requestData);
      dispatch({ 
        type: RENT_REQUEST_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RENT_REQUESTS_FAILURE, 
        payload: error.error || 'Ошибка при создании заявки' 
      });
      throw error;
    }
  };

  const updateRentRequest = async (id, statusData) => {
    dispatch({ type: RENT_REQUESTS_REQUEST });
    try {
      const response = await updateRentRequestStatus(id, statusData);
      dispatch({ 
        type: RENT_REQUEST_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RENT_REQUESTS_FAILURE, 
        payload: error.error || 'Ошибка при обновлении заявки' 
      });
      throw error;
    }
  };

  const removeRentRequest = async (id) => {
    dispatch({ type: RENT_REQUESTS_REQUEST });
    try {
      await deleteRentRequest(id);
      dispatch({ 
        type: RENT_REQUEST_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      dispatch({ 
        type: RENT_REQUESTS_FAILURE, 
        payload: error.error || 'Ошибка при удалении заявки' 
      });
      throw error;
    }
  };

  const fetchRentRequestStats = async () => {
    dispatch({ type: RENT_REQUESTS_REQUEST });
    try {
      const response = await getRentRequestsStats();
      dispatch({ 
        type: RENT_REQUESTS_STATS_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RENT_REQUESTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке статистики' 
      });
      throw error;
    }
  };

  const setFilters = (filters) => {
    dispatch({ 
      type: SET_FILTERS, 
      payload: filters 
    });
  };

  return (
    <RentRequestsContext.Provider
      value={{
        ...state,
        fetchRentRequests,
        fetchRentRequestById,
        submitRentRequest,
        updateRentRequest,
        removeRentRequest,
        fetchRentRequestStats,
        setFilters
      }}
    >
      {children}
    </RentRequestsContext.Provider>
  );
};

// Custom hook
export const useRentRequests = () => {
  const context = useContext(RentRequestsContext);
  if (!context) {
    throw new Error('useRentRequests must be used within a RentRequestsProvider');
  }
  return context;
};