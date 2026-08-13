import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  REQUIRED_SOLVES_PER_BUCKET,
  SCENE_BUCKET_SIZE,
  SCENES,
  isSceneUnlocked,
  sceneBuckets,
} from '../src/scenes';
import { loadSolvedScenes, markSceneSolved } from '../src/state';

describe('scene progression', () => {
  it('organizes every scene into buckets of three', () => {
    const buckets = sceneBuckets();

    expect(SCENE_BUCKET_SIZE).toBe(3);
    expect(REQUIRED_SOLVES_PER_BUCKET).toBe(2);
    expect(buckets.flat()).toEqual(SCENES);
    expect(buckets.every((bucket) => bucket.length === SCENE_BUCKET_SIZE)).toBe(true);
  });

  it('unlocks each next bucket after two solves in the previous bucket', () => {
    const solved = new Set<string>();

    expect(SCENES.map((_, index) => isSceneUnlocked(index, solved))).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);

    solved.add(SCENES[0].id);
    expect(isSceneUnlocked(3, solved)).toBe(false);
    solved.add(SCENES[2].id);
    expect(isSceneUnlocked(3, solved)).toBe(true);
    expect(isSceneUnlocked(6, solved)).toBe(false);

    solved.add(SCENES[3].id);
    solved.add(SCENES[5].id);
    expect(isSceneUnlocked(6, solved)).toBe(true);

    solved.add(SCENES[6].id);
    expect(isSceneUnlocked(9, solved)).toBe(false);
    solved.add(SCENES[8].id);
    expect(isSceneUnlocked(9, solved)).toBe(true);

    solved.add(SCENES[9].id);
    expect(isSceneUnlocked(12, solved)).toBe(false);
    solved.add(SCENES[11].id);
    expect(isSceneUnlocked(12, solved)).toBe(true);

    solved.add(SCENES[12].id);
    expect(isSceneUnlocked(15, solved)).toBe(false);
    solved.add(SCENES[14].id);
    expect(isSceneUnlocked(15, solved)).toBe(true);
  });
});

describe('solved scene storage', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });

  it('persists each solved scene once regardless of difficulty or repeat completions', () => {
    markSceneSolved(SCENES[0].id);
    markSceneSolved(SCENES[0].id);
    markSceneSolved(SCENES[1].id);

    expect(loadSolvedScenes()).toEqual([SCENES[0].id, SCENES[1].id]);
  });
});
