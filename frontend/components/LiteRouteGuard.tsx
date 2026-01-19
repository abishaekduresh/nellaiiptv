'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MaintenanceCheck from "@/components/MaintenanceCheck";
import ClassicModeGuard from "@/components/ClassicModeGuard";
import { useViewMode } from '@/context/ViewModeContext';

export default function LiteRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { mode, isInitialized } = useViewMode();
    const isLite = pathname?.startsWith('/lite');

    // Prevent hydration mismatch / flash of wrong mode
    if (!isInitialized) {
        return <div className="min-h-screen bg-slate-950" />;
    }

    if (isLite) {
        return <div className="h-screen w-screen bg-black text-white overflow-hidden">{children}</div>;
    }

    // Classic Mode: Full immersive (No layout)
    if (mode === 'Classic') {
        return (
            <main className="min-h-screen bg-slate-950">
                 <MaintenanceCheck>
                    <ClassicModeGuard>
                        {children}
                    </ClassicModeGuard>
                </MaintenanceCheck>
            </main>
        );
    }

    // OTT Mode: Standard Layout
    return (
        <>
            <Navbar />
            <main className="flex-grow pt-6">
                <MaintenanceCheck>
                    <ClassicModeGuard>
                        {children}
                    </ClassicModeGuard>
                </MaintenanceCheck>
            </main>
            <Footer />
        </>
    );
}
