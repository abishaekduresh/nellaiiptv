import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';

interface BrandingSettings {
    logo_path: string;
    app_logo_png_path: string | null;
    loading: boolean;
}

export function useBranding() {
    const [branding, setBranding] = useState<BrandingSettings>({
        logo_path: '/icon.jpg',
        app_logo_png_path: null,
        loading: true
    });

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const response = await api.get('/settings/public');
                if (response.data.status) {
                    const data = response.data.data;
                    
                    // URL Sanitization Helper Removed - Use direct URL from backend
                    // to ensure cross-port access (e.g. localhost:3000 frontend vs localhost:80 backend)


                    setBranding({
                        logo_path: resolveImageUrl(data.logo_path) || '/icon.jpg',
                        app_logo_png_path: resolveImageUrl(data.app_logo_png_path),
                        loading: false
                    });
                }
            } catch (error) {
                console.error("Failed to fetch branding:", error);
                setBranding(prev => ({ ...prev, loading: false }));
            }
        };

        fetchBranding();
    }, []);

    return branding;
}
