import type { SceneMood, WorldId } from './types';

export interface WorldTemplate {
  id: WorldId;
  name: string;
  tagline: string;
  emoji: string;
  // 世界设定，注入 system prompt
  setting: string;
  // 开局指令（由模型生成开场）
  openingInstruction: string;
  // 新游戏世界选择卡片上的氛围色（仅 UI 点缀）
  accent: string;
}

export const WORLDS: WorldTemplate[] = [
  {
    id: 'fantasy',
    name: '奇幻',
    tagline: '剑、魔法与远古遗迹',
    emoji: '🗡️',
    accent: '#3D6B4F',
    setting:
      '这是一个剑与魔法的中世纪奇幻世界：森林、遗迹、王国、公会与古老神祇并存。存在法术、药水、精灵、矮人、龙与魔物，但一切都需符合内在逻辑。玩家是一名失去部分记忆的冒险者，身份与使命将随剧情揭开。',
    openingInstruction:
      '玩家从一片陌生而幽暗的古老森林中醒来，记忆模糊，身边有一件不起眼但可能重要的物品。请描写他苏醒时的所见、所闻与身体感受，并埋下一个悬念（远处的光、奇怪的声音或来路不明的痕迹）。',
  },
  {
    id: 'scifi',
    name: '科幻',
    tagline: '星舰、AI 与失落殖民地',
    emoji: '🚀',
    accent: '#1F4E5F',
    setting:
      '这是一个硬科幻基调的未来世界：星际航行、人工智能、殖民地、能量武器与外星遗迹。技术遵循合理设定，不出现魔法。玩家是一艘失事科考星舰上的幸存者，舰队失联，必须在陌生星域求生并查明事故真相。',
    openingInstruction:
      '玩家从冷冻休眠舱的警报声中被强制唤醒，星舰坠毁在一颗未知行星，灯光闪烁、重力异常，AI 主机语音提示船体破损。请描写苏醒后的舱内环境、警报与玩家面临的第一个抉择。',
  },
  {
    id: 'wuxia',
    name: '武侠',
    tagline: '江湖、门派与快意恩仇',
    emoji: '🏔️',
    accent: '#8A6D3B',
    setting:
      '这是一个古代武侠江湖世界：门派林立、武功轻功、刀剑暗器、恩怨情仇。重情义、讲规矩，武功描写要有招式与意境，不出现现代事物。玩家是一名初入江湖的少年（女），身负一桩与师门或身世相关的旧案。',
    openingInstruction:
      '暮色苍茫，玩家牵着一匹瘦马来到一座名为「落雁镇」的边陲小镇，镇口酒旗招展却透着异样的肃杀，几个佩刀汉子正盯着告示上的海捕文书。请描写镇口景象、紧张气氛，并让玩家与一件江湖事端产生牵连。',
  },
  {
    id: 'campus',
    name: '校园',
    tagline: '青春、悬疑与日常推理',
    emoji: '🎒',
    accent: '#6B7684',
    setting:
      '这是一个现代校园背景，带轻度悬疑与青春日常：教学楼、社团、宿舍、考试、同学关系，以及一桩正在发酵的校园谜案（失踪的同学、被篡改的档案、深夜的广播）。现实合理，无超自然元素。玩家是一名刚转学来的高二学生。',
    openingInstruction:
      '周一清晨，玩家第一次走进新学校的教室，班主任正在介绍这位转学生，同学们议论纷纷。请描写教室、几位关键同学给玩家的第一印象，以及课桌抽屉里出现的一张没有署名的神秘字条。',
  },
];

export function getWorld(id: WorldId): WorldTemplate {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}

// 场景地点 -> 背景氛围归类（模型也可直接给 mood，这里做中文关键词兜底）
export function inferMood(location: string): SceneMood {
  const t = location ?? '';
  if (/(洞|穴|地下城|地底|墓|坑道|矿)/.test(t)) return 'cave';
  if (/(林|森林|丛林|树林|树海|沼泽)/.test(t)) return 'forest';
  if (/(星舰|飞船|太空|舱|空间站|机库|实验室|基地)/.test(t)) return 'scifi';
  if (/(教室|学校|校园|宿舍|操场|图书馆|走廊|社团)/.test(t)) return 'campus';
  if (/(镇|城|村|市集|街|客栈|酒馆|店|殿|堂|堡|营)/.test(t)) return 'town';
  if (/(屋|房|室|帐|庙|观|阁|楼|家)/.test(t)) return 'indoor';
  if (/(战场|斗|厮杀|决斗|怪兽|敌人)/.test(t)) return 'combat';
  if (/(荒野|山|崖|谷|漠|雪原|河|湖|海|岛|原)/.test(t)) return 'wilderness';
  return 'default';
}
