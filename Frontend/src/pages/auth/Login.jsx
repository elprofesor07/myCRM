import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { useLoginMutation } from '../../store/api/authApi';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setCredentials } from '../../store/slices/authSlice';
import AuthLayout from '../../layouts/AuthLayout';
import styles from './Auth.module.scss';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [login, { isLoading }] = useLoginMutation();
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data) => {
    try {
      const result = await login(data).unwrap();
      
      // Store credentials
      dispatch(setCredentials({
        user: result.data.user,
        accessToken: result.data.accessToken,
      }));
      
      // Show success message
      toast.success(t('auth.loginSuccess'));
      
      // Redirect to original page or dashboard
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      const message = error.data?.message || t('auth.loginError');
      toast.error(message);
      
      // Focus password field on error
      setFocus('password');
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.login')} - CRM System</title>
      </Helmet>
      
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>{t('auth.welcomeBack')}</h1>
            <p>{t('auth.loginSubtitle')}</p>
          </div>

          <Form
            layout="vertical"
            onFinish={handleSubmit(onSubmit)}
            className={styles.authForm}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label={t('auth.email')}
                  validateStatus={errors.email ? 'error' : ''}
                  help={errors.email?.message}
                >
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder={t('auth.emailPlaceholder')}
                    size="large"
                    autoComplete="email"
                  />
                </Form.Item>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label={t('auth.password')}
                  validateStatus={errors.password ? 'error' : ''}
                  help={errors.password?.message}
                >
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder={t('auth.passwordPlaceholder')}
                    size="large"
                    autoComplete="current-password"
                  />
                </Form.Item>
              )}
            />

            <div className={styles.formOptions}>
              <Controller
                name="remember"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Checkbox checked={value} onChange={(e) => onChange(e.target.checked)}>
                    {t('auth.rememberMe')}
                  </Checkbox>
                )}
              />
              
              <Link to="/forgot-password" className={styles.forgotLink}>
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isLoading}
                block
              >
                {t('auth.loginButton')}
              </Button>
            </Form.Item>

            <Divider plain>{t('auth.or')}</Divider>

            <div className={styles.authFooter}>
              <span>{t('auth.noAccount')} </span>
              <Link to="/register">{t('auth.signUp')}</Link>
            </div>
          </Form>

          {/* Demo credentials for development */}
          {process.env.NODE_ENV === 'development' && (
            <Alert
              message="Demo Credentials"
              description={
                <div>
                  <p>Email: demo@example.com</p>
                  <p>Password: Demo123!</p>
                </div>
              }
              type="info"
              showIcon
              className={styles.demoAlert}
            />
          )}
        </div>

        <div className={styles.authSidebar}>
          <div className={styles.sidebarContent}>
            <h2>{t('auth.features.title')}</h2>
            <ul className={styles.featureList}>
              <li>{t('auth.features.contacts')}</li>
              <li>{t('auth.features.deals')}</li>
              <li>{t('auth.features.tasks')}</li>
              <li>{t('auth.features.reports')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;