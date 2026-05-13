/**
 * Game sound effects via the Web Audio API (shared AudioContext).
 * Buzzer for "Lost on Time!", byo-yomi period chime, turn-end tap chirp, etc.
 */

let audioCtx = null;
let enabled = true;
let visibilityHookInstalled = false;

function getCtx() {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  installVisibilityResumeHook();
  return audioCtx;
}

function installVisibilityResumeHook() {
  if (visibilityHookInstalled || typeof document === 'undefined') return;
  visibilityHookInstalled = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !audioCtx || audioCtx.state === 'closed') {
      return;
    }
    if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
      void audioCtx.resume();
    }
  });
}

/**
 * iOS Safari unlock: start a graph node synchronously inside the user-gesture stack.
 * `await ctx.resume()` in an async handler often runs too late for iOS to count as activation.
 */
function unlockWebAudioWithSilentBuffer(ctx) {
  try {
    const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    src.start(t);
    src.stop(t + 0.001);
  } catch {
    /* ignore */
  }
}

/**
 * iOS/Safari often keep the AudioContext suspended until `resume()` finishes.
 * Scheduling nodes in the same synchronous turn as `resume()` can yield silence.
 */
function runWhenContextRunning(ctx, fn) {
  if (!ctx || ctx.state === 'closed') return;
  const go = () => {
    if (ctx.state === 'running') fn(ctx);
  };
  if (ctx.state === 'running') {
    go();
  } else {
    ctx.resume().then(go).catch(() => {});
  }
}

export function setBuzzerEnabled(value) {
  enabled = !!value;
}

/**
 * Resume / unlock Web Audio after a user gesture.
 * Must stay synchronous — do not `await ctx.resume()` here (breaks iOS Safari activation).
 */
export function primeBuzzer() {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'closed') return;
  try {
    const needsKick =
      ctx.state === 'suspended' || ctx.state === 'interrupted';
    if (needsKick) {
      void ctx.resume();
      unlockWebAudioWithSilentBuffer(ctx);
    }
  } catch (err) {
    console.warn('Audio context prime failed:', err);
  }
}

export function playBuzzer({ duration = 1500 } = {}) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  runWhenContextRunning(ctx, (c) => {
    const now = c.currentTime;
    const seconds = duration / 1000;

    const masterGain = c.createGain();
    masterGain.gain.setValueAtTime(0.0, now);
    masterGain.gain.linearRampToValueAtTime(0.5, now + 0.02);
    masterGain.gain.setValueAtTime(0.5, now + seconds - 0.05);
    masterGain.gain.linearRampToValueAtTime(0.0, now + seconds);
    masterGain.connect(c.destination);

    const osc1 = c.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);

    const osc2 = c.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(220, now);

    osc1.connect(masterGain);
    osc2.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + seconds);
    osc2.stop(now + seconds);
  });
}

/**
 * Short pleasant chime when a byo-yomi period expires and the next period begins.
 */
export function playByoyomiChime() {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  runWhenContextRunning(ctx, (c) => {
    const now = c.currentTime;
    const freqs = [880, 1320];

    freqs.forEach((freq, i) => {
      const start = now + i * 0.11;
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      const g = c.createGain();
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.18, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

      osc.connect(g);
      g.connect(c.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  });
}

/**
 * Brief rising chirp when the active player ends their turn (tap feedback).
 */
export function playTurnEndChirp() {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  runWhenContextRunning(ctx, (c) => {
    const now = c.currentTime;
    const dur = 0.09;

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.linearRampToValueAtTime(920, now + dur);

    const g = c.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.14, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.02);

    osc.connect(g);
    g.connect(c.destination);
    osc.start(now);
    osc.stop(now + dur + 0.025);
  });
}
