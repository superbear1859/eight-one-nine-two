/**
 * 8192 — Slide & Merge Puzzle Game
 * Supports 4x4, 5x5, and 6x6 grids with independent persistence,
 * milestone-earned Undo power-ups, smooth animations, and Web Audio SFX.
 */

const WIN_TARGET = 8192;

// Tile required on grid size `s` to unlock grid size `s + 1`
// 4x4 -> 5x5: 128, 5x5 -> 6x6: 256, 6x6 -> 7x7: 512, 7x7 -> 8x8: 1024, 8x8 -> 9x9: 2048, 9x9 -> 10x10: 4096
function getUnlockTargetForSize(size) {
  return 128 * Math.pow(2, size - 4);
}
const INITIAL_UNDOS = 3;
const MAX_UNDOS = 5;
const INITIAL_SMASHES = 2;
const MAX_SMASHES = 3;
const INITIAL_SWAPS = 2;
const MAX_SWAPS = 3;
const INITIAL_DOUBLES = 1;
const MAX_DOUBLES = 1;
const MAX_HISTORY_LENGTH = 100;
const SECRET_PASSWORD = 'superbearthegreat';
const SECRET_POWERUP_AMOUNT = 100;
const MILESTONE_TILES = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
const SMASH_MILESTONE_TILES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
const SWAP_MILESTONE_TILES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
const DOUBLE_MILESTONE_TILES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];

const THEMES = [
  'light',
  'dark',
  'rainbow-light',
  'rainbow-dark',
  'neon-light',
  'neon-dark',
  'neon-rainbow-light',
  'neon-rainbow-dark',
];
const THEME_LABELS = {
  light: 'Light',
  dark: 'Dark',
  'rainbow-light': 'Rainbow Light',
  'rainbow-dark': 'Rainbow Dark',
  'neon-light': 'Neon Light',
  'neon-dark': 'Neon Dark',
  'neon-rainbow-light': 'Neon Rainbow Light',
  'neon-rainbow-dark': 'Neon Rainbow Dark',
};

const STORAGE_KEYS = {
  STATE_PREFIX: 'game_8192_state_v1_',
  BEST_PREFIX: 'game_8192_best_tile_v1_',
  MAX_UNLOCKED_SIZE: 'game_8192_max_unlocked_size_v1',
  THEME: 'game_8192_theme_v1',
  SOUND: 'game_8192_sound_v1',
  MUSIC: 'game_8192_music_v1',
  ACTIVE_SIZE: 'game_8192_active_size_v1',
  SPLIT_SCREEN: 'game_8192_split_screen_v1',
};

// Theme-based background music definitions (Web Audio procedural soundtracks)
const THEME_MUSIC = {
  light: {
    name: 'Sunny Marimba',
    stepMs: 270,
    leadType: 'sine',
    leadGain: 0.038,
    leadDecay: 0.34,
    bassType: 'triangle',
    bassGain: 0.028,
    bassDecay: 0.45,
    lead: [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 587.33,
      523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0,
    ],
    bass: [
      261.63, 0, 261.63, 0, 220.0, 0, 220.0, 0,
      174.61, 0, 174.61, 0, 196.0, 0, 196.0, 0,
    ],
  },
  dark: {
    name: 'Midnight Lo-Fi',
    stepMs: 360,
    leadType: 'triangle',
    leadGain: 0.034,
    leadDecay: 0.55,
    bassType: 'sine',
    bassGain: 0.042,
    bassDecay: 0.65,
    lead: [
      440.0, 0, 523.25, 659.25, 587.33, 0, 523.25, 440.0,
      392.0, 0, 440.0, 523.25, 493.88, 0, 392.0, 0,
    ],
    bass: [
      110.0, 0, 0, 110.0, 146.83, 0, 0, 146.83,
      130.81, 0, 0, 130.81, 164.81, 0, 123.47, 0,
    ],
  },
  'rainbow-light': {
    name: 'Pastel Rainbow Breeze',
    stepMs: 225,
    leadType: 'sine',
    leadGain: 0.038,
    leadDecay: 0.3,
    bassType: 'triangle',
    bassGain: 0.03,
    bassDecay: 0.36,
    lead: [
      523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 880.0, 783.99,
      659.25, 783.99, 880.0, 1046.5, 1174.66, 1046.5, 880.0, 783.99,
    ],
    bass: [
      261.63, 0, 196.0, 0, 220.0, 0, 164.81, 0,
      174.61, 0, 261.63, 0, 196.0, 0, 246.94, 0,
    ],
  },
  // "Soon May the Wellerman Come" (Verse + Chorus in A minor, 16-step 16th-note grid)
  'rainbow-dark': {
    name: 'The Wellerman',
    stepMs: 145,
    leadType: 'sawtooth',
    leadGain: 0.028,
    leadDecay: 0.25,
    bassType: 'triangle',
    bassGain: 0.042,
    bassDecay: 0.26,
    lead: [
      // Verse Line 1: "(There) once was a ship that put to sea" — A4(4), A4(2), A4(2), C5(4), E5(4)
      440.0, 0, 0, 0, 440.0, 0, 440.0, 0,
      523.25, 0, 0, 0, 659.25, 0, 523.25, 440.0,
      // Verse Line 2: "(The) name of the ship was the Bil-ly o' Tea" — D5(4), D5(2), D5(2), D5(2), C5(2), B4(2), C5(2)
      587.33, 0, 0, 0, 587.33, 0, 587.33, 0,
      587.33, 0, 523.25, 0, 493.88, 0, 523.25, 440.0,
      // Verse Line 3: "(The) winds blew up, her bow dipped down" — A4(4), A4(2), A4(2), C5(4), E5(4)
      440.0, 0, 0, 0, 440.0, 0, 440.0, 0,
      523.25, 0, 0, 0, 659.25, 0, 0, 659.25,
      // Verse Line 4: "(Oh) blow, my bul-ly boys, blow (Huh!)" — E5(4), D5(2), C5(2), B4(4), A4(4)
      659.25, 0, 0, 0, 587.33, 0, 523.25, 0,
      493.88, 0, 0, 0, 440.0, 0, 0, 0,
      // Chorus Line 1: "Soon may the Wel-ler-man come" — F5(6), F5(2), C5(4), C5(4)
      698.46, 0, 0, 0, 0, 0, 698.46, 0,
      523.25, 0, 0, 0, 523.25, 0, 523.25, 587.33,
      // Chorus Line 2: "(To) bring us su-gar and tea and rum" — E5(4), E5(2), E5(2), E5(2), D5(2), C5(2), D5(2)
      659.25, 0, 0, 0, 659.25, 0, 659.25, 0,
      659.25, 0, 587.33, 0, 523.25, 0, 587.33, 0,
      // Chorus Line 3: "One day, when the tongu-ing is done" — F5(6), F5(2), C5(2), C5(2), C5(2), D5(2)
      698.46, 0, 0, 0, 0, 0, 698.46, 0,
      523.25, 0, 523.25, 0, 523.25, 0, 587.33, 0,
      // Chorus Line 4: "We'll take our leave and go!" — E5(4), D5(2), C5(2), B4(4), A4(4)
      659.25, 0, 0, 0, 587.33, 0, 523.25, 0,
      493.88, 0, 0, 0, 440.0, 0, 329.63, 0,
    ],
    bass: [
      // Verse Line 1: Am (A2 - E3)
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 0,
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 0,
      // Verse Line 2: Dm -> Am
      146.83, 0, 220.0, 0, 146.83, 0, 220.0, 0,
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 0,
      // Verse Line 3: Am
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 0,
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 0,
      // Verse Line 4: E -> Am
      164.81, 0, 246.94, 0, 164.81, 0, 246.94, 0,
      164.81, 0, 123.47, 0, 110.0, 0, 220.0, 0,
      // Chorus Line 1: F -> C
      174.61, 0, 261.63, 0, 174.61, 0, 261.63, 0,
      130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
      // Chorus Line 2: Dm -> Am
      146.83, 0, 220.0, 0, 146.83, 0, 220.0, 0,
      110.0, 0, 164.81, 0, 110.0, 0, 164.81, 0,
      // Chorus Line 3: F -> C
      174.61, 0, 261.63, 0, 174.61, 0, 261.63, 0,
      130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
      // Chorus Line 4: E -> Am
      164.81, 0, 246.94, 0, 164.81, 0, 246.94, 0,
      164.81, 0, 123.47, 0, 110.0, 0, 220.0, 0,
    ],
  },
  'neon-light': {
    name: 'Arcade Pop',
    stepMs: 185,
    leadType: 'triangle',
    leadGain: 0.036,
    leadDecay: 0.2,
    bassType: 'sawtooth',
    bassGain: 0.016,
    bassDecay: 0.19,
    lead: [
      659.25, 783.99, 987.77, 1318.51, 987.77, 783.99, 1174.66, 987.77,
      659.25, 783.99, 987.77, 1318.51, 1479.98, 1318.51, 1174.66, 987.77,
    ],
    bass: [
      164.81, 164.81, 0, 164.81, 220.0, 220.0, 0, 220.0,
      196.0, 196.0, 0, 196.0, 246.94, 246.94, 196.0, 0,
    ],
  },
  'neon-dark': {
    name: 'Cyberpunk Synthwave',
    stepMs: 165,
    leadType: 'sawtooth',
    leadGain: 0.02,
    leadDecay: 0.24,
    bassType: 'sawtooth',
    bassGain: 0.025,
    bassDecay: 0.16,
    lead: [
      587.33, 0, 698.46, 0, 880.0, 0, 698.46, 659.25,
      587.33, 0, 523.25, 0, 440.0, 523.25, 587.33, 0,
    ],
    bass: [
      146.83, 146.83, 293.66, 146.83, 116.54, 116.54, 233.08, 116.54,
      130.81, 130.81, 261.63, 130.81, 110.0, 110.0, 220.0, 138.59,
    ],
  },
  'neon-rainbow-light': {
    name: 'Rainbow Prism Chiptune',
    stepMs: 145,
    leadType: 'square',
    leadGain: 0.022,
    leadDecay: 0.18,
    bassType: 'triangle',
    bassGain: 0.03,
    bassDecay: 0.2,
    lead: [
      523.25, 659.25, 783.99, 1046.5, 1174.66, 1046.5, 783.99, 659.25,
      587.33, 739.99, 880.0, 1174.66, 1318.51, 1174.66, 880.0, 739.99,
      659.25, 783.99, 987.77, 1318.51, 1567.98, 1318.51, 987.77, 783.99,
      1046.5, 987.77, 880.0, 783.99, 659.25, 783.99, 1046.5, 0,
    ],
    bass: [
      261.63, 0, 196.0, 0, 261.63, 0, 196.0, 0,
      293.66, 0, 220.0, 0, 293.66, 0, 220.0, 0,
      329.63, 0, 246.94, 0, 329.63, 0, 246.94, 0,
      261.63, 0, 196.0, 0, 261.63, 196.0, 261.63, 0,
    ],
  },
  // Beverly Hills Cop Theme ("Axel F" by Harold Faltermeyer, 1984 — 16-step 16th-note grid in F minor)
  'neon-rainbow-dark': {
    name: 'Beverly Hills Cop (Axel F)',
    stepMs: 127,
    leadType: 'sawtooth',
    leadGain: 0.032,
    leadDecay: 0.22,
    bassType: 'sawtooth',
    bassGain: 0.028,
    bassDecay: 0.19,
    lead: [
      // Bar 1: F5 (2/16), rest (1/16), Ab5 (3/16), F5 (2/16), F5 (1/16), Bb5 (2/16), F5 (2/16), Eb5 (2/16), rest (1/16)
      698.46, 0, 0, 830.61, 0, 0, 698.46, 0,
      698.46, 932.33, 0, 698.46, 0, 622.25, 0, 0,
      // Bar 2: F5 (2/16), rest (1/16), C6 (3/16), F5 (2/16), F5 (1/16), Db6 (2/16), C6 (2/16), Ab5 (2/16), rest (1/16)
      698.46, 0, 0, 1046.5, 0, 0, 698.46, 0,
      698.46, 1108.73, 0, 1046.5, 0, 830.61, 0, 0,
      // Bar 3: F5 (2/16), C6 (2/16), F6 (2/16), F5 (1/16), Eb5 (2/16), Eb5 (1/16), C5 (2/16), G5 (2/16), F5 (2/16)
      698.46, 0, 1046.5, 0, 1396.91, 0, 698.46, 622.25,
      0, 622.25, 523.25, 0, 783.99, 0, 698.46, 0,
      // Bar 4: sustain / synth turnaround
      0, 0, 0, 0, 0, 0, 0, 0,
      523.25, 0, 622.25, 0, 698.46, 0, 0, 0,
    ],
    bass: [
      // Bar 1 (F minor octave synth bass)
      174.61, 0, 174.61, 349.23, 0, 174.61, 155.56, 0,
      174.61, 0, 349.23, 0, 155.56, 0, 174.61, 0,
      // Bar 2 (Eb / Db bass movement)
      155.56, 0, 155.56, 311.13, 0, 155.56, 138.59, 0,
      138.59, 0, 277.18, 0, 155.56, 0, 174.61, 0,
      // Bar 3 (Db -> Eb -> C -> F)
      138.59, 0, 277.18, 0, 155.56, 0, 311.13, 0,
      130.81, 0, 261.63, 0, 174.61, 0, 349.23, 0,
      // Bar 4 turnaround
      174.61, 0, 349.23, 174.61, 155.56, 0, 130.81, 0,
      138.59, 0, 155.56, 0, 174.61, 0, 349.23, 0,
    ],
  },
};

/* ==========================================================================
   Web Audio Synthesizer (Zero External Assets)
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
    this.enabled = savedSound !== null ? savedSound === 'true' : true;
    const savedMusic = localStorage.getItem(STORAGE_KEYS.MUSIC);
    if (savedMusic === 'false' || savedMusic === 'off') {
      this.musicMode = 'off';
    } else if (savedMusic === 'canon') {
      this.musicMode = 'canon';
    } else {
      this.musicMode = 'normal';
    }
    this.musicEnabled = this.musicMode !== 'off';
    this.currentTheme = 'light';
    this.musicTimer = null;
    this.canonTimeout = null;
    this.canonTimer = null;
    this.musicStep = 0;
    this.canonStep = 0;
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
    if (this.musicEnabled && !this.musicTimer) {
      this.startMusicLoop();
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

  toggleMusic() {
    const order = ['normal', 'canon', 'off'];
    const nextIdx = (order.indexOf(this.musicMode) + 1) % order.length;
    this.musicMode = order[nextIdx];
    this.musicEnabled = this.musicMode !== 'off';
    localStorage.setItem(STORAGE_KEYS.MUSIC, this.musicMode);

    if (this.musicEnabled) {
      this.initContext();
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }
    return this.musicMode;
  }

  setMusicTheme(theme) {
    const nextTheme = THEME_MUSIC[theme] ? theme : 'light';
    const changed = this.currentTheme !== nextTheme;
    this.currentTheme = nextTheme;
    if (this.musicEnabled && this.musicTimer && changed) {
      this.startMusicLoop();
    }
  }

  startMusicLoop() {
    this.stopMusicLoop();
    if (!this.musicEnabled) return;
    const track = THEME_MUSIC[this.currentTheme] || THEME_MUSIC.light;
    this.musicStep = 0;
    this.canonStep = 0;

    // Start 1st background music loop immediately
    this.playMusicStep('primary');
    this.musicTimer = setInterval(() => {
      this.playMusicStep('primary');
    }, track.stepMs);

    // In 2× Canon Mode, start a 2nd identical music loop 0.4 seconds (400ms) later so both keep playing over and over!
    if (this.musicMode === 'canon') {
      this.canonTimeout = setTimeout(() => {
        if (!this.musicEnabled || this.musicMode !== 'canon') return;
        this.playMusicStep('canon');
        this.canonTimer = setInterval(() => {
          this.playMusicStep('canon');
        }, track.stepMs);
      }, 400);
    }
  }

  stopMusicLoop() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.canonTimeout) {
      clearTimeout(this.canonTimeout);
      this.canonTimeout = null;
    }
    if (this.canonTimer) {
      clearInterval(this.canonTimer);
      this.canonTimer = null;
    }
  }

  playMusicStep(voice = 'primary') {
    if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
    const track = THEME_MUSIC[this.currentTheme] || THEME_MUSIC.light;
    let stepIdx;
    if (voice === 'canon') {
      stepIdx = this.canonStep % track.lead.length;
      this.canonStep++;
    } else {
      stepIdx = this.musicStep % track.lead.length;
      this.musicStep++;
    }

    const now = this.ctx.currentTime;
    const leadFreq = track.lead[stepIdx];
    const bassFreq = track.bass[stepIdx % track.bass.length];

    if (leadFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = track.leadType;
      osc.frequency.setValueAtTime(leadFreq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(track.leadGain, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + track.leadDecay);

      if (
        this.currentTheme === 'neon-dark' ||
        this.currentTheme === 'neon-rainbow-dark' ||
        this.currentTheme === 'rainbow-dark'
      ) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(
          this.currentTheme === 'neon-rainbow-dark'
            ? 2400
            : this.currentTheme === 'rainbow-dark'
            ? 1900
            : 1650,
          now
        );
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + track.leadDecay + 0.02);
    }

    if (bassFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = track.bassType;
      osc.frequency.setValueAtTime(bassFreq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(track.bassGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + track.bassDecay);

      if (
        this.currentTheme === 'neon-dark' ||
        this.currentTheme === 'neon-light' ||
        this.currentTheme === 'neon-rainbow-dark' ||
        this.currentTheme === 'neon-rainbow-light' ||
        this.currentTheme === 'rainbow-dark'
      ) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(520, now);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }

      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + track.bassDecay + 0.02);
    }
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

  playSwap() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [330, 493.88]; // E4 -> B4 whoosh
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.095);
    });
  }

  playDouble() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 880]; // A4 -> A5 octave power-up chime
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.11);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.125);
    });
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
   Main 8192 Game Controller (Supports Multiple Independent Screens)
   ========================================================================== */
class Game8192 {
  constructor(rootEl = document.getElementById('game-pane-1') || document, playerIndex = 1, sharedSound = null) {
    this.rootEl = rootEl;
    this.playerIndex = playerIndex;
    this.storageSuffix = playerIndex === 1 ? '' : `_p${playerIndex}`;
    this.tileIdPrefix = `p${playerIndex}-tile-`;
    this.sound = sharedSound || new SoundEngine();

    const q = (role, fallbackId) =>
      (this.rootEl.querySelector && this.rootEl.querySelector(`[data-role="${role}"]`)) ||
      document.getElementById(fallbackId);

    // DOM Elements scoped to this screen's container
    this.boardContainer = q('board-container', 'board-container');
    this.gridBackground = q('grid-background', 'grid-background');
    this.tileContainer = q('tile-container', 'tile-container');
    this.currentScoreEl = q('current-score', 'current-score');
    this.bestScoreEl = q('best-score', 'best-score');
    this.scoreAdditionEl = q('score-addition', 'score-addition');
    this.undoBtn = q('undo-btn', 'undo-btn');
    this.undoCountEl = q('undo-count', 'undo-count');
    this.smashBtn = q('smash-btn', 'smash-btn');
    this.smashCountEl = q('smash-count', 'smash-count');
    this.swapBtn = q('swap-btn', 'swap-btn');
    this.swapCountEl = q('swap-count', 'swap-count');
    this.doubleBtn = q('double-btn', 'double-btn');
    this.doubleCountEl = q('double-count', 'double-count');
    this.splitToggleBtn = q('split-toggle', 'split-toggle');
    this.splitLabelEl = q('split-label', 'split-label');
    this.battleToggleBtn = q('battle-toggle', 'battle-toggle');
    this.battleLabelEl = q('battle-label', 'battle-label');
    this.playerBadgeEl = q('player-badge', 'player-badge');
    this.newGameBtn = q('new-game-btn', 'new-game-btn');
    this.soundToggleBtn = q('sound-toggle', 'sound-toggle');
    this.musicToggleBtn = q('music-toggle', 'music-toggle');
    this.musicLabelEl = q('music-label', 'music-label');
    this.themeToggleBtn = q('theme-toggle', 'theme-toggle');
    this.themeLabelEl = q('theme-label', 'theme-label');
    this.guideBtn = q('guide-btn', 'guide-btn');
    this.guideModal = document.getElementById('guide-modal');
    this.guideCloseBtn = document.getElementById('guide-close-btn');
    this.secretBtn = q('secret-btn', 'secret-btn');
    this.secretModal = document.getElementById('secret-modal');
    this.secretCloseBtn = document.getElementById('secret-close-btn');
    this.secretForm = document.getElementById('secret-form');
    this.secretInput = document.getElementById('secret-input');
    this.toastContainer = q('toast-container', 'toast-container');

    // Overlay Elements
    this.overlay = q('game-overlay', 'game-overlay');
    this.overlayTitle = q('overlay-title', 'overlay-title');
    this.overlayMessage = q('overlay-message', 'overlay-message');
    this.keepGoingBtn = q('keep-going-btn', 'keep-going-btn');
    this.overlayUndoBtn = q('overlay-undo-btn', 'overlay-undo-btn');
    this.overlaySmashBtn = q('overlay-smash-btn', 'overlay-smash-btn');
    this.overlaySwapBtn = q('overlay-swap-btn', 'overlay-swap-btn');
    this.overlayDoubleBtn = q('overlay-double-btn', 'overlay-double-btn');
    this.tryAgainBtn = q('try-again-btn', 'try-again-btn');

    this.sizeButtons = Array.from(this.rootEl.querySelectorAll('.size-btn'));
    this.resetUnlocksBtn = q('reset-unlocks-btn', 'reset-unlocks-btn');

    // Internal State
    this.nextTileId = 1;
    this.maxUnlockedSize = this.computeMaxUnlockedSize();
    const savedSize = parseInt(localStorage.getItem(this.getActiveSizeKey()), 10);
    this.size =
      savedSize >= 4 && savedSize <= 10 && savedSize <= this.maxUnlockedSize ? savedSize : 4;

    this.grid = [];
    this.score = 0;
    this.bestScore = 0;
    this.undosRemaining = INITIAL_UNDOS;
    this.smashesRemaining = INITIAL_SMASHES;
    this.swapsRemaining = INITIAL_SWAPS;
    this.doublesRemaining = INITIAL_DOUBLES;
    this.powerupCapBroken = false;
    this.smashMode = false;
    this.swapMode = false;
    this.doubleMode = false;
    this.swapFirstTile = null;
    this.unlockedMilestones = [];
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.over = false;

    this.initTheme();
    this.updateSoundUI();
    this.updateMusicUI();
    this.updateSizeButtonsUI();
    this.bindEvents();
    this.switchGridSize(this.size, false);
  }

  getStateKey(size = this.size) {
    return `${STORAGE_KEYS.STATE_PREFIX}${size}${this.storageSuffix}`;
  }

  getBestKey(size = this.size) {
    return `${STORAGE_KEYS.BEST_PREFIX}${size}${this.storageSuffix}`;
  }

  getMaxUnlockedKey() {
    return `${STORAGE_KEYS.MAX_UNLOCKED_SIZE}${this.storageSuffix}`;
  }

  getActiveSizeKey() {
    return `${STORAGE_KEYS.ACTIVE_SIZE}${this.storageSuffix}`;
  }

  computeMaxUnlockedSize() {
    const saved = localStorage.getItem(this.getMaxUnlockedKey());
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      return Math.min(10, Math.max(4, parsed || 4));
    }
    let unlocked = 4;
    for (let s = 4; s < 10; s++) {
      const bestForSize = parseInt(localStorage.getItem(this.getBestKey(s)), 10) || 0;
      const requiredTile = getUnlockTargetForSize(s);
      if (bestForSize >= requiredTile && s >= unlocked) {
        unlocked = s + 1;
      } else if (s >= unlocked) {
        break;
      }
    }
    unlocked = Math.min(10, unlocked);
    localStorage.setItem(this.getMaxUnlockedKey(), String(unlocked));
    return unlocked;
  }

  resetGridUnlocks() {
    this.maxUnlockedSize = 4;
    localStorage.setItem(this.getMaxUnlockedKey(), '4');

    // Clear saved boards and best blocks so the player can re-unlock 5x5..10x10 cleanly
    for (let s = 4; s <= 10; s++) {
      localStorage.removeItem(this.getStateKey(s));
      localStorage.removeItem(this.getBestKey(s));
    }

    this.bestScore = 0;
    this.switchGridSize(4, false);
    this.startNewGame();
    this.updateSizeButtonsUI();
    this.showToast('Grid unlocks reset back to 4×4!');
  }

  updateSizeButtonsUI(newlyUnlockedSize = null) {
    const lockSvg = `<svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    this.sizeButtons.forEach((btn) => {
      const btnSize = parseInt(btn.getAttribute('data-size'), 10);
      const isUnlocked = btnSize <= this.maxUnlockedSize;
      btn.classList.toggle('active', btnSize === this.size);
      btn.classList.toggle('locked', !isUnlocked);
      if (isUnlocked) {
        btn.innerHTML = `${btnSize}×${btnSize}`;
        btn.title = `Play ${btnSize}×${btnSize} grid`;
      } else {
        const requiredTile = getUnlockTargetForSize(btnSize - 1);
        btn.innerHTML = `${lockSvg}<span>${btnSize}×${btnSize}</span>`;
        btn.title = `Locked — Reach the ${requiredTile} tile on ${btnSize - 1}×${btnSize - 1} to unlock!`;
      }
      if (newlyUnlockedSize === btnSize) {
        btn.classList.remove('newly-unlocked');
        void btn.offsetWidth;
        btn.classList.add('newly-unlocked');
      }
    });
  }

  /* ------------------------------------------------------------------------
     Theme & Sound Initialization
     ------------------------------------------------------------------------ */
  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const theme = THEMES.includes(savedTheme) ? savedTheme : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    this.sound.setMusicTheme(theme);
    this.updateThemeUI(theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const currentIndex = THEMES.indexOf(current);
    const next = THEMES[(currentIndex + 1) % THEMES.length];
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    this.sound.initContext();
    this.sound.setMusicTheme(next);
    this.updateThemeUI(next);
  }

  updateThemeUI(theme) {
    if (!this.themeToggleBtn) return;
    THEMES.forEach((t) => {
      const icon = this.themeToggleBtn.querySelector(`.theme-icon-${t}`);
      if (icon) {
        icon.classList.toggle('hidden', t !== theme);
      }
    });
    if (this.themeLabelEl) {
      this.themeLabelEl.textContent = THEME_LABELS[theme] || 'Light';
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

  updateMusicUI() {
    if (!this.musicToggleBtn) return;
    const onIcon = this.musicToggleBtn.querySelector('.music-on-icon');
    const offIcon = this.musicToggleBtn.querySelector('.music-off-icon');
    const mode = this.sound.musicMode || (this.sound.musicEnabled ? 'normal' : 'off');
    if (mode !== 'off') {
      onIcon.classList.remove('hidden');
      offIcon.classList.add('hidden');
    } else {
      onIcon.classList.add('hidden');
      offIcon.classList.remove('hidden');
    }
    this.musicToggleBtn.classList.toggle('canon-active', mode === 'canon');
    if (this.musicLabelEl) {
      this.musicLabelEl.textContent = mode === 'canon' ? '2×' : mode === 'normal' ? '1×' : 'Off';
    }
  }

  /* ------------------------------------------------------------------------
     Grid Setup & State Persistence per Size
     ------------------------------------------------------------------------ */
  switchGridSize(newSize, saveCurrentFirst = true) {
    if (newSize > this.maxUnlockedSize) {
      const requiredTile = getUnlockTargetForSize(newSize - 1);
      this.showToast(
        `Locked! Get a ${requiredTile} tile on ${newSize - 1}×${newSize - 1} to unlock ${newSize}×${newSize}!`
      );
      return;
    }

    this.setSmashMode(false);
    this.setSwapMode(false);
    this.setDoubleMode(false);
    if (saveCurrentFirst && this.grid.length > 0) {
      this.saveState();
    }

    this.size = newSize;
    localStorage.setItem(this.getActiveSizeKey(), String(this.size));

    // Update size selector buttons & board attribute
    this.updateSizeButtonsUI();
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
    this.bestScore = parseInt(localStorage.getItem(this.getBestKey(this.size)), 10) || 0;

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
    this.setSwapMode(false);
    this.setDoubleMode(false);
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));
    this.score = 0;
    this.undosRemaining = INITIAL_UNDOS;
    this.smashesRemaining = INITIAL_SMASHES;
    this.swapsRemaining = INITIAL_SWAPS;
    this.doublesRemaining = INITIAL_DOUBLES;
    this.powerupCapBroken = false;
    this.unlockedMilestones = [];
    this.history = [];
    this.won = false;
    this.keepPlaying = false;
    this.over = false;

    this.spawnRandomTile(1);
    this.spawnRandomTile(1);
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
      swapsRemaining: this.swapsRemaining,
      doublesRemaining: this.doublesRemaining,
      powerupCapBroken: this.powerupCapBroken,
      unlockedMilestones: this.unlockedMilestones,
      history: serializedHistory,
      won: this.won,
      keepPlaying: this.keepPlaying,
      over: this.over,
    };

    try {
      localStorage.setItem(this.getStateKey(this.size), JSON.stringify(payload));
      localStorage.setItem(this.getBestKey(this.size), String(this.bestScore));
    } catch (e) {
      // Ignore quota errors
    }
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.getStateKey(this.size));
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
      this.swapsRemaining =
        typeof data.swapsRemaining === 'number' ? data.swapsRemaining : INITIAL_SWAPS;
      this.doublesRemaining =
        typeof data.doublesRemaining === 'number' ? data.doublesRemaining : INITIAL_DOUBLES;
      this.powerupCapBroken =
        Boolean(data.powerupCapBroken) ||
        this.undosRemaining > MAX_UNDOS ||
        this.smashesRemaining > MAX_SMASHES ||
        this.swapsRemaining > MAX_SWAPS;
      if (!this.powerupCapBroken && this.doublesRemaining > MAX_DOUBLES) {
        this.doublesRemaining = MAX_DOUBLES;
      }
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

  hasUnmergedOnes() {
    let oneCount = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r] && this.grid[r][c] && this.grid[r][c].value === 1) {
          oneCount++;
        }
      }
    }
    return oneCount >= 2;
  }

  spawnRandomTile(forcedValue = null) {
    const empty = this.getEmptyCells();
    if (empty.length === 0) return null;

    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    const value =
      typeof forcedValue === 'number' ? forcedValue : Math.random() < 0.9 ? 2 : 4;

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
    if (this.swapMode) {
      this.setSwapMode(false);
    }
    if (this.doubleMode) {
      this.setDoubleMode(false);
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

        const gainedUndo = this.powerupCapBroken || this.undosRemaining < MAX_UNDOS;
        if (gainedUndo) {
          this.undosRemaining++;
          this.pulseUndoBadge();
        }

        const isSmashMilestone = SMASH_MILESTONE_TILES.includes(val);
        const gainedSmash =
          isSmashMilestone && (this.powerupCapBroken || this.smashesRemaining < MAX_SMASHES);
        if (gainedSmash) {
          this.smashesRemaining++;
          this.pulseSmashBadge();
        }

        const isSwapMilestone = SWAP_MILESTONE_TILES.includes(val);
        const gainedSwap =
          isSwapMilestone && (this.powerupCapBroken || this.swapsRemaining < MAX_SWAPS);
        if (gainedSwap) {
          this.swapsRemaining++;
          this.pulseSwapBadge();
        }

        const isDoubleMilestone = DOUBLE_MILESTONE_TILES.includes(val);
        const gainedDouble =
          isDoubleMilestone && (this.powerupCapBroken || this.doublesRemaining < MAX_DOUBLES);
        if (gainedDouble) {
          this.doublesRemaining++;
          this.pulseDoubleBadge();
        }

        const rewards = [];
        if (gainedUndo) rewards.push('+1 Undo');
        if (gainedSmash) rewards.push('+1 Smash');
        if (gainedSwap) rewards.push('+1 Swap');
        if (gainedDouble) rewards.push('+1 Double');

        if (rewards.length > 0) {
          earnedPowerup = true;
          this.showToast(`New ${val} tile! ${rewards.join(' & ')}`);
        } else {
          this.showToast(`New ${val} tile unlocked!`);
          this.pulseUndoBadge();
        }
      }
    }

    // Spawn new tile only once the starting two 1s have been put together
    if (!this.hasUnmergedOnes()) {
      this.spawnRandomTile();
    }
    this.updateBestFromGrid();

    // Check if reaching the target tile on this grid unlocks the next grid size
    const unlockRequirement = getUnlockTargetForSize(this.size);
    if (
      this.bestScore >= unlockRequirement &&
      this.size < 10 &&
      this.maxUnlockedSize === this.size
    ) {
      this.maxUnlockedSize = this.size + 1;
      localStorage.setItem(this.getMaxUnlockedKey(), String(this.maxUnlockedSize));
      this.updateSizeButtonsUI(this.maxUnlockedSize);
      earnedPowerup = true;
      this.showToast(`🎉 ${this.maxUnlockedSize}×${this.maxUnlockedSize} Grid Unlocked!`);
    }

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
    if (active && this.swapMode) {
      this.setSwapMode(false);
    }
    if (active && this.doubleMode) {
      this.setDoubleMode(false);
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

  setDoubleMode(active) {
    if (active && (this.doublesRemaining <= 0 || this.getTileCount() < 1)) {
      return;
    }
    if (active && this.smashMode) {
      this.setSmashMode(false);
    }
    if (active && this.swapMode) {
      this.setSwapMode(false);
    }
    this.doubleMode = Boolean(active);
    this.boardContainer.classList.toggle('double-mode', this.doubleMode);
    if (this.doubleBtn) {
      this.doubleBtn.classList.toggle('active', this.doubleMode);
    }
    if (this.doubleMode) {
      this.overlay.classList.add('hidden');
      this.showToast('Double Mode: Click any tile on the board to 2× its value!');
    } else {
      this.updateUI();
    }
  }

  toggleDoubleMode() {
    this.setDoubleMode(!this.doubleMode);
  }

  clearSwapSelectionHighlight() {
    Array.from(this.tileContainer.querySelectorAll('.swap-selected')).forEach((el) => {
      el.classList.remove('swap-selected');
    });
  }

  setSwapMode(active) {
    if (active && (this.swapsRemaining <= 0 || this.getTileCount() < 2)) {
      return;
    }
    if (active && this.smashMode) {
      this.setSmashMode(false);
    }
    if (active && this.doubleMode) {
      this.setDoubleMode(false);
    }
    this.swapMode = Boolean(active);
    this.swapFirstTile = null;
    this.clearSwapSelectionHighlight();
    this.boardContainer.classList.toggle('swap-mode', this.swapMode);
    if (this.swapBtn) {
      this.swapBtn.classList.toggle('active', this.swapMode);
    }
    if (this.swapMode) {
      this.overlay.classList.add('hidden');
      this.showToast('Swap Mode: Click the 1st tile to swap!');
    } else {
      this.updateUI();
    }
  }

  toggleSwapMode() {
    this.setSwapMode(!this.swapMode);
  }

  handleSwapTileClick(r, c) {
    if (!this.swapMode || this.swapsRemaining <= 0) return;
    const clickedTile = this.grid[r] && this.grid[r][c];
    if (!clickedTile) return;

    if (!this.swapFirstTile) {
      this.swapFirstTile = { r, c, id: clickedTile.id };
      const domEl = document.getElementById(`${this.tileIdPrefix}${clickedTile.id}`);
      if (domEl) {
        domEl.classList.add('swap-selected');
      }
      this.showToast('Now click a 2nd tile to swap positions!');
      return;
    }

    // Clicking the same tile again deselects it
    if (this.swapFirstTile.r === r && this.swapFirstTile.c === c) {
      this.swapFirstTile = null;
      this.clearSwapSelectionHighlight();
      this.showToast('Selection cleared — click the 1st tile to swap!');
      return;
    }

    const r1 = this.swapFirstTile.r;
    const c1 = this.swapFirstTile.c;
    const tile1 = this.grid[r1] && this.grid[r1][c1];
    const tile2 = clickedTile;

    if (!tile1 || !tile2) {
      this.setSwapMode(false);
      return;
    }

    // Save snapshot so Undo can revert a Swap if desired
    const preSwapSnapshot = {
      grid: this.serializeGridValues(),
      score: this.score,
      unlockedMilestones: [...this.unlockedMilestones],
      won: this.won,
      keepPlaying: this.keepPlaying,
    };
    this.history.push(preSwapSnapshot);
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.shift();
    }

    // Clear animation flags before swapping
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const t = this.grid[row][col];
        if (t) {
          t.isNew = false;
          t.mergedFrom = null;
        }
      }
    }

    // Swap positions in grid and update row/col so CSS transition slides them smoothly
    this.grid[r1][c1] = tile2;
    this.grid[r][c] = tile1;
    tile1.row = r;
    tile1.col = c;
    tile2.row = r1;
    tile2.col = c1;

    this.swapsRemaining--;
    this.over = false;

    this.sound.playSwap();
    this.setSwapMode(false);

    if (!this.hasMovesAvailable()) {
      this.over = true;
    }

    this.saveState();
    this.renderBoard(false);
    this.updateUI();
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

    const domEl = document.getElementById(`${this.tileIdPrefix}${targetTile.id}`);
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

  doubleTileAt(r, c) {
    if (!this.doubleMode || this.doublesRemaining <= 0) return;
    const targetTile = this.grid[r] && this.grid[r][c];
    if (!targetTile) return;

    // Save snapshot so Undo can revert a Double if desired
    const preDoubleSnapshot = {
      grid: this.serializeGridValues(),
      score: this.score,
      unlockedMilestones: [...this.unlockedMilestones],
      won: this.won,
      keepPlaying: this.keepPlaying,
    };
    this.history.push(preDoubleSnapshot);
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.shift();
    }

    // Clear previous animation flags
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const t = this.grid[row][col];
        if (t) {
          t.isNew = false;
          t.mergedFrom = null;
        }
      }
    }

    const newVal = targetTile.value * 2;
    targetTile.value = newVal;
    targetTile.mergedFrom = []; // Triggers pop animation without ghost tiles

    this.doublesRemaining--;
    this.score += newVal;
    this.triggerScoreAddition(newVal);
    this.over = false;

    let justWon = false;
    let unlockedNewGrid = false;

    if (newVal >= WIN_TARGET && !this.won) {
      this.won = true;
      justWon = true;
    }

    // Using a power-up does not grant new power-up charges
    if (MILESTONE_TILES.includes(newVal) && !this.unlockedMilestones.includes(newVal)) {
      this.unlockedMilestones.push(newVal);
      this.showToast(`New ${newVal} tile unlocked!`);
    }

    this.updateBestFromGrid();

    const unlockRequirement = getUnlockTargetForSize(this.size);
    if (
      this.bestScore >= unlockRequirement &&
      this.size < 10 &&
      this.maxUnlockedSize === this.size
    ) {
      this.maxUnlockedSize = this.size + 1;
      localStorage.setItem(this.getMaxUnlockedKey(), String(this.maxUnlockedSize));
      this.updateSizeButtonsUI(this.maxUnlockedSize);
      unlockedNewGrid = true;
      this.showToast(`🎉 ${this.maxUnlockedSize}×${this.maxUnlockedSize} Grid Unlocked!`);
    }

    if (justWon) {
      this.sound.playWinFanfare();
    } else if (unlockedNewGrid) {
      this.sound.playMilestone();
    } else {
      this.sound.playDouble();
    }

    this.setDoubleMode(false);

    if (!this.hasMovesAvailable()) {
      this.over = true;
    }

    this.saveState();
    this.renderBoard(false);
    this.updateUI();
  }

  undo() {
    if (this.undosRemaining <= 0 || this.history.length === 0) return;

    this.setSmashMode(false);
    this.setSwapMode(false);
    this.setDoubleMode(false);

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
      const domId = `${this.tileIdPrefix}${tileObj.id}`;
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

    if (this.swapCountEl && this.swapBtn) {
      this.swapCountEl.textContent = String(this.swapsRemaining);
      this.swapBtn.disabled = this.swapsRemaining <= 0 || this.getTileCount() < 2;
      this.swapBtn.classList.toggle('active', this.swapMode);
    }

    if (this.doubleCountEl && this.doubleBtn) {
      this.doubleCountEl.textContent = String(this.doublesRemaining);
      this.doubleBtn.disabled = this.doublesRemaining <= 0 || this.getTileCount() < 1;
      this.doubleBtn.classList.toggle('active', this.doubleMode);
    }

    // Overlay handling
    if (this.smashMode || this.swapMode || this.doubleMode) {
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
      if (this.overlaySwapBtn) this.overlaySwapBtn.classList.add('hidden');
      if (this.overlayDoubleBtn) this.overlayDoubleBtn.classList.add('hidden');
    } else if (this.over) {
      this.overlay.classList.remove('hidden');
      this.overlay.classList.remove('win-state');
      this.overlayTitle.textContent = 'Game Over!';
      const canUndo = this.undosRemaining > 0 && this.history.length > 0;
      const canSmash = this.smashesRemaining > 0 && this.getTileCount() > 1;
      const canSwap = this.swapsRemaining > 0 && this.getTileCount() >= 2;
      const canDouble = this.doublesRemaining > 0 && this.getTileCount() >= 1;
      this.overlayMessage.textContent =
        canUndo || canSmash || canSwap || canDouble
          ? 'No more moves—use a Power-Up or start fresh!'
          : 'No more moves available.';
      this.keepGoingBtn.classList.add('hidden');
      this.overlayUndoBtn.classList.toggle('hidden', !canUndo);
      if (this.overlaySmashBtn) {
        this.overlaySmashBtn.classList.toggle('hidden', !canSmash);
      }
      if (this.overlaySwapBtn) {
        this.overlaySwapBtn.classList.toggle('hidden', !canSwap);
      }
      if (this.overlayDoubleBtn) {
        this.overlayDoubleBtn.classList.toggle('hidden', !canDouble);
      }
    } else {
      this.overlay.classList.add('hidden');
      this.overlay.classList.remove('win-state');
    }

    if (typeof window.onBattlePlayerUpdate === 'function') {
      window.onBattlePlayerUpdate(this);
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

  pulseSwapBadge() {
    if (!this.swapCountEl) return;
    this.swapCountEl.classList.add('pulse');
    setTimeout(() => {
      this.swapCountEl.classList.remove('pulse');
    }, 450);
  }

  pulseDoubleBadge() {
    if (!this.doubleCountEl) return;
    this.doubleCountEl.classList.add('pulse');
    setTimeout(() => {
      this.doubleCountEl.classList.remove('pulse');
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

  openSecretModal() {
    if (!this.secretModal) return;
    window.activeSecretTargetGame = this;
    this.setSmashMode(false);
    this.setSwapMode(false);
    this.setDoubleMode(false);
    this.secretModal.classList.remove('hidden');
    if (this.secretInput) {
      this.secretInput.value = '';
      setTimeout(() => this.secretInput.focus(), 20);
    }
  }

  closeSecretModal() {
    if (!this.secretModal) return;
    this.secretModal.classList.add('hidden');
    if (this.secretInput) {
      this.secretInput.value = '';
      this.secretInput.blur();
    }
  }

  unlockSecretRewards() {
    this.powerupCapBroken = true;
    this.undosRemaining = SECRET_POWERUP_AMOUNT;
    this.smashesRemaining = SECRET_POWERUP_AMOUNT;
    this.swapsRemaining = SECRET_POWERUP_AMOUNT;
    this.doublesRemaining = SECRET_POWERUP_AMOUNT;

    this.maxUnlockedSize = 10;
    localStorage.setItem(this.getMaxUnlockedKey(), '10');
    this.updateSizeButtonsUI(10);

    this.pulseUndoBadge();
    this.pulseSmashBadge();
    this.pulseSwapBadge();
    this.pulseDoubleBadge();
    this.saveState();
    this.updateUI();
  }

  handleSecretPassword(rawPassword) {
    const cleaned = String(rawPassword || '').trim().toLowerCase();
    if (cleaned === SECRET_PASSWORD) {
      const games = Array.isArray(window.games8192) && window.games8192.length > 0 ? window.games8192 : [this];
      games.forEach((g) => g.unlockSecretRewards());
      this.sound.playWinFanfare();
      this.closeSecretModal();
      this.showToast('🐻 SUPERBEAR UNLOCKED! All grids (4×4–10×10) & 100 of every Power-Up!');
    } else {
      this.showToast('Wrong password!');
      if (this.secretInput) {
        this.secretInput.select();
      }
    }
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

    if (this.resetUnlocksBtn) {
      this.resetUnlocksBtn.addEventListener('click', () => {
        this.resetGridUnlocks();
      });
    }

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

    if (this.swapBtn) {
      this.swapBtn.addEventListener('click', () => this.toggleSwapMode());
    }
    if (this.overlaySwapBtn) {
      this.overlaySwapBtn.addEventListener('click', () => this.setSwapMode(true));
    }

    if (this.doubleBtn) {
      this.doubleBtn.addEventListener('click', () => this.toggleDoubleMode());
    }
    if (this.overlayDoubleBtn) {
      this.overlayDoubleBtn.addEventListener('click', () => this.setDoubleMode(true));
    }

    // Click on a tile when Smash Mode, Swap Mode, or Double Mode is active
    this.tileContainer.addEventListener('click', (e) => {
      if (!this.smashMode && !this.swapMode && !this.doubleMode) return;
      const tileEl = e.target.closest('.tile');
      if (!tileEl) return;
      const r = parseInt(tileEl.getAttribute('data-row'), 10);
      const c = parseInt(tileEl.getAttribute('data-col'), 10);
      if (!Number.isNaN(r) && !Number.isNaN(c)) {
        e.stopPropagation();
        if (this.smashMode) {
          this.smashTileAt(r, c);
        } else if (this.swapMode) {
          this.handleSwapTileClick(r, c);
        } else if (this.doubleMode) {
          this.doubleTileAt(r, c);
        }
      }
    });

    this.keepGoingBtn.addEventListener('click', () => {
      this.keepPlaying = true;
      this.saveState();
      this.updateUI();
    });

    this.soundToggleBtn.addEventListener('click', () => {
      this.sound.toggle();
      const games = Array.isArray(window.games8192) ? window.games8192 : [this];
      games.forEach((g) => g.updateSoundUI());
    });

    if (this.musicToggleBtn) {
      this.musicToggleBtn.addEventListener('click', () => {
        const mode = this.sound.toggleMusic();
        const games = Array.isArray(window.games8192) ? window.games8192 : [this];
        games.forEach((g) => g.updateMusicUI());
        const track = THEME_MUSIC[this.sound.currentTheme] || THEME_MUSIC.light;
        if (mode === 'canon') {
          this.showToast(`🎵🎵 2× Overlap Mode (+0.4s): ${track.name}`);
        } else if (mode === 'normal') {
          this.showToast(`🎵 Music On (1×): ${track.name}`);
        } else {
          this.showToast('🔇 Music Muted');
        }
      });
    }

    if (this.splitToggleBtn) {
      this.splitToggleBtn.addEventListener('click', () => {
        if (typeof window.toggleSplitScreen === 'function') {
          window.toggleSplitScreen();
        }
      });
    }

    if (this.battleToggleBtn) {
      this.battleToggleBtn.addEventListener('click', () => {
        if (typeof window.openBattleModal === 'function') {
          window.openBattleModal();
        }
      });
    }

    // Unlock Web Audio context on first pointer or key interaction so background music starts automatically
    const unlockAudioOnce = () => {
      this.sound.initContext();
      window.removeEventListener('pointerdown', unlockAudioOnce);
      window.removeEventListener('keydown', unlockAudioOnce);
    };
    window.addEventListener('pointerdown', unlockAudioOnce, { once: true });
    window.addEventListener('keydown', unlockAudioOnce, { once: true });

    this.themeToggleBtn.addEventListener('click', () => {
      this.toggleTheme();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const games = Array.isArray(window.games8192) ? window.games8192 : [this];
      games.forEach((g) => g.updateThemeUI(currentTheme));
    });

    if (this.guideBtn && this.guideModal) {
      this.guideBtn.addEventListener('click', () => {
        this.guideModal.classList.remove('hidden');
      });
    }
    if (this.secretBtn) {
      this.secretBtn.addEventListener('click', () => {
        this.openSecretModal();
      });
    }

    // Only bind shared modal & window-level keyboard listeners on Player 1 instance
    if (this.playerIndex === 1) {
      if (this.guideCloseBtn && this.guideModal) {
        this.guideCloseBtn.addEventListener('click', () => {
          this.guideModal.classList.add('hidden');
        });
      }
      if (this.guideModal) {
        this.guideModal.addEventListener('click', (e) => {
          if (e.target === this.guideModal) {
            this.guideModal.classList.add('hidden');
          }
        });
      }
      if (this.secretCloseBtn) {
        this.secretCloseBtn.addEventListener('click', () => {
          this.closeSecretModal();
        });
      }
      if (this.secretModal) {
        this.secretModal.addEventListener('click', (e) => {
          if (e.target === this.secretModal) {
            this.closeSecretModal();
          }
        });
      }
      if (this.secretForm) {
        this.secretForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const targetGame = window.activeSecretTargetGame || this;
          targetGame.handleSecretPassword(this.secretInput ? this.secretInput.value : '');
        });
      }

      // Keyboard Controls:
      // - 1-Screen Mode: Both WASD and Arrow Keys control Screen 1
      // - 2-Screen Split Mode: WASD controls Screen 1 (left/top), Arrow Keys control Screen 2 (right/bottom)
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const isSecretOpen = this.secretModal && !this.secretModal.classList.contains('hidden');
        if (isSecretOpen) {
          if (e.code === 'Escape') {
            e.preventDefault();
            this.closeSecretModal();
          }
          return;
        }

        const isGuideOpen = this.guideModal && !this.guideModal.classList.contains('hidden');
        if (isGuideOpen) {
          if (e.code === 'Escape' || e.code === 'KeyG') {
            e.preventDefault();
            this.guideModal.classList.add('hidden');
          }
          return;
        }

        const battleModal = document.getElementById('battle-modal');
        const battleResultsModal = document.getElementById('battle-results-modal');
        const isBattleModalOpen = battleModal && !battleModal.classList.contains('hidden');
        const isBattleResultsOpen =
          battleResultsModal && !battleResultsModal.classList.contains('hidden');
        if (isBattleModalOpen || isBattleResultsOpen) {
          if (e.code === 'Escape') {
            e.preventDefault();
            if (isBattleModalOpen) battleModal.classList.add('hidden');
            if (isBattleResultsOpen) battleResultsModal.classList.add('hidden');
          }
          return;
        }

        const screenCount = window.activeScreenCount || 1;
        const game1 = this;
        const game2 = window.game8192P2;
        const game3 = window.game8192P3;
        const game4 = window.game8192P4;

        const wasdMap = {
          KeyW: 'up',
          KeyS: 'down',
          KeyA: 'left',
          KeyD: 'right',
        };
        const arrowMap = {
          ArrowUp: 'up',
          ArrowDown: 'down',
          ArrowLeft: 'left',
          ArrowRight: 'right',
        };
        const ijklMap = {
          KeyI: 'up',
          KeyK: 'down',
          KeyJ: 'left',
          KeyL: 'right',
        };
        const tfghMap = {
          KeyT: 'up',
          KeyG: 'down',
          KeyF: 'left',
          KeyH: 'right',
        };

        if (wasdMap[e.code]) {
          e.preventDefault();
          game1.move(wasdMap[e.code]);
        } else if (arrowMap[e.code]) {
          e.preventDefault();
          if (screenCount >= 2 && game2) {
            game2.move(arrowMap[e.code]);
          } else {
            game1.move(arrowMap[e.code]);
          }
        } else if (screenCount >= 3 && ijklMap[e.code] && game3) {
          e.preventDefault();
          game3.move(ijklMap[e.code]);
        } else if (screenCount >= 4 && tfghMap[e.code] && game4) {
          e.preventDefault();
          game4.move(tfghMap[e.code]);
        } else if (e.code === 'KeyU' || e.code === 'Backspace') {
          e.preventDefault();
          game1.undo();
        } else if (e.code === 'KeyX') {
          e.preventDefault();
          game1.toggleSmashMode();
        } else if (e.code === 'KeyC') {
          e.preventDefault();
          game1.toggleSwapMode();
        } else if (e.code === 'KeyV') {
          e.preventDefault();
          game1.toggleDoubleMode();
        } else if (e.code === 'KeyP') {
          e.preventDefault();
          if (typeof window.toggleSplitScreen === 'function') {
            window.toggleSplitScreen();
          }
        } else if (e.code === 'KeyB') {
          e.preventDefault();
          if (typeof window.openBattleModal === 'function') {
            window.openBattleModal();
          }
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          const mode = this.sound.toggleMusic();
          const games = Array.isArray(window.games8192) ? window.games8192 : [this];
          games.forEach((g) => g.updateMusicUI());
          const track = THEME_MUSIC[this.sound.currentTheme] || THEME_MUSIC.light;
          if (mode === 'canon') {
            this.showToast(`🎵🎵 2× Overlap Mode (+0.4s): ${track.name}`);
          } else if (mode === 'normal') {
            this.showToast(`🎵 Music On (1×): ${track.name}`);
          } else {
            this.showToast('🔇 Music Muted');
          }
        } else if (e.code === 'KeyG') {
          e.preventDefault();
          if (this.guideModal) {
            this.guideModal.classList.remove('hidden');
          }
        } else if (e.code === 'Escape') {
          const games = Array.isArray(window.games8192) ? window.games8192 : [this];
          games.forEach((g) => {
            if (g.smashMode || g.swapMode || g.doubleMode) {
              e.preventDefault();
              g.setSmashMode(false);
              g.setSwapMode(false);
              g.setDoubleMode(false);
            }
          });
        } else if (e.code === 'KeyN') {
          e.preventDefault();
          game1.startNewGame();
        }
      });
    }

    // Independent Multi-Touch & Mouse Drag Swipe Controls scoped to THIS board only
    // Using touch identifier tracking so two players can swipe both boards simultaneously on the same screen!
    let activeTouchId = null;
    let touchStartX = 0;
    let touchStartY = 0;

    this.boardContainer.addEventListener(
      'touchstart',
      (e) => {
        if (activeTouchId !== null || e.changedTouches.length === 0) return;
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );

    this.boardContainer.addEventListener(
      'touchmove',
      (e) => {
        // Prevent page scrolling while swiping inside this board
        e.preventDefault();
      },
      { passive: false }
    );

    const handleTouchFinish = (e) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId) {
          activeTouchId = null;
          const dx = touch.clientX - touchStartX;
          const dy = touch.clientY - touchStartY;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (Math.max(absDx, absDy) > 26) {
            if (absDx > absDy) {
              this.move(dx > 0 ? 'right' : 'left');
            } else {
              this.move(dy > 0 ? 'down' : 'up');
            }
          }
          break;
        }
      }
    };

    this.boardContainer.addEventListener('touchend', handleTouchFinish, { passive: true });
    this.boardContainer.addEventListener(
      'touchcancel',
      () => {
        activeTouchId = null;
      },
      { passive: true }
    );

    // Also allow mouse drag-swiping on each individual board
    let mouseDown = false;
    let mouseStartX = 0;
    let mouseStartY = 0;

    this.boardContainer.addEventListener('mousedown', (e) => {
      if (this.smashMode || this.swapMode || this.doubleMode) return;
      mouseDown = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) > 30) {
        if (absDx > absDy) {
          this.move(dx > 0 ? 'right' : 'left');
        } else {
          this.move(dy > 0 ? 'down' : 'up');
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('split-screen-wrapper');
  const pane1 = document.getElementById('game-pane-1');

  const createClonedPane = (playerNum, badgeLabel) => {
    const clonedPane = pane1.cloneNode(true);
    clonedPane.id = `game-pane-${playerNum}`;
    clonedPane.setAttribute('data-player', String(playerNum));
    clonedPane.classList.add('hidden');
    // Remove duplicate element IDs inside cloned pane (Game8192 uses data-role queries)
    Array.from(clonedPane.querySelectorAll('[id]')).forEach((el) => {
      if (el !== clonedPane) {
        el.removeAttribute('id');
      }
    });
    const badge = clonedPane.querySelector('[data-role="player-badge"]');
    if (badge) {
      badge.textContent = badgeLabel;
    }
    wrapper.appendChild(clonedPane);
    return clonedPane;
  };

  // Clone Screen 1 template before initializing so Screens 2, 3, and 4 start with clean markup
  const pane2 = createClonedPane(2, 'P2 • Arrows / Swipe');
  const pane3 = createClonedPane(3, 'P3 • IJKL / Swipe');
  const pane4 = createClonedPane(4, 'P4 • TFGH / Swipe');

  const game1 = new Game8192(pane1, 1, null);
  const game2 = new Game8192(pane2, 2, game1.sound);
  const game3 = new Game8192(pane3, 3, game1.sound);
  const game4 = new Game8192(pane4, 4, game1.sound);

  window.game8192 = game1;
  window.game8192P2 = game2;
  window.game8192P3 = game3;
  window.game8192P4 = game4;
  window.games8192 = [game1, game2, game3, game4];

  const extraPanes = [
    { num: 2, el: pane2 },
    { num: 3, el: pane3 },
    { num: 4, el: pane4 },
  ];

  const applyScreenCount = (rawCount) => {
    const count = Math.min(4, Math.max(1, Number(rawCount) || 1));
    window.activeScreenCount = count;
    window.isSplitScreenActive = count > 1;
    localStorage.setItem(STORAGE_KEYS.SPLIT_SCREEN, String(count));

    wrapper.setAttribute('data-screen-count', String(count));
    wrapper.classList.toggle('split-active', count > 1);

    extraPanes.forEach(({ num, el }) => {
      el.classList.toggle('hidden', num > count);
    });

    window.games8192.forEach((g) => {
      if (g.playerBadgeEl) {
        g.playerBadgeEl.classList.toggle('hidden', count === 1);
      }
      if (g.splitToggleBtn) {
        g.splitToggleBtn.classList.toggle('active', count > 1);
      }
      if (g.splitLabelEl) {
        g.splitLabelEl.textContent = count === 1 ? '1 Screen' : `${count} Screens`;
      }
    });
  };

  window.toggleSplitScreen = () => {
    const current = window.activeScreenCount || 1;
    const nextCount = current >= 4 ? 1 : current + 1;
    applyScreenCount(nextCount);
    if (nextCount === 1) {
      game1.showToast('1-Screen Mode Active');
    } else {
      game1.showToast(`🎮 ${nextCount}-Screen Mode On! Swipe any board independently!`);
    }
  };

  const savedRaw = localStorage.getItem(STORAGE_KEYS.SPLIT_SCREEN);
  let initialCount = 1;
  if (savedRaw === 'true') {
    initialCount = 2;
  } else if (savedRaw === '2' || savedRaw === '3' || savedRaw === '4') {
    initialCount = Number(savedRaw);
  }
  applyScreenCount(initialCount);

  /* ------------------------------------------------------------------------
     Split-Screen Battle Mode Controller
     ------------------------------------------------------------------------ */
  const battleHud = document.getElementById('battle-hud');
  const battleHudMode = document.getElementById('battle-hud-mode');
  const battleHudTimer = document.getElementById('battle-hud-timer');
  const battleHudStandings = document.getElementById('battle-hud-standings');
  const battleRestartBtn = document.getElementById('battle-restart-btn');
  const battleStopBtn = document.getElementById('battle-stop-btn');

  const battleModal = document.getElementById('battle-modal');
  const battleCloseBtn = document.getElementById('battle-close-btn');
  const battleDurationGroup = document.getElementById('battle-duration-group');
  const battleStartBtn = document.getElementById('battle-start-btn');

  const battleResultsModal = document.getElementById('battle-results-modal');
  const battleResultsCloseBtn = document.getElementById('battle-results-close-btn');
  const battleWinnerBanner = document.getElementById('battle-winner-banner');
  const battleWinnerSub = document.getElementById('battle-winner-sub');
  const battleScoreboard = document.getElementById('battle-scoreboard');
  const battleRematchBtn = document.getElementById('battle-rematch-btn');
  const battleChangeModeBtn = document.getElementById('battle-change-mode-btn');
  const battleExitBtn = document.getElementById('battle-exit-btn');

  const battleState = {
    active: false,
    finished: false,
    type: 'timer', // 'timer' (Highest Number Timed) | 'race10' (Race to 10x10 Grid)
    players: 2,
    durationSec: 120,
    remainingSec: 120,
    elapsedSec: 0,
    intervalId: null,
  };

  const formatClock = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getActiveBattleGames = () => {
    return window.games8192.slice(0, battleState.players);
  };

  const comparePlayersForBattle = (a, b) => {
    if (battleState.type === 'race10') {
      // Rank by highest unlocked grid size, then current grid size, then highest tile on board, then score
      if (b.maxUnlockedSize !== a.maxUnlockedSize) {
        return b.maxUnlockedSize - a.maxUnlockedSize;
      }
      if (b.size !== a.size) {
        return b.size - a.size;
      }
      const maxA = a.getHighestTileOnBoard();
      const maxB = b.getHighestTileOnBoard();
      if (maxB !== maxA) return maxB - maxA;
      return b.score - a.score;
    }
    // 'timer': Highest tile on board wins (or bestScore during this battle), tie-breaker is score
    const tileA = Math.max(a.getHighestTileOnBoard(), a.bestScore);
    const tileB = Math.max(b.getHighestTileOnBoard(), b.bestScore);
    if (tileB !== tileA) return tileB - tileA;
    return b.score - a.score;
  };

  const updateBattleHud = () => {
    if (!battleState.active || !battleHud) return;

    const participants = getActiveBattleGames();
    const ranked = [...participants].sort(comparePlayersForBattle);
    const topPlayer = ranked[0];

    // Highlight leader board(s)
    window.games8192.forEach((g) => {
      const isParticipant = g.playerIndex <= battleState.players;
      const isTiedForFirst =
        isParticipant && topPlayer && comparePlayersForBattle(g, topPlayer) === 0;
      g.rootEl.classList.toggle('battle-leader', Boolean(isTiedForFirst));
    });

    // Render live standings chips
    if (battleHudStandings) {
      battleHudStandings.innerHTML = participants
        .map((g) => {
          const isLeader = topPlayer && comparePlayersForBattle(g, topPlayer) === 0;
          const highestTile = Math.max(g.getHighestTileOnBoard(), g.bestScore);
          const statText =
            battleState.type === 'race10'
              ? `${g.maxUnlockedSize}×${g.maxUnlockedSize} • Tile ${highestTile}`
              : `Tile ${highestTile} (${g.score.toLocaleString()} pts)`;
          return `<div class="battle-player-chip ${isLeader ? 'leader' : ''}" data-player="${g.playerIndex}">
            <span class="battle-chip-tag">P${g.playerIndex}</span>
            <span>${statText}</span>
            ${isLeader ? '<span>👑</span>' : ''}
          </div>`;
        })
        .join('');
    }
  };

  const clearBattleTimer = () => {
    if (battleState.intervalId) {
      clearInterval(battleState.intervalId);
      battleState.intervalId = null;
    }
  };

  const finishBattle = (reasonText = '') => {
    if (!battleState.active || battleState.finished) return;
    battleState.finished = true;
    clearBattleTimer();

    const participants = getActiveBattleGames();
    const ranked = [...participants].sort(comparePlayersForBattle);
    const winner = ranked[0];

    // Check if there is a tie for 1st
    const tiedWinners = ranked.filter((g) => comparePlayersForBattle(g, winner) === 0);

    // Pause all boards by showing their win/over overlay or blocking moves
    participants.forEach((g) => {
      g.over = true;
    });

    game1.sound.playWinFanfare();

    if (battleWinnerBanner) {
      if (tiedWinners.length > 1) {
        const names = tiedWinners.map((g) => `Player ${g.playerIndex}`).join(' & ');
        battleWinnerBanner.textContent = `🤝 Draw: ${names}!`;
      } else {
        battleWinnerBanner.textContent = `🏆 Player ${winner.playerIndex} Wins the Battle!`;
      }
    }

    if (battleWinnerSub) {
      const winnerTile = Math.max(winner.getHighestTileOnBoard(), winner.bestScore);
      if (reasonText) {
        battleWinnerSub.textContent = reasonText;
      } else if (battleState.type === 'race10') {
        battleWinnerSub.textContent = `Reached the ${winner.maxUnlockedSize}×${winner.maxUnlockedSize} grid in ${formatClock(battleState.elapsedSec)}!`;
      } else {
        battleWinnerSub.textContent = `Highest Tile: ${winnerTile} • Score: ${winner.score.toLocaleString()} pts`;
      }
    }

    if (battleScoreboard) {
      battleScoreboard.innerHTML = ranked
        .map((g, idx) => {
          const isWinner = comparePlayersForBattle(g, winner) === 0;
          const highestTile = Math.max(g.getHighestTileOnBoard(), g.bestScore);
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
          return `<div class="battle-score-row ${isWinner ? 'winner' : ''}">
            <div>
              <span class="battle-score-rank">${medal}</span>
              <span>Player ${g.playerIndex}</span>
            </div>
            <div class="battle-score-stats">
              <span>Grid: <strong>${g.maxUnlockedSize}×${g.maxUnlockedSize}</strong></span>
              <span>Best Tile: <strong>${highestTile}</strong></span>
              <span>Score: <strong>${g.score.toLocaleString()}</strong></span>
            </div>
          </div>`;
        })
        .join('');
    }

    if (battleResultsModal) {
      battleResultsModal.classList.remove('hidden');
    }
  };

  const stopBattleMode = () => {
    clearBattleTimer();
    battleState.active = false;
    battleState.finished = false;

    if (battleHud) battleHud.classList.add('hidden');
    if (battleResultsModal) battleResultsModal.classList.add('hidden');

    window.games8192.forEach((g) => {
      g.rootEl.classList.remove('battle-leader');
      if (g.battleToggleBtn) {
        g.battleToggleBtn.classList.remove('active');
      }
    });
  };

  const startBattleMatch = () => {
    clearBattleTimer();
    battleState.active = true;
    battleState.finished = false;
    battleState.remainingSec = battleState.durationSec;
    battleState.elapsedSec = 0;

    if (battleModal) battleModal.classList.add('hidden');
    if (battleResultsModal) battleResultsModal.classList.add('hidden');

    // Switch to the chosen number of split screens (2, 3, or 4)
    applyScreenCount(battleState.players);

    const participants = getActiveBattleGames();
    participants.forEach((g) => {
      if (battleState.type === 'race10') {
        // Reset everyone to 4x4 so it's a fair race to unlock & reach 10x10!
        g.maxUnlockedSize = 4;
        localStorage.setItem(g.getMaxUnlockedKey(), '4');
        for (let s = 4; s <= 10; s++) {
          localStorage.removeItem(g.getStateKey(s));
          localStorage.removeItem(g.getBestKey(s));
        }
        g.bestScore = 0;
        g.switchGridSize(4, false);
        g.startNewGame();
        g.updateSizeButtonsUI();
      } else {
        // Highest Number Timed Battle: start a fresh game on the same starting 4x4 grid with fresh bestScore for the match
        g.bestScore = 0;
        g.switchGridSize(4, false);
        g.startNewGame();
      }
    });

    window.games8192.forEach((g) => {
      if (g.battleToggleBtn) {
        g.battleToggleBtn.classList.add('active');
      }
    });

    if (battleHud) {
      battleHud.classList.remove('hidden');
    }
    if (battleHudMode) {
      battleHudMode.textContent =
        battleState.type === 'race10'
          ? '🏁 Race to 10×10 Grid'
          : '⏱️ Highest Number Battle';
    }
    if (battleHudTimer) {
      battleHudTimer.classList.remove('urgent');
      battleHudTimer.textContent =
        battleState.type === 'race10'
          ? formatClock(0)
          : formatClock(battleState.remainingSec);
    }

    updateBattleHud();

    battleState.intervalId = setInterval(() => {
      if (!battleState.active || battleState.finished) return;
      if (battleState.type === 'timer') {
        battleState.remainingSec--;
        if (battleHudTimer) {
          battleHudTimer.textContent = formatClock(battleState.remainingSec);
          battleHudTimer.classList.toggle('urgent', battleState.remainingSec <= 15);
        }
        if (battleState.remainingSec <= 0) {
          finishBattle("⏰ Time's Up!");
        }
      } else {
        battleState.elapsedSec++;
        if (battleHudTimer) {
          battleHudTimer.textContent = formatClock(battleState.elapsedSec);
        }
      }
    }, 1000);

    game1.showToast(
      battleState.type === 'race10'
        ? `🏁 Battle Started! First player to unlock 10×10 wins!`
        : `⚔️ Battle Started! Get the highest tile in ${formatClock(battleState.durationSec)}!`
    );
  };

  window.onBattlePlayerUpdate = (updatedGame) => {
    if (!battleState.active || battleState.finished) return;
    if (updatedGame.playerIndex > battleState.players) return;

    updateBattleHud();

    // Check instant win condition in Race to 10x10 mode
    if (
      battleState.type === 'race10' &&
      (updatedGame.maxUnlockedSize >= 10 || updatedGame.size >= 10)
    ) {
      finishBattle(
        `🏁 Player ${updatedGame.playerIndex} unlocked the 10×10 grid first in ${formatClock(battleState.elapsedSec)}!`
      );
    }
  };

  window.openBattleModal = () => {
    if (!battleModal) return;
    // Sync default player count pill with active split screen count if >= 2
    if (window.activeScreenCount >= 2 && !battleState.active) {
      battleState.players = window.activeScreenCount;
      Array.from(document.querySelectorAll('[data-battle-players]')).forEach((btn) => {
        btn.classList.toggle(
          'active',
          Number(btn.getAttribute('data-battle-players')) === battleState.players
        );
      });
    }
    battleModal.classList.remove('hidden');
  };

  // Bind Battle Modal option buttons
  Array.from(document.querySelectorAll('[data-battle-type]')).forEach((btn) => {
    btn.addEventListener('click', () => {
      battleState.type = btn.getAttribute('data-battle-type') || 'timer';
      Array.from(document.querySelectorAll('[data-battle-type]')).forEach((b) =>
        b.classList.toggle('active', b === btn)
      );
      if (battleDurationGroup) {
        battleDurationGroup.classList.toggle('hidden', battleState.type !== 'timer');
      }
    });
  });

  Array.from(document.querySelectorAll('[data-battle-players]')).forEach((btn) => {
    btn.addEventListener('click', () => {
      battleState.players = Number(btn.getAttribute('data-battle-players')) || 2;
      Array.from(document.querySelectorAll('[data-battle-players]')).forEach((b) =>
        b.classList.toggle('active', b === btn)
      );
    });
  });

  Array.from(document.querySelectorAll('[data-battle-seconds]')).forEach((btn) => {
    btn.addEventListener('click', () => {
      battleState.durationSec = Number(btn.getAttribute('data-battle-seconds')) || 120;
      Array.from(document.querySelectorAll('[data-battle-seconds]')).forEach((b) =>
        b.classList.toggle('active', b === btn)
      );
    });
  });

  if (battleCloseBtn && battleModal) {
    battleCloseBtn.addEventListener('click', () => battleModal.classList.add('hidden'));
    battleModal.addEventListener('click', (e) => {
      if (e.target === battleModal) battleModal.classList.add('hidden');
    });
  }

  if (battleStartBtn) {
    battleStartBtn.addEventListener('click', () => startBattleMatch());
  }

  if (battleRestartBtn) {
    battleRestartBtn.addEventListener('click', () => startBattleMatch());
  }

  if (battleStopBtn) {
    battleStopBtn.addEventListener('click', () => {
      stopBattleMode();
      game1.showToast('Battle Mode Ended');
    });
  }

  if (battleResultsCloseBtn && battleResultsModal) {
    battleResultsCloseBtn.addEventListener('click', () =>
      battleResultsModal.classList.add('hidden')
    );
  }

  if (battleRematchBtn) {
    battleRematchBtn.addEventListener('click', () => startBattleMatch());
  }

  if (battleChangeModeBtn) {
    battleChangeModeBtn.addEventListener('click', () => {
      if (battleResultsModal) battleResultsModal.classList.add('hidden');
      if (battleModal) battleModal.classList.remove('hidden');
    });
  }

  if (battleExitBtn) {
    battleExitBtn.addEventListener('click', () => {
      stopBattleMode();
      game1.showToast('Exited Battle Mode');
    });
  }
});
