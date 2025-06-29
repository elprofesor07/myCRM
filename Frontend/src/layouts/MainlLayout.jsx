import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, Drawer, Input, Button, Space, Tooltip } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ShopOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useMediaQuery } from 'react-use';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import {
  selectUser,
  selectEmailVerified,
} from '../store/slices/authSlice';
import {
  selectTheme,
  selectSidebarCollapsed,
  selectSidebarMobileOpen,
  selectNotifications,
  toggleSidebar,
  setMobileSidebar,
  setTheme,
  openModal,
  toggleGlobalSearch,
} from '../store/slices/uiSlice';
import { useLogoutMutation } from '../store/api/authApi';
import GlobalSearch from '../components/GlobalSearch';
import NotificationPanel from '../components/NotificationPanel';
import QuickCreate from '../components/QuickCreate';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import RecentlyViewed from '../components/RecentlyViewed';
import UserAvatar from '../components/UserAvatar';
import styles from './MainLayout.module.scss';

const { Header, Sider, Content } = Layout;
const { Search } = Input;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const sidebarMobileOpen = useSelector(selectSidebarMobileOpen);
  const emailVerified = useSelector(selectEmailVerified);
  const notifications = useSelector(selectNotifications);
  
  const [logout] = useLogoutMutation();
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      dispatch(setMobileSidebar(false));
    }
  }, [location.pathname, dispatch, isMobile]);

  // Menu items
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard'),
    },
    {
      key: '/contacts',
      icon: <UserOutlined />,
      label: t('nav.contacts'),
    },
    {
      key: '/companies',
      icon: <ShopOutlined />,
      label: t('nav.companies'),
    },
    {
      key: '/deals',
      icon: <DollarOutlined />,
      label: t('nav.deals'),
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: t('nav.tasks'),
    },
    {
      key: '/activities',
      icon: <ClockCircleOutlined />,
      label: t('nav.activities'),
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: t('nav.calendar'),
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: t('nav.reports'),
    },
  ];

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('user.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('user.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: handleLogout,
    },
  ];

  // Theme menu items
  const themeMenuItems = [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: t('theme.light'),
      onClick: () => dispatch(setTheme('light')),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: t('theme.dark'),
      onClick: () => dispatch(setTheme('dark')),
    },
    {
      key: 'system',
      icon: <DesktopOutlined />,
      label: t('theme.system'),
      onClick: () => dispatch(setTheme('system')),
    },
  ];

  async function handleLogout() {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      default:
        return <DesktopOutlined />;
    }
  };

  return (
    <Layout className={styles.layout}>
      {/* Sidebar for desktop */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={sidebarCollapsed}
          className={styles.sider}
          width={240}
        >
          <div className={styles.logo}>
            {sidebarCollapsed ? (
              <span className={styles.logoIcon}>CRM</span>
            ) : (
              <span className={styles.logoText}>CRM System</span>
            )}
          </div>
          
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />

          {!sidebarCollapsed && (
            <div className={styles.sidebarFooter}>
              <RecentlyViewed />
            </div>
          )}
        </Sider>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={sidebarMobileOpen}
          onClose={() => dispatch(setMobileSidebar(false))}
          width={280}
          className={styles.mobileDrawer}
        >
          <div className={styles.logo}>
            <span className={styles.logoText}>CRM System</span>
          </div>
          
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
          />

          <div className={styles.drawerFooter}>
            <RecentlyViewed />
          </div>
        </Drawer>
      )}

      <Layout className={styles.mainLayout}>
        {/* Header */}
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={sidebarCollapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => isMobile ? dispatch(setMobileSidebar(true)) : dispatch(toggleSidebar())}
              className={styles.triggerButton}
            />

            {!isMobile && (
              <Search
                placeholder={t('search.placeholder')}
                allowClear
                onSearch={() => dispatch(toggleGlobalSearch())}
                onClick={() => dispatch(toggleGlobalSearch())}
                className={styles.searchInput}
                prefix={<SearchOutlined />}
                readOnly
              />
            )}
          </div>

          <div className={styles.headerRight}>
            <Space size="middle">
              {isMobile && (
                <Tooltip title={t('search.global')}>
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    onClick={() => dispatch(toggleGlobalSearch())}
                  />
                </Tooltip>
              )}

              <Tooltip title={t('actions.quickCreate')}>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => dispatch(openModal({ type: 'quickCreate' }))}
                />
              </Tooltip>

              <Dropdown
                menu={{ items: themeMenuItems }}
                placement="bottomRight"
              >
                <Button type="text" icon={getThemeIcon()} />
              </Dropdown>

              <Badge count={notifications.unreadCount} offset={[-2, 0]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => setNotificationDrawerOpen(true)}
                />
              </Badge>

              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  className={styles.userButton}
                >
                  <UserAvatar user={user} size="small" />
                  {!isMobile && (
                    <span className={styles.userName}>
                      {user?.firstName} {user?.lastName}
                    </span>
                  )}
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* Email verification banner */}
        {!emailVerified && <EmailVerificationBanner />}

        {/* Main content */}
        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>

      {/* Global search modal */}
      <GlobalSearch />

      {/* Quick create modal */}
      <QuickCreate />

      {/* Notifications drawer */}
      <Drawer
        title={t('notifications.title')}
        placement="right"
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        width={400}
        className={styles.notificationDrawer}
      >
        <NotificationPanel />
      </Drawer>
    </Layout>
  );
};

export default MainLayout;