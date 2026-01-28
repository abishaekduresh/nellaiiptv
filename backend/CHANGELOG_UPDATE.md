
## [1.24.1] - 2026-01-28

### Fixed
- **Timezone**: Set default system timezone to `Asia/Kolkata` (IST) to fix date discrepancies.
- **Reseller Stats**: Resolved missing column error (`created_by_id`) with database migration.
- **Slim Application Error**: Fixed autoload issue causing 500 errors on dashboard stats API.

### Added
- **API**: `GET /reseller/dashboard/stats` endpoint now operational.
