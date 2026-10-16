// 游戏核心数据模型

export type WorldId = 'fantasy' | 'scifi' | 'wuxia' | 'campus';

export type SceneMood =
  | 'forest'
  | 'town'
  | 'cave'
  | 'indoor'
  | 'wilderness'
  | 'scifi'
  | 'campus'
  | 'combat'
  | 'default';

export interface NPC {
  id: string;
  name: string;
  relation: string; // 关系/身份，如：陌生旅人、同门师姐
  affinity: number; // -100 ~ 100
  note?: string;
}

export interface Quest {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'failed';
  progress: string;
}

// AI 每回合产出的结构化状态
export interface GameState {
  location: string;
  mood: SceneMood;
  inventory: string[];
  npcs: NPC[];
  quests: Quest[];
  turn: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 单个剧情条目（开局或玩家行动后）
export interface StoryEntry {
  id: string;
  type: 'narration' | 'action';
  text: string; // 剧情正文（纯叙述）
  action?: string; // 玩家的原始指令
  options: string[]; // 快捷选项
  state: GameState;
  createdAt: number;
}

export interface SaveSlot {
  id: string;
  label: string;
  worldId: WorldId;
  worldName: string;
  entries: StoryEntry[];
  history: ChatMessage[]; // 发给模型的精简对话历史
  savedAt: number;
}
