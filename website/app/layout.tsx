import type { Metadata } from "next";
import "./globals.css";

import BackendHealthCheck from "@/components/BackendHealthCheck";
import { Toaster } from 'react-hot-toast';
import TVNavigationProvider from "@/components/TVNavigationProvider";
import { ViewModeProvider } from "@/context/ViewModeContext";
import NetworkStatusMonitor from "@/components/NetworkStatusMonitor";
import FaviconUpdater from "@/components/FaviconUpdater";
import SessionMonitor from "@/components/SessionMonitor";
import MaintenanceCheck from "@/components/MaintenanceCheck";

export const metadata: Metadata = {
  title: "Nellai IPTV - Premium Entertainment",
  description: "Watch free live TV channels online with Nellai IPTV — HD streaming, fast loading, 24/7 access, and a smooth OTT experience.",
  keywords: ["Nellai IPTV", "Live TV", "Online Streaming", "Tamil TV", "Free IPTV", "HD Channels", "OTT Platform"],
  authors: [{ name: "Nellai IPTV" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Nellai IPTV - Premium Entertainment",
    description: "Watch free live TV channels online with Nellai IPTV.",
    url: "https://nellaiiptv.com",
    siteName: "Nellai IPTV",
    locale: "en_US",
    type: "website",
  },
  manifest: '/manifest.json',
};

import GoogleTagManager from "@/components/GoogleTagManager";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import DevToolsControl from "@/components/DevToolsControl";

import LiteRouteGuard from "@/components/LiteRouteGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-950 text-white">
        <GoogleAnalytics />
        <GoogleTagManager />
        <DevToolsControl />
        <FaviconUpdater />
        <TVNavigationProvider>
          <ViewModeProvider>
            <BackendHealthCheck />
            <NetworkStatusMonitor />
            <SessionMonitor />
            <Toaster position="top-right" />
            
            {/* Conditional Layout Rendering */}
            <LiteRouteGuard>
                {children}
            </LiteRouteGuard>

          </ViewModeProvider>
        </TVNavigationProvider>
      </body>
    </html>
  );
}
