import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackendHealthCheck from "@/components/BackendHealthCheck";
import { Toaster } from 'react-hot-toast';
import TVNavigationProvider from "@/components/TVNavigationProvider";
import { ViewModeProvider } from "@/context/ViewModeContext";
import ClassicModeGuard from "@/components/ClassicModeGuard";
import NetworkStatusMonitor from "@/components/NetworkStatusMonitor";

export const metadata: Metadata = {
  title: "Nellai IPTV - Premium Entertainment",
  description: "Watch free live TV channels online with Nellai IPTV — HD streaming, fast loading, 24/7 access, and a smooth OTT experience.",
  manifest: '/manifest.json',
};

import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-950 text-white">
        <GoogleAnalytics />
        <TVNavigationProvider>
          <ViewModeProvider>
            <BackendHealthCheck />
            <NetworkStatusMonitor />
            <Toaster position="top-right" />
            <Navbar />
            <main className="flex-grow pt-6">
              <ClassicModeGuard>
                {children}
              </ClassicModeGuard>
            </main>
            <Footer />
          </ViewModeProvider>
        </TVNavigationProvider>
      </body>
    </html>
  );
}
