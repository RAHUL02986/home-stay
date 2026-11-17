'use client';

import { useState } from 'react';

export interface HostReviewItem {
  id: string;
  propertyName: string;
  guestName: string;
  rating: number;
  comment: string;
  hostResponse: string;
  createdAt: string;
}

function HostReviewReply({ review }: { review: HostReviewItem }) {
  const [response, setResponse] = useState(review.hostResponse);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const saveResponse = async () => {
    setError(null);
    if (!response.trim()) {
      setError('Write a response before saving.');
      return;
    }

    setBusy(true);
    try {
      const result = await fetch(`/api/host/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Unable to save response');
        }
        return data;
      });
      setResponse(result.data.response);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save response');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{review.propertyName}</h3>
        <time className="text-xs text-slate-500">{review.createdAt}</time>
      </div>
      <p className="mt-1 text-sm font-medium text-amber-700">
        {review.rating}/5 stars · {review.guestName}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{review.comment}</p>
      <label htmlFor={`host-response-${review.id}`} className="mt-4 block text-sm font-medium text-slate-700">
        Your public reply
      </label>
      <textarea
        id={`host-response-${review.id}`}
        value={response}
        onChange={(event) => {
          setResponse(event.target.value);
          setSaved(false);
        }}
        maxLength={1500}
        rows={3}
        placeholder="Thank the guest or respond to their feedback."
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{response.length}/1500</span>
        <button
          type="button"
          onClick={saveResponse}
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save reply'}
        </button>
      </div>
      {saved && <p role="status" className="mt-2 text-sm text-emerald-700">Reply saved and visible to guests.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}

export default function HostReviewReplies({ reviews }: { reviews: HostReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-slate-500">Approved guest reviews will appear here.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200">
      {reviews.map((review) => <HostReviewReply key={review.id} review={review} />)}
    </ul>
  );
}
