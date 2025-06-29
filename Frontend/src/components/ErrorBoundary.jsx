import React, { Component } from 'react';
import { Result, Button, Typography } from 'antd';
import { CloseCircleOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import styles from './ErrorBoundary.module.scss';

const { Paragraph, Text } = Typography;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // In production, you would send this to an error tracking service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }

    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <Result
            status="error"
            icon={<CloseCircleOutlined />}
            title="Oops! Something went wrong"
            subTitle="We're sorry, but something unexpected happened. Our team has been notified and is working on a fix."
            extra={[
              <Button
                type="primary"
                key="reload"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>,
              <Button
                key="home"
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                Go to Dashboard
              </Button>,
              <Button
                key="retry"
                onClick={this.handleReset}
              >
                Try Again
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className={styles.errorDetails}>
                <Paragraph>
                  <Text strong>Error Details (Development Only):</Text>
                </Paragraph>
                <Paragraph>
                  <Text code>{this.state.error.toString()}</Text>
                </Paragraph>
                {this.state.errorInfo && (
                  <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                      Component Stack Trace
                    </summary>
                    <Text code style={{ fontSize: '12px' }}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </details>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;