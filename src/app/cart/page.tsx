'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { ZeninAnnouncementBar } from '../../components/zenin/ZeninAnnouncementBar';
import { ZeninHeader } from '../../components/zenin/ZeninHeader';
import { ZeninFooter } from '../../components/zenin/ZeninFooter';
import { CheckoutModal } from '../../components/layout/CheckoutModal';

export default function CartPage() {
  const {
    items,
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

  const freeShippingThreshold = 999;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountRemaining = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] text-black antialiased selection:bg-[#FF4D00] selection:text-white">
      <ZeninAnnouncementBar />
      <ZeninHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 mb-8 border-b border-[#EAEAEA]">
          <div>
            <div className="text-[11px] font-mono text-[#888888] uppercase tracking-[0.2em]">
              SHOPPING BAG
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-black uppercase tracking-tight mt-1">
              YOUR CART ({itemCount})
            </h1>
          </div>
          <Link
            href="/collections"
            className="mt-4 sm:mt-0 text-xs font-mono text-[#555555] hover:text-black flex items-center transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAFAFA] border border-[#EAEAEA] flex items-center justify-center text-[#999999] mx-auto mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-mono font-bold text-black mb-1 uppercase">YOUR BAG IS CURRENTLY EMPTY</h3>
            <p className="text-xs text-[#777777] mb-6 font-mono">
              Looks like you haven&apos;t added any anime drops to your cart yet.
            </p>
            <Link
              href="/collections"
              className="px-8 py-3 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-widest transition-colors inline-block"
            >
              EXPLORE NEW ARRIVALS &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Items Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Free shipping bar */}
              <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA]">
                <div className="flex justify-between items-center text-xs mb-2 font-mono">
                  <span className="text-[#666666]">
                    {amountRemaining === 0 ? (
                      <strong className="text-[#16A34A] font-bold">
                        FREE SHIPROCKET EXPRESS SHIPPING UNLOCKED!
                      </strong>
                    ) : (
                      <>
                        Add <strong className="text-black">₹{amountRemaining}</strong> more for{' '}
                        <strong>Free Express Delivery</strong>
                      </>
                    )}
                  </span>
                  <span className="text-[#888888]">{progressPercent}%</span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-black h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="p-4 rounded-lg bg-white border border-[#EAEAEA] flex space-x-4 items-center"
                  >
                    <div className="relative w-20 h-24 bg-[#F4F4F4] rounded overflow-hidden shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-[#FF4D00] font-bold">
                            {item.anime}
                          </span>
                          <h4 className="text-xs sm:text-sm font-mono font-bold text-black uppercase truncate mt-0.5">
                            {item.title}
                          </h4>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#999999] hover:text-[#8A1616] p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-[11px] font-mono text-[#777777]">
                        <span className="px-2 py-0.5 rounded bg-[#F0F0F0] text-black">Size: {item.size}</span>
                        <span className="px-2 py-0.5 rounded bg-[#F0F0F0] text-black">{item.color}</span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#F0F0F0]">
                        <div className="flex items-center space-x-2 bg-white border border-[#D5D5D5] rounded px-2 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="text-[#777777] hover:text-black"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs text-black px-2 font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="text-[#777777] hover:text-black"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-sm text-black">
                          Rs. {(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-lg bg-[#FAFAFA] border border-[#EAEAEA] space-y-4">
                <h3 className="text-xs font-mono font-bold text-black uppercase tracking-wider pb-3 border-b border-[#EAEAEA]">
                  ORDER SUMMARY
                </h3>

                {/* Coupon Box */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded border border-[#16A34A] text-xs font-mono">
                      <span className="flex items-center text-[#16A34A]">
                        <Tag className="w-4 h-4 mr-1.5" />
                        {appliedCoupon.code} applied ({appliedCoupon.discountPercentage}% OFF)
                      </span>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-[#8A1616] hover:underline ml-2"
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
                        className="flex-1 bg-white border border-[#D5D5D5] rounded px-3.5 py-2 text-xs text-black uppercase placeholder-[#999999] outline-none focus:border-black font-mono"
                      />
                      <button
                        onClick={() => {
                          if (couponInput) {
                            applyCoupon(couponInput);
                            setCouponInput('');
                          }
                        }}
                        className="px-4 py-2 bg-black hover:bg-[#222222] text-white text-xs font-mono uppercase font-bold rounded transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {couponError && <p className="text-[11px] text-[#8A1616] mt-1 font-mono">{couponError}</p>}
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-xs font-mono pt-3 border-t border-[#EAEAEA]">
                  <div className="flex justify-between text-[#666666]">
                    <span>Bag Subtotal</span>
                    <span className="text-black font-bold">Rs. {subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#16A34A]">
                      <span>Discount</span>
                      <span>-Rs. {discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#666666]">
                    <span>Shiprocket Express Delivery</span>
                    <span className="text-black font-semibold">{shipping === 0 ? 'FREE' : `Rs. ${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-black pt-3 border-t border-[#EAEAEA]">
                    <span>Total Amount</span>
                    <span className="text-[#FF4D00]">Rs. {total.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[10px] text-[#888888] pt-1">Inclusive of GST and shipping</p>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-4 rounded bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
                >
                  <span>PROCEED TO CHECKOUT &bull; RS. {total.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-[#EAEAEA] grid grid-cols-2 gap-3 text-[11px] font-mono text-[#666666]">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                    <span>Razorpay Secure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-[#FF4D00]" />
                    <span>Shiprocket Express</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ZeninFooter />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </div>
  );
}
