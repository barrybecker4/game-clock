/**
 * Run a tick callback at a high rate while not paused.
 * Uses requestAnimationFrame for smooth 60Hz updates and falls back
 * to setInterval when the tab is in the background (where rAF is throttled).
 *
 * The callback receives (deltaMs, nowMs). Real elapsed wall-clock time is
 * always passed through, so the timer remains accurate even when the tab
 * is throttled.
 */
export function createTicker(callback) {
  let rafId = null;
  let intervalId = null;
  let lastTime = 0;
  let running = false;

  function step() {
    if (!running) return;
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    callback(delta, now);
    rafId = requestAnimationFrame(step);
  }

  function backgroundTick() {
    if (!running) return;
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    callback(delta, now);
  }

  function handleVisibility() {
    if (document.hidden) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      intervalId = setInterval(backgroundTick, 250);
    } else {
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = null;
      lastTime = performance.now();
      if (running) rafId = requestAnimationFrame(step);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      document.addEventListener('visibilitychange', handleVisibility);
      if (document.hidden) {
        intervalId = setInterval(backgroundTick, 250);
      } else {
        rafId = requestAnimationFrame(step);
      }
    },
    stop() {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (intervalId !== null) clearInterval(intervalId);
      rafId = null;
      intervalId = null;
      document.removeEventListener('visibilitychange', handleVisibility);
    },
  };
}

/**
 * Format milliseconds as a clock string.
 * - HH:MM:SS for >= 1 hour
 * - MM:SS for >= 10 seconds
 * - SS.d (one decimal) for < 10 seconds (so byo-yomi countdown is readable)
 */
export function formatTime(ms, { showTenthsUnder = 10000 } = {}) {
  if (ms < 0) ms = 0;
  const totalSeconds = ms / 1000;

  if (ms < showTenthsUnder) {
    const secs = Math.max(0, totalSeconds);
    return secs.toFixed(1);
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}
