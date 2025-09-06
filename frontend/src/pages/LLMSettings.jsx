import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
//   TabPanel,
} from '@mui/material';
import {
  ExpandMore,
  Refresh,
  Save,
  RestoreFromTrash,
  PlayArrow,
  Psychology,
  Settings as SettingsIcon,
  Security,
  Speed,
  Analytics as AnalyticsIcon,
  Info,
} from '@mui/icons-material';
import { apiService } from '../services/api';
import LLMProviderCard from '../components/LLMProviderCard';
import LLMTestComponent from '../components/LLMTestComponent';

const LLMSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    autoReply: false,
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    customEndpoint: '',
    maxTokens: 150,
    temperature: 0.7,
    systemPrompt: 'You are a helpful WhatsApp bot assistant. Respond naturally and helpfully to user messages. Keep responses concise and friendly.',
    fallbackMessage: 'I apologize, but I cannot process your message right now. Please try again later.',
    rateLimitPerHour: 60,
    timeout: 10000,
    headers: {},
    onlyDuringBusinessHours: false,
    smartResponseMode: true,
    contextAware: true,
  });

  const [status, setStatus] = useState({
    isInitialized: false,
    enabled: false,
    provider: '',
    model: '',
    health: { status: 'unknown' },
  });

  const [providers, setProviders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello, how can you help me?');
  const [tabValue, setTabValue] = useState(0);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, statusRes, providersRes, analyticsRes] = await Promise.all([
        apiService.getLLMSettings(),
        apiService.getLLMStatus(),
        apiService.getLLMProviders(),
        apiService.getLLMAnalytics(),
      ]);

      setSettings(settingsRes.data.data);
      setStatus(statusRes.data.data);
      setProviders(providersRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error) {
      console.error('Error fetching LLM data:', error);
      showSnackbar('Error fetching LLM settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateLLMSettings(settings);
      await fetchData(); // Refresh status
      showSnackbar('LLM settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      showSnackbar('Error saving LLM settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await apiService.resetLLMSettings();
      await fetchData(); // Refresh all data
      showSnackbar('LLM settings reset to defaults', 'success');
    } catch (error) {
      console.error('Error resetting LLM settings:', error);
      showSnackbar('Error resetting LLM settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const response = await apiService.testLLMResponse({
        message: testMessage,
        context: {
          sender: 'test-user',
          senderName: 'Test User',
          isGroup: false,
          businessHours: true,
        },
      });
      setTestResult(response.data);
      showSnackbar('LLM test completed', 'success');
    } catch (error) {
      console.error('Error testing LLM:', error);
      setTestResult({
        success: false,
        error: error.response?.data?.message || error.message,
      });
      showSnackbar('Error testing LLM', 'error');
    } finally {
      setTesting(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'error': return 'error';
      case 'disabled': return 'default';
      default: return 'warning';
    }
  };

  const getProviderModels = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider ? provider.models : [];
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`llm-tabpanel-${index}`}
      aria-labelledby={`llm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
        LLM Settings
      </Typography>

      {/* Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Service Status
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Status:</Typography>
                <Chip
                  label={status.health.status}
                  color={getStatusColor(status.health.status)}
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                Provider: <strong>{status.provider || 'Not configured'}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                Model: <strong>{status.model || 'Not configured'}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Tooltip title="Refresh status">
                <IconButton onClick={fetchData} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Analytics Card */}
      {analytics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Usage Analytics (Last 30 Days)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  Total Replies: <strong>{analytics.totalLLMReplies}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  Avg/Day: <strong>{analytics.averagePerDay}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  Unique Users: <strong>{analytics.uniqueUsers}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  Success Rate: <strong>{((analytics.responseTypes.llm / (analytics.responseTypes.llm + analytics.responseTypes.fallback)) * 100 || 0).toFixed(1)}%</strong>
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Configuration" icon={<SettingsIcon />} />
          <Tab label="Providers" icon={<Psychology />} />
          <Tab label="Test & Debug" icon={<PlayArrow />} />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
        </Tabs>

        {/* Configuration Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Basic Configuration */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enabled}
                        onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                      />
                    }
                    label="Enable LLM Service"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoReply}
                        onChange={(e) => handleSettingChange('autoReply', e.target.checked)}
                        disabled={!settings.enabled}
                      />
                    }
                    label="Enable Auto-Reply"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Provider</InputLabel>
                    <Select
                      value={settings.provider}
                      onChange={(e) => handleSettingChange('provider', e.target.value)}
                      label="Provider"
                    >
                      {providers.map((provider) => (
                        <MenuItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={settings.model}
                      onChange={(e) => handleSettingChange('model', e.target.value)}
                      label="Model"
                    >
                      {getProviderModels(settings.provider).map((model) => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => handleSettingChange('apiKey', e.target.value)}
                    helperText="Required for OpenAI provider"
                    disabled={settings.provider !== 'openai'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Base URL"
                    value={settings.baseURL}
                    onChange={(e) => handleSettingChange('baseURL', e.target.value)}
                    helperText="API endpoint URL"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Custom Endpoint"
                    value={settings.customEndpoint}
                    onChange={(e) => handleSettingChange('customEndpoint', e.target.value)}
                    helperText="For custom providers"
                    disabled={settings.provider !== 'custom'}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                Advanced Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>Max Tokens: {settings.maxTokens}</Typography>
                  <Slider
                    value={settings.maxTokens}
                    onChange={(e, value) => handleSettingChange('maxTokens', value)}
                    min={50}
                    max={500}
                    marks={[
                      { value: 50, label: '50' },
                      { value: 150, label: '150' },
                      { value: 300, label: '300' },
                      { value: 500, label: '500' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>Temperature: {settings.temperature}</Typography>
                  <Slider
                    value={settings.temperature}
                    onChange={(e, value) => handleSettingChange('temperature', value)}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 0.7, label: '0.7' },
                      { value: 1, label: '1' },
                      { value: 2, label: '2' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rate Limit (per hour)"
                    type="number"
                    value={settings.rateLimitPerHour}
                    onChange={(e) => handleSettingChange('rateLimitPerHour', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 1000 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Timeout (ms)"
                    type="number"
                    value={settings.timeout}
                    onChange={(e) => handleSettingChange('timeout', parseInt(e.target.value))}
                    inputProps={{ min: 1000, max: 60000 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.onlyDuringBusinessHours}
                        onChange={(e) => handleSettingChange('onlyDuringBusinessHours', e.target.checked)}
                      />
                    }
                    label="Only During Business Hours"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.smartResponseMode}
                        onChange={(e) => handleSettingChange('smartResponseMode', e.target.checked)}
                      />
                    }
                    label="Smart Response Mode"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Prompts & Messages */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                Prompts & Messages
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="System Prompt"
                    value={settings.systemPrompt}
                    onChange={(e) => handleSettingChange('systemPrompt', e.target.value)}
                    helperText="Instructions for how the AI should behave"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Fallback Message"
                    value={settings.fallbackMessage}
                    onChange={(e) => handleSettingChange('fallbackMessage', e.target.value)}
                    helperText="Message sent when LLM fails to respond"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        {/* Providers Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Available LLM Providers
          </Typography>
          <Grid container spacing={2}>
            {providers.map((provider) => (
              <Grid item xs={12} md={6} lg={4} key={provider.id}>
                <LLMProviderCard
                  provider={provider}
                  isSelected={settings.provider === provider.id}
                  onSelect={(providerId) => handleSettingChange('provider', providerId)}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Test & Debug Tab */}
        <TabPanel value={tabValue} index={2}>
          <LLMTestComponent disabled={!settings.enabled} />
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          {analytics && (
            <Box>
              <Typography variant="h6" gutterBottom>
                LLM Usage Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Usage Statistics
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography>
                          Total LLM Replies: <strong>{analytics.totalLLMReplies}</strong>
                        </Typography>
                        <Typography>
                          Average per Day: <strong>{analytics.averagePerDay}</strong>
                        </Typography>
                        <Typography>
                          Unique Users: <strong>{analytics.uniqueUsers}</strong>
                        </Typography>
                        <Typography>
                          Success Rate: <strong>
                            {((analytics.responseTypes.llm / (analytics.responseTypes.llm + analytics.responseTypes.fallback)) * 100 || 0).toFixed(1)}%
                          </strong>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Response Types
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>LLM Responses:</Typography>
                          <Chip label={analytics.responseTypes.llm} color="success" />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Fallback Responses:</Typography>
                          <Chip label={analytics.responseTypes.fallback} color="warning" />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Settings
        </Button>
        <Button
          variant="outlined"
          startIcon={<PlayArrow />}
          onClick={() => setTabValue(2)}
          disabled={!settings.enabled}
        >
          Test LLM
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestoreFromTrash />}
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
        >
          Refresh Status
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LLMSettings;
