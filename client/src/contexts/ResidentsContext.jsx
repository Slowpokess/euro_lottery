import React, { createContext, useContext, useReducer } from 'react';
import { getResidents, getResidentById, createResident, updateResident, deleteResident } from '../services/residents';

// Initial state
const initialState = {
  residents: [],
  currentResident: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 25,
    search: '',
    category: '',
    status: 'active',
    sort: 'name'
  }
};

// Action types
const RESIDENTS_REQUEST = 'RESIDENTS_REQUEST';
const RESIDENTS_SUCCESS = 'RESIDENTS_SUCCESS';
const RESIDENTS_FAILURE = 'RESIDENTS_FAILURE';
const RESIDENT_ITEM_SUCCESS = 'RESIDENT_ITEM_SUCCESS';
const RESIDENT_CREATE_SUCCESS = 'RESIDENT_CREATE_SUCCESS';
const RESIDENT_UPDATE_SUCCESS = 'RESIDENT_UPDATE_SUCCESS';
const RESIDENT_DELETE_SUCCESS = 'RESIDENT_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const residentsReducer = (state, action) => {
  switch (action.type) {
    case RESIDENTS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case RESIDENTS_SUCCESS:
      return {
        ...state,
        residents: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case RESIDENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case RESIDENT_ITEM_SUCCESS:
      return {
        ...state,
        currentResident: action.payload,
        loading: false,
        error: null
      };
    case RESIDENT_CREATE_SUCCESS:
      return {
        ...state,
        residents: [action.payload, ...state.residents],
        loading: false,
        error: null
      };
    case RESIDENT_UPDATE_SUCCESS:
      return {
        ...state,
        residents: state.residents.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentResident: action.payload,
        loading: false,
        error: null
      };
    case RESIDENT_DELETE_SUCCESS:
      return {
        ...state,
        residents: state.residents.filter(item => item._id !== action.payload),
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
const ResidentsContext = createContext();

// Context provider
export const ResidentsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(residentsReducer, initialState);

  // Actions
  const fetchResidents = async (params = {}) => {
    dispatch({ type: RESIDENTS_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getResidents(mergedParams);
      dispatch({ 
        type: RESIDENTS_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RESIDENTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке резидентов' 
      });
      throw error;
    }
  };

  const fetchResidentById = async (id) => {
    dispatch({ type: RESIDENTS_REQUEST });
    try {
      const response = await getResidentById(id);
      dispatch({ 
        type: RESIDENT_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RESIDENTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке резидента' 
      });
      throw error;
    }
  };

  const addResident = async (residentData) => {
    dispatch({ type: RESIDENTS_REQUEST });
    try {
      const response = await createResident(residentData);
      dispatch({ 
        type: RESIDENT_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RESIDENTS_FAILURE, 
        payload: error.error || 'Ошибка при создании резидента' 
      });
      throw error;
    }
  };

  const editResident = async (id, residentData) => {
    dispatch({ type: RESIDENTS_REQUEST });
    try {
      const response = await updateResident(id, residentData);
      dispatch({ 
        type: RESIDENT_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: RESIDENTS_FAILURE, 
        payload: error.error || 'Ошибка при обновлении резидента' 
      });
      throw error;
    }
  };

  const removeResident = async (id) => {
    dispatch({ type: RESIDENTS_REQUEST });
    try {
      await deleteResident(id);
      dispatch({ 
        type: RESIDENT_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      dispatch({ 
        type: RESIDENTS_FAILURE, 
        payload: error.error || 'Ошибка при удалении резидента' 
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
    <ResidentsContext.Provider
      value={{
        ...state,
        fetchResidents,
        fetchResidentById,
        addResident,
        editResident,
        removeResident,
        setFilters
      }}
    >
      {children}
    </ResidentsContext.Provider>
  );
};

// Custom hook
export const useResidents = () => {
  const context = useContext(ResidentsContext);
  if (!context) {
    throw new Error('useResidents must be used within a ResidentsProvider');
  }
  return context;
};