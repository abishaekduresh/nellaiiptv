# Nellai IPTV - Frontend

A Next.js 14 application providing a modern, responsive interface for the Nellai IPTV platfrom. Optimized for Web, Mobile, and TV browsers.

## 🚀 Features

### **Lite Player (TV Mode)**
- **Zero-Overhead Playback**: specialized `/lite` route that strips all React UI to dedicate 100% CPU to video decoding on low-spec Android TVs.
- **Immersive Experience**: Automatically hides Navbar, Footer, and all overlays.
- **Auto-Stretch**: Forces video to fill the screen regardless of aspect ratio, eliminating black bars.
- **Auto-Redirect**: The main application detects TV User-Agents and seamlessly redirects playback requests to this optimized player.
- **TV Navigation**: Full "Channel Surfing" support. Users can use `Arrow Keys` or `Channel +/-` buttons on their remote to switch channels instantly.
- **Premium UI**: Dedicated access-restricted screens with "Go Back" navigation support.

### **Core**
- **Dual Mode Interface**:
  - **OTT Mode**: Modern, Netflix-style layout with Featured Banners, Trending Rows, and "Continue Watching".
  - **Classic Mode**: Traditional TV-guide style list for quick channel surfing.
- **Smart Device Optimization**:
  - **HLS Profiling**: Dynamic buffer settings (20MB for TV, 60MB for PC) based on device capabilities.
  - **Resolution Capping**: Prevents 4K streams from crashing 1080p hardware.
... (Rest of the file remains similar, just highlighting the key updates)
