/**
 * Game sound effects via the Web Audio API (shared AudioContext).
 * Buzzer for "Lost on Time!", byo-yomi period chime, etc.
 */

let audioCtx = null;
let enabled = true;

function getCtx() {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
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

/** Resume the context after a user gesture (required by some browsers). */
export async function primeBuzzer() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch (err) {
      console.warn('Audio context resume failed:', err);
    }
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
