'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import ClapprPlayer from '@/components/ClapprPlayer';

interface Channel {
  uuid: string;
  name: string;
  hls_url: string;
  thumbnail_url?: string;
  is_preview_public: boolean;
}

export default function PreviewPage({ params }: { params: { uuid: string } }) {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import disable-devtool to ensure it runs on the client side
    import('disable-devtool').then((module) => {
        module.default({
            ondevtoolopen: (type) => {
                const info = 'devtool opened!';
                console.warn(info);
                // You can add custom logic here, e.g. redirecting
               // window.location.href = '/'; 
            }
        });
    });
  }, []);

  useEffect(() => {
    const fetchChannel = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        
        const headers: Record<string, string> = {
          'X-API-KEY': process.env.NEXT_PUBLIC_API_SECRET || '',
          'X-Client-Platform': 'web'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/channels/${params.uuid}`;
        console.log(`[PreviewPage] Fetching channel: ${params.uuid}`);

        const response = await fetch(apiUrl, {
          headers,
          cache: 'no-store'
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
             setErrorHeader('Channel Locked');
             setErrorMessage('This channel is private.');
          } else {
             setErrorHeader('Channel Not Available');
             setErrorMessage('The requested channel could not be found.');
          }
          setChannel(null);
        } else {
          const data = await response.json();
          setChannel(data.data);
          if (data.data?.name) {
            document.title = `${data.data.name} | Nellai IPTV`;
          }
          setErrorHeader(null);
          setErrorMessage(null);
        }
      } catch (error) {
        console.error('[PreviewPage] Exception fetching channel:', error);
        setErrorHeader('Error');
        setErrorMessage('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannel();
  }, [params.uuid]);

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'black',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Loading...
      
      </div>
    );
  }

  if (errorHeader || !channel) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'black',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{errorHeader || 'Channel Not Available'}</h1>
        <p style={{ color: '#aaa' }}>
          {errorMessage || 'This channel is private or does not exist.'}
        </p>
      
      </div>
    );
  }

  return (
    <>
      <style>{`
          html, body {
            margin: 0;
            width: 100%;
            height: 100%;
            background: black;
            overflow: hidden;
          }
        `}</style>
      <div className="w-full h-full">
        <ClapprPlayer
          streamUrl={channel.hls_url}
          channelName={channel.name}
          posterUrl={channel.thumbnail_url}
          channelUuid={channel.uuid}
        />
      </div>
    </>
  );
}
