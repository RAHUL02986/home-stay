import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProfileMenu from './ProfileMenu';
import MobileNavigation from './MobileNavigation';

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:h-20 sm:gap-4">
          <Link href="/" className="flex items-center" aria-label="Find Your Homestay home">
            <div className="relative h-16 w-[150px] overflow-hidden rounded-lg bg-transparent sm:h-20 sm:w-[210px]">
              <Image
                src="/FInd%20Your%20Home%20Stay.png"
                alt="Find Your Homestay logo"
                fill
                sizes="(max-width: 639px) 150px, 210px"
                priority
                className="object-contain"
              />
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/properties" className="text-sm font-semibold text-slate-700 transition hover:text-[#0b2f4d]">
              Search Stays
            </Link>
            <Link href="/destinations" className="text-sm font-semibold text-slate-700 transition hover:text-[#0b2f4d]">
              Destinations
            </Link>
            <Link href="/host/new-property" className="text-sm font-semibold text-slate-700 transition hover:text-[#0b2f4d]">
              List Your Property
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {session?.user ? (
              <ProfileMenu
                name={session.user.name || 'My account'}
                email={session.user.email || ''}
                role={session.user.role}
              />
            ) : (
              <>
                <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-[#0b2f4d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e3d61]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
          {session?.user && (
            <div className="md:hidden">
              <ProfileMenu
                name={session.user.name || 'My account'}
                email={session.user.email || ''}
                role={session.user.role}
              />
            </div>
          )}
          <MobileNavigation role={session?.user?.role} />
        </div>
      </div>
    </nav>
  );
}
