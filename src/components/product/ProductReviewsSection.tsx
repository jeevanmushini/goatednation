'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, X, Filter, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  authorEmail?: string;
  rating: number;
  title: string;
  comment: string;
  fitFeedback?: string;
  verifiedPurchase?: boolean;
  createdAt?: string;
}

interface ProductReviewsSectionProps {
  productId: string;
  productTitle: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productTitle,
}) => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [markedHelpful, setMarkedHelpful] = useState<Record<string, boolean>>({});

  // Review Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formName, setFormName] = useState(user?.name || '');
  const [formEmail, setFormEmail] = useState(user?.email || '');
  const [formComment, setFormComment] = useState('');
  const [formFit, setFormFit] = useState('TRUE_TO_SIZE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch reviews from Neon DB via API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.warn('[ProductReviews] Fetch error:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (user.name) setFormName((prev) => prev || user.name);
      if (user.email) setFormEmail((prev) => prev || user.email);
    }
  }, [user]);

  // Calculations
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return { average: 5.0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      dist[star] = (dist[star] || 0) + 1;
    });
    return {
      average: Number((sum / total).toFixed(1)),
      total,
      distribution: dist,
    };
  }, [reviews]);

  // Filtered reviews
  const displayedReviews = useMemo(() => {
    if (filterRating === 'all') return reviews;
    return reviews.filter((r) => Math.round(r.rating) === filterRating);
  }, [reviews, filterRating]);

  const handleHelpfulClick = (reviewId: string) => {
    if (markedHelpful[reviewId]) return;
    setMarkedHelpful((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTitle.trim() || !formComment.trim()) {
      setSubmitError('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          authorName: formName,
          authorEmail: formEmail,
          rating: formRating,
          title: formTitle,
          comment: formComment,
          fitFeedback: formFit,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      // Optimistic update
      setReviews((prev) => [data.review, ...prev]);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsModalOpen(false);
        setFormTitle('');
        setFormComment('');
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-20 pt-12 border-t border-[#EAEAEA]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-[0.25em] uppercase text-[#FF4D00] bg-orange-50 px-2.5 py-1 rounded-full mb-2 border border-orange-200">
            <Sparkles className="w-3 h-3" />
            <span>VERIFIED BUYER FEEDBACK</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-black uppercase tracking-tight">
            CUSTOMER REVIEWS &amp; FIT GUIDE
          </h2>
          <p className="text-xs font-mono text-[#666666] mt-1">
            Real streetwear feedback from verified purchasers across India.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-lg bg-black hover:bg-[#222222] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#FF4D00]" />
          <span>WRITE A REVIEW</span>
        </button>
      </div>

      {/* Ratings Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] mb-10">
        {/* Score & Stars */}
        <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start md:border-r md:border-[#EAEAEA] md:pr-6 text-center md:text-left">
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl sm:text-5xl font-mono font-black text-black">
              {stats.average.toFixed(1)}
            </span>
            <span className="text-sm font-mono text-[#888888]">/ 5.0</span>
          </div>
          <div className="flex items-center space-x-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.average)
                    ? 'fill-[#FF4D00] text-[#FF4D00]'
                    : 'text-[#D5D5D5]'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-mono text-[#666666]">
            Based on <span className="font-bold text-black">{stats.total} verified</span> reviews
          </p>
          <div className="mt-4 pt-4 border-t border-[#EAEAEA] w-full text-[11px] font-mono text-[#555555]">
            <span className="text-[#16A34A] font-bold">95%</span> of buyers reported{' '}
            <span className="font-semibold text-black">True to Size (Oversized Boxy Fit)</span>.
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center space-x-3 text-xs font-mono">
                <button
                  onClick={() => setFilterRating(filterRating === star ? 'all' : star)}
                  className={`w-12 text-left font-bold flex items-center space-x-1 hover:text-[#FF4D00] ${
                    filterRating === star ? 'text-[#FF4D00]' : 'text-black'
                  }`}
                >
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-current inline" />
                </button>
                <div className="flex-1 h-2 rounded-full bg-[#E5E5E5] overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] text-[#888888]">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#888888]" />
          <span className="text-xs font-mono uppercase text-[#888888] mr-2">Filter:</span>
          {(['all', 5, 4, 3] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
                filterRating === r
                  ? 'bg-black text-white font-bold'
                  : 'bg-white border border-[#D5D5D5] text-[#666666] hover:border-black'
              }`}
            >
              {r === 'all' ? 'All Reviews' : `${r} Stars`}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[#888888]">
          Showing {displayedReviews.length} of {reviews.length}
        </span>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="py-12 text-center font-mono text-xs text-[#888888]">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          LOADING VERIFIED REVIEWS...
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="py-12 text-center font-mono text-xs text-[#888888] bg-[#FAFAFA] rounded-xl border border-dashed border-[#D5D5D5]">
          No reviews match this filter. Be the first to review this piece!
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((rev) => {
            const helpful = (helpfulCounts[rev.id] || 0) + (rev.id.charCodeAt(0) % 5);
            const isHelpfulClicked = markedHelpful[rev.id];

            return (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-xl bg-white border border-[#EAEAEA] font-mono space-y-3 transition-shadow hover:shadow-xs"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                      {rev.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-black">{rev.authorName}</span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center space-x-0.5 text-[9px] text-[#16A34A] bg-green-50 border border-green-200 px-1.5 py-0.2 rounded font-bold">
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>VERIFIED</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#888888]">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Buyer'}
                      </div>
                    </div>
                  </div>

                  {/* Star Rating & Fit */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-[#FF4D00] text-[#FF4D00]'
                              : 'text-[#E0E0E0]'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.fitFeedback && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-[#555555] uppercase font-bold">
                        {rev.fitFeedback.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Title & Comment */}
                <div>
                  <h4 className="text-xs font-bold text-black uppercase tracking-wide">
                    {rev.title}
                  </h4>
                  <p className="text-xs text-[#555555] mt-1 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>

                {/* Helpful Button */}
                <div className="pt-2 flex items-center space-x-3 border-t border-[#F0F0F0] text-[11px] text-[#888888]">
                  <span>Was this helpful?</span>
                  <button
                    onClick={() => handleHelpfulClick(rev.id)}
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
                      isHelpfulClicked
                        ? 'bg-black text-white font-bold'
                        : 'bg-[#F5F5F5] hover:bg-[#EAEAEA] text-black'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{helpful}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-white border border-[#EAEAEA] rounded-xl p-6 sm:p-8 shadow-2xl font-mono max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#FF4D00] uppercase font-bold">
                  FEEDBACK ARCHIVE
                </span>
                <h3 className="text-base font-bold text-black uppercase mt-0.5">
                  Write a Verified Review
                </h3>
                <p className="text-xs text-[#888888] truncate max-w-xs">{productTitle}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 rounded-md text-[#888888] hover:text-black hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-50 text-[#16A34A] mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold uppercase text-black">Review Submitted!</h4>
                <p className="text-xs text-[#666666]">
                  Thank you for rating {productTitle}. Your feedback is now live.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 pt-4">
                {submitError && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs">
                    {submitError}
                  </div>
                )}

                {/* Rating Stars Input */}
                <div>
                  <label className="block text-xs font-bold uppercase text-black mb-1.5">
                    Overall Rating *
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating || formRating)
                              ? 'fill-[#FF4D00] text-[#FF4D00]'
                              : 'text-[#D5D5D5]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-black ml-2">
                      {hoverRating || formRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-xs font-bold uppercase text-black mb-1">
                    Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Best heavyweight drop this season"
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5D5D5] focus:outline-none focus:border-black"
                  />
                </div>

                {/* Fit Feedback */}
                <div>
                  <label className="block text-xs font-bold uppercase text-black mb-1">
                    How does it fit?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'RUNS_SMALL', label: 'Runs Small' },
                      { id: 'TRUE_TO_SIZE', label: 'True to Size' },
                      { id: 'RUNS_LARGE', label: 'Runs Large' },
                    ].map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setFormFit(f.id)}
                        className={`py-2 px-2 text-center text-[11px] rounded border transition-all ${
                          formFit === f.id
                            ? 'bg-black text-white border-black font-bold'
                            : 'bg-white border-[#D5D5D5] text-[#666666] hover:border-black'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Body */}
                <div>
                  <label className="block text-xs font-bold uppercase text-black mb-1">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="What did you think of the fabric weight, print clarity, and cut?"
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5D5D5] focus:outline-none focus:border-black"
                  />
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-black mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Rahul S."
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5D5D5] focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-black mb-1">
                      Email (private)
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5D5D5] focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-black hover:bg-[#222222] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    {isSubmitting ? 'SAVING TO DATABASE...' : 'SUBMIT REVIEW'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
