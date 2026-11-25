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
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-[#FFFFFF] text-black font-sans antialiased selection:bg-[#FF4D00] selection:text-white">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
