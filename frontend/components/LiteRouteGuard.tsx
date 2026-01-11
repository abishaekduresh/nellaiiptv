'use client';

import { usePathname } from 'next/navigation';

export default function LiteRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLite = pathname?.startsWith('/lite');

    if (isLite) {
        return <div className="min-h-screen bg-black text-white">{children}</div>;
    }

    return <>{children}</>;
}
