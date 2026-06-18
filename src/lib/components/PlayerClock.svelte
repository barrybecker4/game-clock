<script>
  import { FISCHER_COUNTDOWN_TAIL_SEC } from '../stores/gameState.js';
  import { formatTime } from '../utils/timer.js';

  let {
    player,
    mode,
    isActive,
    isPaused,
    started,
    gameOver,
    lostOnTime,
    rotated = false,
    wrongFlash = false,
    ontap,
  } = $props();

  /** Ignore synthetic click shortly after pointerup (same gesture). */
  let lastPointerTapAt = 0;

  function emitTap() {
    ontap?.();
  }

  function handlePointerUp(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    lastPointerTapAt = Date.now();
    emitTap();
  }

  function handleClick() {
    if (Date.now() - lastPointerTapAt < 350) return;
    emitTap();
  }

  const MS = 1000;

  function computeTimeForDisplay(p, m) {
    if (m === 'fischer') return Math.max(0, p.mainTime);
    if (p.inByoyomi) return Math.max(0, p.periodTime);
    return Math.max(0, p.mainTime);
  }

  function computeSubLabel(p, m, lost) {
    if (lost) return 'Lost on Time!';
    if (m === 'byoyomi') {
      if (p.inByoyomi) {
        if (p.periodsLeft === 1) return 'Sudden Death';
        return `Byo-yomi · ${p.periodsLeft} periods left`;
      }
      return `${p.periodsLeft} × byo-yomi ready`;
    }
    if (
      m === 'fischer' &&
      p.mainTime > 0 &&
      p.mainTime < (FISCHER_COUNTDOWN_TAIL_SEC + 1) * MS
    ) {
      return 'Sudden Death';
    }
    return null;
  }

  let timeForDisplay = $derived(computeTimeForDisplay(player, mode));
  let timeLabel = $derived(
    lostOnTime ? '0:00' : formatTime(timeForDisplay, { showTenthsUnder: 0 })
  );
  let subLabel = $derived(computeSubLabel(player, mode, lostOnTime));
  let suddenDeath = $derived(subLabel === 'Sudden Death');

  let clockClass = $derived(
    [
      'clock',
      isActive ? 'active' : 'inactive',
      rotated ? 'rotated' : '',
      isPaused ? 'paused' : '',
      gameOver ? 'game-over' : '',
      lostOnTime ? 'lost' : '',
      !started ? 'pre-start' : '',
      wrongFlash ? 'wrong-flash' : '',
    ]
      .filter(Boolean)
      .join(' ')
  );
</script>

<button
  type="button"
  class={clockClass}
  onpointerup={handlePointerUp}
  onclick={handleClick}
>
  <div class="inner">
    <div class="top-row">
      <span class="moves">
        {player.moveCount}
        {player.moveCount === 1 ? 'move' : 'moves'}
      </span>
    </div>
    <div class="time-stack">
      <div class="time tabular" class:lost-time={lostOnTime}>
        {timeLabel}
      </div>
      <div class="sub" class:sudden-death-row={suddenDeath}>
        {#if lostOnTime}
          <span class="lost-label">Lost on Time!</span>
        {:else if !started && isActive}
          <span class="hint">Tap to start your turn</span>
        {:else if subLabel}
          {#if suddenDeath}
            <span class="sudden-death">Sudden Death</span>
          {:else}
            <span>{subLabel}</span>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</button>

<style>
  .clock {
    flex: 1 1 0;
    width: 100%;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    background: var(--inactive);
    color: #1a1a1a;
    transition: background 0.2s ease, color 0.2s ease;
    padding: 0;
    border: none;
    cursor: pointer;
    -webkit-touch-callout: none;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    text-align: center;
  }

  .clock.wrong-flash {
    animation: wrong-flash-pulse 0.42s ease;
  }

  @keyframes wrong-flash-pulse {
    0%,
    100% {
      box-shadow: inset 0 0 0 0 transparent;
    }
    35% {
      box-shadow: inset 0 0 0 5px rgba(209, 59, 59, 0.65);
    }
    70% {
      box-shadow: inset 0 0 0 2px rgba(209, 59, 59, 0.35);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .clock.wrong-flash {
      animation: none;
      box-shadow: inset 0 0 0 3px rgba(209, 59, 59, 0.5);
    }
  }

  .clock.rotated {
    padding-top: env(safe-area-inset-top, 0px);
  }

  .clock:not(.rotated) {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .inner {
    flex: 1;
    display: grid;
    grid-template-rows: auto 1fr;
    align-items: stretch;
    justify-items: center;
    padding: 1.25rem 1rem;
    width: 100%;
  }

  .clock.rotated .inner {
    transform: rotate(180deg);
  }

  .clock.active {
    background: var(--active-warm);
    color: #1a1a1a;
  }
  .clock.inactive {
    background: var(--inactive);
    color: var(--inactive-text);
  }
  .clock.active.paused {
    background: #d6d6d6;
    color: #2a2a2a;
  }
  .clock.lost {
    background: var(--danger);
    color: #fff;
  }

  .time-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 0;
    width: 100%;
  }

  .time {
    font-size: clamp(5rem, 26vw, 14rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .time.lost-time {
    opacity: 0.85;
  }

  .top-row {
    align-self: start;
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 0.25rem;
  }
  .moves {
    font-weight: 600;
    font-size: 1.4rem;
    opacity: 0.8;
  }

  .sub {
    font-size: clamp(1.5rem, 3.4vw, 2.52rem);
    font-weight: 600;
    min-height: 1.5em;
    line-height: 1.5;
    opacity: 0.85;
  }
  .sub.sudden-death-row {
    opacity: 1;
  }
  .lost-label {
    font-size: 2.5rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .hint {
    font-size: clamp(1.5rem, 3.8vw, 2.15rem);
    font-weight: 500;
    opacity: 0.7;
  }

  .sudden-death {
    display: inline-block;
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--danger);
    animation: sudden-death-glow 1.5s ease-out forwards;
  }

  @keyframes sudden-death-glow {
    0% {
      text-shadow:
        0 0 8px rgba(255, 120, 120, 1),
        0 0 20px rgba(209, 59, 59, 0.85),
        0 0 36px rgba(209, 59, 59, 0.5);
    }
    55% {
      text-shadow:
        0 0 4px rgba(209, 59, 59, 0.55),
        0 0 12px rgba(209, 59, 59, 0.35);
    }
    100% {
      text-shadow: none;
    }
  }
</style>
