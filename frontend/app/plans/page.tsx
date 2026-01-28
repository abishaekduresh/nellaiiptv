'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Check, X, Crown, Zap, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import Script from 'next/script';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Plan {
    uuid: string;
    name: string;
    price: string;
    reseller_price: string;
    duration: number;
    device_limit: number;
    description: string;
    features: string[];
    platform_access: string[];
    is_popular?: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [showPromo, setShowPromo] = useState(false);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error') === 'subscription_required') {
            setShowPromo(true);
        }

        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans');
                if (res.data.status) {
                    setPlans(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSubscribe = async (plan: Plan) => {
        if (!user) {
            window.location.href = `/login?redirect=/plans`;
            return;
        }

        setProcessingPlan(plan.uuid);
        try {
            // 1. Create Order
            const orderRes = await api.post('/payments/create-order', {
                plan_uuid: plan.uuid,
                gateway: 'razorpay'
            });

            if (!orderRes.data.status) {
                toast.error(orderRes.data.message || 'Failed to initialize payment');
                return;
            }

            const orderData = orderRes.data.data;

            // 2. Open Razorpay
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Nellai IPTV",
                description: `Subscription for ${plan.name}`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            transaction_uuid: orderData.transaction_uuid,
                            gateway: 'razorpay',
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.status) {
                            toast.success('Subscription activated successfully!');
                            // Refresh user session/data to reflect new plan
                            window.location.href = '/profile';
                        } else {
                            toast.error(verifyRes.data.message || 'Payment verification failed');
                        }
                    } catch (err) {
                        toast.error('Verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: (user as any)?.name,
                    email: (user as any)?.email,
                    contact: (user as any)?.phone
                },
                theme: {
                    color: "#06B6D4"
                },
                modal: {
                    ondismiss: function() {
                        setProcessingPlan(null);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment initialization failed');
            setProcessingPlan(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
            {showPromo && (
                <div className="max-w-4xl mx-auto mb-12 p-6 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Subscription Required</h2>
                        <p className="text-slate-400">An active plan is required to watch channels. Please select a plan below to continue.</p>
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                    Choose Your <span className="text-primary">Perfect Plan</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Unlock premium entertainment across all your devices with our flexible subscription options.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan, index) => {
                    const isPremium = !!plan.is_popular;
                    const isCurrentPlan = (user as any)?.plan?.uuid === plan.uuid;

                    return (
                        <div 
                            key={plan.uuid}
                            className={`relative flex flex-col p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                                isCurrentPlan 
                                ? 'bg-slate-900 border-primary shadow-2xl shadow-primary/20 bg-gradient-to-b from-slate-900 via-slate-900 to-primary/5' 
                                : isPremium 
                                    ? 'bg-slate-900 border-primary/50'
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            {(isPremium || isCurrentPlan) && (
                                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-slate-900 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg ${isCurrentPlan ? 'bg-green-400' : 'bg-primary'}`}>
                                    {isCurrentPlan ? 'Active Plan' : 'Most Popular'}
                                </div>
                            )}

                            <div className="mb-8 text-left">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-white">₹{plan.price}</span>
                                    <span className="text-slate-400">/{plan.duration} days</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1 text-left">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Shield size={18} className="text-primary flex-shrink-0" />
                                    <span>{plan.device_limit} Device {plan.device_limit > 1 ? 'Limits' : 'Limit'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Zap size={18} className="text-primary flex-shrink-0" />
                                    <span className="capitalize">{plan.platform_access?.join(', ') || 'All Platforms'}</span>
                                </div>
                                
                                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                                    <div className="pt-4 border-t border-slate-800">
                                        <ul className="space-y-3">
                                            {plan.features.slice(0, expandedPlan === plan.uuid ? undefined : 3).map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                                                    <Check size={16} className="text-green-500 mt-1 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        {plan.features.length > 3 && (
                                            <button 
                                                onClick={() => setExpandedPlan(expandedPlan === plan.uuid ? null : plan.uuid)}
                                                className="mt-4 flex items-center justify-between w-full text-slate-100 font-semibold hover:text-primary transition-colors text-sm"
                                            >
                                                <span>{expandedPlan === plan.uuid ? 'Show Less' : 'View All Details'}</span>
                                                {expandedPlan === plan.uuid ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => !isCurrentPlan && handleSubscribe(plan)}
                                disabled={!!processingPlan}
                                className={`w-full py-4 rounded-xl font-bold transition-all duration-200 text-center flex items-center justify-center gap-2 ${
                                    isCurrentPlan || isPremium
                                    ? 'bg-primary hover:bg-cyan-600 text-slate-950 shadow-lg shadow-primary/30' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                                } ${processingPlan === plan.uuid ? 'opacity-70 cursor-not-allowed' : ''} ${isCurrentPlan ? 'cursor-default' : ''}`}
                            >
                                {processingPlan === plan.uuid && <Loader2 className="animate-spin" size={18} />}
                                {isCurrentPlan ? 'Current Plan' : (user ? 'Select Plan' : 'Get Started')}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-20 max-w-4xl mx-auto text-center p-8 rounded-3xl bg-slate-900/30 border border-slate-800/50 backdrop-blur-md">
                <Crown className="mx-auto text-yellow-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-white mb-2">Need a custom plan?</h2>
                <p className="text-slate-400 mb-6">Contact our support team for bulk licensing, reseller accounts, or custom enterprise solutions.</p>
                <Link 
                    href="/contact" 
                    className="inline-block px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold transition-colors"
                >
                    Contact Support
                </Link>
            </div>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </div>
    );
}
