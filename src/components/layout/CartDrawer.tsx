'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useCmsStore } from '../../lib/cms/cmsStore';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer: React.FC = () => {
  const settings = useCmsStore((state) => state.settings);
  const {
    items,
    isOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    getSubtotal,
    getDiscount,
    getShipping,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const discount = getDiscount();
  const total = getTotal();
  const itemCount = getItemCount();

  const freeShippingThreshold = settings?.freeShippingThreshold || 999;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountRemaining = Math.max(0, freeShippingThreshold - subtotal);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        />

        {/* Drawer Panel */}
        <div className="relative z-10 w-full max-w-md bg-[#101010] border-l border-[#222222] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] bg-[#0A0A0A]">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#E8FF00]" />
              <h3 className="font-bold text-base text-white tracking-wide">
                YOUR STREETWEAR BAG ({itemCount})
              </h3>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#1C1C1C] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-6 py-3 bg-[#141414] border-b border-[#222222]">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-[#A0A0A0]">
                {amountRemaining === 0 ? (
                  <span className="text-[#22C55E] font-medium">
                    ⚡ You&apos;ve unlocked FREE EXPRESS SHIPPING!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-[#E8FF00] font-mono">₹{amountRemaining}</strong> more for{' '}
                    <strong className="text-white">FREE Express Shipping</strong>
                  </span>
                )}
              </span>
              <span className="text-[10px] font-mono text-[#777777]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E8FF00] to-[#00E5FF] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#444444] mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">YOUR BAG IS EMPTY</h4>
                <p className="text-xs text-[#777777] max-w-xs mb-6">
                  You haven&apos;t added any anime drops to your rotation yet.
                </p>
                <Link
                  href="/collections"
                  onClick={closeDrawer}
                  className="px-6 py-2.5 rounded-lg bg-[#E8FF00] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#d4e600] transition-colors"
                >
                  Explore Drops
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex space-x-3.5 p-3 rounded-xl bg-[#161616] border border-[#222222] hover:border-[#333333] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 bg-[#0A0A0A] rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono uppercase text-[#E8FF00]">
                          {item.anime}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#666666] hover:text-[#EF4444] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h5 className="text-xs font-semibold text-white line-clamp-1 mt-0.5">
                        {item.title}
                      </h5>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-[#A0A0A0]">
                          Size: {item.size}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-[#A0A0A0]">
                          {item.color}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#202020]">
                      <div className="flex items-center space-x-2 bg-[#0E0E0E] border border-[#262626] rounded-md px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-0.5 text-[#888888] hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono text-white px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-0.5 text-[#888888] hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-white">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="px-6 py-4 bg-[#0D0D0D] border-t border-[#1E1E1E] space-y-3">
              {/* Coupon code */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#1A1A1A] px-3 py-2 rounded-lg border border-[#26C55E]/40 text-xs">
                    <span className="flex items-center text-[#22C55E] font-mono">
                      <Tag className="w-3.5 h-3.5 mr-1" />
                      {appliedCoupon.code} applied ({appliedCoupon.discountPercentage}% OFF)
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-[#888888] hover:text-white underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-[#161616] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-xs text-white uppercase placeholder-[#666666] outline-none focus:border-[#E8FF00]"
                    />
                    <button
                      onClick={() => {
                        if (couponInput) {
                          applyCoupon(couponInput);
                          setCouponInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#222222] hover:bg-[#333333] text-white text-xs font-mono rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-[#EF4444] mt-1">{couponError}</p>}
              </div>

              {/* Price summary */}
              <div className="space-y-1.5 text-xs border-t border-[#1A1A1A] pt-3">
                <div className="flex justify-between text-[#888888]">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#22C55E]">
                    <span>Coupon Discount</span>
                    <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#888888]">
                  <span>Shipping</span>
                  <span className="font-mono text-white">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#1F1F1F] text-white">
                  <span>Grand Total</span>
                  <span className="font-mono text-[#E8FF00]">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  data-testid="cart-checkout-btn"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3 rounded-lg bg-[#E8FF00] hover:bg-[#d4e600] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer"
                >
                  <span>Instant Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="text-[#A0A0A0] hover:text-white underline"
                  >
                    View Bag Details
                  </Link>
                  <span className="text-[10px] text-[#666666] flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1 text-[#22C55E]" /> Safe & Secure Payment
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Checkout Modal */}
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};
