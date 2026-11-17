'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface GuestReviewFormProps {
  bookingId: string;
  propertyName: string;
  existingReview?: {
    status: string;
    rating: number;
    comment: string;
    hostResponse?: string;
  };
}

export default function GuestReviewForm({
  bookingId,
  propertyName,
  existingReview,
}: GuestReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (existingReview?.status === 'approved' || existingReview?.status === 'pending') {
    return (
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p>
          {existingReview.status === 'approved'
            ? 'Your review is published.'
            : 'Your review is published and awaiting moderation.'}
        </p>
        {existingReview.status === 'approved' && existingReview.hostResponse && (
          <div className="mt-3 border-l-2 border-emerald-500 pl-3">
            <p className="font-semibold text-slate-800">Host reply</p>
            <p className="mt-1 whitespace-pre-wrap">{existingReview.hostResponse}</p>
          </div>
        )}
      </div>
    );
  }

  const submitReview = async () => {
    setError(null);
    if (rating < 1 || rating > 5) {
      setError('Select a rating from 1 to 5 stars.');
      return;
    }
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters about your stay.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to submit review');
      }
      setSubmitted(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit review');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        Thanks for reviewing {propertyName}. Your review is now published and may be reviewed by our team.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="font-semibold text-slate-900">
        {existingReview?.status === 'rejected' ? 'Update your review' : 'Review your stay'}
      </h4>
      <p className="mt-1 text-xs text-slate-600">Your feedback is published immediately and may be reviewed by our team.</p>
      {existingReview?.status === 'rejected' && (
        <p className="mt-2 text-sm text-amber-800">Your previous review wasn’t approved. You can revise and submit it again.</p>
      )}
      <div className="mt-3 flex items-center gap-1" role="group" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
            aria-pressed={rating === value}
            className="rounded p-1 text-amber-500 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Star size={22} className={value <= rating ? 'fill-current' : ''} />
          </button>
        ))}
        <span className="ml-2 text-sm text-slate-600">{rating ? `${rating}/5` : 'Choose stars'}</span>
      </div>
      <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor={`review-${bookingId}`}>
        Your feedback
      </label>
      <textarea
        id={`review-${bookingId}`}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1500}
        rows={3}
        placeholder="What did you enjoy? What could be better?"
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">{comment.length}/1500</span>
        <button
          type="button"
          onClick={submitReview}
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
