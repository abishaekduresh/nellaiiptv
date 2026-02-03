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
      <h1 className="text-3xl font-bold text-white mb-8">Edit Channel</h1>
      <div className="bg-background-card p-6 rounded-lg border border-gray-800">
        <ChannelForm initialData={channel} isEditing={true} />
      </div>
    </div>
  );
}
