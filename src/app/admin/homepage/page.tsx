'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  Save,
  Flame,
  Layers,
  Image as ImageIcon,
  Megaphone,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCmsStore } from '../../../lib/cms/cmsStore';
import ImageInputWithUpload from '../../../components/admin/ImageInputWithUpload';

export default function AdminHomepageCmsPage() {
  const {
    sections,
    heroSlides,
    banners,
    brandStory,
    newsletter,
    heroBottoms,
    stackCards,
    editorialBanner,
    announcement,
    toggleSection,
    reorderSections,
    updateHeroSlide,
    updateBanner,
    updateBrandStory,
    updateNewsletter,
    updateHeroBottom,
    addHeroBottom,
    deleteHeroBottom,
    updateStackCard,
    addStackCard,
    deleteStackCard,
    updateEditorialBanner,
    updateAnnouncement,
    publishChanges,
  } = useCmsStore();

  const [activeMainTab, setActiveMainTab] = useState<
    'zenin-bottoms' | 'zenin-cards' | 'zenin-editorial' | 'zenin-announcement' | 'sections-layout'
  >('zenin-bottoms');

  const [selectedBottomIndex, setSelectedBottomIndex] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [activeLayoutSection, setActiveLayoutSection] = useState<string>('sec-hero');
  const [savedNotice, setSavedNotice] = useState(false);

  const currentHero = heroSlides[0] || {};
  const currentBanner = banners[0] || {};

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    reorderSections(reordered);
  };

  const triggerSaveNotice = () => {
    publishChanges();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleAddNewBottom = () => {
    addHeroBottom({
      name: 'NEW SILHOUETTE / SWEATPANTS',
      kanji: '新 // 420 GSM ROPE CORD',
      price: 'Rs. 1,999',
      image: 'https://zenin.co.in/cdn/shop/files/pant1s.png',
      color: 'Onyx Black',
      badge: 'NEW DROP',
    });
    setSelectedBottomIndex(heroBottoms.length);
  };

  const handleAddNewCard = () => {
    addStackCard({
      category: 'COLLECTION',
      title: 'NEW CAPSULE // CROSSBODY',
      subtitle: 'MODULAR MOLLE SYSTEM • 1000D CORDURA',
      image: 'https://zenin.co.in/cdn/shop/files/backpackcollection.jpg',
      link: '/collections',
    });
    setSelectedCardIndex(stackCards.length);
  };

  const currentBottom = heroBottoms[selectedBottomIndex] || heroBottoms[0];
  const currentCard = stackCards[selectedCardIndex] || stackCards[0];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAEAEA] gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#888888]">
            HOMEPAGE CMS BUILDER
          </span>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-black uppercase tracking-tight mt-1">
            VISUAL SECTION ARCHITECTURE
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#666666] mt-1">
            Upload images from your laptop, customize hero bottoms, 3D card decks, editorial banners, and announcements.
          </p>
        </div>

        <button
          onClick={triggerSaveNotice}
          className="px-5 py-2.5 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save &amp; Publish</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-lg bg-white border border-[#16A34A] text-[#16A34A] text-xs font-mono flex items-center space-x-2 shadow-sm">
          <Check className="w-4 h-4" />
          <span>Changes saved and published to the live storefront!</span>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-[#EAEAEA]">
        <button
          onClick={() => setActiveMainTab('zenin-bottoms')}
          className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeMainTab === 'zenin-bottoms'
              ? 'bg-black text-white shadow-sm'
              : 'bg-white text-[#666666] hover:text-black border border-[#EAEAEA] hover:border-black'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Hero 3D Bottoms ({heroBottoms.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('zenin-cards')}
          className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeMainTab === 'zenin-cards'
              ? 'bg-black text-white shadow-sm'
              : 'bg-white text-[#666666] hover:text-black border border-[#EAEAEA] hover:border-black'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D Category Cards ({stackCards.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('zenin-editorial')}
          className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeMainTab === 'zenin-editorial'
              ? 'bg-black text-white shadow-sm'
              : 'bg-white text-[#666666] hover:text-black border border-[#EAEAEA] hover:border-black'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Editorial 176K Banner</span>
        </button>

        <button
          onClick={() => setActiveMainTab('zenin-announcement')}
          className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeMainTab === 'zenin-announcement'
              ? 'bg-black text-white shadow-sm'
              : 'bg-white text-[#666666] hover:text-black border border-[#EAEAEA] hover:border-black'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Top Announcement Bar</span>
        </button>

        <button
          onClick={() => setActiveMainTab('sections-layout')}
          className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all whitespace-nowrap ${
            activeMainTab === 'sections-layout'
              ? 'bg-black text-white shadow-sm'
              : 'bg-white text-[#666666] hover:text-black border border-[#EAEAEA] hover:border-black'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Legacy Layout &amp; Slides</span>
        </button>
      </div>

      {/* TAB 1: HERO 3D FLOATING BOTTOMS */}
      {activeMainTab === 'zenin-bottoms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Bottoms List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                Fanned Bottoms Rotation
              </h2>
              <button
                type="button"
                onClick={handleAddNewBottom}
                className="px-3 py-1.5 rounded bg-white hover:bg-black hover:text-white text-black text-[11px] font-mono flex items-center space-x-1.5 border border-[#D5D5D5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Silhouette</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {heroBottoms.map((bottom, index) => {
                const isSelected = selectedBottomIndex === index;
                return (
                  <div
                    key={bottom.id}
                    onClick={() => setSelectedBottomIndex(index)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white border-black shadow-md'
                        : 'bg-white border-[#EAEAEA] hover:border-[#CCCCCC]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative w-12 h-14 bg-[#FAFAFA] rounded overflow-hidden shrink-0 border border-[#EAEAEA]">
                        {bottom.image ? (
                          <Image
                            src={bottom.image}
                            alt={bottom.name}
                            fill
                            className="object-contain"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#FF4D00] font-bold">
                          #{index + 1} &bull; {bottom.badge}
                        </span>
                        <h4 className="text-xs font-mono font-bold text-black truncate">{bottom.name}</h4>
                        <span className="text-[11px] font-mono text-[#777777]">
                          {bottom.price} &bull; {bottom.color}
                        </span>
                      </div>
                    </div>

                    {heroBottoms.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHeroBottom(bottom.id);
                          if (selectedBottomIndex >= heroBottoms.length - 1) {
                            setSelectedBottomIndex(Math.max(0, heroBottoms.length - 2));
                          }
                        }}
                        className="p-1.5 rounded text-[#999999] hover:text-[#8A1616] hover:bg-[#8A1616]/10 transition-colors"
                        title="Delete bottom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Bottom Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Edit Silhouette Details
            </h2>

            {currentBottom && (
              <div className="p-6 rounded-lg bg-white border border-[#EAEAEA] shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">{currentBottom.name}</h3>
                  <span className="text-[10px] font-mono text-black bg-[#F0F0F0] px-2 py-0.5 rounded font-bold">
                    SLOT #{selectedBottomIndex + 1}
                  </span>
                </div>

                {/* Upload Image Section */}
                <ImageInputWithUpload
                  label="Pant Image (Upload from Laptop or Enter URL)"
                  value={currentBottom.image}
                  onChange={(val) => updateHeroBottom(currentBottom.id, { image: val })}
                  category="products"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Product Title</label>
                    <input
                      type="text"
                      value={currentBottom.name}
                      onChange={(e) => updateHeroBottom(currentBottom.id, { name: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">
                      Kanji / Subtitle Specification
                    </label>
                    <input
                      type="text"
                      value={currentBottom.kanji}
                      onChange={(e) => updateHeroBottom(currentBottom.id, { kanji: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Price Tag</label>
                    <input
                      type="text"
                      value={currentBottom.price}
                      onChange={(e) => updateHeroBottom(currentBottom.id, { price: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-[#FF4D00] font-mono font-bold outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Color Name</label>
                    <input
                      type="text"
                      value={currentBottom.color}
                      onChange={(e) => updateHeroBottom(currentBottom.id, { color: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={currentBottom.badge}
                      onChange={(e) => updateHeroBottom(currentBottom.id, { badge: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black font-mono outline-none focus:border-black uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 3D CATEGORY CARDS DECK */}
      {activeMainTab === 'zenin-cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cards List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                3D Card Deck Rotation
              </h2>
              <button
                type="button"
                onClick={handleAddNewCard}
                className="px-3 py-1.5 rounded bg-white hover:bg-black hover:text-white text-black text-[11px] font-mono flex items-center space-x-1.5 border border-[#D5D5D5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Card</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {stackCards.map((card, index) => {
                const isSelected = selectedCardIndex === index;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardIndex(index)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white border-black shadow-md'
                        : 'bg-white border-[#EAEAEA] hover:border-[#CCCCCC]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative w-12 h-14 bg-[#FAFAFA] rounded overflow-hidden shrink-0 border border-[#EAEAEA]">
                        {card.image ? (
                          <Image
                            src={card.image}
                            alt={card.title}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#FF4D00] font-bold uppercase">
                          {card.category}
                        </span>
                        <h4 className="text-xs font-mono font-bold text-black truncate">{card.title}</h4>
                        <span className="text-[10px] font-mono text-[#777777] truncate block">
                          {card.link}
                        </span>
                      </div>
                    </div>

                    {stackCards.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStackCard(card.id);
                          if (selectedCardIndex >= stackCards.length - 1) {
                            setSelectedCardIndex(Math.max(0, stackCards.length - 2));
                          }
                        }}
                        className="p-1.5 rounded text-[#999999] hover:text-[#8A1616] hover:bg-[#8A1616]/10 transition-colors"
                        title="Delete card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Card Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Edit Card Content &amp; Media
            </h2>

            {currentCard && (
              <div className="p-6 rounded-lg bg-white border border-[#EAEAEA] shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">{currentCard.title}</h3>
                  <span className="text-[10px] font-mono text-black bg-[#F0F0F0] px-2 py-0.5 rounded font-bold uppercase">
                    {currentCard.category}
                  </span>
                </div>

                {/* Upload Image Section */}
                <ImageInputWithUpload
                  label="Card Background Image (Upload from Laptop or Enter URL)"
                  value={currentCard.image}
                  onChange={(val) => updateStackCard(currentCard.id, { image: val })}
                  category="categories"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Category Label</label>
                    <input
                      type="text"
                      value={currentCard.category}
                      onChange={(e) => updateStackCard(currentCard.id, { category: e.target.value.toUpperCase() })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Card Title</label>
                    <input
                      type="text"
                      value={currentCard.title}
                      onChange={(e) => updateStackCard(currentCard.id, { title: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#666666] mb-1">Subtitle / Specification</label>
                  <input
                    type="text"
                    value={currentCard.subtitle}
                    onChange={(e) => updateStackCard(currentCard.id, { subtitle: e.target.value })}
                    className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#666666] mb-1">Destination URL / Link</label>
                  <input
                    type="text"
                    value={currentCard.link}
                    onChange={(e) => updateStackCard(currentCard.id, { link: e.target.value })}
                    className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EDITORIAL 176K BANNER */}
      {activeMainTab === 'zenin-editorial' && (
        <div className="p-6 rounded-lg bg-white border border-[#EAEAEA] shadow-sm space-y-6 max-w-3xl">
          <div className="pb-3 border-b border-[#EAEAEA]">
            <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">Editorial Full-Bleed Banner Customizer</h3>
            <p className="text-xs font-mono text-[#666666] mt-0.5">
              Updates the cinematic photo section right above the footer.
            </p>
          </div>

          <ImageInputWithUpload
            label="Banner Cinematic Photo (Upload from Laptop or Enter URL)"
            value={editorialBanner?.image || ''}
            onChange={(val) => updateEditorialBanner({ image: val })}
            category="editorial"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">Followers Badge Text</label>
              <input
                type="text"
                value={editorialBanner?.followersText || '176K FOLLOWERS'}
                onChange={(e) => updateEditorialBanner({ followersText: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">Button CTA Text</label>
              <input
                type="text"
                value={editorialBanner?.ctaText || 'INSTAGRAM'}
                onChange={(e) => updateEditorialBanner({ ctaText: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#666666] mb-1">Instagram Profile URL</label>
            <input
              type="text"
              value={editorialBanner?.instagramUrl || 'https://instagram.com/goatednation'}
              onChange={(e) => updateEditorialBanner({ instagramUrl: e.target.value })}
              className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
            />
          </div>
        </div>
      )}

      {/* TAB 4: TOP ANNOUNCEMENT BAR */}
      {activeMainTab === 'zenin-announcement' && (
        <div className="p-6 rounded-lg bg-white border border-[#EAEAEA] shadow-sm space-y-6 max-w-3xl">
          <div className="pb-3 border-b border-[#EAEAEA]">
            <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">Top Charcoal Countdown Bar</h3>
            <p className="text-xs font-mono text-[#666666] mt-0.5">
              Manages the sticky announcement strip with live countdown clock and orange action button.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#666666] mb-1">Highlight Headline (e.g. DIWALI 10% OFF)</label>
            <input
              type="text"
              value={announcement?.highlightText || ''}
              onChange={(e) => updateAnnouncement({ highlightText: e.target.value.toUpperCase() })}
              placeholder="DIWALI 10% OFF"
              className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono uppercase font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">Announcement Copy</label>
              <input
                type="text"
                value={announcement?.text || 'APPLIED AT CHECKOUT'}
                onChange={(e) => updateAnnouncement({ text: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">Countdown Duration (Days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={announcement?.countdownDays || 2}
                onChange={(e) => updateAnnouncement({ countdownDays: Number(e.target.value) })}
                className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">Button CTA Text</label>
              <input
                type="text"
                value={announcement?.ctaText || 'SHOP NOW'}
                onChange={(e) => updateAnnouncement({ ctaText: e.target.value.toUpperCase() })}
                className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-[#FF4D00] font-mono font-bold outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#666666] mb-1">Button Destination URL</label>
              <input
                type="text"
                value={announcement?.ctaLink || '/collections'}
                onChange={(e) => updateAnnouncement({ ctaLink: e.target.value })}
                className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECTIONS LAYOUT */}
      {activeMainTab === 'sections-layout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Homepage Sections &bull; Layout Order
            </h2>

            <div className="space-y-2">
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <div
                    key={section.id}
                    onClick={() => setActiveLayoutSection(section.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      activeLayoutSection === section.id
                        ? 'bg-white border-black shadow-md'
                        : 'bg-white border-[#EAEAEA] hover:border-[#CCCCCC]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded bg-[#F0F0F0] text-black text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                        {section.order}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-mono font-bold text-black truncate">{section.title}</h4>
                        <span className="text-[10px] font-mono uppercase text-[#777777]">
                          Type: {section.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, 'up');
                        }}
                        className="p-1 rounded bg-[#F0F0F0] hover:bg-black hover:text-white text-[#666666] disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sections.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(index, 'down');
                        }}
                        className="p-1 rounded bg-[#F0F0F0] hover:bg-black hover:text-white text-[#666666] disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(section.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          section.enabled
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-[#8A1616]/10 text-[#8A1616]'
                        }`}
                      >
                        {section.enabled ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              Section Content Editor
            </h2>

            <div className="p-6 rounded-lg bg-white border border-[#EAEAEA] shadow-sm space-y-5">
              {activeLayoutSection === 'sec-hero' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                    <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">Hero Slide Content</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">
                      Promotional Tagline / Badge
                    </label>
                    <input
                      type="text"
                      value={currentHero.badge || ''}
                      onChange={(e) => updateHeroSlide(currentHero.id, { badge: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-[#666666] mb-1">Main Heading</label>
                      <input
                        type="text"
                        value={currentHero.title || ''}
                        onChange={(e) => updateHeroSlide(currentHero.id, { title: e.target.value })}
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[#666666] mb-1">
                        Accent Word
                      </label>
                      <input
                        type="text"
                        value={currentHero.titleAccent || ''}
                        onChange={(e) =>
                          updateHeroSlide(currentHero.id, { titleAccent: e.target.value })
                        }
                        className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                      />
                    </div>
                  </div>

                  <ImageInputWithUpload
                    label="Slide Desktop Background Image"
                    value={currentHero.desktopImage || ''}
                    onChange={(val) => updateHeroSlide(currentHero.id, { desktopImage: val })}
                    category="banners"
                  />
                </div>
              )}

              {activeLayoutSection === 'sec-banner' && (
                <div className="space-y-4">
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">Promotional Feature Banner</h3>
                  <ImageInputWithUpload
                    label="Banner Image"
                    value={currentBanner.desktopImage || ''}
                    onChange={(val) => updateBanner(currentBanner.id, { desktopImage: val })}
                    category="banners"
                  />
                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Banner Title</label>
                    <input
                      type="text"
                      value={currentBanner.title || ''}
                      onChange={(e) => updateBanner(currentBanner.id, { title: e.target.value })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black outline-none focus:border-black font-mono"
                    />
                  </div>
                </div>
              )}

              {activeLayoutSection === 'sec-story' && (
                <div className="space-y-4">
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">Brand Story Manifesto</h3>
                  <ImageInputWithUpload
                    label="Editorial Story Image"
                    value={brandStory.image}
                    onChange={(val) => updateBrandStory({ image: val })}
                    category="editorial"
                  />
                </div>
              )}

              {activeLayoutSection === 'sec-newsletter' && (
                <div className="space-y-4">
                  <h3 className="font-mono font-bold text-xs sm:text-sm text-black uppercase">Newsletter Subscription</h3>
                  <div>
                    <label className="block text-xs font-mono text-[#666666] mb-1">Coupon Code</label>
                    <input
                      type="text"
                      value={newsletter.couponCode}
                      onChange={(e) => updateNewsletter({ couponCode: e.target.value.toUpperCase() })}
                      className="w-full bg-[#FAFAFA] border border-[#D5D5D5] rounded px-3 py-2 text-xs text-black font-mono font-bold uppercase outline-none focus:border-black"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
