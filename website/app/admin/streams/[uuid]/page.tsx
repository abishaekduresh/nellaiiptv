'use client';

import StreamForm from '@/components/admin/StreamForm';

export default function EditStreamPage({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Edit Stream</h1>
        <p className="text-slate-400 text-sm mt-1">Update stream configuration</p>
      </div>
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <StreamForm uuid={uuid} />
      </div>
    </div>
  );
}
