import { describe, expect, it } from 'vitest';
import {
  DIFFICULTIES,
  createPuzzlePieces,
  isPuzzleComplete,
  rasterizeBoardCell,
  shuffleIds,
} from '../src/puzzle';

describe('jigsaw generation', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`creates all ${difficulty.pieces} valid ${difficulty.label} pieces`, () => {
      const pieces = createPuzzlePieces(difficulty.rows, difficulty.cols, `scene-${difficulty.id}`);

      expect(pieces).toHaveLength(difficulty.pieces);
      expect(new Set(pieces.map((piece) => piece.id)).size).toBe(difficulty.pieces);
      expect(pieces.map((piece) => piece.id)).toEqual(
        Array.from({ length: difficulty.pieces }, (_, id) => id),
      );

      for (const piece of pieces) {
        expect(piece.top === 0).toBe(piece.row === 0);
        expect(piece.bottom === 0).toBe(piece.row === difficulty.rows - 1);
        expect(piece.left === 0).toBe(piece.col === 0);
        expect(piece.right === 0).toBe(piece.col === difficulty.cols - 1);

        if (piece.col < difficulty.cols - 1) {
          const rightNeighbor = pieces[piece.id + 1];
          expect(piece.right).toBe(-rightNeighbor.left);
        }
        if (piece.row < difficulty.rows - 1) {
          const bottomNeighbor = pieces[piece.id + difficulty.cols];
          expect(piece.bottom).toBe(-bottomNeighbor.top);
        }
      }
    });
  }

  it('is deterministic for saved games and varies with the seed', () => {
    const first = createPuzzlePieces(8, 12, 'moon-a');
    const again = createPuzzlePieces(8, 12, 'moon-a');
    const different = createPuzzlePieces(8, 12, 'moon-b');

    expect(first).toEqual(again);
    expect(first).not.toEqual(different);
  });
});

describe('tray ordering', () => {
  it('keeps every piece exactly once and is deterministic', () => {
    const ids = Array.from({ length: 192 }, (_, id) => id);
    const shuffled = shuffleIds(ids, 'large-puzzle');

    expect(shuffled).toEqual(shuffleIds(ids, 'large-puzzle'));
    expect(shuffled).not.toEqual(ids);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(ids);
  });
});

describe('board cell rasterization', () => {
  const bounds = { left: 20, top: 30, width: 600, height: 400 };
  const grid = { rows: 4, cols: 6 };

  it('uses the visual center of an offset drag preview', () => {
    expect(rasterizeBoardCell(270, 222, -42, bounds, grid)).toEqual({ row: 1, col: 2 });
  });

  it('maps positions equally near the top and bottom of a cell', () => {
    expect(rasterizeBoardCell(270, 177, -42, bounds, grid)).toEqual({ row: 1, col: 2 });
    expect(rasterizeBoardCell(270, 267, -42, bounds, grid)).toEqual({ row: 1, col: 2 });
  });

  it('switches at exact cell boundaries and rejects positions outside the board', () => {
    expect(rasterizeBoardCell(220, 172, -42, bounds, grid)).toEqual({ row: 1, col: 2 });
    expect(rasterizeBoardCell(219.9, 172, -42, bounds, grid)).toEqual({ row: 1, col: 1 });
    expect(rasterizeBoardCell(620, 172, -42, bounds, grid)).toBeUndefined();
    expect(rasterizeBoardCell(270, 71.9, -42, bounds, grid)).toBeUndefined();
  });
});

describe('puzzle completion', () => {
  it('only completes when every piece is placed', () => {
    expect(isPuzzleComplete(23, 24)).toBe(false);
    expect(isPuzzleComplete(24, 24)).toBe(true);
    expect(isPuzzleComplete(0, 0)).toBe(false);
  });
});
