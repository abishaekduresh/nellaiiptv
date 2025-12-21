# Nellai IPTV - Backend API

**Version 1.5.0** | RESTful API built with Slim PHP Framework

## Overview

The backend of **Nellai IPTV** is a RESTful API built with **Slim PHP 4** framework, using **Eloquent ORM** for database operations and **JWT** for authentication. It provides endpoints for channel management, user authentication, ratings, comments, reports, and more.

## Tech Stack

- **Framework**: Slim PHP 4
- **ORM**: Eloquent (Laravel Database)
- **Authentication**: Firebase JWT
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

Configure your database connection and JWT secret in the appropriate config files or environment variables.

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
│   │   ├── ContactController.php
│   │   └── ...
│   ├── Models/              # Eloquent models
│   │   ├── Channel.php
│   │   ├── ChannelReport.php
│   │   ├── ContactMessage.php
│   │   ├── Customer.php
│   │   └── ...
│   ├── Services/            # Business logic
│   │   ├── AuthService.php
│   │   ├── ChannelService.php
│   │   └── ...
│   ├── Middleware/          # Request middleware
│   │   ├── JwtMiddleware.php
│   │   └── CorsMiddleware.php
│   ├── Helpers/             # Utility classes
│   │   ├── ResponseFormatter.php
│   │   ├── Validator.php
│   │   └── JwtHelper.php
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

#### Authentication
- `POST /customers/register` - Register new user
- `POST /customers/login` - User login
- `POST /customers/forgot-password` - Request password reset
- `POST /customers/reset-password` - Reset password

#### Channels
- `GET /channels` - List all channels
- `GET /channels/featured` - Get featured channels
- `GET /channels/{uuid}` - Get channel details
- `POST /channels/{uuid}/rate` - Rate a channel (protected)
- `POST /channels/{uuid}/comments` - Add comment (protected)
- `POST /channels/{uuid}/report` - Report channel issue

#### Contact
- `POST /contact` - Submit contact form

#### System
- `GET /health` - Health check endpoint (Returns system status and timestamp)

### Deployment Note
For **root folder deployments** (e.g., when uploading the contents of `backend/` directly to your server root), the application automatically detects the base path. Ensure your root `.htaccess` redirects to the `public/` directory.

## Database Schema

### Main Tables

- `channels` - Channel information
- `channel_reports` - User-submitted channel reports
- `channel_ratings` - Channel ratings by users
- `channel_comments` - User comments on channels
- `contact_messages` - Contact form submissions
- `customers` - User accounts
- `ads` - Advertisement data
- `states`, `districts`, `languages`, `categories` - Metadata

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register: `POST /api/customers/register`
2. Login: `POST /api/customers/login`
3. Use the returned token in subsequent requests

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error message",
  "errors": { ... }
}
```

## Validation

Input validation is handled using Valitron. Common validation rules:

- `required` - Field must be present
- `email` - Valid email format
- `lengthMin` - Minimum length
- `integer` - Must be an integer

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## CORS

CORS is configured to allow requests from the frontend application. Modify `CorsMiddleware` to adjust allowed origins.

## Testing

```bash
# Run PHPUnit tests
./vendor/bin/phpunit

# Run specific test
./vendor/bin/phpunit tests/Unit/AuthTest.php
```

## Recent Updates (v1.5.0)

- ✅ Added channel reporting system with support for custom descriptions
- ✅ Implemented contact form backend with persistent storage and validation
- ✅ Added automatic base path detection for flexible deployment (root or subfolder)
- ✅ Enhanced health check with diagnostic debugging mode (`?debug=1`)
- ✅ Optimized Slim middleware stack for improved performance and error handling
- ✅ Implemented `ResponseFormatter` for unified API response structure

## Contributing

1. Follow PSR-12 coding standards
2. Write unit tests for new features
3. Update API documentation
4. Run tests before submitting PR

## License

Proprietary software. All rights reserved.

---

**Nellai IPTV Backend** - Powering Premium Entertainment
