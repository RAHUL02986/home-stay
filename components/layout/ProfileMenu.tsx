'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { signOut } from 'next-auth/react';
import type { UserRole } from '@/models/User';

interface ProfileMenuProps {
  name: string;
  email: string;
  role: UserRole;
}

export default function ProfileMenu({ name, email, role }: ProfileMenuProps) {
  const dashboardHref =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'host'
        ? '/host/dashboard'
        : '/guest/dashboard';

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2f4d] text-white">
          <UserRound size={19} aria-hidden="true" />
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{name}</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
        <div className="border-b border-slate-100 px-4 pb-3 pt-1">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
        </div>
        <Link
          href={dashboardHref}
          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          {role === 'admin' ? 'Admin dashboard' : role === 'host' ? 'Host dashboard' : 'Guest dashboard'}
        </Link>
        <Link
          href={dashboardHref}
          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          {role === 'admin' ? 'Review property listings' : role === 'host' ? 'My listings' : 'Booking history'}
        </Link>
        <Link
          href="/account/profile"
          className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Edit profile
        </Link>
        <div className="mt-1 border-t border-slate-100 pt-1">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </details>
  );
}
