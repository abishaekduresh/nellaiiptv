# Flussonic Admin Panel — Recommended Data Structure

## 1. Flussonic Server Table

| Field              | Type           | Example                         | Purpose             |
| ------------------ | -------------- | ------------------------------- | ------------------- |
| id                 | UUID           | `srv_001`                       | Internal ID         |
| server_name        | String         | `Chennai-Main`                  | Friendly name       |
| server_host_ip        | String         | `Chennai-Main`                  | server ip       |
| server_host_domain               | String         | `flussonic.example.com` | Server domain       |
| api_port           | Integer        | `8080`                          | API port            |
| api_version        | String         | `v3`                            | API version         |
| username           | String         | `admin`                         | API username        |
| password_encrypted | Encrypted Text | `AES_ENCRYPTED`                 | API password        |
| bearer_token       | Encrypted Text | `jwt_token`                     | Optional auth token |
| timezone           | String         | `Asia/Kolkata`                  | Server timezone     |
| region             | String         | `India South`                   | Server region       |
| health_status             | Enum           | `online/offline`                | Health status       |
| last_ping_at       | Timestamp      | `2026-05-27 10:00`              | Monitoring          |
| status       | Enum      | `active`,`inactive`,`expired`,`deleted`              | Server Status          |
| created_at         | Timestamp      | —                               | Audit               |
| updated_at         | Timestamp      | —                               | Audit               |
| deleted_at         | Timestamp      | —                               | Audit               |

---

## 2. Stream Table

| Field               | Type    | Example                 |
| ------------------- | ------- | ----------------------- |
| id                  | UUID    | `stream_001`            |
| server_id           | FK      | `srv_001`               |
| stream_name         | String  | `sports_hd`             |
| input_url           | Text    | `rtmp://239.0.0.1:1234`  |
| output_formats      | JSON    | `["hls","dash","rtmp"]` |
| stream_key          | String  | `abc123`                |
| health_status              | Enum    | `online/offline`        |
| viewer_limit        | Integer | `1000`                  |
| current_viewers     | Integer | `245`                   |
| bitrate             | Integer | `4500000`               |
| status       | Enum      | `active`,`inactive`,`expired`,`deleted`              | Server Status          |
| created_at         | Timestamp      | —                               | Audit               |
| updated_at         | Timestamp      | —                               | Audit               |
| deleted_at         | Timestamp      | —                               | Audit               |

---

## 3. Stream Push / Restream Table

| Field            | Type    | Example                   |
| ---------------- | ------- | ------------------------- |
| id               | UUID    | `push_001`                |
| stream_id        | FK      | `stream_001`              |
| destination_type | Enum    | `youtube/facebook/custom` |
| destination_url  | Text    | `rtmp://youtube/live/...` |
| status           | Enum    | `connected/disconnected`  |
| retry_enabled    | Boolean | `true`                    |

---

## 4. Viewer Sessions Table

| Field      | Type      | Example                |
| ---------- | --------- | ---------------------- |
| session_id | String    | `sess_123`             |
| stream_id  | FK        | `stream_001`           |
| ip_address | String    | `1.2.3.4`              |
| country    | String    | `India`                |
| user_agent | Text      | `VLC/3.0`              |
| started_at | Timestamp | —                      |
| bandwidth  | Integer   | `4000000`              |
| protocol   | Enum      | `hls/dash/rtmp/webrtc` |

---

## 5. DVR / Recording Table

| Field      | Type      | Example            |
| ---------- | --------- | ------------------ |
| id         | UUID      | `dvr_001`          |
| stream_id  | FK        | `stream_001`       |
| file_path  | Text      | `/storage/demo.ts` |
| start_time | Timestamp | —                  |
| duration   | Integer   | `3600`             |
| size_mb    | Integer   | `1200`             |

---

## 6. Webhook / Event Sink Table

| Field      | Type           | Example                           |
| ---------- | -------------- | --------------------------------- |
| id         | UUID           | `hook_001`                        |
| server_id  | FK             | `srv_001`                         |
| event_name | String         | `stream_started`                  |
| target_url | Text           | `https://api.example.com/webhook` |
| secret_key | Encrypted Text | `secret`                          |
| enabled    | Boolean        | `true`                            |

---

## 7. Monitoring Table

| Field          | Type      | Example      |
| -------------- | --------- | ------------ |
| id             | UUID      | `metric_001` |
| server_id      | FK        | `srv_001`    |
| cpu_usage      | Float     | `45.2`       |
| ram_usage      | Float     | `68.4`       |
| disk_usage     | Float     | `70.5`       |
| network_in     | Integer   | `400Mbps`    |
| network_out    | Integer   | `1Gbps`      |
| active_streams | Integer   | `120`        |
| active_viewers | Integer   | `3400`       |
| recorded_at    | Timestamp | —            |

---

## 8. Customer / Tenant Table

| Field             | Type    | Example             |
| ----------------- | ------- | ------------------- |
| id                | UUID    | `cust_001`          |
| company_name      | String  | `Nellai IPTV`       |
| email             | String  | `admin@example.com` |
| max_viewers       | Integer | `10000`             |
| allowed_servers   | JSON    | `["srv_001"]`       |
| channel_id      | JSON        | `["1","3]`    |
| status       | Enum      | `active`,`inactive`,`expired`,`deleted`              | Server Status          |
| created_at         | Timestamp      | —                               | Audit               |
| updated_at         | Timestamp      | —                               | Audit               |
| deleted_at         | Timestamp      | —                               | Audit               |

---

## 9. Security Recommendations

### Store encrypted:

* API passwords
* SSH keys
* License keys
* Bearer tokens
* Stream keys

### Never expose:

* Raw RTMP publish keys
* SSH private keys
* Internal IPs to customers

### Recommended:

* AES-256 encryption
* JWT auth
* RBAC permissions
* Audit logs
* 2FA for admin accounts

---

## 10. Recommended Admin Features

| Feature                 | Purpose                  |
| ----------------------- | ------------------------ |
| Server health dashboard | CPU/RAM/traffic          |
| Stream live preview     | Check streams visually   |
| One-click restream      | Push to YouTube/Facebook |
| Auto failover           | Backup inputs            |
| Geo blocking            | Country restrictions     |
| Viewer analytics        | Concurrent viewers       |
| Token authentication    | Secure playback          |
| CDN integration         | Cloudflare/Nginx         |
| API key management      | Customer API access      |
| Alert system            | Telegram/email/webhook   |

---

## 11. Suggested Tech Stack

| Layer         | Recommendation         |
| ------------- | ---------------------- |
| Backend       | Node.js / Laravel / Go |
| Database      | PostgreSQL             |
| Cache         | Redis                  |
| Queue         | RabbitMQ               |
| Monitoring    | Prometheus + Grafana   |
| Auth          | JWT/OAuth2             |
| Reverse Proxy | NGINX                  |
| Container     | Docker/Kubernetes      |
