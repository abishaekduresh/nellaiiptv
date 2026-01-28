# Nellai IPTV - Frontend v1.35.1

A Next.js 14 application providing a modern, responsive interface for the Nellai IPTV platform. Optimized for Web, Mobile, and TV browsers.

## 🚀 Features

### **Latest Updates (v1.35.1)**
- **Reseller Dashboard**: Optimized UI with integrated Wallet Card and removal of redundant stats.
- **Timezone Support**: Fixed date calculation issues in "Assign Plan" modal.
- **Navbar**: Improved layout by removing bottom margin.
- **Reseller Management**:
    - **Admin Panel**: Added role selection (Customer/Reseller) to customer creation/editing forms.
    - **Visual Indicators**: Role badges throughout the UI (purple for Resellers, blue for Customers).
    - **Profile Customization**: Profile page now displays different layouts for resellers vs customers.
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
