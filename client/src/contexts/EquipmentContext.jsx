import React, { createContext, useContext, useReducer } from 'react';
import { getEquipment, getEquipmentById, createEquipment, updateEquipment, deleteEquipment } from '../services/equipment';

// Initial state
const initialState = {
  equipment: [],
  currentEquipment: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    status: 'available',
    sort: 'name'
  }
};

// Action types
const EQUIPMENT_REQUEST = 'EQUIPMENT_REQUEST';
const EQUIPMENT_SUCCESS = 'EQUIPMENT_SUCCESS';
const EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE';
const EQUIPMENT_ITEM_SUCCESS = 'EQUIPMENT_ITEM_SUCCESS';
const EQUIPMENT_CREATE_SUCCESS = 'EQUIPMENT_CREATE_SUCCESS';
const EQUIPMENT_UPDATE_SUCCESS = 'EQUIPMENT_UPDATE_SUCCESS';
const EQUIPMENT_DELETE_SUCCESS = 'EQUIPMENT_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const equipmentReducer = (state, action) => {
  switch (action.type) {
    case EQUIPMENT_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case EQUIPMENT_SUCCESS:
      return {
        ...state,
        equipment: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case EQUIPMENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case EQUIPMENT_ITEM_SUCCESS:
      return {
        ...state,
        currentEquipment: action.payload,
        loading: false,
        error: null
      };
    case EQUIPMENT_CREATE_SUCCESS:
      return {
        ...state,
        equipment: [action.payload, ...state.equipment],
        loading: false,
        error: null
      };
    case EQUIPMENT_UPDATE_SUCCESS:
      return {
        ...state,
        equipment: state.equipment.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentEquipment: action.payload,
        loading: false,
        error: null
      };
    case EQUIPMENT_DELETE_SUCCESS:
      return {
        ...state,
        equipment: state.equipment.filter(item => item._id !== action.payload),
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
const EquipmentContext = createContext();

// Context provider
export const EquipmentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(equipmentReducer, initialState);

  // Actions
  const fetchEquipment = async (params = {}) => {
    dispatch({ type: EQUIPMENT_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getEquipment(mergedParams);
      dispatch({ 
        type: EQUIPMENT_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EQUIPMENT_FAILURE, 
        payload: error.error || 'Ошибка при загрузке оборудования' 
      });
      throw error;
    }
  };

  const fetchEquipmentById = async (id) => {
    dispatch({ type: EQUIPMENT_REQUEST });
    try {
      const response = await getEquipmentById(id);
      dispatch({ 
        type: EQUIPMENT_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EQUIPMENT_FAILURE, 
        payload: error.error || 'Ошибка при загрузке оборудования' 
      });
      throw error;
    }
  };

  const addEquipment = async (equipmentData) => {
    dispatch({ type: EQUIPMENT_REQUEST });
    try {
      const response = await createEquipment(equipmentData);
      dispatch({ 
        type: EQUIPMENT_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EQUIPMENT_FAILURE, 
        payload: error.error || 'Ошибка при создании оборудования' 
      });
      throw error;
    }
  };

  const editEquipment = async (id, equipmentData) => {
    dispatch({ type: EQUIPMENT_REQUEST });
    try {
      const response = await updateEquipment(id, equipmentData);
      dispatch({ 
        type: EQUIPMENT_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EQUIPMENT_FAILURE, 
        payload: error.error || 'Ошибка при обновлении оборудования' 
      });
      throw error;
    }
  };

  const removeEquipment = async (id) => {
    dispatch({ type: EQUIPMENT_REQUEST });
    try {
      await deleteEquipment(id);
      dispatch({ 
        type: EQUIPMENT_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      dispatch({ 
        type: EQUIPMENT_FAILURE, 
        payload: error.error || 'Ошибка при удалении оборудования' 
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
    <EquipmentContext.Provider
      value={{
        ...state,
        fetchEquipment,
        fetchEquipmentById,
        addEquipment,
        editEquipment,
        removeEquipment,
        setFilters
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};

// Custom hook
export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within a EquipmentProvider');
  }
  return context;
};