import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
} from '@mui/material';
import {
  Message,
  Send,
  Error,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    sentMessages: 0,
    receivedMessages: 0,
    failedMessages: 0,
    botStatus: 'offline',
  });

  const [qrCode, setQrCode] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchQrCode();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const statsResponse = await apiService.getStats();
      setStats(statsResponse.data);

      // Fetch recent messages
      const messagesResponse = await apiService.getRecentMessages();
      setRecentMessages(messagesResponse.data.data);
      console.log(messagesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchQrCode = async () => {
    try {
      const qrResponse = await apiService.getQrCode();
      console.log(qrResponse.data.data);
      setQrCode(qrResponse.data.data)// Assuming the QR code data is in data field
      
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
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
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'received': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Overview
      </Typography>

      {/* Bot Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            Bot Status:
          </Typography>
          <Chip
            label={stats.botStatus}
            color={stats.botStatus === 'online' ? 'success' : 'error'}
            icon={stats.botStatus === 'online' ? <CheckCircle /> : <Error />}
          />
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Messages"
            value={stats.totalMessages}
            icon={<Message />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sent Messages"
            value={stats.sentMessages}
            icon={<Send />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Received Messages"
            value={stats.receivedMessages}
            icon={<Message />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed Messages"
            value={stats.failedMessages}
            icon={<Error />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Recent Messages */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Messages
        </Typography>
        {recentMessages.length === 0 ? (
          <Typography color="text.secondary">No recent messages</Typography>
        ) : (
          <Box>
            {recentMessages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < recentMessages.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {message.sender || message.recipient}
                  </Typography>
                  <Typography variant="body1">
                    {message.content.substring(0, 50)}
                    {message.content.length > 50 ? '...' : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    size="small"
                    label={message.status}
                    color={getStatusColor(message.status)}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
      <img src={`${qrCode}`} alt="QR Image  " />
    </Box>
  );
};

export default Dashboard;
