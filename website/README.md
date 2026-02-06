# Nellai IPTV - Frontend v1.44.0

A Next.js 14 application providing a modern, responsive interface for the Nellai IPTV platform. Optimized for Web, Mobile, and TV browsers.

## 🚀 Features

### **Latest Updates (v1.44.0)**
- **Admin Comments**: New dedicated management page (`/admin/comments`) for viewing, searching, and moderating channel comments.
- **Status Toggle**: Low-friction status toggling (Active/Inactive) for comments directly from the list view.
- **Auto-Numbering**: Intelligent channel form that pre-fetches the next available channel number to prevent conflicts.
- **API Stability**: Resolved empty filter dropdowns by aligning API parameters with backend schemas.

### **Previous Updates (v1.43.0)**
- **Channel Proprietor Details**: Unified section in Channel Form to maintain and display owner contact information and address.
- **Indian Phone Validation**: Integrated robust regex-based validation for Indian phone numbers with real-time UI feedback (color-coded borders and messages).
- **Stream Headers Support**: Custom `User-Agent` and `Referer` fields added to Channel Form to support restricted streams.
- **Improved API Resilience**: Standardized on Admin API endpoints for fetching metadata, resolving "Failed to load" errors in filters and forms.

### **Previous Updates (v1.42.1)**
- **Maintenance**: Version synchronized with latest App Release (v1.8.8+24).
- **Improved Performance**: Refined HLS buffering profiles for consistent cross-device stability.

### **Previous Updates (v1.41.0)**
- **Device Profiles**: Tier-aware HLS buffering engine for optimized PC & TV playback.
- **Unified Branding**: Sidebar logo now functions as a global "Home" navigation link.
- **Ad Refinement**: Full-width grid banners replace individual channel ads.

### **Previous Updates (v1.38.0)**
- **Kiosk Mode**: Dedicated distraction-free viewing experience by hiding navigation controls when Open Access is active.
- **Disclaimer Overlay**: Fine-tuned z-index management for reliable display of system messages.

### **Previous Updates (v1.37.0)**
- **Open Access Mode**: Unauthenticated guests can now watch channels directly if enabled in settings.
- **Auto-Redirection**: Intelligent routing from home to channels list for guest users in Open Access mode.
- **Reseller Dashboard (v1.35.1)**: Integrated Wallet Card and optimized timezone-aware plan assignments.
- **Transaction Management**:
    - **Advanced Filtering**: Search and filter admin transactions by status, gateway, and search term.
    - **Improved UX**: Added dedicated transaction layout for consistency.
- **Enhanced Customer Management**:
    - **Role Column**: Added sortable role column to customer table.
    - **Role Filter**: Filter customers by role (All/Customer/Reseller).

### **Previous Updates (v1.33.0)**
- **Authentication Guards**: Implemented automatic redirects for authenticated users on login/register pages.
- **Home UX**: Conditionally hide guest-specific UI for logged-in users.

### **Previous Updates (v1.32.0)**

### **Previous Updates (v1.31.0)**
- **Smart Fallback & Recovery**:
    - Implemented automatic switch to high-quality MP4 fallback when HLS streams fail or time out (20s).
    - Added background monitoring with real-time countdown for automatic live stream recovery.

### **Previous Updates (v1.30.3)**
- **Absolute URLs**: The application now strictly uses `_url` properties from API responses, eliminating relative path resolution logic.

### **Previous Updates (v1.30.0)**
- **Image Resolution Engine**:
  - Implemented `resolveImageUrl` utility to handle production URL construction dynamically.
  - Fixed `logo_url` vs `logo_path` inconsistencies across the application.
  - Ensures correct image loading regardless of subfolder deployment (e.g. `/backend/public`).

### **Previous Updates (v1.29.0)**
- **Admin Tools**:
  - **API Documentation**: Interactive API reference with detailed header requirements built directly into the Admin Panel.
  - **API Key Manager**: GUI for managing secure API access keys with platform restrictions (Web, TV, Android, iOS).
  - **Subscription Management**: Full CRUD for subscription plans.

### **Previous Updates (v1.28.2)**
- **Dynamic Watermark**: Player now uses specific `app_logo_png_url` from backend settings for the persistent watermark.
- **Asset Resolution**: Enhanced `useBranding` hook to correctly resolve image paths from backend subdirectories.

### **Previous Updates (v1.28.0)**
- **Hybrid Responsive Player**: 
  - Smart control layout that switches from absolute centering (Desktop) to flexbox (Tablet/Mobile) to guarantee 0% overlap.
  - Constrained side panels and optimized spacing for all resolutions.
- **Immersive Classic Mode**: 
  - Removed standard web Navbar/Footer in Classic Mode for a native TV app feel.
  - Fixed blank screen race condition on refresh.


### **Core**
- **Dual Mode Interface**:
  - **OTT Mode**: Modern, Netflix-style layout with Featured Banners, Trending Rows, and "Continue Watching".
  - **Classic Mode**: Traditional TV-guide style list for quick channel surfing. (Now resets to OTT Mode on browser restart).
- **Smart Device Optimization**:
  - **HLS Profiling**: Dynamic buffer settings (20MB for TV, 60MB for PC) based on device capabilities.
  - **Watermark Engine**: Dynamic, backend-configured watermark overlay for video players (`png` support).
  - **Resolution Capping**: Prevents 4K streams from crashing 1080p hardware.
- **Admin Tools**:
  - **API Documentation**: Interactive API reference built directly into the Admin Panel.
  - **API Key Manager**: GUI for managing secure API access keys.
  - **Subscription Management**: Full CRUD for subscription plans.
... (Rest of the file remains similar, just highlighting the key updates)
