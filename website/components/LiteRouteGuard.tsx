'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MaintenanceCheck from "@/components/MaintenanceCheck";
import { useViewMode } from '@/context/ViewModeContext';

export default function LiteRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isInitialized } = useViewMode();
    const isLite = pathname?.startsWith('/lite');
    const isAdmin = pathname?.startsWith('/admin');
    
    // Immersive paths (No Navbar/Footer)
    const isPlayerPage = pathname?.startsWith('/channels') || pathname?.startsWith('/channel/') || isLite;

    // Prevent hydration mismatch / flash of wrong mode
    if (!isInitialized) {
        return <div className="min-h-screen bg-slate-950" />;
    }

    if (isLite) {
        return <div className="h-screen w-screen bg-black text-white overflow-hidden">{children}</div>;
    }

    // Standard Layout for landing, auth, about, contact, and admin
    if (!isPlayerPage) {
        return (
            <>
                <Navbar />
                <main className="flex-grow">
                    <MaintenanceCheck>
                        {children}
                    </MaintenanceCheck>
                </main>
                <Footer />
            </>
        );
    }

    // Immersive layout for player pages
    return (
        <main className="min-h-screen bg-slate-950">
                <MaintenanceCheck>
                    {children}
                </MaintenanceCheck>
        </main>
    );
}
