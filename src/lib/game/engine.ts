import { inferMood } from './worlds';
import { STATE_DELIMITER } from './prompts';
import type { GameState, NPC, Quest, SceneMood, WorldId } from './types';

export function createInitialState(worldId: WorldId): GameState {
  return {
    location: '未知之地',
    mood: worldId === 'scifi' ? 'scifi' : worldId === 'campus' ? 'campus' : 'forest',
    inventory: [],
    npcs: [],
    quests: [],
    turn: 1,
  };
}

const VALID_MOODS: SceneMood[] = [
  'forest',
  'town',
  'cave',
  'indoor',
  'wilderness',
  'scifi',
  'campus',
  'combat',
  'default',
];

function sanitizeState(raw: unknown, fallback: GameState): GameState {
  if (typeof raw !== 'object' || raw === null) return fallback;
  const o = raw as Record<string, unknown>;

  const location =
    typeof o.location === 'string' && o.location.trim()
      ? o.location.trim()
      : fallback.location;

  let mood: SceneMood = fallback.mood;
  if (typeof o.mood === 'string' && VALID_MOODS.includes(o.mood as SceneMood)) {
    mood = o.mood as SceneMood;
  } else {
    mood = inferMood(location);
  }

  const inventory = Array.isArray(o.inventory)
    ? o.inventory.filter((x): x is string => typeof x === 'string' && !!x.trim())
    : fallback.inventory;

  const npcs: NPC[] = Array.isArray(o.npcs)
    ? o.npcs
        .filter((n) => typeof n === 'object' && n !== null)
        .map((n) => {
          const nn = n as Record<string, unknown>;
          const affinity = Number(nn.affinity);
          return {
            id: String(nn.id ?? nn.name ?? 'npc'),
            name: String(nn.name ?? '未知'),
            relation: String(nn.relation ?? '陌生人'),
            affinity: Number.isFinite(affinity)
              ? Math.max(-100, Math.min(100, Math.round(affinity)))
              : 0,
            note: typeof nn.note === 'string' ? nn.note : undefined,
          };
        })
    : fallback.npcs;

  const quests: Quest[] = Array.isArray(o.quests)
    ? o.quests
        .filter((q) => typeof q === 'object' && q !== null)
        .map((q) => {
          const qq = q as Record<string, unknown>;
          const status = qq.status === 'completed' || qq.status === 'failed' ? qq.status : 'active';
          return {
            id: String(qq.id ?? qq.title ?? 'quest'),
            title: String(qq.title ?? '未命名任务'),
            status,
            progress: String(qq.progress ?? ''),
          };
        })
    : fallback.quests;

  const turn = Number(o.turn);
  return {
    location,
    mood,
    inventory,
    npcs,
    quests,
    turn: Number.isFinite(turn) && turn > 0 ? Math.round(turn) : fallback.turn,
  };
}

export interface ParsedTurn {
  narration: string;
  options: string[];
  state: GameState;
}

// 从模型完整输出中解析：正文 + 分隔符 + JSON
export function parseTurn(full: string, prevState: GameState): ParsedTurn {
  const idx = full.indexOf(STATE_DELIMITER);
  if (idx === -1) {
    // 兜底：没按格式输出时，全部作为叙述，状态沿用上一次
    const text = full.trim();
    return {
      narration: text,
      options: [],
      state: { ...prevState, turn: prevState.turn + 1 },
    };
  }

  const narration = full.slice(0, idx).trim();

  // 从分隔符之后抓取第一个 JSON 对象（容错多余文字）
  const rest = full.slice(idx + STATE_DELIMITER.length);
  const jsonStart = rest.indexOf('{');
  const jsonEnd = rest.lastIndexOf('}');

  let parsed: Record<string, unknown> = {};
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    const candidate = rest.slice(jsonStart, jsonEnd + 1);
    try {
      parsed = JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  }

  const rawState =
    typeof parsed.state === 'object' && parsed.state !== null
      ? parsed.state
      : undefined;
  const state = sanitizeState(rawState, {
    ...prevState,
    turn: prevState.turn + 1,
  });

  let finalNarration = narration;
  if (
    typeof parsed.narration === 'string' &&
    parsed.narration.trim().length > 0
  ) {
    // 以 JSON 内的 narration 为准（更稳定），但若正文已流式展示则通常一致
    finalNarration = parsed.narration.trim();
  }

  const options = Array.isArray(parsed.options)
    ? parsed.options
        .filter((x): x is string => typeof x === 'string' && !!x.trim())
        .slice(0, 3)
        .map((x) => x.trim())
    : [];

  return { narration: finalNarration, options, state };
}

// 流式过程中，判断当前缓冲是否已进入 JSON 段
export function splitAtDelimiter(buffer: string): { narration: string; tail: string; hit: boolean } {
  const idx = buffer.indexOf(STATE_DELIMITER);
  if (idx === -1) return { narration: buffer, tail: '', hit: false };
  return {
    narration: buffer.slice(0, idx),
    tail: buffer.slice(idx + STATE_DELIMITER.length),
    hit: true,
  };
}
