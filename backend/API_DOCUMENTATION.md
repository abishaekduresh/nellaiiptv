# Nellai IPTV - API Documentation

**Version 1.7.0**

Base URL: `/api`

## Table of Contents

- [Authentication](#authentication)
- [Channels](#channels)
- [Channel Interactions](#channel-interactions)
- [Contact](#contact)
- [Advertisements](#advertisements)
- [Metadata](#metadata)
- [System](#system)

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
- `limit` (optional): Number of results (default: 50). Use `-1` to fetch all channels without pagination.
- `sort` (optional): Sorting criteria. Options: `top_daily`, `top_trending` (3 days), `top_all_time`, `newest`.

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
        "language": { "name": "Tamil" },
        "category": { "name": "Entertainment" },
        "state": { "name": "Tamil Nadu" },
        "district": { "name": "Tirunelveli" }
      }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

---

### Get Featured Channels

**Endpoint**: `GET /channels/featured`

**Query Parameters**:
- `limit` (optional): Number of results (default: 10)

**Response**: Same format as List Channels

---

### Get New Channels

**Endpoint**: `GET /channels/new`

**Query Parameters**:
- `limit` (optional): Number of results (default: 10)

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
    "viewers_count": 150,
    "village": "Village Name",
    "language": { "name": "Tamil" },
    "state": { "name": "Tamil Nadu" },
    "district": { "name": "Tirunelveli" },
    "ratings_avg_rating": 4.5,
    "ratings_count": 25
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

### Get Related Channels

**Endpoint**: `GET /channels/related/{uuid}`

**Query Parameters**:
- `limit` (optional): Number of results (default: 6)

**Response**: Same format as List Channels

---

## Channel Interactions

### Rate Channel

**Endpoint**: `POST /channels/{uuid}/rate`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "rating": 5
}
```

**Response** (201):
```json
{
  "status": true,
  "message": "Rating submitted successfully",
  "data": {
    "rating": 5,
    "average_rating": 4.5
  }
}
```

---

### Get Channel Ratings

**Endpoint**: `GET /channels/{uuid}/ratings`

**Response** (200):
```json
{
  "status": true,
  "data": {
    "average": 4.5,
    "count": 25,
    "ratings": [
      {
        "rating": 5,
        "customer": { "name": "John Doe" },
        "created_at": "2025-12-21T10:00:00Z"
      }
    ]
  }
}
```

---

### Add Comment

**Endpoint**: `POST /channels/{uuid}/comments`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "comment": "Great channel!"
}
```

**Response** (201):
```json
{
  "status": true,
  "message": "Comment added successfully"
}
```

---

### Get Channel Comments

**Endpoint**: `GET /channels/{uuid}/comments`

**Response** (200):
```json
{
  "status": true,
  "data": [
    {
      "uuid": "comment-uuid",
      "comment": "Great channel!",
      "customer": { "name": "John Doe" },
      "created_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

---

### Report Channel Issue

**Endpoint**: `POST /channels/{uuid}/report`

**Request Body**:
```json
{
  "issue_type": "Other",
  "description": "Custom issue description here"
}
```

**Response** (201):
```json
{
  "status": true,
  "message": "Report submitted successfully. We will get back to you soon!"
}
```

---

### Heartbeat (Viewer Tracking)

**Endpoint**: `POST /channels/{uuid}/heartbeat`

**Request Body**:
```json
{
  "device_uuid": "unique-device-id"
}
```

**Response** (200):
```json
{
  "status": true,
  "message": "Heartbeat recorded"
}
```

---

### Increment View Count

**Endpoint**: `POST /channels/{uuid}/view`

**Response** (200):
```json
{
  "status": true,
  "message": "View count incremented"
}
```

---



## Contact

### Submit Contact Form

**Endpoint**: `POST /contact`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about service",
  "message": "I have a question..."
}
```

**Response** (201):
```json
{
  "status": true,
  "message": "Message sent successfully. We will get back to you soon!"
}
```

---

## Advertisements

### Get Ads

**Endpoint**: `GET /ads`

**Query Parameters**:
- `type` (optional): Ad type (banner, inline, video)

**Response** (200):
```json
{
  "status": true,
  "data": [
    {
      "uuid": "ad-uuid",
      "title": "Ad Title",
      "type": "banner",
      "media_url": "https://...",
      "url": "https://..."
    }
  ]
}
```

---

### Track Ad Impression

**Endpoint**: `POST /ads/{uuid}/impression`

**Response** (200):
```json
{
  "status": true,
  "message": "Impression recorded"
}
```

---

## Metadata

### Get States

**Endpoint**: `GET /states`

**Response** (200):
```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "uuid": "state-uuid",
      "name": "Tamil Nadu",
      "code": "TN"
    }
  ]
}
```

---

### Get Districts

**Endpoint**: `GET /districts`

**Response**: Same format as Get States

---

### Get Languages

**Endpoint**: `GET /languages`

**Response**: Same format as Get States

---

### Get Categories

**Endpoint**: `GET /categories`

**Response**: Same format as Get States

---

## System

### Health Check

**Endpoint**: `GET /health`

**Debug Mode**: `GET /health?debug=1` (Returns detailed server environment and routing info)

**Response** (200):
```json
{
  "status": true,
  "message": "System is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-21T10:00:00+00:00",
    "service": "Nellai IPTV Backend"
  }
}
```

---

### Get Disclaimer

**Endpoint**: `GET /settings/disclaimer`

**Response** (200):
```json
{
  "status": true,
  "data": {
    "content": "Disclaimer text..."
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and updates.

---

**Last Updated**: December 24, 2025 | **Version**: 1.7.0
