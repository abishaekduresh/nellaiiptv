'use client';

import React, { useEffect, useState } from 'react';
import { Customer } from '@/types';
import adminApi from '@/lib/adminApi';
import { X, User, CreditCard, Clock, Calendar, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerOverviewModalProps {
  uuid: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerOverviewModal({ uuid, isOpen, onClose }: CustomerOverviewModalProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && uuid) {
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const res = await adminApi.get(`/admin/customers/${uuid}`);
          setCustomer(res.data.data);
        } catch (error: any) {
          console.error(error);
          toast.error('Failed to load customer details');
          onClose();
        } finally {
          setLoading(false);
        }
      };

      fetchCustomer();
    } else {
        setCustomer(null);
    }
  }, [isOpen, uuid, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl w-full max-w-2xl border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="text-primary" size={24} />
            Customer Overview
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : customer ? (
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Personal Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <User size={18} className="text-slate-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500">Name</p>
                            <p className="text-white font-medium">{customer.name}</p>
                        </div>
                    </div>
                    {customer.email && (
                        <div className="flex items-start gap-3">
                            <Mail size={18} className="text-slate-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="text-white font-medium">{customer.email}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3">
                        <Phone size={18} className="text-slate-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-white font-medium">{customer.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar size={18} className="text-slate-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500">Joined Date</p>
                            <p className="text-white font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Subscription</h3>
                   <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <CreditCard size={18} className="text-slate-500 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-500">Plan</p>
                            <p className="text-white font-medium">{customer.plan?.name || 'Free Plan'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                         <div className={`w-4 h-4 rounded-full mt-1 ${customer.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                            <p className="text-xs text-slate-500">Account Status</p>
                            <p className={`font-medium ${customer.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </p>
                        </div>
                    </div>
                    {customer.subscription_expires_at && (
                         <div className="flex items-start gap-3">
                            <Clock size={18} className="text-slate-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Expires At</p>
                                <p className="text-white font-medium">{new Date(customer.subscription_expires_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    )}
                    {customer.plan && (
                        <div className="pt-2 border-t border-slate-700 mt-2">
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Device Limit</span>
                                <span className="text-white">{customer.plan.device_limit}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Platforms</span>
                                <span className="text-white">
                                    {Array.isArray(customer.plan.platform_access) 
                                        ? customer.plan.platform_access.join(', ') 
                                        : 'All'}
                                </span>
                            </div>
                        </div>
                    )}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">Customer not found</div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-800 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}
