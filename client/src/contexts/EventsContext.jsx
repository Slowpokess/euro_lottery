import React, { createContext, useContext, useReducer } from 'react';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from '../services/events';

// Initial state
const initialState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    status: 'upcoming',
    sort: '-startDate'
  }
};

// Action types
const EVENTS_REQUEST = 'EVENTS_REQUEST';
const EVENTS_SUCCESS = 'EVENTS_SUCCESS';
const EVENTS_FAILURE = 'EVENTS_FAILURE';
const EVENT_ITEM_SUCCESS = 'EVENT_ITEM_SUCCESS';
const EVENT_CREATE_SUCCESS = 'EVENT_CREATE_SUCCESS';
const EVENT_UPDATE_SUCCESS = 'EVENT_UPDATE_SUCCESS';
const EVENT_DELETE_SUCCESS = 'EVENT_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const eventsReducer = (state, action) => {
  switch (action.type) {
    case EVENTS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case EVENTS_SUCCESS:
      return {
        ...state,
        events: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case EVENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case EVENT_ITEM_SUCCESS:
      return {
        ...state,
        currentEvent: action.payload,
        loading: false,
        error: null
      };
    case EVENT_CREATE_SUCCESS:
      return {
        ...state,
        events: [action.payload, ...state.events],
        loading: false,
        error: null
      };
    case EVENT_UPDATE_SUCCESS:
      return {
        ...state,
        events: state.events.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentEvent: action.payload,
        loading: false,
        error: null
      };
    case EVENT_DELETE_SUCCESS:
      return {
        ...state,
        events: state.events.filter(item => item._id !== action.payload),
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
const EventsContext = createContext();

// Context provider
export const EventsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(eventsReducer, initialState);

  // Actions
  const fetchEvents = async (params = {}) => {
    dispatch({ type: EVENTS_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getEvents(mergedParams);
      dispatch({ 
        type: EVENTS_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EVENTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке мероприятий' 
      });
      throw error;
    }
  };

  const fetchEventById = async (id) => {
    dispatch({ type: EVENTS_REQUEST });
    try {
      const response = await getEvent(id);
      dispatch({ 
        type: EVENT_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EVENTS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке мероприятия' 
      });
      throw error;
    }
  };

  const addEvent = async (eventData) => {
    dispatch({ type: EVENTS_REQUEST });
    try {
      const response = await createEvent(eventData);
      dispatch({ 
        type: EVENT_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EVENTS_FAILURE, 
        payload: error.error || 'Ошибка при создании мероприятия' 
      });
      throw error;
    }
  };

  const editEvent = async (id, eventData) => {
    dispatch({ type: EVENTS_REQUEST });
    try {
      const response = await updateEvent(id, eventData);
      dispatch({ 
        type: EVENT_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: EVENTS_FAILURE, 
        payload: error.error || 'Ошибка при обновлении мероприятия' 
      });
      throw error;
    }
  };

  const removeEvent = async (id) => {
    dispatch({ type: EVENTS_REQUEST });
    try {
      await deleteEvent(id);
      dispatch({ 
        type: EVENT_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      dispatch({ 
        type: EVENTS_FAILURE, 
        payload: error.error || 'Ошибка при удалении мероприятия' 
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
    <EventsContext.Provider
      value={{
        ...state,
        fetchEvents,
        fetchEventById,
        addEvent,
        editEvent,
        removeEvent,
        setFilters
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

// Custom hook
export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within a EventsProvider');
  }
  return context;
};