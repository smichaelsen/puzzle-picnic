import type { DifficultyId } from './puzzle';

const STORAGE_KEY = 'puzzle-picnic-progress-v1';
const SOLVED_STORAGE_KEY = 'puzzle-picnic-solved-scenes-v1';

export interface SavedGame {
  sceneId: string;
  difficultyId: DifficultyId;
  placed: number[];
  order: number[];
  startedAt: number;
  updatedAt: number;
}

export function loadGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedGame>;
    if (
      typeof parsed.sceneId !== 'string' ||
      typeof parsed.difficultyId !== 'string' ||
      !Array.isArray(parsed.placed) ||
      !Array.isArray(parsed.order) ||
      typeof parsed.startedAt !== 'number' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }
    return parsed as SavedGame;
  } catch {
    return null;
  }
}

export function saveGame(game: SavedGame): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Gameplay remains available if storage is disabled or full.
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function loadSolvedScenes(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SOLVED_STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((sceneId): sceneId is string => typeof sceneId === 'string'))];
  } catch {
    return [];
  }
}

export function markSceneSolved(sceneId: string): string[] {
  const solved = new Set(loadSolvedScenes());
  solved.add(sceneId);
  const result = [...solved];
  try {
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Unlock progress is best-effort when storage is unavailable.
  }
  return result;
}
