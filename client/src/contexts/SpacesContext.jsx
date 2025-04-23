import React, { createContext, useContext, useReducer } from 'react';
import { getSpaces, getSpaceById, getSpaceByCustomId, createSpace, updateSpace, deleteSpace } from '../services/spaces';

// Initial state
const initialState = {
  spaces: [],
  currentSpace: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 25,
    search: '',
    status: 'available',
    sort: 'name'
  }
};

// Action types
const SPACES_REQUEST = 'SPACES_REQUEST';
const SPACES_SUCCESS = 'SPACES_SUCCESS';
const SPACES_FAILURE = 'SPACES_FAILURE';
const SPACE_ITEM_SUCCESS = 'SPACE_ITEM_SUCCESS';
const SPACE_CREATE_SUCCESS = 'SPACE_CREATE_SUCCESS';
const SPACE_UPDATE_SUCCESS = 'SPACE_UPDATE_SUCCESS';
const SPACE_DELETE_SUCCESS = 'SPACE_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const spacesReducer = (state, action) => {
  switch (action.type) {
    case SPACES_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case SPACES_SUCCESS:
      return {
        ...state,
        spaces: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case SPACES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case SPACE_ITEM_SUCCESS:
      return {
        ...state,
        currentSpace: action.payload,
        loading: false,
        error: null
      };
    case SPACE_CREATE_SUCCESS:
      return {
        ...state,
        spaces: [action.payload, ...state.spaces],
        loading: false,
        error: null
      };
    case SPACE_UPDATE_SUCCESS:
      return {
        ...state,
        spaces: state.spaces.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentSpace: action.payload,
        loading: false,
        error: null
      };
    case SPACE_DELETE_SUCCESS:
      return {
        ...state,
        spaces: state.spaces.filter(item => item._id !== action.payload),
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
const SpacesContext = createContext();

// Context provider
export const SpacesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(spacesReducer, initialState);

  // Actions
  const fetchSpaces = async (params = {}) => {
    dispatch({ type: SPACES_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getSpaces(mergedParams);
      dispatch({ 
        type: SPACES_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: SPACES_FAILURE, 
        payload: error.error || 'Ошибка при загрузке пространств' 
      });
      throw error;
    }
  };

  const fetchSpaceById = async (id) => {
    dispatch({ type: SPACES_REQUEST });
    try {
      const response = await getSpaceById(id);
      dispatch({ 
        type: SPACE_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: SPACES_FAILURE, 
        payload: error.error || 'Ошибка при загрузке пространства' 
      });
      throw error;
    }
  };

  const fetchSpaceByCustomId = async (customId) => {
    dispatch({ type: SPACES_REQUEST });
    try {
      const response = await getSpaceByCustomId(customId);
      dispatch({ 
        type: SPACE_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: SPACES_FAILURE, 
        payload: error.error || 'Ошибка при загрузке пространства' 
      });
      throw error;
    }
  };

  const addSpace = async (spaceData) => {
    dispatch({ type: SPACES_REQUEST });
    try {
      const response = await createSpace(spaceData);
      dispatch({ 
        type: SPACE_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: SPACES_FAILURE, 
        payload: error.error || 'Ошибка при создании пространства' 
      });
      throw error;
    }
  };

  const editSpace = async (id, spaceData) => {
    dispatch({ type: SPACES_REQUEST });
    try {
      const response = await updateSpace(id, spaceData);
      dispatch({ 
        type: SPACE_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: SPACES_FAILURE, 
        payload: error.error || 'Ошибка при обновлении пространства' 
      });
      throw error;
    }
  };

  const removeSpace = async (id) => {
    dispatch({ type: SPACES_REQUEST });
    try {
      await deleteSpace(id);
      dispatch({ 
        type: SPACE_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      dispatch({ 
        type: SPACES_FAILURE, 
        payload: error.error || 'Ошибка при удалении пространства' 
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
    <SpacesContext.Provider
      value={{
        ...state,
        fetchSpaces,
        fetchSpaceById,
        fetchSpaceByCustomId,
        addSpace,
        editSpace,
        removeSpace,
        setFilters
      }}
    >
      {children}
    </SpacesContext.Provider>
  );
};

// Custom hook
export const useSpaces = () => {
  const context = useContext(SpacesContext);
  if (!context) {
    throw new Error('useSpaces must be used within a SpacesProvider');
  }
  return context;
};