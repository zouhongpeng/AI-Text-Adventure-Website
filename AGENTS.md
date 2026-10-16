# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **LLM**: DeepSeek Chat Completions（`deepseek-chat`，OpenAI 兼容协议，SSE 流式）

## AI 文本冒险游戏 —— 模块地图

- `src/app/api/game/route.ts`：唯一后端接口 `POST /api/game`（nodejs runtime，SSE）。读取 `DEEPSEEK_API_KEY`（仅服务端）代理调用 DeepSeek，把上游 token 流转成 `delta/done/error` 三类 SSE 事件。
- `src/lib/game/types.ts`：核心模型 `GameState / StoryEntry / SaveSlot / ChatMessage / WorldId`。
- `src/lib/game/worlds.ts`：4 个世界模板（奇幻/科幻/武侠/校园）与 `inferMood`（地点→背景氛围兜底映射）。
- `src/lib/game/prompts.ts`：system prompt、开局/行动 user prompt、输出协议。模型输出固定为 `正文 → <<<STATE>>> 分隔符 → 单行JSON{narration,options,state}`。
- `src/lib/game/engine.ts`：`createInitialState`、`parseTurn`（容错解析正文+JSON）、`splitAtNarrativePrefix` 相关的流式安全前缀逻辑（在 route 内联实现 `safeNarrativePrefix`）。
- `src/lib/game/api.ts`：前端 SSE 客户端 `streamGame`（fetch + ReadableStream reader），零密钥。
- `src/lib/game/storage.ts`：localStorage 存档（key `ai-text-adventure-saves-v1`，最多 10 条），仅客户端调用。
- `src/components/game/`：
  - `GameShell.tsx`：主编排（状态机、回合快照、断线重试 `pending` 快照）。
  - `StartScreen`（选世界）/ `StoryView`（衬线剧情+流式光标）/ `ActionBar`（输入+卡片式快捷选项）/ `StatusPanel`（位置/背包/NPC/任务）/ `AmbientBackground`（随 mood 变化的环境底色）/ `SaveLoadDialog`。

### 环境变量（仅服务端，.env.local 已 gitignore）
- `DEEPSEEK_API_KEY`（必填）、`DEEPSEEK_BASE_URL`（默认 https://api.deepseek.com）、`DEEPSEEK_MODEL`（默认 deepseek-chat）。
- 部署到生产时需要在环境中注入同名变量；前端永不接触密钥。

### 关键约定
- 修改输出协议需同步改 `prompts.ts` 的 `STATE_DELIMITER`、`route.ts` 的流解析与 `engine.ts` 的 `parseTurn`。
- 历史只存 `assistant 正文` 与 `user 行动`（不传 system），route 内部重新拼装 system，且仅发送最近 20 条历史。
- 新增世界：在 `WORLDS` 增加模板，并在 `inferMood`/`AmbientBackground` 需要时补充 mood 映射。

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**
