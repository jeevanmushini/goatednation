import React from 'react';
import Link from 'next/link';
import { Truck, Sparkles, Layers } from 'lucide-react';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';
import { CartDrawer } from '../../components/layout/CartDrawer';

export default function AboutPage() {
  const faqs = [
    {
      q: 'How does the sizing work for Goated Nation streetwear?',
      a: 'All our garments are cut in an authentic Japanese oversized, drop-shoulder silhouette. If you want the intended modern baggy streetwear fit, order your regular size. If you prefer a closer standard fit, order one size down.',
    },
    {
      q: 'How fast is Shiprocket express delivery?',
      a: 'All orders placed before 2 PM IST are dispatched same day from our Mumbai hub. Standard metro delivery via Shiprocket takes 2 to 3 business days; non-metro locations take 3 to 5 business days. Real-time AWB tracking is provided immediately via SMS and on our /track page.',
    },
    {
      q: 'Which payment options are supported?',
      a: 'Through our Razorpay gateway integration, we support Instant UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking across 50+ Indian banks, and Cash on Delivery (COD).',
    },
    {
      q: 'What is your exchange and return policy?',
      a: 'We offer a 7-day hassle-free doorstep exchange policy. If you need a size exchange or different silhouette, initiate a request via support@goatednation.in and our courier partner will arrange doorstep pickup.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Hero Manifesto */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#888888]">
            THE GOATED NATION MANIFESTO
          </span>
          <h1 className="text-3xl sm:text-5xl font-mono font-bold text-black uppercase tracking-tight mt-2 leading-[1.05]">
            WEAR THE CULTURE. <br />
            <span className="text-[#888888]">NO COMPROMISES.</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#555555] leading-relaxed mt-6">
            Goated Nation was founded on a singular conviction: anime fans deserve high-end, luxury-grade streetwear — not thin promotional blanks. We merge the underground grit of Tokyo streetwear with obsessive garment craftsmanship.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-6 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-3">
            <div className="w-9 h-9 rounded bg-black flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-mono font-bold text-sm text-black uppercase">280–420 GSM Terry</h3>
            <p className="text-xs font-mono text-[#666666] leading-relaxed">
              Custom woven loopback terry fabric that holds a structured boxy drape wash after wash. Zero flimsy translucent cotton.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-3">
            <div className="w-9 h-9 rounded bg-black flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-mono font-bold text-sm text-black uppercase">High-Density 3D Puff</h3>
            <p className="text-xs font-mono text-[#666666] leading-relaxed">
              Multi-pass screen prints with dimensional puff textures and UV reactive inks that age like genuine vintage vinyl.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-3">
            <div className="w-9 h-9 rounded bg-black flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-mono font-bold text-sm text-black uppercase">Integrated Logistics</h3>
            <p className="text-xs font-mono text-[#666666] leading-relaxed">
              Integrated with Shiprocket and Razorpay for frictionless UPI checkout, instant courier tracking, and doorstep exchange.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="pt-12 border-t border-[#EAEAEA]">
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-black uppercase tracking-tight mb-8 text-center">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="p-5 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-2"
              >
                <h4 className="text-xs sm:text-sm font-mono font-bold text-black">{f.q}</h4>
                <p className="text-xs font-mono text-[#666666] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-widest transition-all"
          >
            <span>DISCOVER THE LATEST DROPS &rarr;</span>
          </Link>
        </div>
      </main>

      <ZeninFooter />
      <CartDrawer />
    </div>
  );
}
