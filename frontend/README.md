# Nellai IPTV - Frontend (v1.22.1)

## Overview

The frontend of **Nellai IPTV** is built with **Next.js**, **React**, and **Video.js**.

## Prerequisites

- Node.js >= 18
- npm (or Yarn)

## Setup

1. **Environment Config**:
   Create `.env.local` and add your backend API secret:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost/api
   NEXT_PUBLIC_API_SECRET=your_backend_api_secret_here
   ```

2. **Install & Run**:
   ```bash
   cd frontend
   npm install   # install dependencies
   npm run dev   # start development server
   ```

2b. **For Production**:
   **CRITICAL**: If you change `.env` or logo settings, you MUST rebuild:
   ```bash
   npm run build
   npm start
   ```

## Build for Production

```bash
npm run build   # generate optimized production build
npm start       # serve the built app
```

## Troubleshooting

### Logo Not Displaying?
If your logo appears broken or points to `localhost`:
1. **Rebuild the Frontend**: The "Smart Sanitizer" introduced in v1.17.1 works best when compiled. Run `npm run build && npm start`.
2. **Check Proxy**: Ensure `NEXT_PUBLIC_API_URL` in `.env.local` points to your actual backend (e.g., `https://api.yoursite.com/api`).
3. **Verify Sanity**: The frontend now automatically strips `http://localhost` from logo URLs, so it should "just work" even if your backend config is imperfect.

## Project Structure

```
frontend/
├─ app/          # Next.js App Router pages
├─ components/   # reusable UI components
├─ hooks/        # custom hooks (e.g., useTVFocus)
├─ lib/          # api and utility functions
├─ public/       # static assets
├─ styles/       # global CSS / Tailwind config
└─ package.json
```

## Features

- **TV-Friendly Interface**: Optimized for large screens and "10-foot" viewing distances.
- **Classic Mode**: A streamlined, TV-like experience with a focused player, channel list, and integrated ads.
- **Spatial Navigation**: Full support for arrow-key navigation (D-pad) for easy browsing on TV.
- **Smart Search**: Search by channel name or specific channel number (e.g., "CH 101" or just "1").
- **Live Visuals**: Auto-scrolling banners and interactive channel cards.
- **Admin Analytics (v1.19.0)**:
  - **Visual Insights**: Interactive charts showing daily view trends per channel.
  - **Rating Stats**: Displays average channel rating calculated accurately from user feedback.
  - **Integrated Tooling**: Seamless access via the Admin Channels table.
- **Security & Sessions (v1.18.0)**:
  - **Session Monitor**: Real-time polling detects if your session is revoked and logs you out instantly.
  - **Device Manager**: View and Remove your connected devices/sessions directly from the Profile or Devices page.
  - **Conditional Auto-Login**: Smart logic to auto-login only when you are explicitly managing device limits.
  - **Build Stability**: Resolved Vercel build errors by implementing proper Suspense boundaries for client-side navigation.
- **Enhanced Security (v1.13.0)**:
  - **API Key Integration**: All requests are secured with `X-API-KEY`.
  - **Protected Admin**: Secure cookie-based handling for admin sessions.
- **Accessible Disclaimer**: TV-navigable disclaimer modal with focus support.
- **Unlimited Browsing (v1.6.0)**: No more 100-channel limit; browse and search our entire channel catalog without restriction.
- **Premium UI (v1.8.0)**: 
  - **Animated Loader**: "Dual Ring" glowing active states.
  - **Persistent Watermark**: Responsive branding visible in fullscreen.
  - **OTT Improvements**: Separate Native Control experience for Embedded player.
- **Enhanced Player Ops (v1.9.0)**:
  - **Sidebar Search**: In-player channel search with immediate filtering.
  - **OTT Header Fullscreen**: One-click fullscreen toggle in the top-right navbar.
- **SEO & Analytics (v1.9.1)**:
  - **Dual Tracking**: Simultaneous support for Google Tag Manager (GTM) and direct Google Analytics (GA4).
  - **SEO Ready (v1.9.2)**: Indexed by search engines enabled (`index: true`).
- **Player Enhancements (v1.10.0)**:
  - **Watch History**: "Continue Watching" list on Dashboard.
  - **PiP & AirPlay**: Advanced playback controls.
  - **Auto-Retry**: Smart error recovery.
- **Mode Management (v1.11.0)**:
  - **Auto-Expiry**: Classic Mode reverts to OTT after 24h.
  - **Dynamic Titles**: Tab title updates to channel name.
  - **Lazy Loading**: Native image lazy loading.
  - **Status Cleanup**: Removed legacy status checks.
- **Stability & Resilience (v1.14.0)**:
  - **Smart Fallback**: Automatically switches to OTT mode if the backend disconnects in Classic Mode.
  - **Login Loop Fix**: Resolved infinite redirects for smoother authentication.
  - **Vercel Optimized**: Improved path handling for production deployments.
- **Registration Security (v1.15.0)**:
  - **Math Captcha**: Challenge-response system to block bot registrations.
  - **Strict Validation**: Enforced 10-digit phone and regex-based email checks.
- **Smart HLS Engine (v1.16.0)**:
  - **Device Profiling**: Auto-detects hardware capabilities (TV/Mobile/PC).
  - **Adaptive Buffering**: Dynamically minimizes buffer for low-memory TVs and maximizes it for powerful Desktops.
  - **Zero-Overhead Overlay**: Classic Mode now uses conditional rendering to reduce DOM size by 90% for lag-free TV playback.
- **Dynamic Branding (v1.17.0)**:
  - **Custom Logo**: Upload logos via Admin Panel; reflects instantly on Navbar and Classic Mode.
  - **Auto-Favicon**: Website favicon mimics the custom uploaded logo.
- **Analytics & Trends**:
  - **Interactive Chart**: Visual "Trending Channels" graph in Admin Dashboard.
  - **Data Discovery**: Filter trends by Limit (Top 5/10/20), Category, and Language.
- **Premium Experience (v1.17.2)**:
  - **Premium Badges**: Gold "PREMIUM" badges on channel cards and lists.
  - **Secure Overlay**: Restricted content overlay with channel name customization.
  - **Refactor**: full codebase migration to `is_premium` logic.
- **Platform Awareness (v1.17.3)**:
  - **Device Headers**: Automatically identifies client platform (`web`, `tv`, `ios`, `android`).
  - **Restricted Access**: Displays helpful error overlays when content is not available on the current device.
  - **Global Overlay**: "Under Construction" screen blocks public access when enabled.
  - **Dynamic Config**: Admins can customize the title and message or toggle status in real-time.
  - **Smart Access**: Automatically allows Admin Login and Dashboard access while blocking public users.
- **Platform Features (v1.20.0)**:
  - **Platform Awareness**: Automatically detects the environment (Web, TV, Mobile) and adapts the UI accordingly.
  - **Platform Control**: Admins can now toggle "Top Trending" visibility per platform (Web, TV, Android, iOS) via the Settings panel.
  - **Modern Admin UI**: Enhanced card-based interfaces for Channel Management (Status flags, Platform restrictions).

## TV Navigation Controls

| Key | Action |
| :--- | :--- |
| **Arrow Keys** | Navigate between elements (Up, Down, Left, Right) |
| **Enter (OK)** | Select / Play Channel |
| **Backspace / Esc** | Go Back / Close Menus |

## Video Player Controls

| Key | Action |
| :--- | :--- |
| **Enter / Space** | Play / Pause |
| **Arrow Up / Down** | Next / Previous Channel |
| **Arrow Left / Right** | Increase / Decrease Volume |
| **Backspace / Esc** | Exit Player / Go Back |

## Contributing

Please follow the contribution guidelines in the main repository and keep the code style consistent (Prettier, ESLint). 

---

*Generated by Antigravity*
