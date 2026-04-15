import type { Metadata, Viewport } from 'next';
import { SWRProvider } from '../components/providers/SWRProvider';
import './global.css';

export const metadata: Metadata = {
  title: 'Lavrador Team',
  description: 'Performance platform',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#005050',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Manrope — headlines / editorial authority */}
        {/* Inter — body / UI legibility */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols — icon system */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased font-body">
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
