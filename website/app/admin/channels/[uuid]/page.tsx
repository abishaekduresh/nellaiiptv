'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ChannelForm from '@/components/admin/ChannelForm';
import adminApi from '@/lib/adminApi';

export default function EditChannelPage() {
  const { uuid } = useParams();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        // Admin ChannelController now has show method
        const res = await adminApi.get(`/admin/channels/${uuid}`);
        setChannel(res.data.data);
      } catch (error) {
        console.error('Failed to fetch channel', error);
        alert('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchChannel();
    }
  }, [uuid]);

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!channel) {
    return <div className="text-white">Channel not found</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Channel</h1>
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
        <ChannelForm initialData={channel} isEditing={true} />
      </div>
    </div>
  );
}
