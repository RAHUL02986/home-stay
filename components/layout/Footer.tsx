import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#0b2f4d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="relative h-20 w-[220px] overflow-hidden rounded-lg bg-transparent">
                <Image
                  src="/FInd%20Your%20Home%20Stay.png"
                  alt="Find Your Homestay logo"
                  fill
                  sizes="220px"
                  className="object-contain"
                />
              </div>
            </div>
            <p className="max-w-xs text-sm leading-6 text-slate-300">
              Your trusted platform for discovering homestays and hotels in Dharamshala, Himachal Pradesh.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-bold text-white">Explore</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="/properties" className="transition hover:text-[#f9b54d]">Search Properties</Link></li>
              <li><Link href="/destinations" className="transition hover:text-[#f9b54d]">Destinations</Link></li>
              <li><Link href="#" className="transition hover:text-[#f9b54d]">Special Offers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-bold text-white">For Hosts</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="/host/new-property" className="transition hover:text-[#f9b54d]">List Your Property</Link></li>
              <li><Link href="/host/dashboard" className="transition hover:text-[#f9b54d]">Host Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-bold text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="/privacy-policy" className="transition hover:text-[#f9b54d]">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="transition hover:text-[#f9b54d]">Terms of Service</Link></li>
              <li><Link href="/cancellation-policy" className="transition hover:text-[#f9b54d]">Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          © 2026 FindYourHomestay. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
