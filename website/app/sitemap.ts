import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://nellaiiptv.com';

  return [
    { url: base,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/about`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/channels`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/plans`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/player`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/terms`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${base}/disclaimer`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
