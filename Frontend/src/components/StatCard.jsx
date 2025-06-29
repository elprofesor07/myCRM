import React from 'react';
import { Card } from 'antd';
import PropTypes from 'prop-types';
import CountUp from 'react-countup';
import classNames from 'classnames';
import styles from './StatCard.module.scss';

const StatCard = ({
  title,
  value,
  prefix,
  suffix,
  color,
  loading = false,
  precision = 0,
  onClick,
  className,
}) => {
  const isNumber = typeof value === 'number';
  
  const cardContent = (
    <Card
      className={classNames(styles.statCard, className, {
        [styles.clickable]: onClick,
      })}
      loading={loading}
      onClick={onClick}
      style={{
        '--stat-color': color,
      }}
    >
      <div className={styles.cardContent}>
        {prefix && <div className={styles.prefix}>{prefix}</div>}
        
        <div className={styles.statInfo}>
          <div className={styles.title}>{title}</div>
          <div className={styles.value}>
            {isNumber ? (
              <CountUp
                end={value}
                duration={1.5}
                separator=","
                decimals={precision}
                decimal="."
              />
            ) : (
              value
            )}
          </div>
          {suffix && <div className={styles.suffix}>{suffix}</div>}
        </div>
      </div>
    </Card>
  );

  return cardContent;
};

StatCard.propTypes = {
  title: PropTypes.node.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
  color: PropTypes.string,
  loading: PropTypes.bool,
  precision: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default StatCard;