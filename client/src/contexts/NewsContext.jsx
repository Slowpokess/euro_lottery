import React, { createContext, useContext, useReducer } from 'react';
import { getNews, getNewsById, createNews, updateNews, deleteNews } from '../services/news';

// Initial state
const initialState = {
  news: [],
  currentNews: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    page: 1,
    limit: 10,
    search: '',
    category: '',
    status: 'published',
    sort: '-publishDate'
  }
};

// Action types
const NEWS_REQUEST = 'NEWS_REQUEST';
const NEWS_SUCCESS = 'NEWS_SUCCESS';
const NEWS_FAILURE = 'NEWS_FAILURE';
const NEWS_ITEM_SUCCESS = 'NEWS_ITEM_SUCCESS';
const NEWS_CREATE_SUCCESS = 'NEWS_CREATE_SUCCESS';
const NEWS_UPDATE_SUCCESS = 'NEWS_UPDATE_SUCCESS';
const NEWS_DELETE_SUCCESS = 'NEWS_DELETE_SUCCESS';
const SET_FILTERS = 'SET_FILTERS';

// Reducer
const newsReducer = (state, action) => {
  switch (action.type) {
    case NEWS_REQUEST:
      return { 
        ...state, 
        loading: true,
        error: null 
      };
    case NEWS_SUCCESS:
      return {
        ...state,
        news: action.payload.data,
        total: action.payload.total,
        loading: false,
        error: null
      };
    case NEWS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case NEWS_ITEM_SUCCESS:
      return {
        ...state,
        currentNews: action.payload,
        loading: false,
        error: null
      };
    case NEWS_CREATE_SUCCESS:
      return {
        ...state,
        news: [action.payload, ...state.news],
        loading: false,
        error: null
      };
    case NEWS_UPDATE_SUCCESS:
      return {
        ...state,
        news: state.news.map(item => 
          item._id === action.payload._id ? action.payload : item
        ),
        currentNews: action.payload,
        loading: false,
        error: null
      };
    case NEWS_DELETE_SUCCESS:
      return {
        ...state,
        news: state.news.filter(item => item._id !== action.payload),
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
const NewsContext = createContext();

// Context provider
export const NewsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(newsReducer, initialState);

  // Actions
  const fetchNews = async (params = {}) => {
    dispatch({ type: NEWS_REQUEST });
    try {
      const mergedParams = { ...state.filters, ...params };
      const response = await getNews(mergedParams);
      dispatch({ 
        type: NEWS_SUCCESS, 
        payload: response 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: NEWS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке новостей' 
      });
      throw error;
    }
  };

  const fetchNewsById = async (id) => {
    dispatch({ type: NEWS_REQUEST });
    try {
      const response = await getNewsById(id);
      dispatch({ 
        type: NEWS_ITEM_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: NEWS_FAILURE, 
        payload: error.error || 'Ошибка при загрузке новости' 
      });
      throw error;
    }
  };

  const addNews = async (newsData) => {
    dispatch({ type: NEWS_REQUEST });
    try {
      const response = await createNews(newsData);
      dispatch({ 
        type: NEWS_CREATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: NEWS_FAILURE, 
        payload: error.error || 'Ошибка при создании новости' 
      });
      throw error;
    }
  };

  const editNews = async (id, newsData) => {
    dispatch({ type: NEWS_REQUEST });
    try {
      const response = await updateNews(id, newsData);
      dispatch({ 
        type: NEWS_UPDATE_SUCCESS, 
        payload: response.data 
      });
      return response;
    } catch (error) {
      dispatch({ 
        type: NEWS_FAILURE, 
        payload: error.error || 'Ошибка при обновлении новости' 
      });
      throw error;
    }
  };

  const removeNews = async (id) => {
    dispatch({ type: NEWS_REQUEST });
    try {
      await deleteNews(id);
      dispatch({ 
        type: NEWS_DELETE_SUCCESS, 
        payload: id 
      });
    } catch (error) {
      dispatch({ 
        type: NEWS_FAILURE, 
        payload: error.error || 'Ошибка при удалении новости' 
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
    <NewsContext.Provider
      value={{
        ...state,
        fetchNews,
        fetchNewsById,
        addNews,
        editNews,
        removeNews,
        setFilters
      }}
    >
      {children}
    </NewsContext.Provider>
  );
};

// Custom hook
export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};