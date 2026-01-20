import { useState, useEffect } from 'react';
import api from '@/lib/api';


interface BrandingSettings {
    logo_url: string;
    app_logo_png_url: string | null;
    loading: boolean;
}

export function useBranding() {
    const [branding, setBranding] = useState<BrandingSettings>({
        logo_url: '/icon.jpg',
        app_logo_png_url: null,
        loading: true
    });

    useEffect(() => {
        const fetchBranding = async () => {
            try {
                const response = await api.get('/settings/public');
                if (response.data.status) {
                    const data = response.data.data;
                    
                    // Direct URL usage
                    setBranding({
                        logo_url: data.logo_url || '/icon.jpg',
                        app_logo_png_url: data.app_logo_png_url,
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
