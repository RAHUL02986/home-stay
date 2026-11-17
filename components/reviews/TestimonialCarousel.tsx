'use client';

import { ChevronLeft, ChevronRight, Pause, Play, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Testimonial {
  id: string;
  guestName: string;
  propertyName: string;
  area: string;
  rating: number;
  comment: string;
}

export default function TestimonialCarousel({ reviews }: { reviews: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (reviews.length < 2 || !isPlaying) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % reviews.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPlaying, reviews.length]);

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-10 text-center text-slate-200">
        Guest reviews will appear here after guests share their feedback.
      </div>
    );
  }

  const currentIndex = activeIndex % reviews.length;
  const review = reviews[currentIndex];
  const move = (offset: number) => {
    setActiveIndex((index) => (index + offset + reviews.length) % reviews.length);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <article
        aria-live="polite"
        className="min-h-56 rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur sm:p-8"
      >
        <div className="flex items-center gap-1 text-amber-300" aria-label={`${review.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={17} className={star <= review.rating ? 'fill-current' : 'opacity-40'} />
          ))}
        </div>
        <blockquote className="mt-5 text-lg leading-8 text-white">
          “{review.comment}”
        </blockquote>
        <div className="mt-6 border-t border-white/15 pt-4">
          <p className="font-semibold text-white">{review.guestName}</p>
          <p className="mt-1 text-sm text-slate-200">{review.propertyName} · {review.area}</p>
        </div>
      </article>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-200" aria-live="polite">
          {currentIndex + 1} of {reviews.length}
        </span>
        <div className="flex gap-2">
          {reviews.length > 1 && (
            <button
              type="button"
              onClick={() => setIsPlaying((playing) => !playing)}
              aria-label={isPlaying ? 'Pause guest review slider' : 'Play guest review slider'}
              className="rounded-full border border-white/25 p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          )}
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous guest review"
            className="rounded-full border border-white/25 p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next guest review"
            className="rounded-full border border-white/25 p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
