'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

export interface PendingReview {
  id: string;
  guestName: string;
  propertyName: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

export default function AdminReviewQueue({ reviews: initialReviews }: { reviews: PendingReview[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to moderate review');
      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to moderate review');
    } finally {
      setBusyId(null);
    }
  };

  if (reviews.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">There are no guest reviews waiting for approval.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {reviews.map((review) => (
        <article key={review.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{review.propertyName}</h3>
              <p className="mt-1 text-sm text-slate-600">Guest: {review.guestName}</p>
            </div>
            <time className="text-xs text-slate-500">{new Date(review.submittedAt).toLocaleDateString()}</time>
          </div>
          <div className="mt-3 flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} className={star <= review.rating ? 'fill-current' : ''} />)}
            <span className="ml-1 text-sm text-slate-600">{review.rating}/5</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{review.comment}</p>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={busyId === review.id} onClick={() => moderate(review.id, 'approved')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              Approve
            </button>
            <button type="button" disabled={busyId === review.id} onClick={() => moderate(review.id, 'rejected')} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
              Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
