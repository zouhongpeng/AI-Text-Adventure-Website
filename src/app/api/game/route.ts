import { NextRequest } from 'next/server';
import { createInitialState, parseTurn } from '@/lib/game/engine';
import { buildActionUserPrompt, buildOpeningUserPrompt, buildSystemPrompt, STATE_DELIMITER } from '@/lib/game/prompts';
import { getWorld } from '@/lib/game/worlds';
import type { ChatMessage, GameState, WorldId } from '@/lib/game/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GameRequestBody {
  mode?: 'opening' | 'action';
  worldId?: WorldId;
  action?: string;
  state?: GameState;
  history?: ChatMessage[];
}

const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const MAX_TOKENS = 1600;
const HISTORY_TURNS = 20; // 保留最近若干条历史，控制时延与 token

function isGameState(v: unknown): v is GameState {
  return typeof v === 'object' && v !== null && 'location' in v;
}

// 返回"可以安全作为正文展示"的前缀，扣留可能是分隔符开头的末尾片段
function safeNarrativePrefix(full: string): { text: string; hit: boolean } {
  const idx = full.indexOf(STATE_DELIMITER);
  if (idx !== -1) return { text: full.slice(0, idx), hit: true };
  let hold = 0;
  for (let k = Math.min(STATE_DELIMITER.length - 1, full.length); k > 0; k--) {
    if (full.endsWith(STATE_DELIMITER.slice(0, k))) {
      hold = k;
      break;
    }
  }
  return { text: full.slice(0, Math.max(0, full.length - hold)), hit: false };
}

function sse(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  let body: GameRequestBody;
  try {
    body = (await request.json()) as GameRequestBody;
  } catch {
    return Response.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  if (!apiKey) {
    return Response.json(
      { error: '服务端未配置 DEEPSEEK_API_KEY，无法开始游戏。' },
      { status: 503 },
    );
  }

  const mode = body.mode === 'action' ? 'action' : 'opening';
  const worldId = (body.worldId ?? 'fantasy') as WorldId;
  const world = getWorld(worldId);

  const prevState: GameState = isGameState(body.state)
    ? body.state
    : createInitialState(worldId);

  // 组装消息
  const systemPrompt = buildSystemPrompt(world);
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const trimmed = rawHistory.slice(-HISTORY_TURNS).filter(
    (m): m is ChatMessage =>
      m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
  );

  if (mode === 'opening') {
    messages.push({ role: 'user', content: buildOpeningUserPrompt(world, prevState) });
  } else {
    const action = (body.action ?? '').trim();
    if (!action) {
      return Response.json({ error: '缺少玩家行动指令' }, { status: 400 });
    }
    messages.push(...trimmed);
    messages.push({ role: 'user', content: buildActionUserPrompt(action, prevState) });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  request.signal.addEventListener('abort', () => controller.abort());

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.95,
        max_tokens: MAX_TOKENS,
        stream: true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return Response.json(
      { error: aborted ? 'AI 服务响应超时，请稍后重试。' : '无法连接到 AI 服务，请检查网络后重试。' },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timeout);
    const detail = await upstream.text().catch(() => '');
    const status = upstream.status;
    let message = 'AI 服务返回错误，请稍后重试。';
    if (status === 401) message = 'DeepSeek API Key 无效或已失效。';
    else if (status === 402) message = 'DeepSeek 账户余额不足。';
    else if (status === 429) message = 'AI 请求过于频繁，请稍后再试。';
    return Response.json({ error: message, detail: detail.slice(0, 300) }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controllerTarget) {
      let buffer = '';
      let full = '';
      let emitted = 0;
      let delimiterHit = false;

      const send = (obj: unknown) => controllerTarget.enqueue(sse(obj));

      try {
        // 首字节心跳，尽早建立流
        controllerTarget.enqueue(encoder.encode(': connected\n\n'));

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('data:')) continue;
            const payload = trimmedLine.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: { delta?: { content?: string } }[];
              };
              const piece = json.choices?.[0]?.delta?.content;
              if (typeof piece === 'string' && piece.length > 0) {
                full += piece;
                if (!delimiterHit) {
                  const prefix = safeNarrativePrefix(full);
                  delimiterHit = prefix.hit;
                  if (prefix.text.length > emitted) {
                    send({ type: 'delta', text: prefix.text.slice(emitted) });
                    emitted = prefix.text.length;
                  }
                }
              }
            } catch {
              // 忽略不完整/非 JSON 心跳行
            }
          }
        }

        const result = parseTurn(full, prevState);
        if (!result.narration) {
          send({ type: 'error', text: 'AI 这次没有给出有效剧情，请重试。' });
        } else {
          // 模型偶尔不返回 options，用通用行动兜底，保证快捷入口始终可用
          const options =
            result.options.length > 0
              ? result.options
              : ['环顾四周', '继续向前探索', '检查随身物品'];
          send({ type: 'done', ...result, options });
        }
      } catch {
        send({ type: 'error', text: '与 AI 的连接中断，请重试。' });
      } finally {
        clearTimeout(timeout);
        try {
          reader.releaseLock();
        } catch {
          /* noop */
        }
        controllerTarget.close();
      }
    },
    cancel() {
      controller.abort();
      clearTimeout(timeout);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
