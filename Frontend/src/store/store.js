import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import API slices
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { contactApi } from './api/contactApi';
import { companyApi } from './api/companyApi';
import { dealApi } from './api/dealApi';
import { taskApi } from './api/taskApi';
import { activityApi } from './api/activityApi';

// Import reducers
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import filterReducer from './slices/filterSlice';

export const store = configureStore({
  reducer: {
    // API reducers
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [dealApi.reducerPath]: dealApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    
    // Feature reducers
    auth: authReducer,
    ui: uiReducer,
    filters: filterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }).concat(
      authApi.middleware,
      userApi.middleware,
      contactApi.middleware,
      companyApi.middleware,
      dealApi.middleware,
      taskApi.middleware,
      activityApi.middleware
    ),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export default store;