import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import SendMessage from './pages/SendMessage';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import LLMSettings from './pages/LLMSettings';

// Services
import webSocketService from './services/websocket';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#25d366', // WhatsApp green
    },
    secondary: {
      main: '#128c7e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#fff',
        },
      },
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    webSocketService.connect();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/send" element={<SendMessage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/llm-settings" element={<LLMSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
