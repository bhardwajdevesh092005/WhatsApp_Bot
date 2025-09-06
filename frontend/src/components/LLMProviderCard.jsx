import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Link,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  OpenInNew,
  Key,
  Computer,
  Api,
} from '@mui/icons-material';

const LLMProviderCard = ({ provider, isSelected, onSelect }) => {
  const getProviderIcon = (providerId) => {
    switch (providerId) {
      case 'openai': return <Key />;
      case 'ollama': return <Computer />;
      case 'custom': return <Api />;
      default: return <Api />;
    }
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': {
          borderColor: 'primary.main',
          elevation: 3,
        },
      }}
      onClick={() => onSelect(provider.id)}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {getProviderIcon(provider.id)}
          <Typography variant="h6">{provider.name}</Typography>
          {isSelected && <Chip label="Selected" color="primary" size="small" />}
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {provider.description}
        </Typography>

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Available Models:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {provider.models.slice(0, 3).map((model) => (
              <Chip
                key={model}
                label={model}
                size="small"
                variant="outlined"
              />
            ))}
            {provider.models.length > 3 && (
              <Chip
                label={`+${provider.models.length - 3} more`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            API Key Required:
          </Typography>
          <Chip
            label={provider.requiresApiKey ? 'Yes' : 'No'}
            color={provider.requiresApiKey ? 'warning' : 'success'}
            size="small"
          />
        </Box>

        {provider.documentation && (
          <Box mt={1}>
            <Link
              href={provider.documentation}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <Typography variant="body2">Documentation</Typography>
              <OpenInNew fontSize="small" />
            </Link>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LLMProviderCard;
