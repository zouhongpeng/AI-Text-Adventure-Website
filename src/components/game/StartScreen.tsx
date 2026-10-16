'use client';

import { WORLDS } from '@/lib/game/worlds';
import type { WorldId } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface StartScreenProps {
  onStart: (worldId: WorldId) => void;
  hasSave: boolean;
  onLoad: () => void;
  loading: boolean;
}

export default function StartScreen({ onStart, hasSave, onLoad, loading }: StartScreenProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-5 py-16">
      <div className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-[#0071E3]">
        AI Text Adventure
      </div>
      <h1 className="text-center font-serif text-4xl font-bold text-[#1D1D1F] sm:text-5xl">
        无尽之书
      </h1>
      <p className="mt-4 max-w-xl text-center text-[15px] leading-7 text-[#6E6E73]">
        用任意自然语言与世界互动。你说出的每一句话都会改变剧情、位置、物品与人物关系——故事由你书写，且没有固定结局。
      </p>

      <div className="mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {WORLDS.map((w) => (
          <button
            key={w.id}
            type="button"
            disabled={loading}
            onClick={() => onStart(w.id)}
            className={cn(
              'group flex items-start gap-4 rounded-2xl border border-[#E5E5EA] bg-white p-5 text-left',
              'shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200',
              'hover:-translate-y-0.5 hover:border-[#0071E3] hover:shadow-[0_8px_28px_rgba(0,113,227,0.12)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: `${w.accent}1A` }}
            >
              {w.emoji}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-semibold text-[#1D1D1F]">{w.name}</span>
                <span className="text-xs text-[#86868B]">{w.tagline}</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#0071E3] opacity-0 transition-opacity group-hover:opacity-100">
                进入此世界 →
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasSave && (
        <button
          type="button"
          onClick={onLoad}
          className="mt-8 text-sm font-medium text-[#0071E3] underline-offset-4 hover:underline"
        >
          继续上次的冒险（读取存档）
        </button>
      )}
    </div>
  );
}
