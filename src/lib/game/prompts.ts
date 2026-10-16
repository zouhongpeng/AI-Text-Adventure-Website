import type { GameState } from './types';
import type { WorldTemplate } from './worlds';

// 统一的结构化输出约定。叙述与状态用分隔符切分，便于"逐字流式 + 结构化状态"兼得。
export const STATE_DELIMITER = '<<<STATE>>>';

const JSON_SCHEMA_HINT = `state 字段必须是严格合法的 JSON（不要注释、不要尾随逗号、不要 markdown 代码块），结构如下：
{
  "location": "当前地点的简短名称",
  "mood": "场景氛围，只能取这些值之一：forest | town | cave | indoor | wilderness | scifi | campus | combat | default",
  "inventory": ["背包物品1", "物品2"],
  "npcs": [ { "id": "英文短id", "name": "NPC名", "relation": "与玩家的关系/身份", "affinity": 好感度整数-100到100, "note": "一句话近况" } ],
  "quests": [ { "id": "英文短id", "title": "任务名", "status": "active|completed|failed", "progress": "当前进展一句话" } ],
  "turn": 当前回合整数
}`;

const WRITING_RULES = `【叙事铁律】
1. 只能基于"世界设定 + 已有游戏状态 + 玩家输入"来推演，禁止凭空编造与设定矛盾的事物；新引入的人物/物品/线索必须合理且可在后文回收。
2. 尊重玩家行动的因果：玩家做了什么，世界就要真实地回应（可能成功、失败或付出代价），不能无视玩家指令自说自话。
3. 玩家的合理自由行动都应被允许并产生合乎逻辑的后果；不强制玩家走固定选项。
4. 叙事使用第二人称"你"，画面感强、有细节与对话，但单回合控制在 120~260 个汉字，节奏紧凑。
5. 不要替玩家做决定，不要在叙述里写玩家接下来要做的动作；在结尾把选择交还给玩家。
6. 适度制造悬念、风险与选择代价，避免主角无敌或一路顺利。
7. NPC 好感度、任务状态、物品增减都要在 state 中如实反映，保持跨回合一致，物品/任务不凭空出现或消失。`;

export function buildSystemPrompt(world: WorldTemplate): string {
  return `你是一款 AI 文本冒险游戏的"主持人 / 地下城主"。

【世界设定】
${world.setting}

${WRITING_RULES}

【输出格式 —— 极其重要，必须严格遵守】
每次回复只能包含两部分，且只能出现一次分隔符：
第一部分：写给玩家看的剧情正文（纯中文叙述/对话，可含自然换行分段，但不要出现任何 JSON、字段名或分隔符之外的标记）。
紧接一行：${STATE_DELIMITER}
第二部分：一行 JSON 对象，包含 narration（与第一部分完全一致的剧情正文）、options（必须恰好给出 3 个基于当前情境、可立即执行的中文快捷行动建议，每个不超过 12 字，用动词短语，例如"沿脚印追踪""拔剑戒备""向老妇道谢"）、state（更新后的游戏状态）。
${JSON_SCHEMA_HINT}

再次强调：输出顺序固定为 正文 → 换行后的 ${STATE_DELIMITER} 分隔符 → JSON。正文部分绝不允许出现 JSON 或方括号标记。`;
}

// 开局：由模型生成开场剧情
export function buildOpeningUserPrompt(
  world: WorldTemplate,
  state: GameState,
): string {
  return `请开始这场冒险的开场（这是第 1 回合，turn=1）。
${world.openingInstruction}

当前初始状态（请据此在 JSON 的 state 中完善：location 写开场地点，inventory 写苏醒/初到时随身物品，npcs 写此刻在场或已提及的关键人物，quests 给出由开场悬念引出的主线任务，mood 按地点选择）：
${JSON.stringify(state)}

请严格按约定格式输出开场正文与状态。`;
}

// 普通行动回合
export function buildActionUserPrompt(
  action: string,
  state: GameState,
): string {
  return `【玩家行动】${action}

【当前游戏状态】
${JSON.stringify(state)}

请根据玩家行动推进剧情（turn 在上一回合基础上 +1），更新状态，并给出 3 个合乎当前情境的快捷行动选项。严格按约定格式输出。`;
}
