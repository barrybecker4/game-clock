<script>
  import { formatTime } from '../utils/timer.js';

  export let player;
  export let mode;
  export let isActive;
  export let isPaused;
  export let started;
  export let gameOver;
  export let lostOnTime;
  export let rotated = false;

  $: timeForDisplay = computeTimeForDisplay(player, mode);
  $: showTenths = mode === 'byoyomi' && player.inByoyomi;
  $: timeLabel = lostOnTime
    ? '0:00'
    : formatTime(timeForDisplay, {
        showTenthsUnder: showTenths ? 10000 : 0,
      });
  $: subLabel = computeSubLabel(player, mode, lostOnTime);

  function computeTimeForDisplay(p, m) {
    if (m === 'fischer') return Math.max(0, p.mainTime);
    if (p.inByoyomi) return Math.max(0, p.periodTime);
    return Math.max(0, p.mainTime);
  }

  function computeSubLabel(p, m, lost) {
    if (lost) return 'Lost on Time!';
    if (m === 'byoyomi') {
      if (p.inByoyomi) {
        return `Byo-yomi · ${p.periodsLeft} ${p.periodsLeft === 1 ? 'period' : 'periods'} left`;
      }
      return `${p.periodsLeft} × byo-yomi ready`;
    }
    return null;
  }

  $: clockClass = [
    'clock',
    isActive ? 'active' : 'inactive',
    rotated ? 'rotated' : '',
    isPaused ? 'paused' : '',
    gameOver ? 'game-over' : '',
    lostOnTime ? 'lost' : '',
    !started ? 'pre-start' : '',
  ]
    .filter(Boolean)
    .join(' ');
</script>

<button class={clockClass} on:click>
  <div class="inner">
    <div class="top-row">
      <span class="moves">
        {player.moveCount}
        {player.moveCount === 1 ? 'move' : 'moves'}
      </span>
    </div>
    <div class="time tabular" class:lost-time={lostOnTime}>
      {timeLabel}
    </div>
    <div class="sub">
      {#if lostOnTime}
        <span class="lost-label">Lost on Time!</span>
      {:else if !started && isActive}
        <span class="hint">Tap to start your turn</span>
      {:else if subLabel}
        <span>{subLabel}</span>
      {/if}
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
    text-align: center;
  }

  .inner {
    flex: 1;
    display: grid;
    grid-template-rows: auto 1fr auto;
    align-items: center;
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

  .time {
    font-size: clamp(5rem, 24vw, 11rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
    align-self: center;
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
    font-size: 0.95rem;
    opacity: 0.8;
  }

  .sub {
    align-self: end;
    padding-bottom: 0.25rem;
    font-size: 0.95rem;
    font-weight: 600;
    min-height: 1.2em;
    opacity: 0.85;
  }
  .lost-label {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .hint {
    font-weight: 500;
    opacity: 0.7;
  }
</style>
