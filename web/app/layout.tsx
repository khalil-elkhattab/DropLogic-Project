import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import ClerkProviderWrapper from './ClerkProviderWrapper'
import CookieConsent from '@/components/CookieConsent'
import { siteConfig } from '@/lib/site'

/** Clerk auth components cannot run during static prerender without env keys. */
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

const ogImage = {
  url: siteConfig.ogImagePath,
  width: 1200,
  height: 630,
  alt: 'DropLogic — AI dropshipping intelligence platform',
  type: 'image/png' as const,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.ogTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'dropshipping',
    'dropship tools',
    'product research',
    'winning products',
    'tiktok ads',
    'meta ads',
    'facebook ads',
    'ecommerce AI',
    'video ad generator',
    'ugc ads',
    'shopify dropshipping',
    'product hunt',
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  applicationName: siteConfig.name,
  category: 'technology',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.ogTitle,
    description: siteConfig.ogDescription,
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    title: siteConfig.ogTitle,
    description: siteConfig.ogDescription,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/icon', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/icon', type: 'image/png', sizes: '32x32' }],
  },
  // Swap ogImagePath to '/og-image.png' once a static asset is added to /public
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} dl-page antialiased`}>
        <ClerkProviderWrapper>
          {children}
          <CookieConsent />
        </ClerkProviderWrapper>
      </body>
    </html>
  )
}
