import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  Person,
  Message,
  Error,
} from '@mui/icons-material';
import { apiService } from '../services/api';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState({
    messageVolume: {
      total: 0,
      sent: 0,
      received: 0,
      failed: 0,
      trend: 0,
    },
    responseTime: {
      average: 0,
      fastest: 0,
      slowest: 0,
    },
    topContacts: [],
    hourlyDistribution: [],
    dailyStats: [],
    errorAnalysis: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAnalytics(timeRange);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, trend, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>{icon}</Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" color={`${color}.main`}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {trend > 0 ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 16 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 16 }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend > 0 ? 'success.main' : 'error.main',
                ml: 0.5,
              }}
            >
              {Math.abs(trend)}% vs last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getHourLabel = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="day">Last 24 Hours</MenuItem>
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Messages"
            value={analytics.messageVolume.total}
            icon={<Message />}
            trend={analytics.messageVolume.trend}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Messages Sent"
            value={analytics.messageVolume.sent}
            subtitle={`${Math.round((analytics.messageVolume.sent / analytics.messageVolume.total) * 100) || 0}% of total`}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Messages Received"
            value={analytics.messageVolume.received}
            subtitle={`${Math.round((analytics.messageVolume.received / analytics.messageVolume.total) * 100) || 0}% of total`}
            icon={<TrendingDown />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Failed Messages"
            value={analytics.messageVolume.failed}
            subtitle={`${Math.round((analytics.messageVolume.failed / analytics.messageVolume.total) * 100) || 0}% failure rate`}
            icon={<Error />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Response Time Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Avg Response Time"
            value={formatTime(analytics.responseTime.average)}
            icon={<Schedule />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Fastest Response"
            value={formatTime(analytics.responseTime.fastest)}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Slowest Response"
            value={formatTime(analytics.responseTime.slowest)}
            icon={<TrendingDown />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Contacts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Most Active Contacts
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Contact</TableCell>
                    <TableCell align="right">Messages</TableCell>
                    <TableCell align="right">Last Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.topContacts.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Person sx={{ mr: 1, fontSize: 16 }} />
                          {contact.phone}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{contact.messageCount}</TableCell>
                      <TableCell align="right">
                        <Typography variant="caption">
                          {new Date(contact.lastActive).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Hourly Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Message Distribution by Hour
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {analytics.hourlyDistribution.map((hour, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    {getHourLabel(hour.hour)}
                  </Typography>
                  <Box sx={{ flexGrow: 1, mx: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(hour.count / Math.max(...analytics.hourlyDistribution.map(h => h.count))) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                    {hour.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Error Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Error Analysis
            </Typography>
            {analytics.errorAnalysis.length === 0 ? (
              <Typography color="text.secondary">No errors in the selected time range</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Error Type</TableCell>
                      <TableCell>Count</TableCell>
                      <TableCell>Percentage</TableCell>
                      <TableCell>Last Occurrence</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.errorAnalysis.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.type}</TableCell>
                        <TableCell>{error.count}</TableCell>
                        <TableCell>
                          {Math.round((error.count / analytics.messageVolume.failed) * 100) || 0}%
                        </TableCell>
                        <TableCell>
                          {new Date(error.lastOccurrence).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={error.resolved ? 'Resolved' : 'Active'}
                            color={error.resolved ? 'success' : 'error'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
