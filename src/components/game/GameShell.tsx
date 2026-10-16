'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookPlus, Save, FolderOpen, RotateCcw, PanelLeft, WifiOff } from 'lucide-react';
import AmbientBackground, { isDarkMood } from './AmbientBackground';
import StartScreen from './StartScreen';
import StatusPanel from './StatusPanel';
import StoryView from './StoryView';
import ActionBar from './ActionBar';
import SaveLoadDialog from './SaveLoadDialog';
import { streamGame, type GameRequest } from '@/lib/game/api';
import { createInitialState } from '@/lib/game/engine';
import { getWorld } from '@/lib/game/worlds';
import { hasAnySave, loadSave, saveGame } from '@/lib/game/storage';
import type {
  ChatMessage,
  GameState,
  SaveSlot,
  StoryEntry,
  WorldId,
} from '@/lib/game/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type Phase = 'start' | 'playing';

interface PendingRun {
  request: GameRequest;
  action?: string;
  entriesBefore: StoryEntry[];
  stateBefore: GameState;
  historyBefore: ChatMessage[];
}

let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${idSeq}`;
}

export default function GameShell() {
  const [phase, setPhase] = useState<Phase>('start');
  const [worldId, setWorldId] = useState<WorldId>('fantasy');
  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [state, setState] = useState<GameState>(() => createInitialState('fantasy'));
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRun | null>(null);
  const [hasSave, setHasSave] = useState(false);

  const [dialogMode, setDialogMode] = useState<'save' | 'load'>('load');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGameConfirm, setNewGameConfirm] = useState(false);

  const handleRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    setHasSave(hasAnySave());
  }, [entries]);

  useEffect(() => () => handleRef.current?.cancel(), []);

  const currentOptions = useMemo(() => {
    if (streaming) return [];
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].type === 'narration' && entries[i].options.length > 0) {
        return entries[i].options;
      }
    }
    return [];
  }, [entries, streaming]);

  const runTurn = useCallback((req: GameRequest) => {
    setError(null);
    setStreaming(true);
    setStreamingText('');

    let acc = '';
    const handle = streamGame(req, {
      onDelta: (t) => {
        acc += t;
        setStreamingText(acc);
      },
      onDone: ({ narration, options, state: nextState }) => {
        setStreaming(false);
        setStreamingText('');
        setState(nextState);

        if (req.mode === 'action' && req.action) {
          setEntries((prev) => [
            ...prev,
            {
              id: nextId('action'),
              type: 'action',
              text: '',
              action: req.action as string,
              options: [],
              state: nextState,
              createdAt: Date.now(),
            },
            {
              id: nextId('narr'),
              type: 'narration',
              text: narration,
              options,
              state: nextState,
              createdAt: Date.now(),
            },
          ]);
          setHistory((prev) => [
            ...prev,
            { role: 'user', content: req.action as string },
            { role: 'assistant', content: narration },
          ]);
        } else {
          setEntries((prev) => [
            ...prev,
            {
              id: nextId('narr'),
              type: 'narration',
              text: narration,
              options,
              state: nextState,
              createdAt: Date.now(),
            },
          ]);
          setHistory((prev) => [...prev, { role: 'assistant', content: narration }]);
        }
        setPending(null);
      },
      onError: (message) => {
        setStreaming(false);
        setStreamingText('');
        setError(message);
      },
    });
    handleRef.current = handle;
  }, []);

  const startGame = useCallback(
    (id: WorldId) => {
      const initState = createInitialState(id);
      setWorldId(id);
      setState(initState);
      setEntries([]);
      setHistory([]);
      setError(null);
      setPhase('playing');

      const request: GameRequest = {
        mode: 'opening',
        worldId: id,
        state: initState,
        history: [],
      };
      setPending({ request, entriesBefore: [], stateBefore: initState, historyBefore: [] });
      runTurn(request);
    },
    [runTurn],
  );

  const submitAction = useCallback(
    (action: string) => {
      if (streaming) return;
      const request: GameRequest = {
        mode: 'action',
        worldId,
        action,
        state,
        history,
      };
      setPending({ request, action, entriesBefore: entries, stateBefore: state, historyBefore: history });
      runTurn(request);
    },
    [streaming, worldId, state, history, entries, runTurn],
  );

  const retry = useCallback(() => {
    if (!pending) return;
    // 回到该回合开始前的快照
    setEntries(pending.entriesBefore);
    setState(pending.stateBefore);
    setHistory(pending.historyBefore);
    runTurn(pending.request);
  }, [pending, runTurn]);

  const applySave = useCallback(
    (slot: SaveSlot) => {
      setWorldId(slot.worldId);
      setState(
        slot.entries.length > 0
          ? slot.entries[slot.entries.length - 1].state
          : createInitialState(slot.worldId),
      );
      setEntries(slot.entries);
      setHistory(slot.history);
      setPhase('playing');
      setError(null);
      setPending(null);
      setStreaming(false);
      setStreamingText('');
    },
    [],
  );

  const handleLoadFromStart = useCallback(() => {
    setDialogMode('load');
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (label: string) => {
      saveGame({
        id: nextId('save'),
        label: label || getWorld(worldId).name + '冒险',
        worldId,
        worldName: getWorld(worldId).name,
        entries,
        history,
      });
      setHasSave(true);
    },
    [worldId, entries, history],
  );

  const dark = isDarkMood(state.mood);

  if (phase === 'start') {
    return (
      <>
        <AmbientBackground mood="default" />
        <StartScreen
          onStart={startGame}
          hasSave={hasSave}
          onLoad={handleLoadFromStart}
          loading={false}
        />
        <SaveLoadDialog
          open={dialogOpen}
          mode={dialogMode}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
          onLoad={applySave}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <AmbientBackground mood={state.mood} />

      {/* 顶栏 */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-black/5 bg-white/70 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="hidden text-[15px] font-serif font-semibold text-[#1D1D1F] sm:inline">
            无尽之书
          </span>
          <span className="rounded-full bg-[#F0F7FF] px-2.5 py-0.5 text-[12px] font-medium text-[#0071E3]">
            {getWorld(worldId).name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#3A3A3C] hover:bg-black/5 lg:hidden"
              >
                <PanelLeft className="h-4 w-4" />
                状态
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-3">
              <SheetHeader>
                <SheetTitle className="font-serif">冒险手札</SheetTitle>
              </SheetHeader>
              <div className="mt-3 h-[calc(100%-3rem)]">
                <StatusPanel state={state} />
              </div>
            </SheetContent>
          </Sheet>

          <button
            type="button"
            onClick={() => setNewGameConfirm(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#3A3A3C] hover:bg-black/5"
          >
            <BookPlus className="h-4 w-4" />
            <span className="hidden sm:inline">新游戏</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDialogMode('save');
              setDialogOpen(true);
            }}
            disabled={streaming || entries.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#3A3A3C] hover:bg-black/5 disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">存档</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDialogMode('load');
              setDialogOpen(true);
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#3A3A3C] hover:bg-black/5"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">读档</span>
          </button>
        </div>
      </header>

      {/* 主体三栏 */}
      <div className="z-0 grid min-h-0 flex-1 grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 lg:block">
          <StatusPanel state={state} />
        </aside>

        <main className="flex min-h-0 flex-col overflow-hidden rounded-2xl">
          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            {entries.length === 0 && streaming ? (
              <div className="mx-auto mt-24 max-w-2xl px-1">
                <div className="rounded-2xl border border-[#ECECEF] bg-white px-6 py-5">
                  <div className="space-y-2.5">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-[#EDEDF0]" />
                    <div className="h-3.5 w-full animate-pulse rounded bg-[#EDEDF0]" />
                    <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#EDEDF0]" />
                  </div>
                </div>
              </div>
            ) : (
              <StoryView entries={entries} streamingText={streamingText} streaming={streaming} />
            )}

            {error ? (
              <div className="mx-auto mb-4 max-w-2xl px-1">
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-[#F0D6D6] bg-[#FDF4F4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2.5">
                    <WifiOff className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#B25C5C]" />
                    <div>
                      <p className="text-[14px] font-medium text-[#8C3A3A]">连接中断</p>
                      <p className="mt-0.5 text-[12.5px] text-[#A87070]">{error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={retry}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0071E3] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#0060C0]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重试
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <ActionBar
            options={currentOptions}
            streaming={streaming}
            disabled={!!error}
            onSubmit={submitAction}
          />
        </main>
      </div>

      <SaveLoadDialog
        open={dialogOpen}
        mode={dialogMode}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onLoad={applySave}
      />

      <AlertDialog open={newGameConfirm} onOpenChange={setNewGameConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">开始新的冒险？</AlertDialogTitle>
            <AlertDialogDescription>
              当前未保存的剧情将会丢失。建议先存档，再开启新世界。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#0071E3] hover:bg-[#0060C0]"
              onClick={() => {
                handleRef.current?.cancel();
                setStreaming(false);
                setStreamingText('');
                setError(null);
                setPending(null);
                setPhase('start');
              }}
            >
              开始新游戏
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
