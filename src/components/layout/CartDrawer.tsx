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
        {/* Solid Dim Overlay - Zero Blur to match brand aesthetic */}
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/60 transition-opacity"
        />

        {/* Drawer Panel - Pure Crisp White & Obsidian Streetwear Theme */}
        <div className="relative z-10 w-full max-w-md bg-white border-l border-[#EAEAEA] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-white">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-5 h-5 text-[#FF4D00]" />
              <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-black flex items-center gap-1.5">
                YOUR STREETWEAR BAG <span className="text-[#FF4D00]">({itemCount})</span>
              </h3>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-[#666666] hover:text-black hover:bg-[#F5F5F5] transition-colors"
              aria-label="Close Bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-6 py-3.5 bg-[#FAFAFA] border-b border-[#EAEAEA]">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-[#666666]">
                {amountRemaining === 0 ? (
                  <span className="text-[#16A34A] font-semibold font-mono text-[11px]">
                    ⚡ UNLOCKED FREE EXPRESS SHIPPING!
                  </span>
                ) : (
                  <span className="text-[11px] font-mono">
                    Add <strong className="text-[#FF4D00] font-mono">₹{amountRemaining}</strong> more for{' '}
                    <strong className="text-black">FREE Express Shipping</strong>
                  </span>
                )}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#888888]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#EAEAEA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF4D00] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-white">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#FF4D00] mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-mono font-bold text-black uppercase tracking-wider mb-1">
                  YOUR BAG IS CURRENTLY EMPTY
                </h4>
                <p className="text-xs text-[#777777] max-w-xs mb-6 font-mono">
                  Looks like you haven&apos;t added any anime drops to your cart yet.
                </p>
                <Link
                  href="/collections"
                  onClick={closeDrawer}
                  className="px-6 py-2.5 rounded bg-black hover:bg-[#FF4D00] text-white font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
                >
                  EXPLORE NEW ARRIVALS &rarr;
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex space-x-3.5 p-3 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] hover:border-[#D5D5D5] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 bg-white rounded-lg overflow-hidden shrink-0 border border-[#EAEAEA]">
                    <Image
                      src={item.image || '/images/placeholder-product.svg'}
                      alt={item.title}
                      fill
                      sizes="80px"
                      unoptimized={!item.image?.startsWith('/images/')}
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono uppercase text-[#FF4D00] font-bold tracking-wider">
                          {item.anime}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#888888] hover:text-[#DC2626] transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h5 className="text-xs font-mono font-bold text-black line-clamp-1 mt-0.5">
                        {item.title}
                      </h5>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#EAEAEA] text-[#555555]">
                          Size: {item.size}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#EAEAEA] text-[#555555]">
                          {item.color}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EAEAEA]">
                      <div className="flex items-center space-x-2 bg-white border border-[#D5D5D5] rounded px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-0.5 text-[#666666] hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono text-black font-bold px-1">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-0.5 text-[#666666] hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-black">
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
            <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EAEAEA] space-y-3">
              {/* Coupon code */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#16A34A]/40 text-xs">
                    <span className="flex items-center text-[#16A34A] font-mono font-medium">
                      <Tag className="w-3.5 h-3.5 mr-1" />
                      {appliedCoupon.code} applied ({appliedCoupon.discountPercentage}% OFF)
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-[#888888] hover:text-black underline ml-2 font-mono"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="COUPON (E.G. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-white border border-[#D5D5D5] rounded-lg px-3 py-1.5 text-xs text-black uppercase placeholder-[#888888] outline-none focus:border-[#FF4D00] font-mono"
                    />
                    <button
                      onClick={() => {
                        if (couponInput) {
                          applyCoupon(couponInput);
                          setCouponInput('');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-black hover:bg-[#FF4D00] text-white text-xs font-mono font-bold rounded-lg transition-colors uppercase tracking-wider"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[11px] text-[#DC2626] mt-1 font-mono">{couponError}</p>}
              </div>

              {/* Price summary */}
              <div className="space-y-1.5 text-xs border-t border-[#EAEAEA] pt-3 font-mono">
                <div className="flex justify-between text-[#666666]">
                  <span>Subtotal</span>
                  <span className="font-mono text-black font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <span>Coupon Discount</span>
                    <span className="font-mono font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#666666]">
                  <span>Shipping</span>
                  <span className="font-mono text-black font-semibold">
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#EAEAEA] text-black">
                  <span className="uppercase">Grand Total</span>
                  <span className="font-mono text-[#FF4D00] text-base font-bold">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  data-testid="cart-checkout-btn"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3.5 rounded bg-black hover:bg-[#FF4D00] text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  <span>INSTANT CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1 font-mono">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="text-[#666666] hover:text-black underline text-[11px]"
                  >
                    View Bag Details
                  </Link>
                  <span className="text-[10px] text-[#888888] flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1 text-[#16A34A]" /> Safe & Secure Payment
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
