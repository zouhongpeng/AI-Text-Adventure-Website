'use client';

import { SendHorizonal, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ActionBarProps {
  options: string[];
  streaming: boolean;
  disabled: boolean;
  onSubmit: (action: string) => void;
}

export default function ActionBar({ options, streaming, disabled, onSubmit }: ActionBarProps) {
  const [value, setValue] = useState('');

  const submit = (text: string) => {
    const action = text.trim();
    if (!action || streaming || disabled) return;
    onSubmit(action);
    setValue('');
  };

  const locked = streaming || disabled;

  return (
    <div className="border-t border-[#ECECEF] bg-white/85 px-4 pb-5 pt-3 backdrop-blur-md">
      <div className="mx-auto w-full max-w-2xl">
        {options.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <button
                key={`${opt}-${i}`}
                type="button"
                disabled={locked}
                onClick={() => submit(opt)}
                className="rounded-xl border border-[#E5E5EA] bg-white px-3.5 py-2 text-[13px] text-[#3A3A3C] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-150 hover:border-[#0071E3] hover:bg-[#F0F7FF] hover:text-[#0071E3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {opt}
              </button>
            ))}
          </div>
        ) : null}

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(value);
          }}
        >
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(value);
              }
            }}
            rows={1}
            placeholder="你想做什么？例如：我向前走、捡起地上的剑、和陌生人说话……"
            disabled={locked}
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl border border-[#E5E5EA] bg-white px-4 py-3 text-[14.5px] leading-6 text-[#1D1D1F] placeholder:text-[#A1A1A6] focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={locked || !value.trim()}
            aria-label="发送行动"
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#0071E3] text-white transition-all hover:bg-[#0060C0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#A9C7EA]"
          >
            {streaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
          </button>
        </form>
        <p className="mt-1.5 text-center text-[11px] text-[#A1A1A6]">Enter 发送 · Shift + Enter 换行</p>
      </div>
    </div>
  );
}
