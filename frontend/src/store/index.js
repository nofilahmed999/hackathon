import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice';
import employeeReducer from './slices/employeeSlice';
import attendanceReducer from './slices/attendanceSlice';
import leaveReducer from './slices/leaveSlice';
import payrollReducer from './slices/payrollSlice';
import uiReducer from './slices/uiSlice';

// Safe browser storage adapter for Vite / ESM compatibility
const storage = typeof window !== 'undefined'
  ? {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key, item) => Promise.resolve(window.localStorage.setItem(key, item)),
      removeItem: (key) => Promise.resolve(window.localStorage.removeItem(key)),
    }
  : {
      getItem: () => Promise.resolve(null),
      setItem: (_key, value) => Promise.resolve(value),
      removeItem: () => Promise.resolve(),
    };

const rootReducer = combineReducers({
  auth: authReducer,
  company: companyReducer,
  employee: employeeReducer,
  attendance: attendanceReducer,
  leave: leaveReducer,
  payroll: payrollReducer,
  ui: uiReducer,
});

const persistConfig = {
  key: 'hcm-lite-root',
  storage,
  whitelist: ['auth', 'ui'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
