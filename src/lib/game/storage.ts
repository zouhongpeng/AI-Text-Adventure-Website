'use client';

import type { SaveSlot } from './types';

const STORAGE_KEY = 'ai-text-adventure-saves-v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window;
}

export function listSaves(): SaveSlot[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SaveSlot[];
    if (!Array.isArray(arr)) return [];
    return arr.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function saveGame(slot: Omit<SaveSlot, 'savedAt'>): SaveSlot {
  const existing = listSaves().filter((s) => s.id !== slot.id);
  const record: SaveSlot = { ...slot, savedAt: Date.now() };
  const next = [record, ...existing].slice(0, 10);
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return record;
}

export function loadSave(id: string): SaveSlot | null {
  return listSaves().find((s) => s.id === id) ?? null;
}

export function deleteSave(id: string): void {
  if (!isBrowser()) return;
  const next = listSaves().filter((s) => s.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function hasAnySave(): boolean {
  return listSaves().length > 0;
}
