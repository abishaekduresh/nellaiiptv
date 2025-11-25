# Nellai IPTV Backend API - Complete Documentation

## Base URLs
- **User API**: `http://localhost/api`
- **Admin API**: `http://localhost/api/admin`

## Admin Setup

### Default Admin Credentials
- **Username**: `admin`
- **Email**: `admin@nellaiiptv.com`
- **Password**: `admin123`

### Database Migration
Run this SQL file to create admin tables:
```bash
mysql -u root -p nellai_iptv < database/migrations/admin_tables.sql
```

---

## Admin API Endpoints

### Authentication

#### Admin Login
```
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "status": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "uuid": "...",
      "username": "admin",
      "email": "admin@nellaiiptv.com",
      "role": "super_admin"
    }
  }
}
```

#### Refresh Token
```
POST /api/admin/refresh-token
Authorization: Bearer {admin_token}
```

---

### Channel Management (Admin)

#### List All Channels
```
GET /api/admin/channels?page=1&per_page=20&state_id=1&status=active
Authorization: Bearer {admin_token}
```

#### Create Channel
```
POST /api/admin/channels
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Test Channel",
  "stream_url": "https://example.com/stream.m3u8",
  "logo": "https://example.com/logo.png",
  "state_id": 1,
  "district_id": 1,
  "language_id": 1,
  "status": "active"
}
```

#### Update Channel
```
PUT /api/admin/channels/{uuid}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Channel Name",
  "status": "inactive"
}
```

#### Delete Channel
```
DELETE /api/admin/channels/{uuid}
Authorization: Bearer {admin_token}
```

---

### Customer Management (Admin)

#### List Customers
```
GET /api/admin/customers?page=1&search=john&status=active
Authorization: Bearer {admin_token}
```

#### Update Customer Status
```
PUT /api/admin/customers/{uuid}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "inactive"
}
```

#### Delete Customer
```
DELETE /api/admin/customers/{uuid}
Authorization: Bearer {admin_token}
```

---

### Settings Management (Admin)

#### Get All Settings
```
GET /api/admin/settings
Authorization: Bearer {admin_token}
```

#### Update Setting
```
PUT /api/admin/settings/disclaimer_text
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "value": "New disclaimer text here..."
}
```

---

## Public API Endpoints

### Advanced Search
```
GET /api/channels/search?q=channel&state_id=1&language_id=2&district_id=3&page=1
```

### Get Disclaimer
```
GET /api/settings/disclaimer

Response:
{
  "status": true,
  "data": {
    "disclaimer": "Nellai IPTV provides streaming services..."
  }
}
```

---

## Testing with cURL

### Admin Login
```bash
curl -X POST http://localhost/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Create Channel (Admin)
```bash
curl -X POST http://localhost/api/admin/channels \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Channel",
    "stream_url": "https://example.com/stream.m3u8",
    "state_id": 1,
    "language_id": 1
  }'
```

### Search Channels
```bash
curl "http://localhost/api/channels/search?q=test&state_id=1"
```

---

## Error Responses

All errors follow this format:
```json
{
  "status": false,
  "message": "Error message",
  "errors": {
    "field": ["Validation error"]
  }
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
