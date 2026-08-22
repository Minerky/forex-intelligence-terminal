'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { AiChat } from '@/components/ai-chat';
import { CommandPalette } from '@/components/command-palette';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Prevent hydration mismatch: mock data uses Math.random()/Date.now()
  // which differ between server and client renders.
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <span className="animate-pulse text-sm">Memuat terminal...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
      <AiChat />
      <CommandPalette />
    </div>
  );
}
