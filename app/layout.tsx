// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'KAI-X — Galaxy Mind Map',
  description: 'AI-powered 3D mind map: explore ideas as a living galaxy of concepts.',
  keywords: ['mind map', 'AI', '3D', 'knowledge', 'galaxy'],
  themeColor: '#020408',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌌</text></svg>" />
      </head>
      <body className="bg-void text-slate-100 font-body antialiased">
        {/* Starfield background */}
        <div className="star-field" aria-hidden="true" />
        
        {/* Main content */}
        <main className="relative z-10 min-h-screen">
          {children}
        </main>

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          gutter={8}
          toastOptions={{
            className: 'toast-neon',
            duration: 4000,
            style: {
              background: 'rgba(2, 6, 18, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#e2e8f0',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              backdropFilter: 'blur(12px)',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#020408' },
            },
            error: {
              iconTheme: { primary: '#f472b6', secondary: '#020408' },
            },
          }}
        />
      </body>
    </html>
  );
}
