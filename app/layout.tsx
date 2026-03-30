import type { Metadata } from 'next';

import { getTranslations } from '@/lib/i18n';

import './globals.css';

const defaultTranslations = getTranslations('es');

export const metadata: Metadata = {
  metadataBase: new URL('https://extractor-app.vercel.app'),
  title: 'Extractor.app',
  description: defaultTranslations.metadataDescription,
  applicationName: 'Extractor.app',
  robots: {
    index: false,
    follow: false
  },
  icons: {
    icon: '/icon.svg'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
