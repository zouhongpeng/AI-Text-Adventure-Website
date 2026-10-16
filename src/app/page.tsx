'use client';

import dynamic from 'next/dynamic';

const GameShell = dynamic(() => import('@/components/game/GameShell'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8D8DE] border-t-[#0071E3]" />
    </div>
  ),
});

export default function Home() {
  return <GameShell />;
}
