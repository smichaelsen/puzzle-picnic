export type Edge = -1 | 0 | 1;

export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  top: Edge;
  right: Edge;
  bottom: Edge;
  left: Edge;
}

export interface GridSize {
  rows: number;
  cols: number;
}

export interface GridCell {
  row: number;
  col: number;
}

export interface BoardBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const DIFFICULTIES = [
  { id: 'gentle', label: 'Little Explorer', note: 'Big pieces', pieces: 24, rows: 4, cols: 6, icon: '🌱' },
  { id: 'brave', label: 'Puzzle Pro', note: 'A fun challenge', pieces: 96, rows: 8, cols: 12, icon: '🌻' },
  { id: 'mighty', label: 'Master Builder', note: 'Lots to discover', pieces: 192, rows: 12, cols: 16, icon: '🏔️' },
] as const;

export type DifficultyId = (typeof DIFFICULTIES)[number]['id'];

export function difficultyById(id: string) {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) ?? DIFFICULTIES[0];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createPuzzlePieces(rows: number, cols: number, seed: string): PuzzlePiece[] {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
    throw new Error('Puzzle rows and columns must be positive integers.');
  }

  const random = mulberry32(hashString(seed));
  const pieces: PuzzlePiece[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const above = row > 0 ? pieces[(row - 1) * cols + col] : undefined;
      const before = col > 0 ? pieces[row * cols + col - 1] : undefined;
      const top = above ? ((-above.bottom) as Edge) : 0;
      const left = before ? ((-before.right) as Edge) : 0;
      const right = col === cols - 1 ? 0 : random() > 0.5 ? 1 : -1;
      const bottom = row === rows - 1 ? 0 : random() > 0.5 ? 1 : -1;

      pieces.push({ id: row * cols + col, row, col, top, right, bottom, left });
    }
  }

  return pieces;
}

type Point = { x: number; y: number };

function edgePoint(start: Point, along: Point, normal: Point, distance: number, offset: number): Point {
  return {
    x: start.x + along.x * distance + normal.x * offset,
    y: start.y + along.y * distance + normal.y * offset,
  };
}

function drawEdge(
  path: Path2D,
  start: Point,
  along: Point,
  outward: Point,
  length: number,
  edge: Edge,
  depth: number,
) {
  const lineTo = (distance: number, offset = 0) => {
    const point = edgePoint(start, along, outward, distance, offset);
    path.lineTo(point.x, point.y);
  };
  const curveTo = (
    firstDistance: number,
    firstOffset: number,
    secondDistance: number,
    secondOffset: number,
    endDistance: number,
    endOffset: number,
  ) => {
    const first = edgePoint(start, along, outward, firstDistance, firstOffset);
    const second = edgePoint(start, along, outward, secondDistance, secondOffset);
    const end = edgePoint(start, along, outward, endDistance, endOffset);
    path.bezierCurveTo(first.x, first.y, second.x, second.y, end.x, end.y);
  };

  if (edge === 0) {
    lineTo(length);
    return;
  }

  const bump = edge * depth;
  lineTo(length * 0.33);
  curveTo(length * 0.385, 0, length * 0.37, bump * 0.2, length * 0.415, bump * 0.24);
  curveTo(length * 0.405, bump * 0.9, length * 0.595, bump * 0.9, length * 0.585, bump * 0.24);
  curveTo(length * 0.63, bump * 0.2, length * 0.615, 0, length * 0.67, 0);
  lineTo(length);
}

export function createPiecePath(piece: PuzzlePiece, cellWidth: number, cellHeight: number, margin = 0): Path2D {
  const path = new Path2D();
  const depth = Math.min(cellWidth, cellHeight) * 0.24;
  path.moveTo(margin, margin);

  drawEdge(path, { x: margin, y: margin }, { x: 1, y: 0 }, { x: 0, y: -1 }, cellWidth, piece.top, depth);
  drawEdge(
    path,
    { x: margin + cellWidth, y: margin },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    cellHeight,
    piece.right,
    depth,
  );
  drawEdge(
    path,
    { x: margin + cellWidth, y: margin + cellHeight },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    cellWidth,
    piece.bottom,
    depth,
  );
  drawEdge(
    path,
    { x: margin, y: margin + cellHeight },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    cellHeight,
    piece.left,
    depth,
  );
  path.closePath();
  return path;
}

export function isEdgePiece(piece: PuzzlePiece): boolean {
  return piece.top === 0 || piece.right === 0 || piece.bottom === 0 || piece.left === 0;
}

export function shuffleIds(ids: number[], seed: string): number[] {
  const random = mulberry32(hashString(seed));
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

export function rasterizeBoardCell(
  pointerX: number,
  pointerY: number,
  previewOffsetY: number,
  bounds: BoardBounds,
  grid: GridSize,
): GridCell | undefined {
  const x = pointerX - bounds.left;
  const y = pointerY + previewOffsetY - bounds.top;
  if (
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    grid.rows < 1 ||
    grid.cols < 1 ||
    x < 0 ||
    y < 0 ||
    x >= bounds.width ||
    y >= bounds.height
  ) {
    return undefined;
  }

  return {
    row: Math.floor((y / bounds.height) * grid.rows),
    col: Math.floor((x / bounds.width) * grid.cols),
  };
}

export function isPuzzleComplete(placedCount: number, totalPieces: number): boolean {
  return totalPieces > 0 && placedCount === totalPieces;
}
