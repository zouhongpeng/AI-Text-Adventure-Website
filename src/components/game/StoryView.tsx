'use client';

import { useEffect, useRef } from 'react';
import type { StoryEntry } from '@/lib/game/types';
import { cn } from '@/lib/utils';

function BlinkingCursor({ dark }: { dark: boolean }) {
  return (
    <span
      className={cn(
        'ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-pulse',
        dark ? 'bg-[#0071E3]' : 'bg-[#0071E3]',
      )}
    />
  );
}

export default function StoryView({
  entries,
  streamingText,
  streaming,
}: {
  entries: StoryEntry[];
  streamingText: string;
  streaming: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries, streamingText, streaming]);

  return (
    <div className="mx-auto w-full max-w-2xl px-1 py-2">
      {entries.map((entry) => (
        <article key={entry.id} className="mb-7">
          {entry.type === 'action' && entry.action ? (
            <div className="mb-2 flex justify-end">
              <span className="max-w-[85%] rounded-2xl rounded-br-md bg-[#0071E3] px-3.5 py-2 text-[13.5px] leading-6 text-white">
                {entry.action}
              </span>
            </div>
          ) : null}
          <div
            className={cn(
              'rounded-2xl rounded-tl-md border border-[#ECECEF] bg-white px-6 py-5',
              'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
            )}
          >
            <p className="whitespace-pre-wrap font-serif text-[16.5px] leading-[1.95] text-[#1D1D1F]">
              {entry.text}
            </p>
          </div>
        </article>
      ))}

      {streaming ? (
        <article className="mb-7">
          <div className="rounded-2xl rounded-tl-md border border-[#ECECEF] bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="whitespace-pre-wrap font-serif text-[16.5px] leading-[1.95] text-[#1D1D1F]">
              {streamingText}
              <BlinkingCursor dark={false} />
            </p>
          </div>
        </article>
      ) : null}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
