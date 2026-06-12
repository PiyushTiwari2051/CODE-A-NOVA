import { configureStore, createSlice } from '@reduxjs/toolkit';
import { injectStore } from '../api/axios';

// --- AUTH STATE SLICE ---
const initialToken = localStorage.getItem('token') || null;
let initialUser = null;
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser && storedUser !== 'undefined') {
    initialUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.error("Failed to parse user from localStorage:", e);
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    loading: false,
    error: null,
  },
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      localStorage.setItem('token', action.payload.accessToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    updateShopName: (state, action) => {
      if (state.user) {
        state.user.shopName = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

// --- UI STATE SLICE ---
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    mobileSidebarOpen: false,
    darkMode: localStorage.getItem('darkMode') === 'true',
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed);
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    closeMobileSidebar: (state) => {
      state.mobileSidebarOpen = false;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    initDarkMode: (state) => {
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
});

// Export actions
export const { loginStart, loginSuccess, loginFailure, setToken, updateShopName, logout } = authSlice.actions;
export const { toggleSidebar, toggleMobileSidebar, closeMobileSidebar, toggleDarkMode, initDarkMode } = uiSlice.actions;

// Configure store
const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
});

// Inject store into axios client to avoid circular dependencies
injectStore(store);

export default store;
