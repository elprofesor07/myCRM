import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, Spin } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { selectTheme } from './store/slices/uiSlice';
import { selectIsAuthenticated, selectUser } from './store/slices/authSlice';
import { useGetMeQuery } from './store/api/authApi';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/PageLoader';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Contacts = lazy(() => import('./pages/contacts/Contacts'));
const ContactDetail = lazy(() => import('./pages/contacts/ContactDetail'));
const Companies = lazy(() => import('./pages/companies/Companies'));
const CompanyDetail = lazy(() => import('./pages/companies/CompanyDetail'));
const Deals = lazy(() => import('./pages/deals/Deals'));
const DealDetail = lazy(() => import('./pages/deals/DealDetail'));
const Tasks = lazy(() => import('./pages/tasks/Tasks'));
const TaskDetail = lazy(() => import('./pages/tasks/TaskDetail'));
const Activities = lazy(() => import('./pages/activities/Activities'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const currentTheme = useSelector(selectTheme);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  
  // Skip auth check if already authenticated
  const { isLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || !localStorage.getItem('accessToken'),
  });

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = currentTheme === 'system' ? systemTheme : currentTheme;
    
    root.setAttribute('data-theme', activeTheme);
    
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  // Apply user language preference
  useEffect(() => {
    if (user?.language && i18n.language !== user.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  // Configure Ant Design theme
  const antTheme = {
    algorithm: currentTheme === 'dark' || 
               (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
               ? theme.darkAlgorithm 
               : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#4f46e5',
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <ConfigProvider theme={antTheme}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Contacts */}
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/contacts/:id" element={<ContactDetail />} />
                
                {/* Companies */}
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:id" element={<CompanyDetail />} />
                
                {/* Deals */}
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:id" element={<DealDetail />} />
                
                {/* Tasks */}
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                
                {/* Activities */}
                <Route path="/activities" element={<Activities />} />
                
                {/* Calendar */}
                <Route path="/calendar" element={<Calendar />} />
                
                {/* Reports */}
                <Route path="/reports" element={<Reports />} />
                
                {/* User */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings/*" element={<Settings />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ConfigProvider>
  );
}

export default App;