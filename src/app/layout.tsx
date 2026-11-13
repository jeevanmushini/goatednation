import type { Metadata } from "next";
import "./tailwind.css";

export const dynamic = "force-dynamic";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-[#FFFFFF] text-black font-sans antialiased selection:bg-[#FF4D00] selection:text-white">
        {children}
      </body>
    </html>
  );
}
