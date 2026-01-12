'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MaintenanceCheck from "@/components/MaintenanceCheck";
import ClassicModeGuard from "@/components/ClassicModeGuard";

export default function LiteRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLite = pathname?.startsWith('/lite');

    if (isLite) {
        return <div className="h-screen w-screen bg-black text-white overflow-hidden">{children}</div>;
    }

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
