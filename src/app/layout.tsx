import type { Metadata, Viewport } from "next";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "./tailwind.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0E0E0E",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.goatednation.com'),
  title: "GOATED NATION | Premium Anime Streetwear",
  description:
    "Wear the culture. Premium heavyweight oversized anime streetwear, graphic tees, hoodies, and cargo pants inspired by modern Japanese aesthetics.",
  keywords: [
    "goated nation",
    "goated nation clothing",
    "anime streetwear",
    "oversized tees",
    "anime hoodies",
    "japanese streetwear",
    "jujutsu kaisen hoodie",
    "berserk tee",
  ],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "GOATED NATION | Premium Anime Streetwear",
    description: "Wear the culture. Premium heavyweight oversized anime streetwear, graphic tees, hoodies, and cargo pants.",
    url: "https://www.goatednation.com",
    siteName: "GOATED NATION",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GOATED NATION Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GOATED NATION | Premium Anime Streetwear",
    description: "Wear the culture. Premium heavyweight oversized anime streetwear.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "O-eA1509EZO1wsiXRdjijrhXFbLCkkw3YakrZOOL7Wk",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "GOATED NATION",
  url: "https://www.goatednation.com",
  logo: "https://www.goatednation.com/icon-512.png",
  image: "https://www.goatednation.com/og-image.png",
  description:
    "Wear the culture. Premium heavyweight oversized anime streetwear, graphic tees, hoodies, and cargo pants inspired by modern Japanese aesthetics.",
  brand: {
    "@type": "Brand",
    name: "GOATED NATION",
    logo: "https://www.goatednation.com/icon-512.png",
  },
  sameAs: ["https://instagram.com/goatednation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <meta
          name="google-site-verification"
          content="O-eA1509EZO1wsiXRdjijrhXFbLCkkw3YakrZOOL7Wk"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#FFFFFF] text-black font-sans antialiased selection:bg-[#FF4D00] selection:text-white">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
