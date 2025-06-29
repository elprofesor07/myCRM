import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme || 'system';
};

const initialState = {
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  activeModal: null,
  modalProps: {},
  notifications: {
    unreadCount: 0,
    items: [],
  },
  breadcrumbs: [],
  pageLoading: false,
  globalSearch: {
    open: false,
    query: '',
    results: [],
  },
  recentlyViewed: [],
  shortcuts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.sidebarMobileOpen = !state.sidebarMobileOpen;
    },
    setMobileSidebar: (state, action) => {
      state.sidebarMobileOpen = action.payload;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload.type;
      state.modalProps = action.payload.props || {};
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalProps = {};
    },
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
    setPageLoading: (state, action) => {
      state.pageLoading = action.payload;
    },
    setGlobalSearch: (state, action) => {
      state.globalSearch = { ...state.globalSearch, ...action.payload };
    },
    toggleGlobalSearch: (state) => {
      state.globalSearch.open = !state.globalSearch.open;
      if (!state.globalSearch.open) {
        state.globalSearch.query = '';
        state.globalSearch.results = [];
      }
    },
    addRecentlyViewed: (state, action) => {
      const { type, id, name, meta } = action.payload;
      const item = { type, id, name, meta, timestamp: Date.now() };
      
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(
        (i) => !(i.type === type && i.id === id)
      );
      
      // Add to beginning
      state.recentlyViewed.unshift(item);
      
      // Keep only last 10
      state.recentlyViewed = state.recentlyViewed.slice(0, 10);
      
      // Save to localStorage
      localStorage.setItem('recentlyViewed', JSON.stringify(state.recentlyViewed));
    },
    loadRecentlyViewed: (state) => {
      const saved = localStorage.getItem('recentlyViewed');
      if (saved) {
        try {
          state.recentlyViewed = JSON.parse(saved);
        } catch (e) {
          state.recentlyViewed = [];
        }
      }
    },
    addShortcut: (state, action) => {
      const { path, name, icon } = action.payload;
      const shortcut = { path, name, icon };
      
      // Check if already exists
      const exists = state.shortcuts.some((s) => s.path === path);
      if (!exists) {
        state.shortcuts.push(shortcut);
        localStorage.setItem('shortcuts', JSON.stringify(state.shortcuts));
      }
    },
    removeShortcut: (state, action) => {
      state.shortcuts = state.shortcuts.filter((s) => s.path !== action.payload);
      localStorage.setItem('shortcuts', JSON.stringify(state.shortcuts));
    },
    loadShortcuts: (state) => {
      const saved = localStorage.getItem('shortcuts');
      if (saved) {
        try {
          state.shortcuts = JSON.parse(saved);
        } catch (e) {
          state.shortcuts = [];
        }
      }
    },
    updateNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    markNotificationRead: (state, action) => {
      const notification = state.notifications.items.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1);
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.items.forEach((n) => {
        n.read = true;
      });
      state.notifications.unreadCount = 0;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebar,
  openModal,
  closeModal,
  setBreadcrumbs,
  setPageLoading,
  setGlobalSearch,
  toggleGlobalSearch,
  addRecentlyViewed,
  loadRecentlyViewed,
  addShortcut,
  removeShortcut,
  loadShortcuts,
  updateNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = uiSlice.actions;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectSidebarMobileOpen = (state) => state.ui.sidebarMobileOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectModalProps = (state) => state.ui.modalProps;
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;
export const selectPageLoading = (state) => state.ui.pageLoading;
export const selectGlobalSearch = (state) => state.ui.globalSearch;
export const selectRecentlyViewed = (state) => state.ui.recentlyViewed;
export const selectShortcuts = (state) => state.ui.shortcuts;
export const selectNotifications = (state) => state.ui.notifications;

export default uiSlice.reducer;