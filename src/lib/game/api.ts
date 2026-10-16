import type { ChatMessage, GameState, WorldId } from './types';

export interface GameRequest {
  mode: 'opening' | 'action';
  worldId: WorldId;
  action?: string;
  state: GameState;
  history: ChatMessage[];
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: (payload: {
    narration: string;
    options: string[];
    state: GameState;
  }) => void;
  onError: (message: string) => void;
}

export interface StreamHandle {
  cancel: () => void;
  done: Promise<void>;
}

// 调用后端 SSE 接口；密钥只存在于服务端，前端只发业务参数。
export function streamGame(req: GameRequest, handlers: StreamHandlers): StreamHandle {
  const controller = new AbortController();

  const done = (async () => {
    let res: Response;
    try {
      res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      handlers.onError('网络连接失败，请检查网络后重试。');
      return;
    }

    const contentType = res.headers.get('Content-Type') ?? '';

    // 非流式错误（如 503 未配置 key / 502 上游错误）
    if (!res.ok || !res.body || !contentType.includes('text/event-stream')) {
      let message = '服务暂时不可用，请稍后重试。';
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        /* ignore */
      }
      handlers.onError(message);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamFailed = false;

    try {
      for (;;) {
        const { done: isDone, value } = await reader.read();
        if (isDone) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          for (const rawLine of evt.split('\n')) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const msg = JSON.parse(payload) as {
                type?: 'delta' | 'done' | 'error';
                text?: string;
                narration?: string;
                options?: string[];
                state?: GameState;
              };
              if (msg.type === 'delta' && msg.text) {
                handlers.onDelta(msg.text);
              } else if (msg.type === 'done' && msg.state && msg.narration !== undefined) {
                handlers.onDone({
                  narration: msg.narration,
                  options: Array.isArray(msg.options) ? msg.options : [],
                  state: msg.state,
                });
              } else if (msg.type === 'error') {
                streamFailed = true;
                handlers.onError(msg.text ?? 'AI 生成失败，请重试。');
              }
            } catch {
              /* 忽略心跳/不完整帧 */
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      streamFailed = true;
      handlers.onError('与服务器的连接中断，请重试。');
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* noop */
      }
      if (!streamFailed) {
        // 流正常结束但未收到 done（罕见的提前断开）
        // 由调用方依据 streaming 文本兜底；此处不强制报错。
      }
    }
  })();

  return {
    cancel: () => controller.abort(),
    done,
  };
}
