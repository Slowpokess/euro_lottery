import React, { createContext, useContext, useReducer } from 'react';
import { getPromotions, getPromotionById, createPromotion, updatePromotion, deletePromotion } from '../services/promotions';

// Initial state
const initialState = {
  promotions: [],
  currentPromotion: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    status: 'active',
    sort: 'order'
  }
};

// Action types
const PROMOTIONS_REQUEST = 'PROMOTIONS_REQUEST';
const PROMOTIONS_SUCCESS = 'PROMOTIONS_SUCCESS';
const PROMOTIONS_FAILURE = 'PROMOTIONS_FAILURE';
const PROMOTION_ITEM_SUCCESS = 'PROMOTION_ITEM_SUCCESS';
const PROMOTION_CREATE_SUCCESS = 'PROMOTION_CREATE_SUCCESS';
const PROMOTION_UPDATE_SUCCESS = 'PROMOTION_UPDATE_SUCCESS';
const PROMOTION_DELETE_SUCCESS = 'PROMOTION_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const promotionsReducer = (state, action) => {
  switch (action.type) {
    case PROMOTIONS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case PROMOTIONS_SUCCESS:
      return {
        ...state,
        promotions: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case PROMOTIONS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case PROMOTION_ITEM_SUCCESS:
      return {
        ...state,
        currentPromotion: action.payload,
        loading: false,
        error: null
      };
    case PROMOTION_CREATE_SUCCESS:
      return {
        ...state,
        promotions: [action.payload, ...state.promotions],
        loading: false,
        error: null
      };
    case PROMOTION_UPDATE_SUCCESS:
      return {
        ...state,
        promotions: state.promotions.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentPromotion: action.payload,
        loading: false,
        error: null
      };
    case PROMOTION_DELETE_SUCCESS:
      return {
        ...state,
        promotions: state.promotions.filter(item => item._id !== action.payload),
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
const PromotionsContext = createContext();

// Context provider
export const PromotionsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(promotionsReducer, initialState);

  // Actions
  const fetchPromotions = async (params = {}) => {
    dispatch({ type: PROMOTIONS_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getPromotions(mergedParams);
      dispatch({ 
        type: PROMOTIONS_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при загрузке услуг промоушена';
      dispatch({ 
        type: PROMOTIONS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const fetchPromotionById = async (id) => {
    dispatch({ type: PROMOTIONS_REQUEST });
    try {
      const response = await getPromotionById(id);
      dispatch({ 
        type: PROMOTION_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при загрузке услуги промоушена';
      dispatch({ 
        type: PROMOTIONS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const addPromotion = async (promotionData) => {
    dispatch({ type: PROMOTIONS_REQUEST });
    try {
      const response = await createPromotion(promotionData);
      dispatch({ 
        type: PROMOTION_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при создании услуги промоушена';
      dispatch({ 
        type: PROMOTIONS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const editPromotion = async (id, promotionData) => {
    dispatch({ type: PROMOTIONS_REQUEST });
    try {
      const response = await updatePromotion(id, promotionData);
      dispatch({ 
        type: PROMOTION_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при обновлении услуги промоушена';
      dispatch({ 
        type: PROMOTIONS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const removePromotion = async (id) => {
    dispatch({ type: PROMOTIONS_REQUEST });
    try {
      await deletePromotion(id);
      dispatch({ 
        type: PROMOTION_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при удалении услуги промоушена';
      dispatch({ 
        type: PROMOTIONS_FAILURE, 
        payload: errorMessage 
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
    <PromotionsContext.Provider
      value={{
        ...state,
        fetchPromotions,
        fetchPromotionById,
        addPromotion,
        editPromotion,
        removePromotion,
        setFilters
      }}
    >
      {children}
    </PromotionsContext.Provider>
  );
};

// Custom hook
export const usePromotions = () => {
  const context = useContext(PromotionsContext);
  if (!context) {
    throw new Error('usePromotions must be used within a PromotionsProvider');
  }
  return context;
};