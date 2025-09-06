import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Snackbar,
} from '@mui/material';
import {
  Save,
  Refresh,
  Add,
  Delete,
  Edit,
  Computer,
  Smartphone,
  QrCode,
  Settings as SettingsIcon,
  Security,
  Notifications,
} from '@mui/icons-material';
import { apiService } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    botName: 'WhatsApp Bot',
    autoReply: false,
    autoReplyMessage: 'Thanks for your message! We will get back to you soon.',
    webhookUrl: '',
    maxRetries: 3,
    retryDelay: 5000,
    enableLogging: true,
    logLevel: 'info',
    allowedContacts: [],
    blockedContacts: [],
    workingHours: {
      enabled: false,
      start: '09:00',
      end: '17:00',
      timezone: 'UTC',
    },
    notifications: {
      email: true,
      webhook: false,
      emailAddress: '',
    },
  });

  const [deviceStatus, setDeviceStatus] = useState({
    connected: false,
    deviceInfo: null,
    qrCode: null,
    lastSeen: null,
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [contactDialog, setContactDialog] = useState({ open: false, type: 'allowed', contact: '' });

  useEffect(() => {
    fetchSettings();
    fetchDeviceStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiService.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchDeviceStatus = async () => {
    try {
      const response = await apiService.getDeviceStatus();
      setDeviceStatus(response.data);
    } catch (error) {
      console.error('Error fetching device status:', error);
    }
  };

  const handleSettingChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...settings[parent],
          [child]: value,
        },
      });
    } else {
      setSettings({
        ...settings,
        [field]: value,
      });
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await apiService.updateSettings(settings);
      showAlert('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnectDevice = async () => {
    setLoading(true);
    try {
      const response = await apiService.reconnectDevice();
      setDeviceStatus(response.data);
      showAlert('success', 'Device reconnection initiated!');
    } catch (error) {
      console.error('Error reconnecting device:', error);
      showAlert('error', 'Failed to reconnect device. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const handleAddContact = (type) => {
    setContactDialog({ open: true, type, contact: '' });
  };

  const handleContactDialogClose = () => {
    setContactDialog({ open: false, type: 'allowed', contact: '' });
  };

  const handleContactDialogSave = () => {
    const { type, contact } = contactDialog;
    if (contact.trim()) {
      const listKey = type === 'allowed' ? 'allowedContacts' : 'blockedContacts';
      setSettings({
        ...settings,
        [listKey]: [...settings[listKey], contact.trim()],
      });
    }
    handleContactDialogClose();
  };

  const handleRemoveContact = (type, index) => {
    const listKey = type === 'allowed' ? 'allowedContacts' : 'blockedContacts';
    const newList = settings[listKey].filter((_, i) => i !== index);
    setSettings({
      ...settings,
      [listKey]: newList,
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Device Status */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Device Status"
              avatar={<Smartphone />}
              action={
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchDeviceStatus}
                  size="small"
                >
                  Refresh
                </Button>
              }
            />
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                      Connection Status:
                    </Typography>
                    <Chip
                      label={deviceStatus.connected ? 'Connected' : 'Disconnected'}
                      color={deviceStatus.connected ? 'success' : 'error'}
                      icon={deviceStatus.connected ? <Computer /> : <QrCode />}
                    />
                  </Box>
                  {deviceStatus.deviceInfo && (
                    <Typography variant="body2" color="text.secondary">
                      Device: {deviceStatus.deviceInfo.name} ({deviceStatus.deviceInfo.platform})
                    </Typography>
                  )}
                  {deviceStatus.lastSeen && (
                    <Typography variant="body2" color="text.secondary">
                      Last seen: {new Date(deviceStatus.lastSeen).toLocaleString()}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {!deviceStatus.connected && (
                    <Button
                      variant="contained"
                      onClick={handleReconnectDevice}
                      disabled={loading}
                      startIcon={<QrCode />}
                    >
                      Reconnect Device
                    </Button>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Bot Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Bot Configuration" avatar={<SettingsIcon />} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bot Name"
                    value={settings.botName}
                    onChange={handleSettingChange('botName')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoReply}
                        onChange={handleSettingChange('autoReply')}
                      />
                    }
                    label="Enable Auto Reply"
                  />
                </Grid>
                {settings.autoReply && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Auto Reply Message"
                      value={settings.autoReplyMessage}
                      onChange={handleSettingChange('autoReplyMessage')}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={settings.webhookUrl}
                    onChange={handleSettingChange('webhookUrl')}
                    placeholder="https://your-webhook-url.com"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Advanced Settings" avatar={<Security />} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Retries"
                    value={settings.maxRetries}
                    onChange={handleSettingChange('maxRetries')}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retry Delay (ms)"
                    value={settings.retryDelay}
                    onChange={handleSettingChange('retryDelay')}
                    inputProps={{ min: 1000, step: 1000 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableLogging}
                        onChange={handleSettingChange('enableLogging')}
                      />
                    }
                    label="Enable Logging"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Log Level"
                    value={settings.logLevel}
                    onChange={handleSettingChange('logLevel')}
                    SelectProps={{ native: true }}
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Working Hours */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Working Hours" avatar={<Schedule />} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workingHours.enabled}
                        onChange={handleSettingChange('workingHours.enabled')}
                      />
                    }
                    label="Enable Working Hours"
                  />
                </Grid>
                {settings.workingHours.enabled && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="Start Time"
                        value={settings.workingHours.start}
                        onChange={handleSettingChange('workingHours.start')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="End Time"
                        value={settings.workingHours.end}
                        onChange={handleSettingChange('workingHours.end')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Timezone"
                        value={settings.workingHours.timezone}
                        onChange={handleSettingChange('workingHours.timezone')}
                        placeholder="UTC"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Notifications" avatar={<Notifications />} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.email}
                        onChange={handleSettingChange('notifications.email')}
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                {settings.notifications.email && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={settings.notifications.emailAddress}
                      onChange={handleSettingChange('notifications.emailAddress')}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.webhook}
                        onChange={handleSettingChange('notifications.webhook')}
                      />
                    }
                    label="Webhook Notifications"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Management */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Contact Management" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Allowed Contacts</Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddContact('allowed')}
                    >
                      Add
                    </Button>
                  </Box>
                  <List dense>
                    {settings.allowedContacts.map((contact, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={contact} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveContact('allowed', index)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {settings.allowedContacts.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No contacts in allow list
                      </Typography>
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Blocked Contacts</Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddContact('blocked')}
                    >
                      Add
                    </Button>
                  </Box>
                  <List dense>
                    {settings.blockedContacts.map((contact, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={contact} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveContact('blocked', index)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                    {settings.blockedContacts.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No blocked contacts
                      </Typography>
                    )}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={loading}
          >
            Save Settings
          </Button>
        </Grid>
      </Grid>

      {/* Contact Dialog */}
      <Dialog open={contactDialog.open} onClose={handleContactDialogClose}>
        <DialogTitle>
          Add {contactDialog.type === 'allowed' ? 'Allowed' : 'Blocked'} Contact
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Phone Number"
            placeholder="+1234567890"
            fullWidth
            value={contactDialog.contact}
            onChange={(e) => setContactDialog({ ...contactDialog, contact: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleContactDialogClose}>Cancel</Button>
          <Button onClick={handleContactDialogSave} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.show}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.type}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
