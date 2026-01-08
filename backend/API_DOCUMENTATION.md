# Nellai IPTV - API Documentation

**Version 1.13.0**

Base URL: `/api`

## Security & Headers

**CRITICAL**: All public API requests MUST include the **API Key**.
Protected endpoints require BOTH the API Key and a Bearer Token.

| Header | Value | Required | Description |
| :--- | :--- | :--- | :--- |
| `X-API-KEY` | `your_secret_key` | **Yes (All)** | Secret key to prevent unauthorized scraping. |
| `Authorization` | `Bearer <token>` | **Protected Only** | JWT token for user actions (Rate/Comment). |
| `X-Client-Platform` | `web`, `android`, `ios`, `tv` | **Yes (All)** | Platform identifier for content filtering. |
| `Content-Type` | `application/json` | Yes | Request body format. |

## Table of Contents

- [Authentication](#authentication)
- [Channels](#channels)
- [Channel Interactions](#channel-interactions)
- [Contact](#contact)
- [Advertisements](#advertisements)
- [Metadata](#metadata)
- [System](#system)
- [Dashboard & Analytics](#dashboard--analytics)
- [System Settings](#system-settings)

---

## Authentication

### Register User

**Endpoint**: `POST /customers/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com",
  "password": "password123"
}
```

> **Note**: `phone` must be exactly 10 digits. `email` must be a valid email format.

**Response** (201):
```json
{
  "status": true,
  "message": "Registration successful. Please login.",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### Login

**Endpoint**: `POST /customers/login`

**Request Body**:
```json
{
  "phone": "1234567890",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### Forgot Password

**Endpoint**: `POST /customers/forgot-password`

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Response** (200):
```json
{
  "status": true,
  "message": "Password reset link has been sent to your email"
}
```

---

### Reset Password

**Endpoint**: `POST /customers/reset-password`

**Request Body**:
```json
{
  "token": "reset-token-here",
  "password": "newpassword123"
}
```

**Response** (200):
```json
{
  "status": true,
  "message": "Password has been reset successfully"
}
```

---

### Refresh Token

**Endpoint**: `POST /customers/refresh-token`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

---

### Manage Sessions

#### Get Active Sessions
**Endpoint**: `GET /customers/sessions`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": true,
  "message": "Active sessions retrieved",
  "data": [
    {
      "id": 12,
      "customer_id": 150,
      "device_name": "Chrome on Windows",
      "platform": "web",
      "ip_address": "192.168.1.5",
      "last_active": "2026-01-08 10:30:00",
      "created_at": "2026-01-08 09:00:00"
    }
  ]
}
```

#### Revoke Session
**Endpoint**: `DELETE /customers/sessions/{id}`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `auto_login` (boolean, optional): If `true`, attempts to issue a new token for the current device if the device limit allows. Default `false`.

**Response** (200):
```json
{
  "status": true,
  "message": "Session revoked successfully",
  "data": {
     "tokens": { ... } // Only present if auto_login=true and successful
  }
}
```

---

## Customer Profile

### Get Profile

**Endpoint**: `GET /customers/profile`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": true,
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }
}
```

---

### Update Profile

**Endpoint**: `PUT /customers/profile`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Updated",
  "email": "johnupdated@example.com"
}
```

**Response** (200):
```json
{
  "status": true,
  "message": "Profile updated successfully"
}
```

---

### Delete Account

**Endpoint**: `DELETE /customers`

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "status": true,
  "message": "Account deleted successfully"
}
```

---

## Channels

### List Channels

**Endpoint**: `GET /channels`

**Query Parameters**:
- `limit` (optional): Number of results (default: 50). Use `-1` to fetch all channels.
- `sort` (optional): `top_daily`, `top_trending`, `top_all_time`, `newest`.

**Response** (200):
```json
{
  "status": true,
  "data": {
    "data": [
      {
        "uuid": "channel-uuid",
        "name": "Channel Name",
        "channel_number": 1,
        "hls_url": "https://...",
        "thumbnail_url": "https://...",
        "viewers_count": 150,
        "is_featured": true,
        "is_premium": true,
        "allowed_platforms": "web,tv,ios,android"
      }
    ],
    "total": 100,
    "limit": 50
  }
}
```

---

### Get Featured Channels

**Endpoint**: `GET /channels/featured`

**Response**: Same format as List Channels

---

### Get Channel Details

**Endpoint**: `GET /channels/{uuid}`

**Response** (200):
```json
{
  "status": true,
  "data": {
    "uuid": "channel-uuid",
    "name": "Channel Name",
    "channel_number": 1,
    "hls_url": "https://...",
    "thumbnail_url": "https://...",
    "viewers_count": 150
  }
}
```

---

### Search Channels

**Endpoint**: `GET /channels/search`

**Query Parameters**:
- `q`: Search query (name or channel number)

**Response**: Same format as List Channels

---

## Channel Interactions

### Rate Channel
**Endpoint**: `POST /channels/{uuid}/rate` (Protected)
**Body**: `{ "rating": 5 }`

### Add Comment
**Endpoint**: `POST /channels/{uuid}/comments` (Protected)
**Body**: `{ "comment": "Great channel!" }`

### Report Channel Issue
**Endpoint**: `POST /channels/{uuid}/report`
**Body**: `{ "issue_type": "Other", "description": "Issue..." }`

---

## Contact

### Submit Contact Form

**Endpoint**: `POST /contact`

**Body**: `{ "name": "...", "email": "...", "message": "..." }`

---

## Advertisements

### Get Ads

**Endpoint**: `GET /ads`

---

## Metadata

### Get Categories
**Endpoint**: `GET /categories`

### Get Languages
**Endpoint**: `GET /languages`

### Get States
**Endpoint**: `GET /states`

### Get Districts
**Endpoint**: `GET /districts`

---

## Dashboard & Analytics

### Get Trending Stats
**Endpoint**: `GET /dashboard/trending` (Protected: Admin)

**Query Parameters**:
- `limit`: Number of results (default: 5, 10, 20)
- `category_uuid`: Filter by category UUID
- `language_uuid`: Filter by language UUID

**Response**:
```json
{
  "status": true,
  "data": {
    "labels": ["Channel A", "Channel B"],
    "data": [150, 120]
  }
}
```

---

## System Settings

### Upload Logo
**Endpoint**: `POST /settings/logo` (Protected: Admin)
**Body**: Form-data with file `logo`

### Get Public Settings
**Endpoint**: `GET /settings/public`
**Response**: `{ "status": true, "data": { "logo_url": "..." } }`

---

## System

### Health Check

**Endpoint**: `GET /health`

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized (Missing/Invalid Token or Key) |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limit Exceeded) |
| 500 | Internal Server Error |

## Rate Limiting

- **Limit**: 100 requests per minute per IP address.
- **Header**: Standard `X-RateLimit-*` headers are included in responses.
- **Violation**: Returns `429 Too Many Requests`.

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history.

---

**Last Updated**: January 7, 2026 | **Version**: 1.13.0
