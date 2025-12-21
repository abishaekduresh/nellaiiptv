# Nellai IPTV

**Version 1.5.0** | A modern IPTV streaming platform with dual-mode interface

## Overview

Nellai IPTV is a full-stack video streaming platform optimized for both web (OTT Mode) and TV (Classic Mode) interfaces. Built with modern technologies, it provides a seamless viewing experience across all devices.

- **Frontend**: Next.js 14 (React 18) with TypeScript
- **Backend**: Slim PHP REST API with Eloquent ORM
- **Database**: MySQL with MyISAM engine
- **Styling**: Tailwind CSS with custom design system

## Key Features

### 🎯 Dual Mode Interface
- **OTT Mode**: Modern web interface with Netflix-style UI, hero banners, and categorized content
- **Classic Mode**: TV-optimized interface with channel grid and remote control navigation

### 📺 Video Streaming
- HLS video streaming with Video.js player
- Real-time stream status monitoring
- Quality selector and playback controls
- TV remote control support (Play/Pause, Volume, Seek)

### 🔍 Advanced Features
- **Search**: Search channels by name or channel number
- **Favorites**: Save and manage favorite channels (persisted in localStorage)
- **Ratings & Comments**: Rate and comment on channels
- **Channel Reports**: Report issues with channels (stored in database)
- **Contact Form**: Submit inquiries via database-backed contact system

### 🌐 Network & Connectivity
- Real-time internet connection monitoring
- Toast notifications for connection status
- Automatic offline detection and recovery

### 📱 Responsive Design
- Mobile-first responsive design
- TV navigation with spatial controls
- Keyboard and remote control support

### 🔐 Authentication
- JWT-based authentication
- User registration and login
- Profile management
- Admin panel support

## Project Structure

```
nellai-iptv/
├── frontend/                 # Next.js application
│   ├── app/                 # Next.js 14 App Router pages
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state management
│   ├── context/            # React context providers
│   ├── lib/                # Utilities and API client
│   └── public/             # Static assets
│
├── backend/                 # Slim PHP API
│   ├── app/
│   │   ├── Controllers/    # API controllers
│   │   ├── Models/         # Eloquent models
│   │   ├── Services/       # Business logic
│   │   ├── Middleware/     # Request middleware
│   │   ├── Routes/         # API routes
│   │   └── Helpers/        # Utility functions
│   ├── database/
│   │   └── migrations/     # SQL migration files
│   └── public/             # Entry point
│
├── CHANGELOG.md            # Version history
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PHP 8.1+
- MySQL 8.0+
- Composer

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure NEXT_PUBLIC_API_URL in .env.local
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
composer install
# Configure database connection in .env or config
# Run SQL migrations from database/migrations/
php -S localhost:8080 -t public
```

Backend API will be available at `http://localhost:8080`

### Database Setup

1. Create MySQL database
2. Run migration files in order:
   - `create_channel_reports_table.sql`
   - `create_contact_messages_table.sql`
   - (other migration files as needed)

## API Endpoints

### Public Endpoints
- `GET /api/channels` - List all channels
- `GET /api/channels/featured` - Get featured channels
- `GET /api/channels/{uuid}` - Get channel details
- `GET /api/channels/{uuid}/stream-status` - Check stream status
- `POST /api/channels/{uuid}/report` - Report channel issue
- `POST /api/contact` - Submit contact form

### Protected Endpoints (Require JWT)
- `POST /api/channels/{uuid}/rate` - Rate a channel
- `POST /api/channels/{uuid}/comment` - Comment on a channel
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/refresh` - Refresh JWT token

## Technologies Used

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Video Player**: Video.js with HLS support
- **UI Components**: Custom components with Lucide icons
- **Notifications**: react-hot-toast

### Backend
- **Framework**: Slim PHP 4
- **ORM**: Eloquent (Laravel)
- **Authentication**: Firebase JWT
- **Validation**: Valitron
- **Database**: MySQL with MyISAM engine

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### Backend
Configure database connection and JWT secret in your environment or config files.

## Recent Updates (v1.5.0)

- ✅ Channel reporting system with database storage
- ✅ Contact form backend integration
- ✅ Real-time stream status monitoring
- ✅ Classic Mode navigation guard
- ✅ Network status monitoring with toast notifications
- ✅ Improved UI spacing and skeleton loading
- ✅ Enhanced error handling and validation

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or feature requests, please use the contact form in the application or open an issue on the repository.

---

**Nellai IPTV** - Premium Entertainment, Anytime, Anywhere
