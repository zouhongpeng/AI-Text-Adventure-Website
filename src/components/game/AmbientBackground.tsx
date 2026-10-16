'use client';

import type { SceneMood } from '@/lib/game/types';

interface MoodTheme {
  base: string;
  glowA: string;
  glowB: string;
}

// 暗色 mood 用更深的底，其余统一在 #F5F5F7 上叠加低饱和光晕；前景卡片始终白色。
const THEMES: Record<SceneMood, MoodTheme> = {
  forest: {
    base: '#EAF0EB',
    glowA: 'rgba(61,107,79,0.34)',
    glowB: 'rgba(120,150,110,0.20)',
  },
  town: {
    base: '#F2EEE6',
    glowA: 'rgba(138,109,59,0.26)',
    glowB: 'rgba(190,160,110,0.18)',
  },
  cave: {
    base: '#14171B',
    glowA: 'rgba(40,60,90,0.55)',
    glowB: 'rgba(12,14,18,0.85)',
  },
  indoor: {
    base: '#F3EFE8',
    glowA: 'rgba(184,155,114,0.24)',
    glowB: 'rgba(210,190,160,0.16)',
  },
  wilderness: {
    base: '#EBEFF2',
    glowA: 'rgba(90,113,132,0.28)',
    glowB: 'rgba(140,160,175,0.18)',
  },
  scifi: {
    base: '#0E1B20',
    glowA: 'rgba(31,78,95,0.60)',
    glowB: 'rgba(0,113,227,0.28)',
  },
  campus: {
    base: '#EEF1F4',
    glowA: 'rgba(107,118,132,0.24)',
    glowB: 'rgba(0,113,227,0.12)',
  },
  combat: {
    base: '#F4EBEB',
    glowA: 'rgba(122,46,46,0.30)',
    glowB: 'rgba(160,80,70,0.16)',
  },
  default: {
    base: '#F5F5F7',
    glowA: 'rgba(0,113,227,0.06)',
    glowB: 'rgba(0,0,0,0.03)',
  },
};

export function isDarkMood(mood: SceneMood): boolean {
  return mood === 'cave' || mood === 'scifi';
}

export default function AmbientBackground({ mood }: { mood: SceneMood }) {
  const theme = THEMES[mood] ?? THEMES.default;
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden transition-[background-color] duration-700"
      style={{ backgroundColor: theme.base }}
    >
      <div
        className="absolute -top-[20%] -left-[10%] h-[70vh] w-[70vh] rounded-full blur-3xl transition-all duration-1000"
        style={{ background: `radial-gradient(circle at center, ${theme.glowA}, transparent 65%)` }}
      />
      <div
        className="absolute -bottom-[25%] -right-[10%] h-[75vh] w-[75vh] rounded-full blur-3xl transition-all duration-1000"
        style={{ background: `radial-gradient(circle at center, ${theme.glowB}, transparent 65%)` }}
      />
    </div>
  );
}
