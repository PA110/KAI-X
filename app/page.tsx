// app/page.tsx
// Main page: full-screen 3D galaxy mind map with HUD overlay.

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Controls from '@/components/Controls';

// Dynamically import Galaxy to avoid SSR issues with Three.js
const Galaxy = dynamic(() => import('@/components/Galaxy'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4" />
        <p className="font-mono text-sm text-cyan-400/60 animate-pulse tracking-widest">
          INITIALIZING GALAXY...
        </p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 3D Galaxy canvas - fills entire screen */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Galaxy />
        </Suspense>
      </div>

      {/* HUD Controls overlay */}
      <Controls />

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(2,4,8,0.6) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
