'use client';

import Script from 'next/script';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OpaqueData {
  dataDescriptor: string;
  dataValue: string;
}

interface AcceptResponse {
  messages?: {
    resultCode?: string;
    message?: Array<{ code?: string; text?: string }>;
  };
  opaqueData?: OpaqueData;
}

interface AcceptClient {
  dispatchData: (
    secureData: {
      authData: { clientKey: string; apiLoginID: string };
      cardData: { cardNumber: string; month: string; year: string; cardCode: string };
    },
    callback: (response: AcceptResponse) => void
  ) => void;
}

declare global {
  interface Window {
    Accept?: AcceptClient;
  }
}

interface AuthorizeNetCheckoutProps {
  bookingId: string;
  apiLoginId: string;
  clientKey: string;
  amount: number;
  currency: string;
}

interface ChargeResponse {
  success?: boolean;
  error?: string;
  gateway?: {
    responseCode?: string;
    reasonCode?: string;
    reason?: string;
  };
}

export default function AuthorizeNetCheckout({
  bookingId,
  apiLoginId,
  clientKey,
  amount,
  currency,
}: AuthorizeNetCheckoutProps) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenizeAndPay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const accept = window.Accept;
    if (!accept) {
      setError('Secure payment service is not ready. Please reload and try again.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const cardNumber = String(formData.get('cardNumber') || '').replace(/\s/g, '');
    const expiration = String(formData.get('expiration') || '');
    const [month, twoDigitYear] = expiration.split('/');
    const year = twoDigitYear ? `20${twoDigitYear}` : '';
    const cardCode = String(formData.get('cardCode') || '');
    setSubmitting(true);

    accept.dispatchData(
      { authData: { clientKey, apiLoginID: apiLoginId }, cardData: { cardNumber, month, year, cardCode } },
      async (tokenResponse) => {
        const opaqueData = tokenResponse.opaqueData;
        if (tokenResponse.messages?.resultCode !== 'Ok' || !opaqueData) {
          setError(tokenResponse.messages?.message?.[0]?.text || 'Card could not be validated. Check the details and try again.');
          setSubmitting(false);
          return;
        }

        try {
          const response = await fetch('/api/payments/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, opaqueData }),
          });
          const result: ChargeResponse = await response.json();
          if (!response.ok || !result.success) {
            const gatewayReason = [
              result.gateway?.responseCode && `response ${result.gateway.responseCode}`,
              result.gateway?.reasonCode && `reason ${result.gateway.reasonCode}`,
              result.gateway?.reason,
            ].filter(Boolean).join(': ');
            throw new Error(
              gatewayReason
                ? `${result.error || 'Payment was not approved'} ${gatewayReason}`
                : result.error || 'Payment was not completed'
            );
          }
          router.replace('/guest/dashboard?payment=success');
          router.refresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Payment was not completed');
          setSubmitting(false);
        }
      }
    );
  };

  return (
    <>
      <Script
        src="https://jstest.authorize.net/v1/Accept.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError('Unable to load Authorize.Net Sandbox. Check your connection and reload.')}
      />
      <form onSubmit={tokenizeAndPay} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Your card details are tokenized directly by Authorize.Net and are not sent to our server.
        </p>
        <div>
          <label htmlFor="card-number" className="mb-1.5 block text-sm font-medium text-slate-700">Card number</label>
          <input
            id="card-number"
            name="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            pattern="[0-9 ]{12,23}"
            maxLength={23}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="card-expiration" className="mb-1.5 block text-sm font-medium text-slate-700">Expiration (MM/YY)</label>
            <input
              id="card-expiration"
              name="expiration"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
              required
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
                event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label htmlFor="card-code" className="mb-1.5 block text-sm font-medium text-slate-700">Security code</label>
            <input
              id="card-code"
              name="cardCode"
              inputMode="numeric"
              autoComplete="cc-csc"
              pattern="[0-9]{3,4}"
              maxLength={4}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={!scriptReady || submitting}
          className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Processing securely…' : `Pay ${currency} ${amount.toFixed(2)}`}
        </button>
        <p className="text-xs text-slate-500">Authorize.Net Sandbox test mode. No live charge will be made.</p>
      </form>
    </>
  );
}
