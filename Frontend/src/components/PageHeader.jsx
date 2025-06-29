import React from 'react';
import { Breadcrumb, Space, Button } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import styles from './PageHeader.module.scss';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
  actions,
  className,
  ghost = true,
}) => {
  const defaultBreadcrumbs = [
    {
      title: (
        <Link to="/dashboard">
          <HomeOutlined />
        </Link>
      ),
    },
  ];

  const allBreadcrumbs = breadcrumbs ? [...defaultBreadcrumbs, ...breadcrumbs] : null;

  return (
    <div className={classNames(styles.pageHeader, { [styles.ghost]: ghost }, className)}>
      {allBreadcrumbs && (
        <Breadcrumb
          className={styles.breadcrumb}
          items={allBreadcrumbs}
        />
      )}
      
      <div className={styles.headerContent}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        
        {(extra || actions) && (
          <div className={styles.headerExtra}>
            {extra}
            {actions && (
              <Space wrap>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    type={action.type || 'default'}
                    icon={action.icon}
                    onClick={action.onClick}
                    loading={action.loading}
                    danger={action.danger}
                  >
                    {action.label}
                  </Button>
                ))}
              </Space>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.node,
      href: PropTypes.string,
    })
  ),
  extra: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      type: PropTypes.string,
      icon: PropTypes.node,
      loading: PropTypes.bool,
      danger: PropTypes.bool,
    })
  ),
  className: PropTypes.string,
  ghost: PropTypes.bool,
};

export default PageHeader;