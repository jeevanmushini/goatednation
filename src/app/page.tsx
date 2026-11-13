import { ZeninAnnouncementBar } from '../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../components/zenin/ZeninHeader';
import { ZeninHeroFloatingPants } from '../components/zenin/ZeninHeroFloatingPants';
import { ZeninNewArrivals } from '../components/zenin/ZeninNewArrivals';
import { ZeninCategory3DStack } from '../components/zenin/ZeninCategory3DStack';
import { ZeninEditorialBanner } from '../components/zenin/ZeninEditorialBanner';
import { ZeninFooter } from '../components/zenin/ZeninFooter';
import { CartDrawer } from '../components/layout/CartDrawer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      {/* 1. Zenin Announcement Bar with Live Countdown & Orange Shop Button */}
      <ZeninAnnouncementBar />

      {/* 2. Zenin Minimalist Header with Dropdown & 12-Category Sub-Navigation */}
      <ZeninHeader />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 3. Hero Section 1: Brutalist Studio with Overhead Neon Ring Light & 3D Fanned Bottoms */}
        <ZeninHeroFloatingPants />

        {/* 4. Section 2: NEW ARRIVAL / 新品上市 4-Column Grid with Dual-Image Hover & Red Badges */}
        <ZeninNewArrivals />

        {/* 5. Section 3: 3D Fanned Card Deck Category Showcase (Zoro Backpack & Tactical Lookbook) */}
        <ZeninCategory3DStack />

        {/* 6. Section 4: 176K Followers Instagram Editorial Photo Banner */}
        <ZeninEditorialBanner />
      </main>

      {/* 7. Zenin Minimalist Pitch-Black Footer with Newsletter & Legal Links */}
      <ZeninFooter />

      {/* Interactive Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
