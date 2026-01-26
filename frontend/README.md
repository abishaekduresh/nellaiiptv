# Nellai IPTV - Frontend v1.32.0

A Next.js 14 application providing a modern, responsive interface for the Nellai IPTV platform. Optimized for Web, Mobile, and TV browsers.

## 🚀 Features

### **Latest Updates (v1.32.0)**
- **Immersive User Experience**:
    - **SEO Landing Page**: New root interface (`/`) with optimized sections and clear call-to-actions.
    - **Dedicated Player**: Moved Classic Mode to `/channels` with automatic immersive layout (no navbar/footer).
- **Community & Social**:
    - **Channel Discussion**: Built-in real-time comment section for live interaction.
    - **Smart Redirection**: Returns users to their exact location after login.
- **Global TV Optimization**:
    - **Navigable UI**: Native-level D-pad support for landing page buttons, ratings, and comments.
    - **Enhanced Feedback**: Clear focus indicators and logout success notifications.
- **Visual Polishing**:
    - **Modernized Layout**: Glowing dynamic logos and high-end gradients in `Navbar` and `Footer`.

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
