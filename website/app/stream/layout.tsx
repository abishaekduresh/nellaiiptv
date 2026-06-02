import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RTMP & SRT Streaming Services | Nellai IPTV",
  description:
    "Professional RTMP & SRT live streaming hosting with HLS delivery, free domain & SSL, dedicated servers, and 24/7 support. Monthly plans from ₹499/mo. Annual bandwidth packages up to 16 TB.",
  keywords: [
    "RTMP streaming server India",
    "SRT streaming hosting",
    "RTMP ingest server",
    "HLS streaming service India",
    "live streaming hosting India",
    "cheap RTMP server India",
    "RTMP hosting Tamil Nadu",
    "live stream server India",
    "RTMP SRT streaming service",
    "professional live streaming hosting",
    "streaming CDN India",
    "RTMP hosting affordable",
    "RTMP server rent India",
    "SRT ingest hosting",
    "OBS streaming server India",
    "live stream bandwidth hosting",
    "white label streaming server",
    "dedicated streaming server India",
    "Nellai IPTV Stream",
    "HLS delivery India",
  ],
  authors: [{ name: "Nellai IPTV", url: "https://nellaiiptv.com" }],
  alternates: {
    canonical: "https://nellaiiptv.com/stream",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "RTMP & SRT Streaming Services | Nellai IPTV",
    description:
      "Host your live stream with professional RTMP & SRT ingest, HLS delivery, free SSL, and dedicated servers. Plans from ₹499/mo.",
    url: "https://nellaiiptv.com/stream",
    siteName: "Nellai IPTV",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://nellaiiptv.com/assets/logos/Nellai IPTV - PNG Logo.webp",
        width: 512,
        height: 512,
        alt: "Nellai IPTV Stream",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RTMP & SRT Streaming Services | Nellai IPTV",
    description:
      "Professional RTMP & SRT live streaming hosting. HLS delivery, free SSL, dedicated servers. Plans from ₹499/mo.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Nellai IPTV Stream — RTMP & SRT Streaming Hosting",
  url: "https://nellaiiptv.com/stream",
  description:
    "Professional live streaming hosting service offering RTMP and SRT ingest, HLS delivery, free domain and SSL, dedicated servers, full HD 1080p support, and 24/7 technical support.",
  serviceType: "Live Streaming Hosting",
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  provider: {
    "@type": "Organization",
    name: "Nellai IPTV",
    url: "https://nellaiiptv.com",
    logo: "https://nellaiiptv.com/assets/logos/Nellai IPTV - PNG Logo.webp",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-7708443543",
      email: "nellaiiptv@gmail.com",
      contactType: "customer support",
      availableLanguage: ["English", "Tamil"],
    },
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Streaming Hosting Plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Basic Monthly Plan",
        description: "Entry-level RTMP/SRT streaming plan",
        price: "499",
        priceCurrency: "INR",
        billingIncrement: "P1M",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Offer",
        name: "Standard Monthly Plan",
        description: "Standard RTMP/SRT streaming with increased bandwidth",
        price: "799",
        priceCurrency: "INR",
        billingIncrement: "P1M",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Offer",
        name: "Pro Monthly Plan",
        description: "Pro RTMP/SRT streaming with multi-stream support",
        price: "999",
        priceCurrency: "INR",
        billingIncrement: "P1M",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Offer",
        name: "Business Monthly Plan",
        description: "Business-grade streaming with white label support",
        price: "1899",
        priceCurrency: "INR",
        billingIncrement: "P1M",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Offer",
        name: "4 TB Annual Bandwidth Package",
        description: "4 TB bandwidth per year — unlimited viewers",
        price: "8999",
        priceCurrency: "INR",
        billingIncrement: "P1Y",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Offer",
        name: "8 TB Annual Bandwidth Package",
        description: "8 TB bandwidth per year — multi-stream, most popular",
        price: "12999",
        priceCurrency: "INR",
        billingIncrement: "P1Y",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
      {
        "@type": "Offer",
        name: "16 TB Annual Bandwidth Package",
        description: "16 TB bandwidth per year — white label",
        price: "19999",
        priceCurrency: "INR",
        billingIncrement: "P1Y",
        eligibleRegion: { "@type": "Country", name: "India" },
      },
    ],
  },
};

export default function StreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
