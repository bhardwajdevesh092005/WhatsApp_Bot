import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Close,
  Phone,
  Message,
  Image,
  Description,
} from '@mui/icons-material';
import { apiService } from '../services/api';

const SendMessage = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    message: '',
    messageType: 'text',
  });
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
  const [recentContacts, setRecentContacts] = useState([
    '+1234567890',
    '+9876543210',
    '+5555555555',
  ]);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleFileAttach = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showAlert('error', 'File size must be less than 10MB');
        return;
      }
      
      setAttachedFile(file);
      
      // Auto-detect message type based on file
      if (file.type.startsWith('image/')) {
        setFormData({ ...formData, messageType: 'image' });
      } else if (file.type === 'application/pdf' || file.type.startsWith('application/')) {
        setFormData({ ...formData, messageType: 'document' });
      }
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFormData({ ...formData, messageType: 'text' });
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, show: false });
  };

  const validateForm = () => {
    if (!formData.recipient.trim()) {
      showAlert('error', 'Please enter a recipient phone number');
      return false;
    }
    
    if (!formData.message.trim() && !attachedFile) {
      showAlert('error', 'Please enter a message or attach a file');
      return false;
    }
    
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.recipient)) {
      showAlert('error', 'Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  const handleSendMessage = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const messageData = new FormData();
      messageData.append('recipient', formData.recipient);
      messageData.append('message', formData.message);
      messageData.append('messageType', formData.messageType);
      
      if (attachedFile) {
        messageData.append('attachment', attachedFile);
      }
      
      const response = await apiService.sendMessage(messageData);
      
      if (response.data.success) {
        showAlert('success', 'Message sent successfully!');
        
        // Reset form
        setFormData({
          recipient: '',
          message: '',
          messageType: 'text',
        });
        setAttachedFile(null);
        
        // Add to recent contacts if not already there
        if (!recentContacts.includes(formData.recipient)) {
          setRecentContacts([formData.recipient, ...recentContacts.slice(0, 4)]);
        }
      } else {
        showAlert('error', response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showAlert('error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectRecentContact = (contact) => {
    setFormData({ ...formData, recipient: contact });
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <Image />;
    } else if (file.type === 'application/pdf' || file.type.startsWith('application/')) {
      return <Description />;
    }
    return <AttachFile />;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Send Message
      </Typography>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Recipient */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recipient Phone Number"
                  placeholder="+1234567890"
                  value={formData.recipient}
                  onChange={handleInputChange('recipient')}
                  InputProps={{
                    startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  helperText="Include country code (e.g., +1 for US, +91 for India)"
                />
              </Grid>

              {/* Message Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Message Type</InputLabel>
                  <Select
                    value={formData.messageType}
                    label="Message Type"
                    onChange={handleInputChange('messageType')}
                  >
                    <MenuItem value="text">Text Message</MenuItem>
                    <MenuItem value="image">Image</MenuItem>
                    <MenuItem value="document">Document</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* File Attachment */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFile />}
                    disabled={loading}
                  >
                    Attach File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileAttach}
                      accept={
                        formData.messageType === 'image'
                          ? 'image/*'
                          : formData.messageType === 'document'
                          ? '.pdf,.doc,.docx,.txt'
                          : '*'
                      }
                    />
                  </Button>
                  
                  {attachedFile && (
                    <Chip
                      icon={getFileIcon(attachedFile)}
                      label={attachedFile.name}
                      onDelete={removeAttachment}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>

              {/* Message Content */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Message"
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  InputProps={{
                    startAdornment: <Message sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />,
                  }}
                />
              </Grid>

              {/* Send Button */}
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  onClick={handleSendMessage}
                  disabled={loading}
                  sx={{ minWidth: 140 }}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Contacts Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Contacts
            </Typography>
            {recentContacts.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No recent contacts
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentContacts.map((contact, index) => (
                  <Chip
                    key={index}
                    label={contact}
                    onClick={() => selectRecentContact(contact)}
                    clickable
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          {/* Message Preview */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                To: {formData.recipient || 'No recipient'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {formData.messageType}
              </Typography>
              {attachedFile && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Attachment: {attachedFile.name}
                </Typography>
              )}
              <Typography variant="body1">
                {formData.message || 'No message content'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

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

export default SendMessage;
