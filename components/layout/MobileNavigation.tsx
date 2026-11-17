'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { UserRole } from '@/models/User';

interface MobileNavigationProps {
  role?: UserRole;
}

export default function MobileNavigation({ role }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dashboardHref =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'host'
        ? '/host/dashboard'
        : '/guest/dashboard';

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);
  const linkClass =
    'block rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-[#0b2f4d]';

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0b2f4d] shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2f4d]"
      >
        {isOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div
          id="mobile-navigation-menu"
          className="absolute inset-x-0 top-full border-t border-slate-200 bg-white px-4 pb-5 pt-3 shadow-xl sm:px-6"
        >
          <nav aria-label="Mobile navigation" className="mx-auto max-w-7xl">
            <ul className="space-y-1">
              <li><Link href="/properties" onClick={closeMenu} className={linkClass}>Search Stays</Link></li>
              <li><Link href="/destinations" onClick={closeMenu} className={linkClass}>Destinations</Link></li>
              <li><Link href="/host/new-property" onClick={closeMenu} className={linkClass}>List Your Property</Link></li>
              {role ? (
                <>
                  <li><Link href={dashboardHref} onClick={closeMenu} className={linkClass}>My Dashboard</Link></li>
                  <li><Link href="/account/profile" onClick={closeMenu} className={linkClass}>Edit Profile</Link></li>
                </>
              ) : (
                <li className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={closeMenu}
                    className="rounded-lg bg-[#0b2f4d] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0e3d61]"
                  >
                    Sign up
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
