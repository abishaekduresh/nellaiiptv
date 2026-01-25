# Nellai IPTV - Backend API (v1.21.0)

**Version 1.21.0** | RESTful API built with Slim PHP Framework

## Overview

The backend of **Nellai IPTV** is a RESTful API built with **Slim PHP 4** framework, using **Eloquent ORM** for database operations and **JWT** for authentication. It features robust security layers including **API Key Authentication**, **Rate Limiting**, and **Security Headers**.

## Tech Stack

- **Framework**: Slim PHP 4
- **ORM**: Eloquent (Laravel Database)
- **Authentication**: Firebase JWT (User Auth) + API Key (Public Access)
- **Security**: Rate Limiting, Security Headers (HSTS, XSS Protection)
- **Validation**: Valitron
- **Database**: MySQL 8.0+ (MyISAM engine)
- **Dependency Injection**: PHP-DI
- **HTTP**: PSR-7 compliant

## Prerequisites

- PHP >= 8.1
- Composer
- MySQL 8.0+
- Apache/Nginx with mod_rewrite

## Installation

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Database Setup

Create a MySQL database and import the migration files:

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE nellai_iptv;"

# Import migrations
mysql -u root -p nellai_iptv < database/migrations/create_channel_reports_table.sql
mysql -u root -p nellai_iptv < database/migrations/create_contact_messages_table.sql
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure your database and security keys:

```ini
DB_HOST=localhost
DB_NAME=nellai_iptv
DB_USER=root
DB_PASS=

# Security
JWT_SECRET=your_jwt_secret_here
API_SECRET=your_strong_api_secret_here

# General
APP_URL=https://api.yoursite.com/backend/public  # Required for correct absolute URL generation (supports subdirectories)
```

### 4. Start Development Server

```bash
php -S localhost:8080 -t public
```

The API will be available at `http://localhost:8080`

## Project Structure

```
backend/
├── app/
│   ├── Controllers/          # Request handlers
│   │   ├── Admin/           # Admin controllers
│   │   ├── AuthController.php
│   │   ├── ChannelController.php
│   │   └── ...
│   ├── Models/              # Eloquent models
│   │   ├── Channel.php
│   │   └── ...
│   ├── Services/            # Business logic
│   │   ├── AuthService.php
│   │   ├── Admin/ChannelService.php # Admin specific logic
│   │   └── ...
│   ├── Middleware/          # Request middleware
│   │   ├── ApiKeyMiddleware.php       # Enforces X-API-KEY
│   │   ├── RateLimitMiddleware.php    # Request throttling
│   │   ├── SecurityHeadersMiddleware.php # Security headers
│   │   ├── JwtMiddleware.php
│   │   └── CorsMiddleware.php
│   ├── Helpers/             # Utility classes
│   │   └── ...
│   └── Routes/              # Route definitions
│       └── api.php
├── database/
│   └── migrations/          # SQL migration files
├── public/
│   └── index.php           # Application entry point
├── vendor/                  # Composer dependencies
└── composer.json
```

## API Documentation

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint reference.

### Quick Reference

**Base URL**: `/api`

**Required Headers**:
- `X-API-KEY`: Required for ALL public endpoints.
- `Authorization`: Bearer token required for protected endpoints.
- `X-Client-Platform`: Required for content filtering (`web`, `tv`, `ios`, `android`).

#### Authentication
- `POST /customers/register` - Register new user
- `POST /customers/login` - User login

#### Channels
- `GET /channels` - List all channels
- `GET /channels/featured` - Get featured channels

#### System
- `GET /health` - Health check endpoint

### Deployment Note
For **root folder deployments**, the application automatically detects the base path. Ensure `API_SECRET` is set in your environment.

## Database Schema

### Main Tables
- `channels`, `customers`, `ads`, `channel_views`, `contact_messages`

## Authentication

The API uses a dual-layer security model:
1. **API Key**: Required for all public requests (e.g., fetching channels) to prevent unauthorized scraping.
2. **JWT**: Required for user-specific actions (e.g., rating, commenting).

### Getting a Token
1. Register/Login to get a JWT.
2. Use `Authorization: Bearer <token>` in headers.

## Rate Limiting
Public endpoints are rate-limited to **100 requests per minute** per IP address to prevent abuse.

## Latest Updates (v1.21.0)
- **Settings Resolution**: Enhanced `PublicSettingController` to resolve full absolute URLs for fallback assets.
- **Resilience**: Added automated fallback video sample defaults for empty configurations.

## Latest Updates (v1.20.4)
- **Settings**: Added `fallback_404_mp4_url` support for compatible fallback playback.
- **Ads**: Enabled `redirect_url` support for clickable banner ads.

## Latest Updates (v1.20.3)
- **Math Logic**: Switched to integer-based view count formatting for precision.
- **Production URL Fix**: Robust `APP_URL` detection supporting `getenv` and `$_SERVER` fallbacks.
- **Admin**: Updated settings resolution logic.

## Latest Updates (v1.20.2)
- **Production URL Fix**: Enhanced `APP_URL` detection supporting `getenv` and `$_SERVER` fallbacks.
- **Admin**: Updated settings resolution logic.

## Latest Updates (v1.20.1)
- **Security**: Removed `_path` fields from API responses.
- **Architecture**: Enforced absolute URL usage for all media assets.

## Latest Updates (v1.20.0)
- **Production URL Fixes**: Refactored `Channel` and `Settings` models to prioritize `APP_URL` from environment to generate correct absolute URLs for images in production.
- **Env Configuration**: Clarified `APP_URL` usage in `README` to prevent localhost leakages.

## Latest Updates (v1.19.0)
- **API Key System**: Database-backed API key management with expiry, soft-delete, and Platform Restrictions.
- 🔐 **Security**: Legacy `.env` API secrets supported alongside new DB keys.

## Latest Updates (v1.18.0)
- 🖼️ **Logo System Refactor**: Settings now store relative paths and dynamically resolve URLs based on `APP_URL` or Proxy headers (`X-Forwarded-*`).
- 📁 **Subdirectory Support**: Fixed asset URL generation for backends deployed in subfolders (e.g., `/nellaiiptv/backend`).
- 💧 **Watermark Setting**: Added dedicated `app_logo_png_path` setting for the video player's transparent overlay.

## Latest Updates (v1.17.0)
- **API Key System**: Database-backed API key management with expiry and soft-delete support (`api_keys` table).
- 💳 **Subscription Engine**: Flexible plan management and validation logic. subscription plans (`SubscriptionPlanController`) and identifying customer subscriptions.
- ⚙️ **Public Settings**: Expose `top_trending_platforms` configuration to control trending section visibility.

## Latest Updates (v1.15.0)
- 📊 **Analytics API**: New `GET /admin/channels/{uuid}/analytics` provides rich data on channel views (daily trends) and user ratings.
- 🛠️ **Service Architecture**: Separated Admin-only logic into `Services\Admin\ChannelService` for better code organization and security.
- 🐛 **Bug Fixes**: Resolved 500 errors in public channel listings by optimizing `withAvg` queries.

## Latest Updates (v1.14.0)
- 📝 **Activity Logging**: Full audit trail for customer Login, Logout, and Device Revocation events.
- 🔄 **Session Management**: Enhanced `DELETE` endpoint with `auto_login` capability.
- 🗄️ **Database Refactor**: Improved schema integrity by using integer IDs for foreign key relationships (`customer_sessions`, `customer_activity_logs`).
- 🐛 **Bug Fixes**: Corrected IP address and User-Agent capturing in logs.

## Latest Updates (v1.13.0)
- 🛡️ **Platform Enforcement**: Mandatory `X-Client-Platform` header for all requests (Web/Android/iOS/TV).
- 🐛 **Critical Fixes**: Resolved Namespace conflicts in Admin Controller and CORS Middleware ordering.
- 🔒 **Premium Content Protection**: Implemented secure HLS URL redaction. Channels marked as `is_premium` now return `PAID_RESTRICTED` in public API responses.
- ♻️ **Refactor**: Standardized `is_premium` naming convention across the entire codebase (formerly `is_paid`).

## Latest Updates (v1.12.1)
- 🐛 **Critical Fix**: Resolved syntax error in `public/index.php`.
- 🐛 **Fix**: Logo URLs are now always fully qualified.
- 🔧 **Config**: Added `APP_URL` support for reliable absolute URL generation in production.

## Latest Updates (v1.12.0)
- 📊 **Trending Analytics**: New `DashboardController@getTrendingStats` endpoint aggregates view data with dynamic filtering (Category, Language, Limit).
- 🏷️ **Metadata API**: Public endpoints for fetching system metadata (Categories, Languages, Geo-data).
- 🎨 **Dynamic Branding**: API support for uploading and retrieving custom logos via `SettingController`.

## Recent Updates (v1.11.0)
- 🐛 **Critical Fix**: Enabled `BodyParsingMiddleware` to resolve JSON body parsing issues (Admin Login fix).
- 🔒 **Validation Hardening**: Enforced 10-digit phone numbers and valid emails for new registrations.

## Recent Updates (v1.10.0)
- 🔒 **API Security Suite**: Implemented `ApiKeyMiddleware`, `RateLimitMiddleware`, and `SecurityHeadersMiddleware`.
- 🔧 **CORS Overhaul**: Fixed Preflight OPTION handling for robust cross-origin support.
- 🐛 **Deletion Fixes**: Corrected Channel Hard Delete and Customer Soft Delete logic.
- 🛠 **System Stability**: Resolved 500 errors caused by middleware ordering conflicts.

## Recent Updates (v1.9.0)
- ✅ **PHP 8.3 Support**: Upgraded `illuminate` components.
- ✅ **Cleanup**: Removed legacy stream endpoints.

## Contributing

1. Follow PSR-12 coding standards
2. Update API documentation
3. Run tests before submitting PR

## License

Proprietary software. All rights reserved.

---

# Nellai IPTV - Backend API (v1.14.0)
