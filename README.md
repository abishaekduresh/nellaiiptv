# Nellai IPTV

**Current Version**: Frontend v1.17.5 | Backend v1.13.0

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

### 🛡️ Platform Control
- **Strict Filtering**: Content is filtered based on the client device (Web, TV, Mobile).
- **Security**: Request headers (`X-Client-Platform`) enforce platform-specific access rights.

### 📺 Video Streaming
- HLS video streaming with **Smart Device Profiling** (TV/Mobile/PC optimized)
- Dynamic Resolution Capping & Buffer Management
- Quality selector and playback controls
- **Premium UI**: Custom "Dual Ring" animated loader and persistent branding watermark
- TV remote control support (Play/Pause, Volume, Seek)

### 🔍 Advanced Features
- **Search**: Search channels by name or channel number
- **Favorites**: Save and manage favorite channels (persisted in localStorage)
- **Ratings & Comments**: Rate and comment on channels
- **Channel Reports**: Report issues with channels (stored in database)
- **Contact Form**: Submit inquiries via database-backed contact system
- **Unlimited Browsing**: Support for fetching and browsing thousands of channels without hardcoded limits (v1.6.0)

### 🌐 Network & Connectivity
- Real-time internet connection monitoring
- Toast notifications for connection status
- Automatic offline detection and recovery

### 📱 Responsive Design
- Mobile-first responsive design
- TV navigation with spatial controls
- Keyboard and remote control support

### 🔐 Authentication & Security
- **API Key Security**: Frontend-Backend communication secured via `X-API-KEY`.
- **JWT Authentication**: Secure user sessions for ratings and comments.
- **Rate Limiting**: Public endpoints protected against unlimited scraping (100 req/min).
- **Security Headers**: HSTS, XSS protection, and anti-sniffing headers enabled.

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
│   │   ├── Middleware/     # Request middleware (ApiKey, RateLimit, SecurityHeaders)
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
# Configure NEXT_PUBLIC_API_URL and NEXT_PUBLIC_API_SECRET
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
# Configure DB and API_SECRET in .env
php -S localhost:80 -t public
```

Backend API will be available at `http://localhost:80`

### Database Setup

1. Create MySQL database
2. Run migration files in order:
   - `create_channel_reports_table.sql`
   - `create_contact_messages_table.sql`
   - `migrate_favorites.php` (Run via PHP: `php backend/migrate_favorites.php`)
   - (other migration files as needed)

## API Endpoints

### Public Endpoints (Require X-API-KEY)
- `GET /api/channels` - List all channels
- `GET /api/channels/featured` - Get featured channels
- `GET /api/channels/{uuid}` - Get channel details
- `POST /api/channels/{uuid}/report` - Report channel issue
- `POST /api/contact` - Submit contact form

### Protected Endpoints (Require X-API-KEY + JWT)
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
- **HTTP Client**: Axios (configured with automated `X-API-KEY` injection)
- **Video Player**: Video.js with HLS support
- **UI Components**: Custom components with Lucide icons
- **Notifications**: react-hot-toast

### Backend
- **Framework**: Slim PHP 4
- **ORM**: Eloquent (Laravel)
- **Authentication**: Firebase JWT
- **Validation**: Valitron
- **Database**: MySQL with MyISAM engine
- **Security Middleware**: Custom Stack (Cors, ApiKey, RateLimit, SecurityHeaders)

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_API_SECRET=your_backend_secret
```

### Backend (.env)
```
API_SECRET=your_backend_secret
JWT_SECRET=your_jwt_secret
```

## Latest Updates

### Backend (v1.13.0) | Frontend (v1.17.4)
- 🐛 **Critical Fix**: Resolved namespace conflict in `Admin\ChannelController` causing Fatal Errors.
- 🐛 **CORS Refactor**: Corrected middleware order in `index.php` to ensure CORS headers are sent on all responses.
- **Security Refactor**: (Frontend v1.17.4)
  - Extracted Admin API logic to dedicated secure client with automatic session management.
  - Improved handling of 401 Unauthorized states with auto-redirects.

- **Platform Control**: (Backend v1.13.0, Frontend v1.17.3)
  - Implemented strict platform-based content filtering (Web/Android/iOS/TV).
  - Enforced `X-Client-Platform` header for all API interactions.
  - Added native support for 'TV' platform restrictions.

- **Premium Ecosystem**: (Backend v1.12.3, Frontend v1.17.2)
  - **Secure HLS**: Premium channel URLs are now automatically redacted in the API for unauthorized users.
  - **Refactored Logic**: Transitioned from `is_paid` to `is_premium` for better semantic clarity.
  - **Visual Polishing**: Added gold "Premium" badges and restricted access overlays in the UI.
- 🐛 **Stability**: Fixed logo URL generation in `SettingController` to ensure fully qualified URLs.

### Backend (v1.11.0) | Frontend (v1.16.0)
- 🚀 **Smart HLS Engine**: Ultra-optimized video player with **Aggressive Buffering** for TVs, hardware-based resolution capping, and **Zero-Overhead Classic Mode** (optimized DOM rendering).
- 🔒 **Registration Security**: Complete overhaul of registration flow with Math Captcha, strict regex validation, and improved UI.
- 🐛 **Critical Fix**: Resolved JSON body parsing issues in backend and admin login compilation errors in frontend.

### Backend (v1.10.1) | Frontend (v1.14.0)
- 🛡️ **Stability & Resilience**: Implemented automatic Backend Disconnect Fallback (Classic -> OTT) and resolved infinite Login Loops.
- 🔧 **Connection Fixes**: Corrected Backend Base Path calculation and Frontend Health Check diagnostics for reliable production deployments (Vercel/WAMP).

### Backend (v1.10.0) | Frontend (v1.13.0)
- 🔒 **Security Suite**: Implemented `ApiKeyMiddleware`, `RateLimitMiddleware`, and `SecurityHeadersMiddleware`.
- 🔧 **CORS Overhaul**: Fixed Preflight OPTION handling for robust cross-origin support.
- 🐛 **Deletion Fixes**: Corrected Channel Hard Delete and Customer Soft Delete logic.

### Frontend (v1.12.0)
- ✅ **Dynamic Titles**: Browser tab shows playing channel name.
- ✅ **Performance**: Lazy loading for thumbnails.
- ❌ **Clean UI**: Removed online/offline status badges.

### Backend (v1.9.0)
- ✅ **Compatibility**: PHP 8.3 support (upgraded dependencies).
- ❌ **Cleanup**: Removed unused status check endpoints.

### Frontend (v1.11.0)
- ✅ **Classic Mode Expiry**: Automatically reverts to OTT Mode after 24 hours.

### Frontend (v1.10.0)
- ✅ **Watch History**: "Continue Watching" row on Dashboard.
- ✅ **Picture-in-Picture (PiP)**: Floating video support.
- ✅ **AirPlay Support**: Added AirPlay casting support for Apple devices.
- ✅ **Auto-Retry**: Implemented auto-refresh mechanism (10s countdown) when playback errors occur.

## Recent Updates (v1.7.0)
- ✅ **Advanced Classic Mode**: Complete mobile redesign and TV navigation improvements.
- ✅ **Enhanced Filtering**: Grouping by Language and Category with improved sorting.
- ✅ **Performance**: Optimized channel loading and rendering.
- ✅ **IP Tracking**: Implemented channel view tracking with client IPs.

## Previous Updates (v1.6.0)
- ✅ Global removal of the 100-channel limit
- ✅ Integrated `limit=-1` API support for unlimited data fetching
- ✅ Full synchronization of "no limit" behavior across all modes and categories
- ✅ Updated documentation and changelogs for v1.6.0

## Previous Updates (v1.5.0)
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
