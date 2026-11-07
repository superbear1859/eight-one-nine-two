/**
 * 8192 — Slide & Merge Puzzle Game
 * Supports 4x4, 5x5, and 6x6 grids with independent persistence,
 * milestone-earned Undo power-ups, smooth animations, and Web Audio SFX.
 */

const WIN_TARGET = 8192;
const INITIAL_UNDOS = 3;
const MAX_UNDOS = 5;
const INITIAL_SMASHES = 2;
const MAX_SMASHES = 3;
const MAX_HISTORY_LENGTH = 10;
const MILESTONE_TILES = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
const SMASH_MILESTONE_TILES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];

const STORAGE_KEYS = {
  STATE_PREFIX: 'game_8192_state_v1_',
  BEST_PREFIX: 'game_8192_best_tile_v1_',
  THEME: 'game_8192_theme_v1',
  SOUND: 'game_8192_sound_v1',
  ACTIVE_SIZE: 'game_8192_active_size_v1',
};

/* ==========================================================================
   Web Audio Synthesizer (Zero External Assets)
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
    this.enabled = savedSound !== null ? savedSound === 'true' : true;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem(STORAGE_KEYS.SOUND, String(this.enabled));
    if (this.enabled) {
      this.playSlide();
    }
    return this.enabled;
  }

  playSlide() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.055);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playMerge(maxMergedValue) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pitch scales up with log2 of tile value (4 -> 2, 8192 -> 13)
    const step = Math.max(1, Math.min(15, Math.log2(maxMergedValue || 4)));
    const baseFreq = 200 * Math.pow(1.09, step);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = step >= 10 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.11);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.125);
  }

  playUndo() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  playSmash() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);

    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playMilestone() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    });
  }

  playWinFanfare() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const duration = idx === notes.length - 1 ? 0.45 : 0.2;
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    });
  }
}

/* ==========================================================================
   Main 8192 Game Controller
   ========================================================================== */
class Game8192 {
  constructor() {
    this.sound = new SoundEngine();

    // DOM Elements
    this.boardContainer = document.getElementById('board-container');
    this.gridBackground = document.getElementById('grid-background');
    this.tileContainer = document.getElementById('tile-container');
    this.currentScoreEl = document.getElementById('current-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.scoreAdditionEl = document.getElementById('score-addition');
    this.undoBtn = document.getElementById('undo-btn');
    this.undoCountEl = document.getElementById('undo-count');
    this.smashBtn = document.getElementById('smash-btn');
    this.smashCountEl = document.getElementById('smash-count');
    this.newGameBtn = document.getElementById('new-game-btn');
    this.soundToggleBtn = document.getElementById('sound-toggle');
    this.themeToggleBtn = document.getElementById('theme-toggle');
    this.toastContainer = document.getElementById('toast-container');

    // Overlay Elements
    this.overlay = document.getElementById('game-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayMessage = document.getElementById('overlay-message');
    this.keepGoingBtn = document.getElementById('keep-going-btn');
    this.overlayUndoBtn = document.getElementById('overlay-undo-btn');
    this.overlaySmashBtn = document.getElementById('overlay-smash-btn');
    this.tryAgainBtn = document.getElementById('try-again-btn');

    this.sizeButtons = Array.from(document.querySelectorAll('.size-btn'));

    // Internal State
    this.nextTileId = 1;
    const savedSize = parseInt(localStorage.getItem(STORAGE_KEYS.ACTIVE_SIZE), 10);
    this.size = savedSize >= 4 && savedSize <= 10 ? savedSize : 4;

    this.grid = [];
    this.score = 0;
    this.bestScore = 0;
    this.undosRemaining = INITIAL_UNDOS;
    this.smashesRemaining = INITIAL_SMASHES;
    this.smashMode = false;
    this.unlockedMilestones = [];
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.over = false;

    this.initTheme();
    this.updateSoundUI();
    this.bindEvents();
    this.switchGridSize(this.size, false);
  }

  /* ------------------------------------------------------------------------
     Theme & Sound Initialization
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeUI(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    this.updateThemeUI(next);
  }

  updateThemeUI(theme) {
    const moon = this.themeToggleBtn.querySelector('.moon-icon');
    const sun = this.themeToggleBtn.querySelector('.sun-icon');
    if (theme === 'dark') {
      moon.classList.add('hidden');
      sun.classList.remove('hidden');
    } else {
      moon.classList.remove('hidden');
      sun.classList.add('hidden');
    }
  }

  updateSoundUI() {
    const onIcon = this.soundToggleBtn.querySelector('.sound-on-icon');
    const offIcon = this.soundToggleBtn.querySelector('.sound-off-icon');
    if (this.sound.enabled) {
      onIcon.classList.remove('hidden');
      offIcon.classList.add('hidden');
    } else {
      onIcon.classList.add('hidden');
      offIcon.classList.remove('hidden');
    }
  }

  /* ------------------------------------------------------------------------
     Grid Setup & State Persistence per Size
     ------------------------------------------------------------------------ */
  switchGridSize(newSize, saveCurrentFirst = true) {
    this.setSmashMode(false);
    if (saveCurrentFirst && this.grid.length > 0) {
      this.saveState();
    }

    this.size = newSize;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SIZE, String(this.size));

    // Update size selector buttons & board attribute
    this.sizeButtons.forEach((btn) => {
      const btnSize = parseInt(btn.getAttribute('data-size'), 10);
      btn.classList.toggle('active', btnSize === this.size);
    });
    this.boardContainer.setAttribute('data-grid-size', String(this.size));

    // Build background empty cells
    this.gridBackground.innerHTML = '';
    const totalCells = this.size * this.size;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      this.gridBackground.appendChild(cell);
    }

    // Load best tile for this grid size
    this.bestScore = parseInt(localStorage.getItem(STORAGE_KEYS.BEST_PREFIX + this.size), 10) || 0;

    // Load saved game state for this grid size or start fresh
    if (!this.loadState()) {
      this.startNewGame();
    } else {
      this.updateBestFromGrid();
      this.saveState();
      this.renderBoard(true);
      this.updateUI();
    }
  }

  getHighestTileOnBoard() {
    let maxTile = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r] && this.grid[r][c];
        if (tile && tile.value > maxTile) {
          maxTile = tile.value;
        }
      }
    }
    return maxTile;
  }

  updateBestFromGrid() {
    const highestOnBoard = this.getHighestTileOnBoard();
    if (highestOnBoard > this.bestScore) {
      this.bestScore = highestOnBoard;
    }
  }

  startNewGame() {
    this.setSmashMode(false);
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.score = 0;
    this.undosRemaining = INITIAL_UNDOS;
    this.smashesRemaining = INITIAL_SMASHES;
    this.unlockedMilestones = [];
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.over = false;

    this.spawnRandomTile();
    this.spawnRandomTile();
    this.updateBestFromGrid();

    this.saveState();
    this.renderBoard(true);
    this.updateUI();
  }

  saveState() {
    const serializedGrid = this.grid.map((row) =>
      row.map((tile) => (tile ? { value: tile.value } : null))
    );

    const serializedHistory = this.history.map((snap) => ({
      grid: snap.grid,
      score: snap.score,
      unlockedMilestones: snap.unlockedMilestones,
      won: snap.won,
      keepPlaying: snap.keepPlaying,
    }));

    const payload = {
      size: this.size,
      grid: serializedGrid,
      score: this.score,
      undosRemaining: this.undosRemaining,
      smashesRemaining: this.smashesRemaining,
      unlockedMilestones: this.unlockedMilestones,
      history: serializedHistory,
      won: this.won,
      keepPlaying: this.keepPlaying,
      over: this.over,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.STATE_PREFIX + this.size, JSON.stringify(payload));
      localStorage.setItem(STORAGE_KEYS.BEST_PREFIX + this.size, String(this.bestScore));
    } catch (e) {
      // Ignore quota errors
    }
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE_PREFIX + this.size);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.size !== this.size || !Array.isArray(data.grid)) return false;

      this.grid = data.grid.map((row, r) =>
        row.map((cell, c) =>
          cell
            ? {
                id: this.nextTileId++,
                value: cell.value,
                row: r,
                col: c,
                isNew: false,
                mergedFrom: null,
              }
            : null
        )
      );

      this.score = Number(data.score) || 0;
      this.undosRemaining =
        typeof data.undosRemaining === 'number' ? data.undosRemaining : INITIAL_UNDOS;
      this.smashesRemaining =
        typeof data.smashesRemaining === 'number' ? data.smashesRemaining : INITIAL_SMASHES;
      this.unlockedMilestones = Array.isArray(data.unlockedMilestones)
        ? data.unlockedMilestones
        : [];
      for (const milestoneVal of this.unlockedMilestones) {
        if (milestoneVal > this.bestScore) {
          this.bestScore = milestoneVal;
        }
      }
      this.history = Array.isArray(data.history) ? data.history : [];
      this.won = Boolean(data.won);
      this.keepPlaying = Boolean(data.keepPlaying);
      this.over = Boolean(data.over);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------------
     Core Board Mechanics (Spawn, Slide, Merge, Undo)
     ------------------------------------------------------------------------ */
  getEmptyCells() {
    const cells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.grid[r][c]) {
          cells.push({ r, c });
        }
      }
    }
    return cells;
  }

  spawnRandomTile() {
    const empty = this.getEmptyCells();
    if (empty.length === 0) return null;

    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;

    const tile = {
      id: this.nextTileId++,
      value,
      row: r,
      col: c,
      isNew: true,
      mergedFrom: null,
    };

    this.grid[r][c] = tile;
    return tile;
  }

  serializeGridValues() {
    return this.grid.map((row) => row.map((tile) => (tile ? tile.value : 0)));
  }

  move(direction) {
    // Block moves if overlay is active (either game over, or win screen awaiting decision)
    if (this.over || (this.won && !this.keepPlaying)) return;

    if (this.smashMode) {
      this.setSmashMode(false);
    }

    const vectors = {
      up: { dr: -1, dc: 0 },
      down: { dr: 1, dc: 0 },
      left: { dr: 0, dc: -1 },
      right: { dr: 0, dc: 1 },
    };

    const vector = vectors[direction];
    if (!vector) return;

    // Save snapshot prior to move in case tiles actually move
    const preMoveSnapshot = {
      grid: this.serializeGridValues(),
      score: this.score,
      unlockedMilestones: [...this.unlockedMilestones],
      won: this.won,
      keepPlaying: this.keepPlaying,
    };

    // Clear previous animation flags
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const t = this.grid[r][c];
        if (t) {
          t.isNew = false;
          t.mergedFrom = null;
        }
      }
    }

    const rowOrder = [...Array(this.size).keys()];
    const colOrder = [...Array(this.size).keys()];
    if (vector.dr === 1) rowOrder.reverse();
    if (vector.dc === 1) colOrder.reverse();

    let moved = false;
    let scoreDelta = 0;
    let maxMergedValue = 0;
    const newlyCreatedValues = [];

    for (const r of rowOrder) {
      for (const c of colOrder) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        let targetR = r;
        let targetC = c;
        let nextR = r + vector.dr;
        let nextC = c + vector.dc;

        while (
          nextR >= 0 &&
          nextR < this.size &&
          nextC >= 0 &&
          nextC < this.size &&
          !this.grid[nextR][nextC]
        ) {
          targetR = nextR;
          targetC = nextC;
          nextR += vector.dr;
          nextC += vector.dc;
        }

        const obstacle =
          nextR >= 0 && nextR < this.size && nextC >= 0 && nextC < this.size
            ? this.grid[nextR][nextC]
            : null;

        if (obstacle && obstacle.value === tile.value && !obstacle.mergedFrom) {
          // Merge into obstacle position
          const mergedValue = tile.value * 2;
          this.grid[r][c] = null;

          tile.row = nextR;
          tile.col = nextC;

          const mergedTile = {
            id: this.nextTileId++,
            value: mergedValue,
            row: nextR,
            col: nextC,
            isNew: false,
            mergedFrom: [tile, obstacle],
          };

          this.grid[nextR][nextC] = mergedTile;
          moved = true;
          scoreDelta += mergedValue;
          maxMergedValue = Math.max(maxMergedValue, mergedValue);
          newlyCreatedValues.push(mergedValue);
        } else if (targetR !== r || targetC !== c) {
          // Slide into furthest empty cell
          this.grid[r][c] = null;
          tile.row = targetR;
          tile.col = targetC;
          this.grid[targetR][targetC] = tile;
          moved = true;
        }
      }
    }

    if (!moved) return;

    // Record history for Undo
    this.history.push(preMoveSnapshot);
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.shift();
    }

    // Update score
    if (scoreDelta > 0) {
      this.score += scoreDelta;
      this.triggerScoreAddition(scoreDelta);
    }

    // Check milestones (8, 16, 32, ..., 8192...) & Win condition
    let earnedPowerup = false;
    let justWon = false;

    for (const val of newlyCreatedValues) {
      if (val >= WIN_TARGET && !this.won) {
        this.won = true;
        justWon = true;
      }

      if (MILESTONE_TILES.includes(val) && !this.unlockedMilestones.includes(val)) {
        this.unlockedMilestones.push(val);

        const gainedUndo = this.undosRemaining < MAX_UNDOS;
        if (gainedUndo) {
          this.undosRemaining++;
          this.pulseUndoBadge();
        }

        const isSmashMilestone = SMASH_MILESTONE_TILES.includes(val);
        const gainedSmash = isSmashMilestone && this.smashesRemaining < MAX_SMASHES;
        if (gainedSmash) {
          this.smashesRemaining++;
          this.pulseSmashBadge();
        }

        if (gainedUndo && gainedSmash) {
          earnedPowerup = true;
          this.showToast(`New ${val} tile! +1 Undo & +1 Smash`);
        } else if (gainedSmash) {
          earnedPowerup = true;
          this.showToast(`New ${val} tile! +1 Smash (${this.smashesRemaining}/${MAX_SMASHES})`);
        } else if (gainedUndo) {
          earnedPowerup = true;
          this.showToast(`New ${val} tile! +1 Undo (${this.undosRemaining}/${MAX_UNDOS})`);
        } else {
          this.showToast(`New ${val} tile unlocked!`);
          this.pulseUndoBadge();
        }
      }
    }

    // Spawn new tile and update Best Block for this grid size
    this.spawnRandomTile();
    this.updateBestFromGrid();

    // Check Game Over
    if (!this.hasMovesAvailable()) {
      this.over = true;
    }

    // Play audio
    if (justWon) {
      this.sound.playWinFanfare();
    } else if (earnedPowerup) {
      this.sound.playMilestone();
    } else if (maxMergedValue > 0) {
      this.sound.playMerge(maxMergedValue);
    } else {
      this.sound.playSlide();
    }

    this.saveState();
    this.renderBoard(false);
    this.updateUI();
  }

  getTileCount() {
    let count = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r] && this.grid[r][c]) count++;
      }
    }
    return count;
  }

  setSmashMode(active) {
    if (active && (this.smashesRemaining <= 0 || this.getTileCount() <= 1)) {
      return;
    }
    this.smashMode = Boolean(active);
    this.boardContainer.classList.toggle('smash-mode', this.smashMode);
    if (this.smashBtn) {
      this.smashBtn.classList.toggle('active', this.smashMode);
    }
    if (this.smashMode) {
      // Hide game over overlay if player clicked "Smash a Tile" from Game Over screen
      this.overlay.classList.add('hidden');
      this.showToast('Click any tile on the board to smash it!');
    } else {
      this.updateUI();
    }
  }

  toggleSmashMode() {
    this.setSmashMode(!this.smashMode);
  }

  smashTileAt(r, c) {
    if (!this.smashMode || this.smashesRemaining <= 0) return;
    const targetTile = this.grid[r] && this.grid[r][c];
    if (!targetTile) return;

    if (this.getTileCount() <= 1) {
      this.showToast('Cannot smash the last remaining tile!');
      this.setSmashMode(false);
      return;
    }

    // Save snapshot so Undo can revert a Smash if desired
    const preSmashSnapshot = {
      grid: this.serializeGridValues(),
      score: this.score,
      unlockedMilestones: [...this.unlockedMilestones],
      won: this.won,
      keepPlaying: this.keepPlaying,
    };
    this.history.push(preSmashSnapshot);
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.shift();
    }

    this.smashesRemaining--;
    this.grid[r][c] = null;
    this.over = false;

    const domEl = document.getElementById(`tile-${targetTile.id}`);
    if (domEl) {
      domEl.classList.add('tile-smashed');
    }

    this.sound.playSmash();
    this.setSmashMode(false);

    // If board was somehow still out of moves, re-check
    if (!this.hasMovesAvailable()) {
      this.over = true;
    }

    this.saveState();
    setTimeout(() => {
      this.renderBoard(false);
      this.updateUI();
    }, 150);
  }

  undo() {
    if (this.undosRemaining <= 0 || this.history.length === 0) return;

    this.setSmashMode(false);

    const prev = this.history.pop();
    this.undosRemaining--;

    this.grid = prev.grid.map((row, r) =>
      row.map((val, c) =>
        val > 0
          ? {
              id: this.nextTileId++,
              value: val,
              row: r,
              col: c,
              isNew: false,
              mergedFrom: null,
            }
          : null
      )
    );

    this.score = prev.score;
    // Keep unlockedMilestones intact so undoing and re-merging the same tile doesn't farm extra Undos
    this.won = prev.won;
    this.keepPlaying = prev.keepPlaying;
    this.over = false;

    this.sound.playUndo();
    this.saveState();
    this.renderBoard(true);
    this.updateUI();
  }

  hasMovesAvailable() {
    if (this.getEmptyCells().length > 0) return true;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const current = this.grid[r][c];
        if (!current) continue;
        if (r + 1 < this.size && this.grid[r + 1][c].value === current.value) return true;
        if (c + 1 < this.size && this.grid[r][c + 1].value === current.value) return true;
      }
    }
    return false;
  }

  /* ------------------------------------------------------------------------
     DOM Rendering & Smooth Tile Transitions
     ------------------------------------------------------------------------ */
  renderBoard(instant = false) {
    if (instant) {
      this.tileContainer.innerHTML = '';
    }

    const activeDomIds = new Set();

    const upsertTileElement = (tileObj, isGhost = false) => {
      const domId = `tile-${tileObj.id}`;
      activeDomIds.add(domId);

      let el = document.getElementById(domId);
      const digits = String(tileObj.value).length;
      const tierClass = tileObj.value <= 8192 ? `tile-${tileObj.value}` : 'tile-super';
      const digitClass = digits >= 3 ? `tile-digits-${Math.min(digits, 5)}` : '';

      if (!el) {
        el = document.createElement('div');
        el.id = domId;
        const inner = document.createElement('div');
        inner.className = 'tile-inner';
        inner.textContent = String(tileObj.value);
        el.appendChild(inner);
        this.tileContainer.appendChild(el);
      } else {
        const inner = el.querySelector('.tile-inner');
        if (inner && inner.textContent !== String(tileObj.value)) {
          inner.textContent = String(tileObj.value);
        }
      }

      const classes = ['tile', tierClass];
      if (digitClass) classes.push(digitClass);
      if (tileObj.isNew && !instant) classes.push('tile-new');
      if (tileObj.mergedFrom && !instant) classes.push('tile-merged');
      el.className = classes.join(' ');

      el.style.setProperty('--row', String(tileObj.row));
      el.style.setProperty('--col', String(tileObj.col));
      el.setAttribute('data-row', String(tileObj.row));
      el.setAttribute('data-col', String(tileObj.col));

      if (isGhost) {
        // Ghost tiles slide into the merged spot and get cleaned up after transition
        setTimeout(() => {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }, 125);
      }
    };

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        if (tile.mergedFrom && !instant) {
          tile.mergedFrom.forEach((sourceTile) => {
            upsertTileElement(sourceTile, true);
          });
        }
        upsertTileElement(tile, false);
      }
    }

    // Remove stale DOM tiles not present in activeDomIds
    Array.from(this.tileContainer.children).forEach((child) => {
      if (!activeDomIds.has(child.id)) {
        this.tileContainer.removeChild(child);
      }
    });
  }

  updateUI() {
    this.currentScoreEl.textContent = this.score.toLocaleString();
    this.bestScoreEl.textContent = this.bestScore.toLocaleString();
    this.undoCountEl.textContent = String(this.undosRemaining);
    this.undoBtn.disabled = this.undosRemaining <= 0 || this.history.length === 0;

    if (this.smashCountEl && this.smashBtn) {
      this.smashCountEl.textContent = String(this.smashesRemaining);
      this.smashBtn.disabled = this.smashesRemaining <= 0 || this.getTileCount() <= 1;
      this.smashBtn.classList.toggle('active', this.smashMode);
    }

    // Overlay handling
    if (this.smashMode) {
      this.overlay.classList.add('hidden');
      return;
    }

    if (this.won && !this.keepPlaying) {
      this.overlay.classList.remove('hidden');
      this.overlay.classList.add('win-state');
      this.overlayTitle.textContent = 'You reached 8192!';
      this.overlayMessage.textContent = 'Incredible mastery! Keep going for an even higher tile?';
      this.keepGoingBtn.classList.remove('hidden');
      this.overlayUndoBtn.classList.add('hidden');
      if (this.overlaySmashBtn) this.overlaySmashBtn.classList.add('hidden');
    } else if (this.over) {
      this.overlay.classList.remove('hidden');
      this.overlay.classList.remove('win-state');
      this.overlayTitle.textContent = 'Game Over!';
      const canUndo = this.undosRemaining > 0 && this.history.length > 0;
      const canSmash = this.smashesRemaining > 0 && this.getTileCount() > 1;
      this.overlayMessage.textContent =
        canUndo || canSmash
          ? 'No more moves—use a Power-Up or start fresh!'
          : 'No more moves available.';
      this.keepGoingBtn.classList.add('hidden');
      this.overlayUndoBtn.classList.toggle('hidden', !canUndo);
      if (this.overlaySmashBtn) {
        this.overlaySmashBtn.classList.toggle('hidden', !canSmash);
      }
    } else {
      this.overlay.classList.add('hidden');
      this.overlay.classList.remove('win-state');
    }
  }

  triggerScoreAddition(delta) {
    this.scoreAdditionEl.textContent = `+${delta}`;
    this.scoreAdditionEl.classList.remove('animate');
    // Force reflow to restart animation
    void this.scoreAdditionEl.offsetWidth;
    this.scoreAdditionEl.classList.add('animate');
  }

  pulseUndoBadge() {
    this.undoCountEl.classList.add('pulse');
    setTimeout(() => {
      this.undoCountEl.classList.remove('pulse');
    }, 450);
  }

  pulseSmashBadge() {
    if (!this.smashCountEl) return;
    this.smashCountEl.classList.add('pulse');
    setTimeout(() => {
      this.smashCountEl.classList.remove('pulse');
    }, 450);
  }

  showToast(message) {
    this.toastContainer.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2250);
  }

  /* ------------------------------------------------------------------------
     Event Listeners (Keyboard, Touch Swipes, Toolbar Buttons)
     ------------------------------------------------------------------------ */
  bindEvents() {
    // Grid Size Buttons
    this.sizeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetSize = parseInt(btn.getAttribute('data-size'), 10);
        if (targetSize !== this.size) {
          this.switchGridSize(targetSize, true);
        }
      });
    });

    // Toolbar Actions
    this.newGameBtn.addEventListener('click', () => this.startNewGame());
    this.tryAgainBtn.addEventListener('click', () => this.startNewGame());

    this.undoBtn.addEventListener('click', () => this.undo());
    this.overlayUndoBtn.addEventListener('click', () => this.undo());

    if (this.smashBtn) {
      this.smashBtn.addEventListener('click', () => this.toggleSmashMode());
    }
    if (this.overlaySmashBtn) {
      this.overlaySmashBtn.addEventListener('click', () => this.setSmashMode(true));
    }

    // Click on a tile when Smash Mode is active
    this.tileContainer.addEventListener('click', (e) => {
      if (!this.smashMode) return;
      const tileEl = e.target.closest('.tile');
      if (!tileEl) return;
      const r = parseInt(tileEl.getAttribute('data-row'), 10);
      const c = parseInt(tileEl.getAttribute('data-col'), 10);
      if (!Number.isNaN(r) && !Number.isNaN(c)) {
        e.stopPropagation();
        this.smashTileAt(r, c);
      }
    });

    this.keepGoingBtn.addEventListener('click', () => {
      this.keepPlaying = true;
      this.saveState();
      this.updateUI();
    });

    this.soundToggleBtn.addEventListener('click', () => {
      this.sound.toggle();
      this.updateSoundUI();
    });

    this.themeToggleBtn.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Keyboard Controls (Arrow keys, WASD, U/Backspace for Undo, X for Smash, Escape to cancel Smash, N for New Game)
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const keyMap = {
        ArrowUp: 'up',
        KeyW: 'up',
        ArrowDown: 'down',
        KeyS: 'down',
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
      };

      if (keyMap[e.code]) {
        e.preventDefault();
        this.move(keyMap[e.code]);
      } else if (e.code === 'KeyU' || e.code === 'Backspace') {
        e.preventDefault();
        this.undo();
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        this.toggleSmashMode();
      } else if (e.code === 'Escape' && this.smashMode) {
        e.preventDefault();
        this.setSmashMode(false);
      } else if (e.code === 'KeyN') {
        e.preventDefault();
        this.startNewGame();
      }
    });

    // Touch / Pointer Swipe Controls on the Board
    let touchStartX = 0;
    let touchStartY = 0;

    this.boardContainer.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    this.boardContainer.addEventListener(
      'touchmove',
      (e) => {
        // Prevent page scrolling while swiping inside the board
        e.preventDefault();
      },
      { passive: false }
    );

    this.boardContainer.addEventListener(
      'touchend',
      (e) => {
        if (e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 26) {
          if (absDx > absDy) {
            this.move(dx > 0 ? 'right' : 'left');
          } else {
            this.move(dy > 0 ? 'down' : 'up');
          }
        }
      },
      { passive: true }
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.game8192 = new Game8192();
});
