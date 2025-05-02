import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import cacheService from '../../services/cacheService';

// Начальное состояние
const initialState = {
  isOnline: navigator.onLine,
  showOfflineMode: false,
  offlineOperationsCount: 0,
  lastSyncTime: null,
  cacheStatus: {
    enabled: true,
    size: '0 MB',
    entries: 0
  },
  notification: null
};

// Асинхронные actions
export const syncOfflineOperations = createAsyncThunk(
  'network/syncOfflineOperations',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Здесь будет вызван метод синхронизации из networkService
      // Импортируем динамически, чтобы избежать циклических зависимостей
      const networkService = (await import('../../services/networkService')).default;
      await networkService.syncOfflineOperations();
      
      // Получаем оставшиеся операции
      const pendingOperations = await cacheService.getPendingOperations();
      
      return {
        count: pendingOperations.length,
        timestamp: Date.now()
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCacheMetrics = createAsyncThunk(
  'network/getCacheMetrics',
  async (_, { rejectWithValue }) => {
    try {
      return await cacheService.getCacheMetrics();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearCache = createAsyncThunk(
  'network/clearCache',
  async (pattern, { rejectWithValue }) => {
    try {
      const count = await cacheService.clearCache(pattern);
      return { count, pattern };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Создание slice
const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus: (state, action) => {
      state.isOnline = action.payload;
      
      // Если восстановлено соединение, скрываем уведомление через 3 секунды
      if (action.payload && state.notification && state.notification.type === 'offline') {
        state.notification = {
          ...state.notification,
          autoHide: true,
          timeout: 3000
        };
      }
    },
    showOfflineMode: (state, action) => {
      state.showOfflineMode = action.payload;
    },
    showNetworkStatusNotification: (state, action) => {
      const isOnline = action.payload;
      
      if (isOnline) {
        state.notification = {
          type: 'online',
          message: 'Соединение восстановлено',
          autoHide: true,
          timeout: 3000,
          timestamp: Date.now()
        };
      } else {
        state.notification = {
          type: 'offline',
          message: 'Нет подключения к интернету. Работаем в автономном режиме',
          autoHide: false,
          timestamp: Date.now()
        };
      }
    },
    hideNetworkNotification: (state) => {
      state.notification = null;
    },
    updateOfflineOperationsCount: (state, action) => {
      state.offlineOperationsCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncOfflineOperations.fulfilled, (state, action) => {
        state.offlineOperationsCount = action.payload.count;
        state.lastSyncTime = action.payload.timestamp;
        
        if (action.payload.count === 0 && state.notification && state.notification.type === 'sync') {
          state.notification = {
            type: 'sync_complete',
            message: 'Синхронизация завершена',
            autoHide: true,
            timeout: 3000,
            timestamp: Date.now()
          };
        }
      })
      .addCase(syncOfflineOperations.pending, (state) => {
        if (state.offlineOperationsCount > 0) {
          state.notification = {
            type: 'sync',
            message: `Синхронизация данных (${state.offlineOperationsCount})...`,
            autoHide: false,
            timestamp: Date.now()
          };
        }
      })
      .addCase(getCacheMetrics.fulfilled, (state, action) => {
        if (action.payload) {
          state.cacheStatus = {
            enabled: true,
            size: action.payload.sizeEstimate,
            entries: action.payload.totalEntries,
            validEntries: action.payload.validEntries,
            expiredEntries: action.payload.expiredEntries
          };
        }
      })
      .addCase(clearCache.fulfilled, (state, action) => {
        state.notification = {
          type: 'cache_cleared',
          message: action.payload.pattern 
            ? `Кэш очищен для ${action.payload.pattern} (${action.payload.count} записей)`
            : 'Весь кэш очищен',
          autoHide: true,
          timeout: 3000,
          timestamp: Date.now()
        };
      });
  }
});

// Экспорт actions
export const { 
  setNetworkStatus,
  showOfflineMode,
  showNetworkStatusNotification,
  hideNetworkNotification,
  updateOfflineOperationsCount
} = networkSlice.actions;

// Экспорт reducer
export default networkSlice.reducer;