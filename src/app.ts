import { DIFFICULTIES, createPiecePath, createPuzzlePieces, difficultyById, isEdgePiece, isPuzzleComplete, isWithinSnap, shuffleIds } from './puzzle';
import type { DifficultyId, PuzzlePiece } from './puzzle';
import { REQUIRED_SOLVES_PER_BUCKET, SCENE_BUCKET_SIZE, SCENES, isSceneUnlocked, sceneBuckets, solvedInBucket } from './scenes';
import type { Scene } from './scenes';
import { clearGame, loadGame, loadSolvedScenes, markSceneSolved, saveGame } from './state';
import type { SavedGame } from './state';

type View = 'home' | 'play';

interface DragState {
  pieceId: number;
  pointerId: number;
  source: HTMLElement;
  preview: HTMLCanvasElement;
  yOffset: number;
}

class SoundEffects {
  private context?: AudioContext;

  private tone(frequency: number, duration: number, delay = 0, volume = 0.07) {
    try {
      this.context ??= new AudioContext();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const start = this.context.currentTime + delay;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch {
      // Sound is a bonus; silent gameplay should always work.
    }
  }

  placed() {
    this.tone(520, 0.1);
    this.tone(760, 0.13, 0.07, 0.055);
  }

  complete() {
    [523, 659, 784, 1047].forEach((frequency, index) => this.tone(frequency, 0.28, index * 0.11, 0.06));
  }
}

export class PuzzleApp {
  private view: View = 'home';
  private selectedScene?: Scene;
  private game?: SavedGame;
  private pieces: PuzzlePiece[] = [];
  private image?: HTMLImageElement;
  private placed = new Set<number>();
  private edgeOnly = false;
  private ghostVisible = true;
  private boardCanvas?: HTMLCanvasElement;
  private boardFrame?: HTMLElement;
  private trayGrid?: HTMLElement;
  private progressLabel?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private drag?: DragState;
  private hintPieceId?: number;
  private hintTimer?: number;
  private renderToken = 0;
  private readonly sounds = new SoundEffects();

  constructor(private readonly root: HTMLElement) {}

  start() {
    this.showHome();
  }

  private showHome() {
    this.view = 'home';
    this.cleanupPlayView();
    const saved = loadGame();
    const resumable = saved && saved.placed.length < difficultyById(saved.difficultyId).pieces;
    const knownSceneIds = new Set(SCENES.map((scene) => scene.id));
    const solvedSceneIds = new Set(loadSolvedScenes().filter((sceneId) => knownSceneIds.has(sceneId)));

    this.root.innerHTML = `
      <main class="home-view">
        <header class="welcome">
          <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
          <div>
            <p class="eyebrow">Pick a picture. Make it whole.</p>
            <h1>Puzzle <em>Picnic</em></h1>
          </div>
          <div class="welcome-badge" aria-hidden="true">🧩</div>
        </header>
        ${
          resumable
            ? `<button class="continue-card" type="button" data-action="continue">
                <span class="continue-icon">▶</span>
                <span><strong>Keep puzzling!</strong><small>${saved.placed.length} of ${difficultyById(saved.difficultyId).pieces} pieces are home</small></span>
                <span class="continue-arrow">›</span>
              </button>`
            : ''
        }
        <section class="scene-section" aria-labelledby="choose-heading">
          <div class="section-heading">
            <div><p class="step-pill">1</p><h2 id="choose-heading">Choose your adventure</h2></div>
            <p class="collection-progress"><strong>${solvedSceneIds.size}</strong><span>of ${SCENES.length}<small>pictures solved</small></span></p>
          </div>
          <div class="scene-shelves">
            ${sceneBuckets()
              .map((bucket, bucketIndex) => {
                const previousSolved = bucketIndex === 0 ? 0 : solvedInBucket(bucketIndex - 1, solvedSceneIds);
                return `<div class="scene-shelf" data-bucket="${bucketIndex + 1}">
                  <div class="scene-grid">
                    ${bucket
                      .map((scene, indexInBucket) => {
                        const index = bucketIndex * SCENE_BUCKET_SIZE + indexInBucket;
                        const solved = solvedSceneIds.has(scene.id);
                        const unlocked = isSceneUnlocked(index, solvedSceneIds);
                        return `<button class="scene-card scene-${index + 1}${solved ? ' solved' : ''}${unlocked ? '' : ' locked'}" type="button" data-scene="${scene.id}" data-solved="${solved}" data-unlocked="${unlocked}" style="--scene-color:${scene.color}" ${unlocked ? '' : 'disabled'}>
                          <span class="scene-image">
                            <img src="${scene.src}" alt="" draggable="false" />
                            <span class="scene-number">${index + 1}</span>
                            ${solved ? '<span class="solved-badge"><span aria-hidden="true">✓</span> Solved</span>' : ''}
                            ${
                              unlocked
                                ? ''
                                : `<span class="lock-overlay"><b aria-hidden="true">🔒</b><strong>Locked</strong><small>${previousSolved} of ${REQUIRED_SOLVES_PER_BUCKET} solved above</small></span>`
                            }
                          </span>
                          <span class="scene-copy"><strong>${scene.title}</strong><small>${scene.subtitle}</small></span>
                          <span class="scene-go" aria-hidden="true">${unlocked ? '›' : '•'}</span>
                        </button>`;
                      })
                      .join('')}
                  </div>
                </div>`;
              })
              .join('')}
          </div>
        </section>
        <footer class="home-footer"><span>Made for little hands</span><span aria-hidden="true">•</span><span>Works offline</span><span aria-hidden="true">•</span><span>Progress saves itself</span></footer>
      </main>`;

    this.root.querySelectorAll<HTMLElement>('[data-scene]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedScene = SCENES.find((scene) => scene.id === button.dataset.scene);
        if (this.selectedScene) this.showDifficultyPicker(this.selectedScene);
      });
    });
    this.root.querySelector<HTMLElement>('[data-action="continue"]')?.addEventListener('click', () => {
      if (saved) void this.resumeGame(saved);
    });
  }

  private showDifficultyPicker(scene: Scene) {
    const dialog = document.createElement('dialog');
    dialog.className = 'difficulty-dialog';
    dialog.innerHTML = `
      <div class="dialog-art"><img src="${scene.src}" alt="${scene.title}" /></div>
      <div class="dialog-content">
        <button class="close-button" type="button" aria-label="Close">×</button>
        <p class="eyebrow">${scene.emoji} ${scene.title}</p>
        <h2>How big a puzzle?</h2>
        <div class="difficulty-list">
          ${DIFFICULTIES.map(
            (difficulty) => `
              <button type="button" class="difficulty-option" data-difficulty="${difficulty.id}">
                <span class="difficulty-icon">${difficulty.icon}</span>
                <span><strong>${difficulty.label}</strong><small>${difficulty.note}</small></span>
                <b>${difficulty.pieces}<small>pieces</small></b>
              </button>`,
          ).join('')}
        </div>
      </div>`;
    document.body.append(dialog);
    dialog.querySelector('.close-button')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.querySelectorAll<HTMLElement>('[data-difficulty]').forEach((button) => {
      button.addEventListener('click', () => {
        const difficultyId = button.dataset.difficulty as DifficultyId;
        dialog.close();
        void this.newGame(scene, difficultyId);
      });
    });
    dialog.showModal();
  }

  private async loadImage(scene: Scene): Promise<HTMLImageElement> {
    const image = new Image();
    image.decoding = 'async';
    image.src = scene.src;
    await image.decode();
    return image;
  }

  private async newGame(scene: Scene, difficultyId: DifficultyId) {
    const difficulty = difficultyById(difficultyId);
    const order = shuffleIds(
      Array.from({ length: difficulty.pieces }, (_, id) => id),
      `${scene.id}-${difficultyId}-tray`,
    );
    clearGame();
    const now = Date.now();
    this.game = { sceneId: scene.id, difficultyId, placed: [], order, startedAt: now, updatedAt: now };
    this.selectedScene = scene;
    this.placed = new Set();
    this.saveProgress();
    await this.openGame();
  }

  private async resumeGame(saved: SavedGame) {
    const scene = SCENES.find((candidate) => candidate.id === saved.sceneId);
    if (!scene) {
      clearGame();
      this.showHome();
      return;
    }
    const difficulty = difficultyById(saved.difficultyId);
    const validIds = new Set(Array.from({ length: difficulty.pieces }, (_, id) => id));
    this.game = {
      ...saved,
      placed: saved.placed.filter((id) => validIds.has(id)),
      order: saved.order.filter((id) => validIds.has(id)),
    };
    if (this.game.order.length !== difficulty.pieces) {
      this.game.order = shuffleIds([...validIds], `${scene.id}-${saved.difficultyId}-tray`);
    }
    this.selectedScene = scene;
    this.placed = new Set(this.game.placed);
    await this.openGame();
  }

  private async openGame() {
    if (!this.game || !this.selectedScene) return;
    this.view = 'play';
    const token = ++this.renderToken;
    this.image = await this.loadImage(this.selectedScene);
    if (token !== this.renderToken) return;
    const difficulty = difficultyById(this.game.difficultyId);
    this.pieces = createPuzzlePieces(difficulty.rows, difficulty.cols, `${this.game.sceneId}-${this.game.difficultyId}`);

    this.root.innerHTML = `
      <main class="play-view" style="--scene-color:${this.selectedScene.color}">
        <header class="game-header">
          <button class="round-button" type="button" data-action="home" aria-label="Back to puzzle pictures">‹</button>
          <div class="game-title"><span>${this.selectedScene.emoji}</span><div><strong>${this.selectedScene.title}</strong><small>${difficulty.pieces} pieces</small></div></div>
          <div class="progress-wrap"><span class="progress-text"></span><span class="progress-track"><span></span></span></div>
          <button class="header-button" type="button" data-action="picture"><span aria-hidden="true">🖼️</span><span>Picture</span></button>
          <button class="round-button menu-button" type="button" data-action="restart" aria-label="Start this puzzle again">↻</button>
        </header>
        <div class="game-layout">
          <section class="board-stage" aria-label="Puzzle board">
            <div class="board-frame">
              <canvas class="board-canvas"></canvas>
              <div class="hint-target" aria-hidden="true"></div>
            </div>
          </section>
          <aside class="piece-tray" aria-label="Loose puzzle pieces">
            <div class="tray-heading">
              <div><p class="eyebrow">Your pieces</p><h2>Find their homes</h2></div>
              <button class="shuffle-button" type="button" data-action="shuffle" aria-label="Shuffle loose pieces">↝</button>
            </div>
            <div class="tray-filters">
              <button type="button" data-filter="all" class="active">All pieces</button>
              <button type="button" data-filter="edges">Edge pieces</button>
            </div>
            <div class="tray-grid"></div>
            <div class="board-tools">
              <button type="button" data-action="hint"><span aria-hidden="true">✨</span> Hint</button>
              <button type="button" data-action="ghost" class="active"><span aria-hidden="true">👀</span> Guide</button>
            </div>
            <p class="tray-empty">All the pieces here are home! 🎉</p>
          </aside>
        </div>
      </main>`;

    this.boardCanvas = this.root.querySelector('.board-canvas')!;
    this.boardFrame = this.root.querySelector('.board-frame')!;
    this.trayGrid = this.root.querySelector('.tray-grid')!;
    this.progressLabel = this.root.querySelector('.progress-text')!;
    this.bindGameControls();
    this.renderTray();
    this.updateProgress();
    this.resizeObserver = new ResizeObserver(() => this.resizeBoard());
    this.resizeObserver.observe(this.root.querySelector('.board-stage')!);
    this.resizeBoard();

    if (import.meta.env.DEV) {
      window.__PUZZLE_TEST__ = {
        place: (pieceId: number) => this.placePiece(pieceId),
        placeAll: () => this.pieces.forEach((piece) => this.placePiece(piece.id, false)),
        state: () => ({ total: this.pieces.length, placed: this.placed.size, difficulty: this.game?.difficultyId }),
      };
    }
  }

  private bindGameControls() {
    this.root.querySelector('[data-action="home"]')?.addEventListener('click', () => this.showHome());
    this.root.querySelector('[data-action="picture"]')?.addEventListener('click', () => this.showPicture());
    this.root.querySelector('[data-action="restart"]')?.addEventListener('click', () => this.confirmRestart());
    this.root.querySelector('[data-action="hint"]')?.addEventListener('click', () => this.showHint());
    this.root.querySelector('[data-action="ghost"]')?.addEventListener('click', (event) => {
      this.ghostVisible = !this.ghostVisible;
      (event.currentTarget as HTMLElement).classList.toggle('active', this.ghostVisible);
      this.renderBoard();
    });
    this.root.querySelector('[data-action="shuffle"]')?.addEventListener('click', () => this.shuffleTray());
    this.root.querySelectorAll<HTMLElement>('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        this.edgeOnly = button.dataset.filter === 'edges';
        this.root.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        this.renderTray();
      });
    });
  }

  private resizeBoard() {
    if (!this.boardCanvas || !this.boardFrame) return;
    const stage = this.boardFrame.parentElement!;
    const stageRect = stage.getBoundingClientRect();
    const stageStyle = window.getComputedStyle(stage);
    const frameStyle = window.getComputedStyle(this.boardFrame);
    const tools = stage.querySelector('.board-tools')?.getBoundingClientRect().height ?? 0;
    const horizontalChrome =
      Number.parseFloat(stageStyle.paddingLeft) +
      Number.parseFloat(stageStyle.paddingRight) +
      Number.parseFloat(frameStyle.borderLeftWidth) +
      Number.parseFloat(frameStyle.borderRightWidth);
    const verticalChrome =
      Number.parseFloat(stageStyle.paddingTop) +
      Number.parseFloat(stageStyle.paddingBottom) +
      Number.parseFloat(frameStyle.borderTopWidth) +
      Number.parseFloat(frameStyle.borderBottomWidth);
    const maxWidth = Math.max(240, stageRect.width - horizontalChrome);
    const maxHeight = Math.max(180, stageRect.height - tools - verticalChrome);
    const width = Math.floor(Math.min(maxWidth, (maxHeight * 4) / 3));
    const height = Math.floor((width * 3) / 4);
    this.boardFrame.style.width = `${width}px`;
    this.boardFrame.style.height = `${height}px`;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.boardCanvas.width = Math.round(width * ratio);
    this.boardCanvas.height = Math.round(height * ratio);
    this.boardCanvas.style.width = `${width}px`;
    this.boardCanvas.style.height = `${height}px`;
    this.renderBoard();
  }

  private renderBoard() {
    if (!this.boardCanvas || !this.image || !this.game) return;
    const context = this.boardCanvas.getContext('2d')!;
    const width = this.boardCanvas.clientWidth;
    const height = this.boardCanvas.clientHeight;
    const ratio = this.boardCanvas.width / width;
    const difficulty = difficultyById(this.game.difficultyId);
    const cellWidth = width / difficulty.cols;
    const cellHeight = height / difficulty.rows;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#f8f0da';
    context.fillRect(0, 0, width, height);

    if (this.ghostVisible && this.placed.size < this.pieces.length) {
      context.save();
      context.globalAlpha = 0.18;
      context.filter = 'saturate(0.72)';
      context.drawImage(this.image, 0, 0, width, height);
      context.restore();
    }

    for (const piece of this.pieces) {
      if (!this.placed.has(piece.id)) continue;
      context.save();
      context.translate(piece.col * cellWidth, piece.row * cellHeight);
      const path = createPiecePath(piece, cellWidth, cellHeight);
      context.clip(path);
      context.drawImage(this.image, -piece.col * cellWidth, -piece.row * cellHeight, width, height);
      context.strokeStyle = this.placed.size === this.pieces.length ? 'transparent' : 'rgba(61, 46, 28, 0.2)';
      context.lineWidth = Math.max(0.7, Math.min(cellWidth, cellHeight) * 0.018);
      context.stroke(path);
      context.restore();
    }

    if (this.placed.size === this.pieces.length) {
      context.drawImage(this.image, 0, 0, width, height);
    }
  }

  private renderTray() {
    if (!this.trayGrid || !this.image || !this.game) return;
    const difficulty = difficultyById(this.game.difficultyId);
    const orderedPieces = this.game.order
      .map((id) => this.pieces[id])
      .filter((piece): piece is PuzzlePiece => Boolean(piece) && !this.placed.has(piece.id) && (!this.edgeOnly || isEdgePiece(piece)));
    this.trayGrid.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const piece of orderedPieces) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'piece-button';
      button.dataset.pieceId = String(piece.id);
      button.setAttribute('aria-label', `Loose piece ${piece.id + 1}`);
      const canvas = this.createPieceCanvas(piece, 54, 42, difficulty.cols, difficulty.rows, 1.5);
      button.append(canvas);
      button.addEventListener('pointerdown', (event) => this.startDrag(event, piece, button));
      fragment.append(button);
    }
    this.trayGrid.append(fragment);
    this.root.querySelector<HTMLElement>('.tray-empty')?.classList.toggle('visible', orderedPieces.length === 0);
  }

  private createPieceCanvas(
    piece: PuzzlePiece,
    cellWidth: number,
    cellHeight: number,
    cols: number,
    rows: number,
    pixelRatio = 1,
  ): HTMLCanvasElement {
    const margin = Math.min(cellWidth, cellHeight) * 0.28;
    const canvas = document.createElement('canvas');
    const cssWidth = cellWidth + margin * 2;
    const cssHeight = cellHeight + margin * 2;
    canvas.width = Math.ceil(cssWidth * pixelRatio);
    canvas.height = Math.ceil(cssHeight * pixelRatio);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    const context = canvas.getContext('2d')!;
    context.scale(pixelRatio, pixelRatio);
    const path = createPiecePath(piece, cellWidth, cellHeight, margin);
    context.save();
    context.shadowColor = 'rgba(47, 36, 21, 0.32)';
    context.shadowBlur = 4;
    context.shadowOffsetY = 2;
    context.fillStyle = '#fff';
    context.fill(path);
    context.restore();
    context.save();
    context.clip(path);
    context.drawImage(
      this.image!,
      margin - piece.col * cellWidth,
      margin - piece.row * cellHeight,
      cellWidth * cols,
      cellHeight * rows,
    );
    context.restore();
    context.strokeStyle = 'rgba(48, 38, 25, 0.34)';
    context.lineWidth = 1.1;
    context.stroke(path);
    return canvas;
  }

  private startDrag(event: PointerEvent, piece: PuzzlePiece, source: HTMLElement) {
    if (!this.boardCanvas || !this.game || event.button > 0) return;
    event.preventDefault();
    this.hideHint();
    const difficulty = difficultyById(this.game.difficultyId);
    const boardWidth = this.boardCanvas.clientWidth;
    const boardHeight = this.boardCanvas.clientHeight;
    const cellWidth = Math.max(42, (boardWidth / difficulty.cols) * 1.2);
    const cellHeight = Math.max(34, (boardHeight / difficulty.rows) * 1.2);
    const preview = this.createPieceCanvas(piece, cellWidth, cellHeight, difficulty.cols, difficulty.rows, Math.min(devicePixelRatio, 2));
    preview.className = 'drag-preview';
    document.body.append(preview);
    const yOffset = event.pointerType === 'touch' ? -42 : -8;
    this.drag = { pieceId: piece.id, pointerId: event.pointerId, source, preview, yOffset };
    source.classList.add('dragging');
    this.boardFrame?.classList.add('drag-active');
    source.setPointerCapture(event.pointerId);
    this.movePreview(event.clientX, event.clientY);
    source.addEventListener('pointermove', this.onDragMove);
    source.addEventListener('pointerup', this.onDragEnd);
    source.addEventListener('pointercancel', this.onDragCancel);
  }

  private readonly onDragMove = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    this.movePreview(event.clientX, event.clientY);
  };

  private readonly onDragEnd = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.pointerId || !this.boardCanvas || !this.game) return;
    event.preventDefault();
    const piece = this.pieces[this.drag.pieceId];
    const rect = this.boardCanvas.getBoundingClientRect();
    const difficulty = difficultyById(this.game.difficultyId);
    const cellWidth = rect.width / difficulty.cols;
    const cellHeight = rect.height / difficulty.rows;
    const targetX = rect.left + (piece.col + 0.5) * cellWidth;
    const targetY = rect.top + (piece.row + 0.5) * cellHeight;
    const accepted = isWithinSnap(event.clientX, event.clientY, targetX, targetY, cellWidth, cellHeight);
    const source = this.drag.source;
    this.finishDrag();
    if (accepted) {
      this.placePiece(piece.id);
    } else {
      source.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 230 },
      );
    }
  };

  private readonly onDragCancel = () => this.finishDrag();

  private movePreview(clientX: number, clientY: number) {
    if (!this.drag) return;
    const width = Number.parseFloat(this.drag.preview.style.width);
    const height = Number.parseFloat(this.drag.preview.style.height);
    this.drag.preview.style.transform = `translate3d(${clientX - width / 2}px, ${clientY - height / 2 + this.drag.yOffset}px, 0)`;
  }

  private finishDrag() {
    if (!this.drag) return;
    const { source, preview } = this.drag;
    source.classList.remove('dragging');
    source.removeEventListener('pointermove', this.onDragMove);
    source.removeEventListener('pointerup', this.onDragEnd);
    source.removeEventListener('pointercancel', this.onDragCancel);
    preview.remove();
    this.boardFrame?.classList.remove('drag-active');
    this.drag = undefined;
  }

  private placePiece(pieceId: number, celebrate = true) {
    if (this.placed.has(pieceId) || !this.game) return;
    this.placed.add(pieceId);
    this.game.placed = [...this.placed];
    this.game.updatedAt = Date.now();
    this.saveProgress();
    this.trayGrid?.querySelector(`[data-piece-id="${pieceId}"]`)?.remove();
    this.renderBoard();
    this.updateProgress();
    if (celebrate) this.sounds.placed();
    if (isPuzzleComplete(this.placed.size, this.pieces.length)) {
      window.setTimeout(() => this.completeGame(), 420);
    }
  }

  private updateProgress() {
    if (!this.progressLabel) return;
    const total = this.pieces.length;
    const count = this.placed.size;
    this.progressLabel.textContent = `${count} / ${total}`;
    const bar = this.root.querySelector<HTMLElement>('.progress-track span');
    if (bar) bar.style.width = `${total ? (count / total) * 100 : 0}%`;
  }

  private saveProgress() {
    if (this.game) saveGame(this.game);
  }

  private shuffleTray() {
    if (!this.game) return;
    this.game.order = shuffleIds(this.game.order, `${Date.now()}-${this.placed.size}`);
    this.game.updatedAt = Date.now();
    this.saveProgress();
    this.renderTray();
    this.trayGrid?.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 280 });
  }

  private showHint() {
    if (!this.game || !this.boardCanvas) return;
    const piece = this.game.order.map((id) => this.pieces[id]).find((candidate) => candidate && !this.placed.has(candidate.id));
    if (!piece) return;
    this.hideHint();
    this.hintPieceId = piece.id;
    if (this.edgeOnly && !isEdgePiece(piece)) {
      this.edgeOnly = false;
      this.root.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      this.root.querySelector('[data-filter="all"]')?.classList.add('active');
      this.renderTray();
    }
    const button = this.trayGrid?.querySelector<HTMLElement>(`[data-piece-id="${piece.id}"]`);
    button?.classList.add('hinted');
    button?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const target = this.root.querySelector<HTMLElement>('.hint-target');
    const difficulty = difficultyById(this.game.difficultyId);
    if (target) {
      target.style.left = `${(piece.col / difficulty.cols) * 100}%`;
      target.style.top = `${(piece.row / difficulty.rows) * 100}%`;
      target.style.width = `${100 / difficulty.cols}%`;
      target.style.height = `${100 / difficulty.rows}%`;
      target.classList.add('visible');
    }
    this.hintTimer = window.setTimeout(() => this.hideHint(), 15_000);
  }

  private hideHint() {
    if (this.hintTimer) window.clearTimeout(this.hintTimer);
    if (this.hintPieceId !== undefined) {
      this.trayGrid?.querySelector(`[data-piece-id="${this.hintPieceId}"]`)?.classList.remove('hinted');
    }
    this.root.querySelector('.hint-target')?.classList.remove('visible');
    this.hintPieceId = undefined;
  }

  private showPicture() {
    if (!this.selectedScene) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'picture-dialog';
    dialog.innerHTML = `<button type="button" aria-label="Close picture">×</button><img src="${this.selectedScene.src}" alt="The complete ${this.selectedScene.title} picture" /><strong>${this.selectedScene.title}</strong><small>Tap anywhere to go back</small>`;
    dialog.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
  }

  private confirmRestart() {
    if (!this.selectedScene || !this.game) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `<div><span aria-hidden="true">↻</span><h2>Mix up this puzzle?</h2><p>All the pieces will go back into the tray.</p><div><button type="button" data-answer="no">Keep playing</button><button type="button" data-answer="yes">Start over</button></div></div>`;
    dialog.querySelector('[data-answer="no"]')?.addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-answer="yes"]')?.addEventListener('click', () => {
      const scene = this.selectedScene!;
      const difficulty = this.game!.difficultyId;
      dialog.close();
      void this.newGame(scene, difficulty);
    });
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
  }

  private completeGame() {
    if (!this.selectedScene || this.view !== 'play') return;
    this.sounds.complete();
    const solvedBefore = new Set(loadSolvedScenes());
    const solvedAfter = new Set(markSceneSolved(this.selectedScene.id));
    const sceneIndex = SCENES.findIndex((scene) => scene.id === this.selectedScene!.id);
    const nextBucketStart = (Math.floor(sceneIndex / SCENE_BUCKET_SIZE) + 1) * SCENE_BUCKET_SIZE;
    const unlockedNewBucket =
      nextBucketStart < SCENES.length &&
      !isSceneUnlocked(nextBucketStart, solvedBefore) &&
      isSceneUnlocked(nextBucketStart, solvedAfter);
    clearGame();
    this.launchConfetti();
    const overlay = document.createElement('div');
    overlay.className = 'completion-card';
    overlay.innerHTML = `<div><span class="completion-stars" aria-hidden="true">★ ✦ ★</span><p class="eyebrow">Every piece found its home</p><h2>You did it!</h2><p>${this.selectedScene.title} is complete.</p>${unlockedNewBucket ? '<p class="unlock-message">🔓 Three new pictures unlocked!</p>' : ''}<button type="button">Choose another picture <span>›</span></button></div>`;
    overlay.querySelector('button')?.addEventListener('click', () => {
      overlay.remove();
      this.showHome();
    });
    document.body.append(overlay);
  }

  private launchConfetti() {
    const colors = ['#ff6b59', '#ffd44d', '#42c6b7', '#6656c8', '#ee75a8'];
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    for (let index = 0; index < 48; index += 1) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', `${Math.random() * 100}vw`);
      piece.style.setProperty('--delay', `${Math.random() * 0.45}s`);
      piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
      piece.style.setProperty('--color', colors[index % colors.length]);
      layer.append(piece);
    }
    document.body.append(layer);
    window.setTimeout(() => layer.remove(), 4200);
  }

  private cleanupPlayView() {
    this.renderToken += 1;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.finishDrag();
    this.hideHint();
    delete window.__PUZZLE_TEST__;
  }
}

declare global {
  interface Window {
    __PUZZLE_TEST__?: {
      place: (pieceId: number) => void;
      placeAll: () => void;
      state: () => { total: number; placed: number; difficulty?: DifficultyId };
    };
  }
}
