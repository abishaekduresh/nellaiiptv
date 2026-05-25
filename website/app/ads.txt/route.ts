import { NextResponse } from 'next/server';

// Serves /ads.txt for Google AdSense publisher verification.
// Publisher ID: NEXT_PUBLIC_GOOGLE_ADSENSE_ID (e.g. ca-pub-1234567890)
// Direct ID:    NEXT_PUBLIC_GOOGLE_DIRECT_ID   (e.g. f08c47fec0942fa0)
export async function GET() {
  const raw      = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID ?? '';
  const directId = process.env.NEXT_PUBLIC_GOOGLE_DIRECT_ID ?? '';

  if (!raw || !directId) {
    return new NextResponse('# ads.txt — NEXT_PUBLIC_GOOGLE_ADSENSE_ID or NEXT_PUBLIC_GOOGLE_DIRECT_ID not set\n', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // AdSense uses "pub-XXXX" (without the "ca-" prefix) in ads.txt
  const pubId = raw.startsWith('ca-') ? raw.slice(3) : raw;

  const content = `google.com, ${pubId}, DIRECT, ${directId}\n`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
