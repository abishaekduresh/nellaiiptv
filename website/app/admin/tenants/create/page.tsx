'use client';

import TenantForm from '@/components/admin/TenantForm';

export default function CreateTenantPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Add Tenant</h1>
        <p className="text-slate-400 text-sm mt-1">Register a new B2B tenant / organisation</p>
      </div>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <TenantForm />
      </div>
    </div>
  );
}
