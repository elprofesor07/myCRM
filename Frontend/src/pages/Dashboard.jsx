import React, { useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Avatar, List, Timeline, Select, DatePicker, Segmented } from 'antd';
import {
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Line, Column, Pie, Area } from '@ant-design/plots';
import dayjs from 'dayjs';

import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import styles from './Dashboard.module.scss';

const { RangePicker } = DatePicker;

const Dashboard = () => {
  const { t } = useTranslation();
  const user = useSelector(selectUser);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [viewType, setViewType] = useState('overview');

  // Mock data - in real app, this would come from API
  const stats = {
    totalContacts: 1234,
    contactsGrowth: 12.5,
    totalCompanies: 456,
    companiesGrowth: 8.3,
    totalDeals: 89,
    dealsGrowth: 15.7,
    totalRevenue: 458750,
    revenueGrowth: 22.4,
  };

  const revenueData = [
    { date: '2024-01', value: 65000, type: 'Revenue' },
    { date: '2024-02', value: 72000, type: 'Revenue' },
    { date: '2024-03', value: 78000, type: 'Revenue' },
    { date: '2024-04', value: 85000, type: 'Revenue' },
    { date: '2024-05', value: 92000, type: 'Revenue' },
    { date: '2024-06', value: 98000, type: 'Revenue' },
  ];

  const dealsByStage = [
    { stage: 'Qualification', value: 25, count: 15 },
    { stage: 'Needs Analysis', value: 30, count: 18 },
    { stage: 'Proposal', value: 20, count: 12 },
    { stage: 'Negotiation', value: 15, count: 9 },
    { stage: 'Closed Won', value: 10, count: 6 },
  ];

  const topDeals = [
    { id: 1, name: 'Enterprise Software License', company: 'Tech Corp', value: 125000, stage: 'Negotiation', probability: 75 },
    { id: 2, name: 'Cloud Migration Project', company: 'Global Industries', value: 95000, stage: 'Proposal', probability: 60 },
    { id: 3, name: 'Annual Support Contract', company: 'Startup Inc', value: 45000, stage: 'Needs Analysis', probability: 40 },
    { id: 4, name: 'Custom Development', company: 'Finance Co', value: 78000, stage: 'Qualification', probability: 25 },
  ];

  const recentActivities = [
    { id: 1, type: 'call', title: 'Call with John Doe', time: '10 minutes ago', icon: <PhoneOutlined /> },
    { id: 2, type: 'email', title: 'Email sent to Tech Corp', time: '1 hour ago', icon: <MailOutlined /> },
    { id: 3, type: 'meeting', title: 'Meeting with Global Industries', time: '2 hours ago', icon: <CalendarOutlined /> },
    { id: 4, type: 'deal', title: 'Deal won: Annual Support Contract', time: '3 hours ago', icon: <TrophyOutlined /> },
  ];

  const teamPerformance = [
    { name: 'Sarah Johnson', avatar: null, deals: 23, revenue: 340000, conversion: 68 },
    { name: 'Mike Chen', avatar: null, deals: 19, revenue: 285000, conversion: 63 },
    { name: 'Emily Davis', avatar: null, deals: 21, revenue: 315000, conversion: 71 },
    { name: 'James Wilson', avatar: null, deals: 17, revenue: 255000, conversion: 59 },
  ];

  // Chart configurations
  const revenueChartConfig = {
    data: revenueData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    xAxis: {
      label: {
        formatter: (v) => dayjs(v).format('MMM'),
      },
    },
    yAxis: {
      label: {
        formatter: (v) => `$${(v / 1000).toFixed(0)}k`,
      },
    },
    tooltip: {
      formatter: (datum) => ({
        name: datum.type,
        value: `$${datum.value.toLocaleString()}`,
      }),
    },
  };

  const dealsPipelineConfig = {
    data: dealsByStage,
    xField: 'stage',
    yField: 'value',
    label: {
      position: 'middle',
      content: (item) => `${item.count} deals`,
      style: {
        fill: '#FFFFFF',
        opacity: 0.8,
      },
    },
    xAxis: {
      label: {
        autoRotate: false,
      },
    },
    meta: {
      stage: {
        alias: 'Stage',
      },
      value: {
        alias: 'Value ($k)',
      },
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'Total Value',
        value: `$${(datum.value * 1000).toLocaleString()}`,
      }),
    },
  };

  const conversionRateConfig = {
    data: teamPerformance.map(member => ({
      name: member.name,
      value: member.conversion,
    })),
    xField: 'name',
    yField: 'value',
    radius: 0.9,
    label: {
      position: 'middle',
      content: ({ value }) => `${value}%`,
      style: {
        textAlign: 'center',
        fontSize: 14,
      },
    },
    interactions: [{ type: 'element-active' }],
  };

  return (
    <>
      <Helmet>
        <title>{t('dashboard.title')} - CRM System</title>
      </Helmet>

      <PageHeader
        title={t('dashboard.welcome', { name: user?.firstName })}
        subtitle={t('dashboard.subtitle')}
        extra={
          <div className={styles.headerControls}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="MMM DD, YYYY"
              allowClear={false}
            />
            <Segmented
              options={[
                { label: 'Overview', value: 'overview' },
                { label: 'Sales', value: 'sales' },
                { label: 'Team', value: 'team' },
              ]}
              value={viewType}
              onChange={setViewType}
            />
          </div>
        }
      />

      <div className={styles.dashboard}>
        {/* Stats Cards */}
        <Row gutter={[24, 24]} className={styles.statsRow}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title={t('dashboard.totalContacts')}
              value={stats.totalContacts}
              prefix={<UserOutlined />}
              suffix={
                <span className={styles.growth}>
                  <RiseOutlined /> {stats.contactsGrowth}%
                </span>
              }
              color="#4f46e5"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title={t('dashboard.totalCompanies')}
              value={stats.totalCompanies}
              prefix={<ShopOutlined />}
              suffix={
                <span className={styles.growth}>
                  <RiseOutlined /> {stats.companiesGrowth}%
                </span>
              }
              color="#10b981"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title={t('dashboard.activeDeals')}
              value={stats.totalDeals}
              prefix={<FireOutlined />}
              suffix={
                <span className={styles.growth}>
                  <RiseOutlined /> {stats.dealsGrowth}%
                </span>
              }
              color="#f59e0b"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title={t('dashboard.totalRevenue')}
              value={`$${stats.totalRevenue.toLocaleString()}`}
              prefix={<DollarOutlined />}
              suffix={
                <span className={styles.growth}>
                  <RiseOutlined /> {stats.revenueGrowth}%
                </span>
              }
              color="#ef4444"
              precision={0}
            />
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[24, 24]} className={styles.chartsRow}>
          <Col xs={24} lg={16}>
            <Card
              title={t('dashboard.revenueOverview')}
              className={styles.chartCard}
              extra={
                <Select defaultValue="6months" style={{ width: 120 }}>
                  <Select.Option value="7days">Last 7 days</Select.Option>
                  <Select.Option value="30days">Last 30 days</Select.Option>
                  <Select.Option value="6months">Last 6 months</Select.Option>
                  <Select.Option value="1year">Last year</Select.Option>
                </Select>
              }
            >
              <Line {...revenueChartConfig} height={300} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title={t('dashboard.dealsPipeline')} className={styles.chartCard}>
              <Column {...dealsPipelineConfig} height={300} />
            </Card>
          </Col>
        </Row>

        {/* Tables Row */}
        <Row gutter={[24, 24]} className={styles.tablesRow}>
          <Col xs={24} lg={12}>
            <Card
              title={t('dashboard.topDeals')}
              className={styles.tableCard}
              extra={<a href="/deals">{t('common.viewAll')}</a>}
            >
              <Table
                dataSource={topDeals}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: t('dashboard.dealName'),
                    dataIndex: 'name',
                    key: 'name',
                    render: (text, record) => (
                      <div>
                        <div className={styles.dealName}>{text}</div>
                        <div className={styles.dealCompany}>{record.company}</div>
                      </div>
                    ),
                  },
                  {
                    title: t('dashboard.value'),
                    dataIndex: 'value',
                    key: 'value',
                    render: (value) => `$${value.toLocaleString()}`,
                    align: 'right',
                  },
                  {
                    title: t('dashboard.probability'),
                    dataIndex: 'probability',
                    key: 'probability',
                    render: (probability) => (
                      <Progress
                        percent={probability}
                        size="small"
                        strokeColor={probability >= 60 ? '#10b981' : probability >= 40 ? '#f59e0b' : '#ef4444'}
                      />
                    ),
                    width: 120,
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={t('dashboard.teamPerformance')}
              className={styles.tableCard}
              extra={<a href="/reports/team">{t('common.viewAll')}</a>}
            >
              <List
                dataSource={teamPerformance}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={member.name}
                      description={`${member.deals} deals · $${(member.revenue / 1000).toFixed(0)}k revenue`}
                    />
                    <div className={styles.conversionRate}>
                      <Progress
                        type="circle"
                        percent={member.conversion}
                        width={50}
                        strokeColor={{
                          '0%': '#108ee9',
                          '100%': '#87d068',
                        }}
                      />
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* Activity Timeline */}
        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <Card
              title={t('dashboard.recentActivity')}
              className={styles.activityCard}
              extra={<a href="/activities">{t('common.viewAll')}</a>}
            >
              <Timeline
                items={recentActivities.map((activity) => ({
                  dot: activity.icon,
                  children: (
                    <div className={styles.activityItem}>
                      <div className={styles.activityTitle}>{activity.title}</div>
                      <div className={styles.activityTime}>{activity.time}</div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Dashboard;