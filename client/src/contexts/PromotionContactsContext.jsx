import React, { createContext, useContext, useReducer } from 'react';
import { 
  getPromotionContacts, 
  getPromotionContactById, 
  submitPromotionContact, 
  updatePromotionContact, 
  deletePromotionContact 
} from '../services/promotionContacts';

// Initial state
const initialState = {
  contacts: [],
  currentContact: null,
  loading: false,
  error: null,
  success: false,
  total: 0,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    status: 'new',
    sort: '-createdAt'
  }
};

// Action types
const CONTACTS_REQUEST = 'CONTACTS_REQUEST';
const CONTACTS_SUCCESS = 'CONTACTS_SUCCESS';
const CONTACTS_FAILURE = 'CONTACTS_FAILURE';
const CONTACT_ITEM_SUCCESS = 'CONTACT_ITEM_SUCCESS';
const CONTACT_SUBMIT_SUCCESS = 'CONTACT_SUBMIT_SUCCESS';
const CONTACT_UPDATE_SUCCESS = 'CONTACT_UPDATE_SUCCESS';
const CONTACT_DELETE_SUCCESS = 'CONTACT_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';
const RESET_SUCCESS = 'RESET_SUCCESS';

// Reducer
const contactsReducer = (state, action) => {
  switch (action.type) {
    case CONTACTS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null,
        success: false 
      };
    case CONTACTS_SUCCESS:
      return {
        ...state,
        contacts: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case CONTACTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        success: false
      };
    case CONTACT_ITEM_SUCCESS:
      return {
        ...state,
        currentContact: action.payload,
        loading: false,
        error: null
      };
    case CONTACT_SUBMIT_SUCCESS:
      return {
        ...state,
        contacts: [action.payload, ...state.contacts],
        currentContact: action.payload,
        loading: false,
        error: null,
        success: true
      };
    case CONTACT_UPDATE_SUCCESS:
      return {
        ...state,
        contacts: state.contacts.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentContact: action.payload,
        loading: false,
        error: null
      };
    case CONTACT_DELETE_SUCCESS:
      return {
        ...state,
        contacts: state.contacts.filter(item => item._id !== action.payload),
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
    case RESET_SUCCESS:
      return {
        ...state,
        success: false
      };
    default:
      return state;
  }
};

// Create context
const PromotionContactsContext = createContext();

// Context provider
export const PromotionContactsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(contactsReducer, initialState);

  // Actions
  const fetchContacts = async (params = {}) => {
    dispatch({ type: CONTACTS_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getPromotionContacts(mergedParams);
      dispatch({ 
        type: CONTACTS_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при загрузке заявок';
      dispatch({ 
        type: CONTACTS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const fetchContactById = async (id) => {
    dispatch({ type: CONTACTS_REQUEST });
    try {
      const response = await getPromotionContactById(id);
      dispatch({ 
        type: CONTACT_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при загрузке заявки';
      dispatch({ 
        type: CONTACTS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const submitContact = async (contactData) => {
    dispatch({ type: CONTACTS_REQUEST });
    try {
      const response = await submitPromotionContact(contactData);
      dispatch({ 
        type: CONTACT_SUBMIT_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при отправке заявки';
      dispatch({ 
        type: CONTACTS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const updateContact = async (id, contactData) => {
    dispatch({ type: CONTACTS_REQUEST });
    try {
      const response = await updatePromotionContact(id, contactData);
      dispatch({ 
        type: CONTACT_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при обновлении заявки';
      dispatch({ 
        type: CONTACTS_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  const removeContact = async (id) => {
    dispatch({ type: CONTACTS_REQUEST });
    try {
      await deletePromotionContact(id);
      dispatch({ 
        type: CONTACT_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || error.error || 'Ошибка при удалении заявки';
      dispatch({ 
        type: CONTACTS_FAILURE, 
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

  const resetSuccess = () => {
    dispatch({ type: RESET_SUCCESS });
  };

  return (
    <PromotionContactsContext.Provider
      value={{
        ...state,
        fetchContacts,
        fetchContactById,
        submitContact,
        updateContact,
        removeContact,
        setFilters,
        resetSuccess
      }}
    >
      {children}
    </PromotionContactsContext.Provider>
  );
};

// Custom hook
export const usePromotionContacts = () => {
  const context = useContext(PromotionContactsContext);
  if (!context) {
    throw new Error('usePromotionContacts must be used within a PromotionContactsProvider');
  }
  return context;
};