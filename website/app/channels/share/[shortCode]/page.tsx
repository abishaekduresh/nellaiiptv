import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SharePage({ params }: { params: { shortCode: string } }) {
  const shortCode = params.shortCode;
  
  // Use server-side env var (API_URL) first, fall back to NEXT_PUBLIC_API_URL
  const baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost/nellaiiptv/backend/public/api';
  const apiUrl = `${baseUrl}/channels/share/${shortCode}`;
  const apiSecret = process.env.API_SECRET || process.env.NEXT_PUBLIC_API_SECRET || '';
  
  let channelUuid = null;
  
  console.log(`[SharePage] Fetching: ${apiUrl}`);
  
  try {
      const response = await fetch(apiUrl, {
          headers: {
            'X-API-KEY': apiSecret,
            'X-Client-Platform': 'web'
          },
          cache: 'no-store'
      });
      
      console.log(`[SharePage] Response status: ${response.status}`);
      
      if (response.ok) {
          const data = await response.json();
          console.log(`[SharePage] Response data:`, JSON.stringify(data).substring(0, 200));
          channelUuid = data.data?.uuid;
      } else {
          const text = await response.text();
          console.error(`[SharePage] API error ${response.status}: ${text.substring(0, 300)}`);
      }
  } catch (err) {
      console.error('[SharePage] Fetch error:', err);
  }

  if (!channelUuid) {
      return (
          <div style={{ background: '#0f1729', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
             <div style={{ fontSize: '48px' }}>📺</div>
             <h2 style={{ margin: 0 }}>Channel not found</h2>
             <p style={{ color: '#94a3b8', margin: 0 }}>
               Share code <code style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>{shortCode}</code> is invalid or expired.
             </p>
          </div>
      );
  }

  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /android|ipad|iphone|ipod/i.test(userAgent);
  const previewUrl = `/channels/preview/${channelUuid}`;

  if (isMobile) {
      const intentUrl = `intent://channels/share/${shortCode}#Intent;scheme=nellaiiptv;package=com.nellaiiptv;end;`;
      
      return (
          <html lang="en">
              <body style={{ background: 'black', color: 'white', padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
                  <h3>Opening Nellai IPTV...</h3>
                  <p>If the app does not open automatically, <a href={previewUrl} style={{ color: '#00d2ff' }}>click here to watch in browser</a>.</p>
                  <script dangerouslySetInnerHTML={{ __html: `
                      setTimeout(function() {
                          window.location.href = "${previewUrl}";
                      }, 2500);
                      window.location.href = "${intentUrl}";
                  `}} />
              </body>
          </html>
      );
  }

  redirect(previewUrl);
}
