'use client';

import { MapPin, Backpack, Users, ScrollText, Compass } from 'lucide-react';
import type { GameState } from '@/lib/game/types';
import { cn } from '@/lib/utils';

function AffinityBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value + 100) / 2) * 1; // 映射 -100~100 -> 0~100
  const positive = value >= 0;
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#EDEDF0]">
      <div
        className={cn('h-full rounded-full transition-all', positive ? 'bg-[#0071E3]' : 'bg-[#B25C5C]')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#F0F0F2] px-4 py-4 last:border-b-0">
      <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function StatusPanel({ state }: { state: GameState }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-[#F0F0F2] px-4 py-3.5">
        <span className="flex items-center gap-1.5 font-serif text-[15px] font-semibold text-[#1D1D1F]">
          <Compass className="h-4 w-4 text-[#0071E3]" />
          冒险手札
        </span>
        <span className="rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[11px] font-medium text-[#6E6E73]">
          第 {state.turn} 回合
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section icon={<MapPin className="h-3.5 w-3.5" />} title="当前位置">
          <p className="font-serif text-[15px] font-medium text-[#1D1D1F]">{state.location}</p>
        </Section>

        <Section icon={<Backpack className="h-3.5 w-3.5" />} title="背包">
          {state.inventory.length === 0 ? (
            <p className="text-[13px] text-[#A1A1A6]">空空如也</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {state.inventory.map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="rounded-lg border border-[#E8E8ED] bg-[#FAFAFC] px-2 py-1 text-[12.5px] text-[#3A3A3C]"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<Users className="h-3.5 w-3.5" />} title="人物关系">
          {state.npcs.length === 0 ? (
            <p className="text-[13px] text-[#A1A1A6]">尚未遇到关键人物</p>
          ) : (
            <ul className="space-y-3">
              {state.npcs.map((npc) => (
                <li key={npc.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13.5px] font-medium text-[#1D1D1F]">{npc.name}</span>
                    <span className="shrink-0 text-[11px] text-[#86868B]">{npc.relation}</span>
                  </div>
                  <AffinityBar value={npc.affinity} />
                  {npc.note ? <p className="mt-1 text-[12px] leading-5 text-[#6E6E73]">{npc.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<ScrollText className="h-3.5 w-3.5" />} title="任务进度">
          {state.quests.length === 0 ? (
            <p className="text-[13px] text-[#A1A1A6]">暂无任务</p>
          ) : (
            <ul className="space-y-2.5">
              {state.quests.map((q) => (
                <li key={q.id}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        q.status === 'active' && 'bg-[#0071E3]',
                        q.status === 'completed' && 'bg-[#34A853]',
                        q.status === 'failed' && 'bg-[#B25C5C]',
                      )}
                    />
                    <span
                      className={cn(
                        'text-[13.5px] font-medium',
                        q.status === 'active'
                          ? 'text-[#1D1D1F]'
                          : q.status === 'completed'
                            ? 'text-[#86868B] line-through'
                            : 'text-[#B25C5C]',
                      )}
                    >
                      {q.title}
                    </span>
                  </div>
                  {q.progress ? <p className="mt-0.5 pl-3.5 text-[12px] leading-5 text-[#6E6E73]">{q.progress}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
