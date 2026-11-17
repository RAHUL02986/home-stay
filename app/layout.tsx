import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import FloatingSupportWidget from "@/components/layout/FloatingSupportWidget";
import { siteUrl } from "@/lib/seo";
import "./globals.css";
import Providers from "./providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: 'Homestays in Dharamshala, Himachal Pradesh',
    template: '%s | Find Your Homestay',
  },
  description:
    'Find homestays, hotels, and guest houses in Dharamshala, McLeodganj, Dharamkot, Naddi, and Bhagsu. Compare local stays and room details.',
  applicationName: 'Find Your Homestay',
  keywords: [
    'homestays in Dharamshala',
    'hotels in Dharamshala',
    'McLeodganj stays',
    'Dharamkot homestays',
    'Naddi stays',
    'Bhagsu guest houses',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Find Your Homestay',
    title: 'Homestays in Dharamshala, Himachal Pradesh',
    description:
      'Discover homestays, hotels, and guest houses across Dharamshala and its mountain neighbourhoods.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Find Your Homestay in Dharamshala',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Homestays in Dharamshala | Find Your Homestay',
    description:
      'Explore local homestays, hotels, and guest houses in Dharamshala, Himachal Pradesh.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${poppins.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-slate-50 text-slate-900"
        suppressHydrationWarning
      >
        <Providers session={session}>
          <Navbar />
          {children}
          <FloatingSupportWidget />
        </Providers>
      </body>
    </html>
  );
}
