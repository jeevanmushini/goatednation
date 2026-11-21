'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import { Product, ProductCategory } from '../../../types/product';
import { ZeninAnnouncementBar } from '../../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../../components/zenin/ZeninFooter';
import { CartDrawer } from '../../../components/layout/CartDrawer';
import { ProductCard } from '../../../components/product/ProductCard';
import CollectionsClientView from '../../../components/collections/CollectionsClientView';

const CATEGORY_MAP: Record<string, { title: string; subtitle: string; filterKey: string }> = {
  backpack: {
    title: 'BACKPACKS & CROSSBODY',
    subtitle: 'Tactical anime crossbody slings, 1000D Cordura bags, and modular Molle techwear backpacks.',
    filterKey: 'accessories',
  },
  trackpant: {
    title: 'BOTTOMS & SWEATPANTS',
    subtitle: 'Oversized barrel sweatpants, 420 GSM thick rope cord bottoms, and Tokyo cargo pants.',
    filterKey: 'cargo',
  },
  jacket: {
    title: 'JACKETS & BOMBERS',
    subtitle: 'Metallic thread jacquard jackets, Sukuna domain bombers, and waterproof tech shells.',
    filterKey: 'jackets',
  },
  winter: {
    title: 'WINTER CAPSULE',
    subtitle: 'Heavyweight thermal fleece, double-layered zip hoodies, and insulated outerwear.',
    filterKey: 'hoodies',
  },
  tees: {
    title: 'OVERSIZED T-SHIRTS',
    subtitle: 'Custom-milled 280 GSM combed cotton tees with high-density puff screen prints.',
    filterKey: 'tees',
  },
  accessories: {
    title: 'STREET ACCESSORIES',
    subtitle: 'Crossbody tactical bags, utility harnesses, anime caps, and oversized desk mats.',
    filterKey: 'accessories',
  },
  hoodie: {
    title: 'HEAVY HOODIES (420 GSM)',
    subtitle: 'Double-layer oversized hood, no drawstrings, drop-shoulder luxury French terry cuts.',
    filterKey: 'hoodies',
  },
  caps: {
    title: 'CAPS & HEADWEAR',
    subtitle: 'Distressed vintage wash dad hats, structured snapbacks, and embroidered beanies.',
    filterKey: 'accessories',
  },
  deskmat: {
    title: 'DESK MATS & PRINTS',
    subtitle: 'Water-resistant micro-woven anime desk pads with non-slip natural rubber bases.',
    filterKey: 'accessories',
  },
  jersey: {
    title: 'RETRO ANIME JERSEYS',
    subtitle: 'Breathable sports mesh jerseys featuring vintage manga graphics and boxy cuts.',
    filterKey: 'tees',
  },
  compression: {
    title: 'COMPRESSION & BASE LAYERS',
    subtitle: 'Moisture-wicking second-skin athletic rashguards engineered for high performance.',
    filterKey: 'tees',
  },
  vest: {
    title: 'TACTICAL UTILITY VESTS',
    subtitle: 'Modular multi-pocket chest rigs, tactical webbing, and reflective streetwear vests.',
    filterKey: 'jackets',
  },
};

export default function CategoryCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const cmsCategories = useCmsStore((state) => state.categories);
  const cmsProducts = useCmsStore((state) => state.products);
  const deletedProductIds = useCmsStore((state) => state.deletedProductIds || []);

  React.useEffect(() => {
    useCmsStore.getState().syncFromServer(true);
  }, []);

  if (slug === 'all-products' || slug === 'all') {
    return <CollectionsClientView />;
  }

  const allCategories = cmsCategories;
  const allProducts = React.useMemo(() => {
    const deletedSet = new Set(deletedProductIds);
    if (cmsProducts && cmsProducts.length > 0) {
      return cmsProducts.filter((p) => !deletedSet.has(p.id));
    }
    return [];
  }, [cmsProducts, deletedProductIds]);

  const mapped = CATEGORY_MAP[slug.toLowerCase()];
  const fallbackCat = allCategories.find((c) => c.slug === slug);

  const categoryName = mapped?.title || fallbackCat?.title || slug.toUpperCase();
  const categorySubtitle =
    mapped?.subtitle ||
    fallbackCat?.subtitle ||
    'Curated Japanese anime streetwear engineered with luxury heavyweight fabrics.';

  const targetCategoryKey = mapped?.filterKey || slug;

  const filteredProducts = allProducts.filter(
    (p) =>
      p.category === (targetCategoryKey as ProductCategory) ||
      p.slug.toLowerCase().includes(slug.toLowerCase()) ||
      p.title.toLowerCase().includes(slug.toLowerCase())
  );

  const displayProducts = filteredProducts;

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Minimalist Zenin Breadcrumb */}
        <nav className="flex items-center space-x-2 text-[11px] font-mono text-[#888888] mb-8 uppercase tracking-widest">
          <Link href="/" className="hover:text-black transition-colors">
            HOME
          </Link>
          <ChevronRight className="w-3 h-3 text-[#CCCCCC]" />
          <Link href="/collections" className="hover:text-black transition-colors">
            COLLECTIONS
          </Link>
          <ChevronRight className="w-3 h-3 text-[#CCCCCC]" />
          <span className="text-black font-semibold">{categoryName}</span>
        </nav>

        {/* Page Header (Zenin Clean Monospace & Typography) */}
        <div className="border-b border-[#EAEAEA] pb-8 mb-10">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.2em] text-[#888888]">
            <span>COLLECTION ARCHIVE</span>
            <span>/</span>
            <span>{slug.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-mono font-bold text-black uppercase tracking-tight mt-1">
            {categoryName}
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#666666] mt-2 max-w-2xl">
            {categorySubtitle}
          </p>
        </div>

        {/* Product Grid */}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center font-mono">
            <p className="text-sm uppercase tracking-widest text-[#888888]">
              No active drops found in this collection capsule yet.
            </p>
            <Link
              href="/collections"
              className="inline-block mt-4 px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors rounded-lg"
            >
              Explore All Drops
            </Link>
          </div>
        )}
      </main>

      <ZeninFooter />
      <CartDrawer />
    </div>
  );
}
