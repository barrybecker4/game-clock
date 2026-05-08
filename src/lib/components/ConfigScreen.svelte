<script>
  import {
    settings,
    FISCHER_PRESETS,
    BYOYOMI_PRESETS,
    findFischerPresetId,
    findByoyomiPresetId,
  } from '../stores/settings.js';
  import { gameState } from '../stores/gameState.js';
  import { primeVoice } from '../audio/voiceAnnouncer.js';
  import { primeBuzzer } from '../audio/sounds.js';

  function setMode(mode) {
    settings.setMode(mode);
  }

  function applyFischerPreset(p) {
    settings.applyFischerPreset(p);
  }

  function applyByoyomiPreset(p) {
    settings.applyByoyomiPreset(p);
  }

  function handleFischerMain(e) {
    const seconds = clampInt(e.target.value, 0, 60 * 60 * 6);
    settings.setFischer({ mainTime: seconds });
  }

  function handleFischerInc(e) {
    const seconds = clampInt(e.target.value, 0, 600);
    settings.setFischer({ increment: seconds });
  }

  function handleByoMain(e) {
    const seconds = clampInt(e.target.value, 0, 60 * 60 * 6);
    settings.setByoyomi({ mainTime: seconds });
  }

  function handleByoPeriods(e) {
    const periods = clampInt(e.target.value, 1, 30);
    settings.setByoyomi({ periods });
  }

  function handleByoPeriodTime(e) {
    const seconds = clampInt(e.target.value, 1, 600);
    settings.setByoyomi({ periodTime: seconds });
  }

  function clampInt(value, min, max) {
    const n = Math.round(Number(value));
    if (Number.isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function startGame() {
    primeVoice();
    primeBuzzer();
    gameState.startGame($settings);
  }

  $: mode = $settings.mode;
  $: fischer = $settings.fischer;
  $: byoyomi = $settings.byoyomi;

  /** Match highlight to the numeric config (avoids stale persisted "selection" IDs) */
  $: activeFischerPresetId = findFischerPresetId(fischer);
  $: activeByoyomiPresetId = findByoyomiPresetId(byoyomi);

  function formatMainSummary() {
    if (mode === 'fischer') {
      return `${secondsLabel(fischer.mainTime)} + ${fischer.increment}s`;
    }
    return `${secondsLabel(byoyomi.mainTime)} + ${byoyomi.periods} × ${byoyomi.periodTime}s`;
  }

  function secondsLabel(s) {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
  }
</script>

<div class="config">
  <header>
    <h1>Game Clock</h1>
    <p class="subtitle">Configure your game</p>
  </header>

  <div class="mode-tabs">
    <button
      class="tab"
      class:active={mode === 'fischer'}
      on:click={() => setMode('fischer')}
    >
      Fischer
    </button>
    <button
      class="tab"
      class:active={mode === 'byoyomi'}
      on:click={() => setMode('byoyomi')}
    >
      Byo-yomi
    </button>
  </div>

  <section class="panel">
    {#if mode === 'fischer'}
      <h2>Presets</h2>
      <div class="preset-grid">
        {#each FISCHER_PRESETS as preset}
          <button
            class="preset"
            class:active={preset.id === activeFischerPresetId}
            on:click={() => applyFischerPreset(preset)}
          >
            <span class="preset-label">{preset.label}</span>
            <span class="preset-detail">
              {secondsLabel(preset.mainTime)} + {preset.increment}s
            </span>
          </button>
        {/each}
      </div>

      <h2>Custom</h2>
      <div class="custom-grid">
        <label>
          <span>Main time (sec)</span>
          <input
            type="number"
            min="0"
            step="30"
            value={fischer.mainTime}
            on:input={handleFischerMain}
          />
          <small>{secondsLabel(fischer.mainTime)}</small>
        </label>
        <label>
          <span>Increment (sec)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={fischer.increment}
            on:input={handleFischerInc}
          />
          <small>per move</small>
        </label>
      </div>
    {:else}
      <h2>Presets</h2>
      <div class="preset-grid">
        {#each BYOYOMI_PRESETS as preset}
          <button
            class="preset"
            class:active={preset.id === activeByoyomiPresetId}
            on:click={() => applyByoyomiPreset(preset)}
          >
            <span class="preset-label">{preset.label}</span>
            <span class="preset-detail">
              {secondsLabel(preset.mainTime)} + {preset.periods}×{preset.periodTime}s
            </span>
          </button>
        {/each}
      </div>

      <h2>Custom</h2>
      <div class="custom-grid byo">
        <label>
          <span>Main time (sec)</span>
          <input
            type="number"
            min="0"
            step="30"
            value={byoyomi.mainTime}
            on:input={handleByoMain}
          />
          <small>{secondsLabel(byoyomi.mainTime)}</small>
        </label>
        <label>
          <span>Periods</span>
          <input
            type="number"
            min="1"
            step="1"
            value={byoyomi.periods}
            on:input={handleByoPeriods}
          />
          <small>count</small>
        </label>
        <label>
          <span>Period time (sec)</span>
          <input
            type="number"
            min="1"
            step="5"
            value={byoyomi.periodTime}
            on:input={handleByoPeriodTime}
          />
          <small>each</small>
        </label>
      </div>
    {/if}
  </section>

  <footer>
    <div class="summary">
      <span class="summary-label">{mode === 'fischer' ? 'Fischer' : 'Byo-yomi'}</span>
      <span class="summary-value tabular">{formatMainSummary()}</span>
    </div>
    <button class="start" on:click={startGame}>Start Game</button>
  </footer>
</div>

<style>
  .config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: max(1rem, env(safe-area-inset-top)) 1rem
      max(1rem, env(safe-area-inset-bottom)) 1rem;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  header h1 {
    margin: 0;
    font-size: 1.6rem;
    letter-spacing: -0.01em;
  }
  header .subtitle {
    margin: 0.25rem 0 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .mode-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #1a1a1a;
    border-radius: 14px;
    padding: 4px;
    gap: 4px;
  }
  .tab {
    padding: 0.85rem 0.5rem;
    border-radius: 10px;
    color: var(--muted);
    font-weight: 600;
    font-size: 1rem;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .tab.active {
    background: var(--accent);
    color: #1a1a1a;
  }

  .panel {
    background: #181818;
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .panel h2 {
    margin: 0;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    font-weight: 600;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(140px, 100%), 1fr));
    gap: 0.5rem;
  }

  .preset {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.85rem 0.9rem;
    background: #232323;
    border-radius: 12px;
    text-align: left;
    transition: background 0.15s ease, transform 0.05s ease;
  }
  .preset:active { transform: scale(0.98); }
  .preset.active {
    background: var(--accent);
    color: #1a1a1a;
  }
  .preset-label {
    font-weight: 700;
    font-size: 1rem;
  }
  .preset-detail {
    font-size: 0.85rem;
    opacity: 0.8;
    margin-top: 2px;
  }

  .custom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .custom-grid.byo {
    grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
    color: var(--muted);
  }
  label span {
    font-weight: 600;
  }
  label small {
    color: #6f7378;
    font-size: 0.75rem;
  }
  input[type='number'] {
    background: #0e0e0e;
    border: 1px solid #2c2c2c;
    color: var(--fg);
    padding: 0.6rem 0.7rem;
    border-radius: 10px;
    font-size: 1rem;
    -moz-appearance: textfield;
  }
  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 0.5rem;
  }
  .summary {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.5rem 0.25rem;
  }
  .summary-label {
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .summary-value {
    font-size: 1.25rem;
    font-weight: 700;
    min-width: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .start {
    padding: 1.1rem;
    border-radius: 14px;
    background: var(--accent);
    color: #1a1a1a;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .start:active { transform: scale(0.99); }

  @media (max-width: 520px) {
    .custom-grid,
    .custom-grid.byo {
      grid-template-columns: 1fr;
    }
  }
</style>
