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
              <body style={{ background: '#0f1729', color: 'white', padding: '40px 20px', fontFamily: 'sans-serif', margin: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>📱</div>
                  <h2 style={{ marginBottom: '10px' }}>Opening Nellai IPTV...</h2>
                  <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '400px' }}>
                      Redirecting to web preview in <strong id="countdown" style={{ color: '#00d2ff', fontSize: '24px' }}>3</strong> seconds...
                  </p>
                  
                  <a href={previewUrl} style={{ 
                      display: 'inline-block', 
                      marginTop: '30px', 
                      padding: '12px 24px', 
                      background: '#1e293b', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      border: '1px solid #334155',
                      backdropFilter: 'blur(10px)'
                  }}>
                      Open in Browser Now
                  </a>

                  <script dangerouslySetInnerHTML={{ __html: `
                      var isAndroid = /android/i.test(navigator.userAgent);
                      var intentUrl = "${intentUrl}";
                      var iosUrl = "nellaiiptv://channels/share/${shortCode}";
                      
                      // Try to open the app (OS specific intent)
                      window.location.href = isAndroid ? intentUrl : iosUrl;

                      // Start the 3-second fallback countdown
                      var count = 3;
                      var countdownEl = document.getElementById("countdown");
                      var timer = setInterval(function() {
                          count--;
                          if (countdownEl) countdownEl.innerText = count;
                          if (count <= 0) {
                              clearInterval(timer);
                              window.location.replace("${previewUrl}");
                          }
                      }, 1000);
                  `}} />
              </body>
          </html>
      );
  }

  redirect(previewUrl);
}
