'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Trash2, Smartphone, Monitor, Tv, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Session {
    id: number;
    device_name: string;
    platform: string;
    ip_address: string;
    last_active: string;
    created_at: string;
}

interface DeviceManagerProps {
    className?: string;
    redirectOnSuccess?: string;
    onRevokeSuccess?: () => void;
    enableAutoLogin?: boolean;
}

export default function DeviceManager({ className = '', redirectOnSuccess, onRevokeSuccess, enableAutoLogin = false }: DeviceManagerProps) {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/customers/sessions');
            if (response.data.status) {
                setSessions(response.data.data);
            }
        } catch (err: any) {
            // 401 handled by interceptor
            if (err.response?.status !== 401) {
                toast.error('Failed to load sessions');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: number) => {
        // Direct removal without confirmation as per user request
        deleteSession(id);
    };

    const deleteSession = async (id: number) => {
        try {
            const url = `/customers/sessions/${id}` + (enableAutoLogin ? '?auto_login=true' : '');
            const response = await api.delete(url);
             if (response.data.status) {
                
                // Auto-login logic if tokens returned
                if (response.data.data && response.data.data.tokens) {
                    toast.success('Device removed. Logging in...', { id: 'auth-redirect' });
                    const { user } = response.data.data.tokens;
                    const { token } = response.data.data.tokens;
                    setAuth(token, user, false);
                    
                    if (redirectOnSuccess) {
                        router.push(redirectOnSuccess);
                        return;
                    }
                } else {
                    toast.success('Device removed successfully');
                }

                setSessions(prev => prev.filter(s => s.id !== id));
                if (onRevokeSuccess) onRevokeSuccess();
            } else {
                toast.error(response.data.message || 'Failed to remove device');
            }
        } catch (err: any) {
             console.error('Revoke error:', err);
            toast.error(err.response?.data?.message || 'Failed to remove device');
        }
    };

    const getIcon = (platform: string) => {
        switch (platform) {
            case 'android': return <Smartphone className="text-green-400" />;
            case 'ios': return <Smartphone className="text-gray-400" />;
            case 'tv': return <Tv className="text-blue-400" />;
            case 'web': 
            default: return <Globe className="text-cyan-400" />;
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <>
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-slate-800 rounded-lg p-4 flex items-center justify-between border border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-700 rounded-full">
                                    {getIcon(session.platform)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{session.device_name || 'Unknown Device'}</h3>
                                    <p className="text-sm text-slate-400">Last active: {session.last_active}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRevoke(session.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Remove Device"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <p className="text-center text-slate-500 py-4">No active sessions found.</p>
                    )}
                </>
            )}
        </div>
    );
}
