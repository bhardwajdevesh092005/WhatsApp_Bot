import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Send,
  Clear,
  Psychology,
} from '@mui/icons-material';
import { apiService } from '../services/api';

const LLMTestComponent = ({ disabled = false }) => {
  const [testMessage, setTestMessage] = useState('Hello, how can you help me?');
  const [testContext, setTestContext] = useState({
    sender: 'test-user',
    senderName: 'Test User',
    isGroup: false,
    businessHours: true,
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const predefinedMessages = [
    'Hello, how can you help me?',
    'What are your business hours?',
    'Can you help me with my order?',
    'I need technical support',
    'What services do you offer?',
    'How can I contact support?',
  ];

  const handleTest = async () => {
    if (!testMessage.trim()) return;

    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await apiService.testLLMResponse({
        message: testMessage,
        context: testContext,
      });
      
      setTestResult(response.data);
      console.log('LLM Test Response:', response.data);
    } catch (error) {
      console.error('Error testing LLM:', error);
      setTestResult({
        success: false,
        error: error.response?.data?.message || error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setTestMessage('');
    setTestResult(null);
  };

  const handlePredefinedMessage = (message) => {
    setTestMessage(message);
    setTestResult(null);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
          Test LLM Response
        </Typography>

        {/* Test Context Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Test Context:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
            <TextField
              label="Sender Name"
              value={testContext.senderName}
              onChange={(e) => setTestContext(prev => ({ ...prev, senderName: e.target.value }))}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={testContext.isGroup}
                  onChange={(e) => setTestContext(prev => ({ ...prev, isGroup: e.target.checked }))}
                />
              }
              label="Group Chat"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={testContext.businessHours}
                  onChange={(e) => setTestContext(prev => ({ ...prev, businessHours: e.target.checked }))}
                />
              }
              label="Business Hours"
            />
          </Box>
        </Box>

        {/* Predefined Messages */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Test Messages:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {predefinedMessages.map((message, index) => (
              <Chip
                key={index}
                label={message}
                onClick={() => handlePredefinedMessage(message)}
                clickable
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Test Message Input */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Test Message"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Enter a message to test the LLM response..."
          disabled={disabled}
          sx={{ mb: 2 }}
        />

        {/* Action Buttons */}
        <Box display="flex" gap={1} mb={2}>
          <Button
            variant="contained"
            startIcon={testing ? <CircularProgress size={20} /> : <Send />}
            onClick={handleTest}
            disabled={disabled || testing || !testMessage.trim()}
          >
            Test Response
          </Button>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClear}
            disabled={disabled || testing}
          >
            Clear
          </Button>
        </Box>

        {/* Test Result */}
        {testResult && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Result:
            </Typography>
            <Alert 
              severity={testResult.success ? 'success' : 'error'}
              sx={{ 
                '& .MuiAlert-message': { 
                  width: '100%',
                  wordBreak: 'break-word'
                }
              }}
            >
              {testResult.success ? (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    LLM Response:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {testResult.data?.response}
                  </Typography>
                  {testResult.data?.timestamp && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                      Generated at: {new Date(testResult.data.timestamp).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Error:
                  </Typography>
                  <Typography variant="body2">
                    {testResult.error}
                  </Typography>
                </Box>
              )}
            </Alert>
          </Box>
        )}

        {disabled && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            LLM service is disabled. Enable it in the settings to test responses.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default LLMTestComponent;
