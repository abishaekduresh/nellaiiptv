'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StreamServerForm from '@/components/admin/StreamServerForm';
import adminApi from '@/lib/adminApi';

export default function EditStreamServerPage() {
  const { uuid } = useParams();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const res = await adminApi.get(`/admin/stream-servers/${uuid}`);
        setServer(res.data.data);
      } catch (error) {
        console.error('Failed to fetch stream server', error);
        alert('Failed to load stream server data');
      } finally {
        setLoading(false);
      }
    };

    if (uuid) fetchServer();
  }, [uuid]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!server) return <div className="text-white">Stream server not found</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Stream Server</h1>
        <div className="bg-background-card px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
          <span className="text-text-secondary text-sm font-mono">{uuid}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(uuid as string);
              alert('UUID Copied!');
            }}
            className="text-primary hover:text-primary-dark text-xs font-semibold uppercase tracking-wider"
          >
            Copy UUID
          </button>
        </div>
      </div>
      <div className="bg-background-card p-6 rounded-lg border border-gray-800">
        <StreamServerForm initialData={server} isEditing={true} />
      </div>
    </div>
  );
}
