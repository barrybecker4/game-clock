<script>
  export let isPaused = false;
  export let audioEnabled = true;
  export let gameOver = false;

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="bar">
  <button
    class="ctrl"
    aria-label="Back to settings"
    title="Settings"
    on:click={() => dispatch('settings')}
  >
    <!-- Clock / settings icon -->
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12,7 12,12 15,14" />
    </svg>
  </button>

  <button
    class="ctrl"
    aria-label="Reset game"
    title="Reset"
    on:click={() => dispatch('reset')}
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-7" />
    </svg>
  </button>

  <button
    class="ctrl big"
    aria-label={isPaused ? 'Resume' : 'Pause'}
    title={isPaused ? 'Resume' : 'Pause'}
    disabled={gameOver}
    on:click={() => dispatch('togglePause')}
  >
    {#if isPaused}
      <!-- Play icon -->
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
        <polygon points="6,4 20,12 6,20" />
      </svg>
    {:else}
      <!-- Pause icon -->
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    {/if}
  </button>

  <button
    class="ctrl"
    aria-label={audioEnabled ? 'Mute' : 'Unmute'}
    title={audioEnabled ? 'Mute' : 'Unmute'}
    on:click={() => dispatch('toggleAudio')}
  >
    {#if audioEnabled}
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    {/if}
  </button>
</div>

<style>
  .bar {
    background: var(--control-bg);
    color: var(--control-fg);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
    justify-items: center;
    gap: 0;
    padding: 0.5rem 0.5rem;
    min-height: 3.5rem;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .ctrl {
    width: 100%;
    height: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--control-fg);
    background: transparent;
    border-radius: 8px;
    transition: background 0.1s ease;
  }
  .ctrl:active {
    background: rgba(255, 255, 255, 0.08);
  }
  .ctrl[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .ctrl.big svg {
    transform: scale(1.05);
  }
</style>
