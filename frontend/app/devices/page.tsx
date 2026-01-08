'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import DeviceManager from '@/components/DeviceManager';

export default function DevicesPage() {
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);

    const handleBackToLogin = () => {
        logout(); // Clear temp token
        router.push('/login');
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Manage Devices</h1>
                    <p className="text-slate-400">
                        You have reached the maximum number of allowed devices (1). 
                        Please remove a device to continue logging in.
                    </p>
                </div>

                <DeviceManager redirectOnSuccess="/" enableAutoLogin={true} />

                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
                    <button
                        onClick={handleBackToLogin}
                        className="text-primary hover:text-cyan-400 font-medium transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
