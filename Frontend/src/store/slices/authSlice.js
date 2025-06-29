import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  emailVerified: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.emailVerified = user.emailVerified;
      localStorage.setItem('accessToken', accessToken);
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      state.emailVerified = state.user.emailVerified;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.emailVerified = true;
      localStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    // Handle login success
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data.user;
        state.accessToken = payload.data.accessToken;
        state.isAuthenticated = true;
        state.emailVerified = payload.data.user.emailVerified;
        localStorage.setItem('accessToken', payload.data.accessToken);
      }
    );

    // Handle register success
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data.user;
        state.accessToken = payload.data.accessToken;
        state.isAuthenticated = true;
        state.emailVerified = false;
        localStorage.setItem('accessToken', payload.data.accessToken);
      }
    );

    // Handle refresh token success
    builder.addMatcher(
      authApi.endpoints.refreshToken.matchFulfilled,
      (state, { payload }) => {
        state.accessToken = payload.data.accessToken;
        localStorage.setItem('accessToken', payload.data.accessToken);
      }
    );

    // Handle get me success
    builder.addMatcher(
      authApi.endpoints.getMe.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data;
        state.isAuthenticated = true;
        state.emailVerified = payload.data.emailVerified;
      }
    );

    // Handle logout success
    builder.addMatcher(
      authApi.endpoints.logout.matchFulfilled,
      (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.emailVerified = true;
        localStorage.removeItem('accessToken');
      }
    );

    // Handle API errors (401 Unauthorized)
    builder.addMatcher(
      (action) => action.type.endsWith('/rejected') && action.payload?.status === 401,
      (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.emailVerified = true;
        localStorage.removeItem('accessToken');
      }
    );
  },
});

export const { setCredentials, updateUser, logout } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectEmailVerified = (state) => state.auth.emailVerified;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectUserDepartment = (state) => state.auth.user?.department;

export default authSlice.reducer;