'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { CircleHelp, LoaderCircle, MessageCircle, Phone, RotateCcw, Send, X } from 'lucide-react';

const WHATSAPP_NUMBER = '917807102986';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I need help with Find Your Homestay.')}`;

const QUICK_QUESTIONS = [
  'How do I book a stay?',
  'When do I pay?',
  'How do I list my property?',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export default function FloatingSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages, isSending]);

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: 'user' as const, text: content }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const recentMessages = nextMessages.slice(-8);
      if (recentMessages[0]?.role === 'assistant') recentMessages.shift();
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
      });
      const result = await response.json() as {
        success?: boolean;
        error?: string;
        data?: { answer?: string };
      };
      const answer = result.data?.answer;
      if (!response.ok || !result.success || !answer) {
        throw new Error(result.error || 'The assistant could not respond. Please try WhatsApp.');
      }

      setMessages((current) => [...current, { role: 'assistant', text: answer }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The assistant could not respond. Please try WhatsApp.');
    } finally {
      setIsSending(false);
    }
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {isOpen && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="support-widget-title"
          className="fixed bottom-20 right-4 z-50 flex max-h-[min(36rem,calc(100dvh-7rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6 sm:w-96"
        >
          <div className="flex items-center justify-between bg-[#0b2f4d] px-4 py-3 text-white">
            <div>
              <h2 id="support-widget-title" className="font-semibold">Homestay Assistant</h2>
              <p className="text-xs text-slate-200">AI support · Powered by Gemini</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close help"
              className="rounded-full p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 ? (
              <div>
                <div className="mb-4 max-w-[90%] rounded-2xl rounded-tl-sm bg-slate-100 p-3 text-sm leading-5 text-slate-700">
                  Hi! I can help with bookings, payments, and listing your property. What would you like to know?
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested questions</p>
                <ul className="space-y-2">
                  {QUICK_QUESTIONS.map((question) => (
                    <li key={question}>
                      <button
                        type="button"
                        onClick={() => void sendMessage(question)}
                        disabled={isSending}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-5 ${
                      message.role === 'user'
                        ? 'ml-auto rounded-br-sm bg-emerald-600 text-white'
                        : 'rounded-bl-sm bg-slate-100 text-slate-700'
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {isSending && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <LoaderCircle size={16} className="animate-spin" />
                    Assistant is replying…
                  </div>
                )}
                <div ref={endOfMessagesRef} />
              </div>
            )}
            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{error}</p>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <p className="mb-2 text-[11px] leading-4 text-slate-500">
              Messages are sent to Google Gemini and aren’t saved by our app. Don’t include passwords, OTPs, payment details, or other sensitive information.
            </p>
            <form onSubmit={submitMessage} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1500}
                disabled={isSending}
                aria-label="Ask the homestay assistant"
                placeholder="Type your question…"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50"
              />
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setError(null);
                  }}
                  disabled={isSending}
                  aria-label="Start a new chat"
                  title="Start a new chat"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  <RotateCcw size={17} />
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="rounded-lg bg-emerald-600 p-2.5 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />
              </button>
            </form>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <MessageCircle size={16} />
              Prefer a person? Message us on WhatsApp
            </a>
          </div>
        </section>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 sm:bottom-6 sm:right-6">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          title="Contact us on WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1fb95a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
        >
          <span className="relative flex items-center justify-center">
            <MessageCircle size={27} strokeWidth={2.2} />
            <Phone size={11} strokeWidth={3} className="absolute" />
          </span>
        </a>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? 'Close help' : 'Open help'}
          aria-expanded={isOpen}
          className="flex h-12 items-center gap-2 rounded-full bg-[#0b2f4d] px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#123d63] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
        >
          {isOpen ? <X size={19} /> : <CircleHelp size={19} />}
          <span>{isOpen ? 'Close' : 'Help'}</span>
        </button>
      </div>
    </>
  );
}
