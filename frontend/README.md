# WhatsApp Bot Admin Dashboard - Frontend

A modern React-based admin dashboard for managing WhatsApp Bot operations, built with Vite and Material-UI.

## Features

### 🎛️ Dashboard
- Real-time bot status monitoring
- Message statistics and analytics
- Recent messages overview
- Quick action buttons

### 💬 Message Management
- View all sent and received messages
- Advanced filtering (date, status, sender)
- Search functionality
- Message status tracking (sent, delivered, failed)

### 📤 Send Messages
- Send text messages to WhatsApp contacts
- File attachment support (images, documents)
- Recipient validation
- Message preview
- Recent contacts quick access

### 📊 Analytics
- Message volume trends
- Response time analytics
- Contact activity statistics
- Hourly distribution charts
- Error analysis and reporting

### ⚙️ Settings
- Bot configuration
- Auto-reply settings
- Device connection management
- Contact allow/block lists
- Working hours configuration
- Notification preferences
- Webhook configuration

## Tech Stack

- **Framework**: React 19 with Vite
- **UI Library**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Styling**: Emotion (CSS-in-JS)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- WhatsApp Bot backend server running

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your backend API URL:
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.jsx      # Main layout with navigation
├── pages/              # Page components
│   ├── Dashboard.jsx   # Dashboard overview
│   ├── Messages.jsx    # Message management
│   ├── SendMessage.jsx # Send message form
│   ├── Analytics.jsx   # Analytics dashboard
│   └── Settings.jsx    # Bot settings
├── services/           # API and WebSocket services
│   ├── api.js         # HTTP API client
│   └── websocket.js   # WebSocket service
├── utils/             # Utility functions
│   └── helpers.js     # Common helper functions
├── App.jsx            # Main app component
└── main.jsx          # Entry point
```

## API Integration

The frontend integrates with the WhatsApp Bot backend through:

### REST API Endpoints
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/messages` - Message list with filtering
- `POST /api/messages/send` - Send new message
- `GET /api/analytics` - Analytics data
- `GET /api/settings` - Bot settings
- `PUT /api/settings` - Update settings
- `GET /api/bot/status` - Bot connection status

### WebSocket Events
- `message:new` - New incoming message
- `message:sent` - Message sent successfully
- `message:failed` - Message send failed
- `bot:status` - Bot status updates
- `bot:qr` - QR code for device pairing

## Real-time Features

The dashboard includes real-time updates for:
- New incoming messages
- Message delivery status
- Bot connection status
- Analytics updates

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api` |
| `VITE_WS_URL` | WebSocket URL | `http://localhost:3001` |
| `VITE_MAX_FILE_SIZE` | Max upload size | `10485760` (10MB) |

### Theme Customization

The app uses Material-UI theming with WhatsApp-inspired colors:
- Primary: `#25d366` (WhatsApp green)
- Secondary: `#128c7e` (Darker green)

## Development

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route to `App.jsx`
3. Add navigation item to `Layout.jsx`

### Adding API Endpoints

1. Add method to `src/services/api.js`
2. Use in components with error handling
3. Add WebSocket events if needed

### Styling Guidelines

- Use Material-UI components and theme
- Follow responsive design principles
- Maintain consistent spacing and typography
- Use theme colors and breakpoints

## Performance

- Code splitting with React Router
- Optimized bundle with Vite
- Efficient re-renders with React hooks
- WebSocket connection pooling

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
