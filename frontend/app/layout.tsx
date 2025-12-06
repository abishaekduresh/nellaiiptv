import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackendHealthCheck from "@/components/BackendHealthCheck";
import { Toaster } from 'react-hot-toast';
import TVNavigationProvider from "@/components/TVNavigationProvider";

export const metadata: Metadata = {
  title: "Nellai IPTV - Premium Entertainment",
  description: "Watch free live TV channels online with Nellai IPTV — HD streaming, fast loading, 24/7 access, and a smooth OTT experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-950 text-white">
        <TVNavigationProvider>
          <BackendHealthCheck />
          <Toaster position="top-right" />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </TVNavigationProvider>
      </body>
    </html>
  );
}
