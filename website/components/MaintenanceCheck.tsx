'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import MaintenanceScreen from './MaintenanceScreen';

interface PublicSettings {
    maintenance_mode: boolean;
    maintenance_title: string;
    maintenance_message: string;
}

export default function MaintenanceCheck({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [maintenance, setMaintenance] = useState<PublicSettings | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await api.get('/settings/public');
                if (res.data.status) {
                    setMaintenance(res.data.data);
                }
            } catch (err) {
                console.error('Failed to check maintenance status');
            } finally {
                setChecked(true);
            }
        };

        checkStatus();
        
        // Optional: Poll status every minute
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // Allowed paths during maintenance (Admins need to login)
    const isAdminPath = pathname?.startsWith('/admin');
    const isLoginPath = pathname?.startsWith('/login');
    
    // If not checked yet, just render children (optimistic) or null (strict)
    if (!checked) return <>{children}</>;

    if (maintenance?.maintenance_mode && !isAdminPath && !isLoginPath) {
        return (
            <MaintenanceScreen 
                title={maintenance.maintenance_title} 
                message={maintenance.maintenance_message} 
            />
        );
    }

    return <>{children}</>;
}
