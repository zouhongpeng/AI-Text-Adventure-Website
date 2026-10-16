'use client';

import { useEffect, useState } from 'react';
import { Trash2, Save, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteSave, listSaves } from '@/lib/game/storage';
import type { SaveSlot } from '@/lib/game/types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface SaveLoadDialogProps {
  open: boolean;
  mode: 'save' | 'load';
  onOpenChange: (open: boolean) => void;
  onSave: (label: string) => void;
  onLoad: (slot: SaveSlot) => void;
}

export default function SaveLoadDialog({
  open,
  mode,
  onOpenChange,
  onSave,
  onLoad,
}: SaveLoadDialogProps) {
  const [label, setLabel] = useState('');
  const [saves, setSaves] = useState<SaveSlot[]>([]);

  useEffect(() => {
    if (open) {
      setSaves(listSaves());
      setLabel('');
    }
  }, [open]);

  const refresh = () => setSaves(listSaves());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {mode === 'save' ? '保存进度' : '读取存档'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'save' ? (
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="为这段冒险起个名字（可选）"
                className="h-10 flex-1 rounded-xl border border-[#E5E5EA] px-3 text-sm focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20"
              />
              <Button
                className="bg-[#0071E3] hover:bg-[#0060C0]"
                onClick={() => {
                  onSave(label.trim());
                  onOpenChange(false);
                }}
              >
                <Save className="mr-1 h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        ) : null}

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {saves.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#A1A1A6]">暂无存档</p>
          ) : (
            saves.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#ECECEF] bg-[#FAFAFC] px-3.5 py-3"
              >
                <button
                  type="button"
                  disabled={mode === 'save'}
                  onClick={() => {
                    onLoad(s);
                    onOpenChange(false);
                  }}
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                >
                  <div className="truncate text-sm font-medium text-[#1D1D1F]">
                    {s.label || '未命名冒险'}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[#86868B]">
                    <span>{s.worldName}</span>
                    <span>·</span>
                    <span>{formatTime(s.savedAt)}</span>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {mode === 'load' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[#0071E3] hover:bg-[#F0F7FF]"
                      onClick={() => {
                        onLoad(s);
                        onOpenChange(false);
                      }}
                    >
                      <FolderOpen className="mr-1 h-4 w-4" />
                      读取
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-[#B25C5C] hover:bg-[#FBEDED]"
                    aria-label="删除存档"
                    onClick={() => {
                      deleteSave(s.id);
                      refresh();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
