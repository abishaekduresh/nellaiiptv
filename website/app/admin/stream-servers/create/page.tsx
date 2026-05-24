'use client';

import StreamServerForm from '@/components/admin/StreamServerForm';

export default function CreateStreamServerPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Add Stream Server</h1>
      <div className="bg-slate-900/80 p-6 rounded-lg border border-slate-800">
        <StreamServerForm />
      </div>
    </div>
  );
}
