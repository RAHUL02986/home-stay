import Link from 'next/link';
import type { ReactNode } from 'react';
import Footer from '@/components/layout/Footer';

const POLICY_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/cancellation-policy', label: 'Cancellation Policy' },
];

interface LegalSection {
  title: string;
  content: ReactNode;
}

interface LegalPageProps {
  title: string;
  summary: string;
  sections: LegalSection[];
}

export default function LegalPage({ title, summary, sections }: LegalPageProps) {
  return (
    <div className="flex min-h-svh flex-col bg-slate-50 text-slate-900">
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d5d9c]">Find Your Homestay · Legal</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#0b2f4d] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{summary}</p>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8 lg:py-14">
          <nav
            aria-label="Legal policies"
            className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Policies</p>
            <ul className="space-y-1">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={link.label === title ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      link.label === title
                        ? 'bg-[#0b2f4d] text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#0b2f4d]'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <p className="mb-8 text-sm text-slate-500">Last updated: November 13, 2026</p>
            <div className="space-y-8">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-bold text-[#0b2f4d]">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
