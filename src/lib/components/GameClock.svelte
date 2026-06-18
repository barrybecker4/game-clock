<script>
  import PlayerClock from './PlayerClock.svelte';
  import ControlBar from './ControlBar.svelte';
  import PauseMenu from './PauseMenu.svelte';
  import { gameState } from '../stores/gameState.js';
  import { settings } from '../stores/settings.js';
  import { createTicker } from '../utils/timer.js';
  import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';
  import { setVoiceEnabled, primeVoice } from '../audio/voiceAnnouncer.js';
  import { setBuzzerEnabled, primeBuzzer, playTurnEndChirp } from '../audio/sounds.js';

  let ticker;
  /** Which clock (0 bottom / 1 top) shows wrong-side tap feedback */
  let wrongFlashPlayer = $state(/** @type {null | 0 | 1} */ (null));
  /** @type {ReturnType<typeof setTimeout> | null} */
  let wrongFlashClearId = null;

  function flashWrongSide(playerId) {
    wrongFlashPlayer = playerId;
    if (wrongFlashClearId !== null) clearTimeout(wrongFlashClearId);
    wrongFlashClearId = setTimeout(() => {
      wrongFlashPlayer = null;
      wrongFlashClearId = null;
    }, 420);
  }

  function pulseTurnSuccess() {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    } catch {
      /* ignore unsupported environments */
    }
  }

  /** Short double pulse when the inactive side is tapped (wrong player). */
  function pulseWrongTap() {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([12, 40, 12]);
      }
    } catch {
      /* ignore unsupported environments */
    }
  }

  $effect(() => {
    ticker = createTicker((delta) => gameState.tick(delta));
    ticker.start();
    requestWakeLock();
    setVoiceEnabled($settings.audioEnabled);
    setBuzzerEnabled($settings.audioEnabled);
    return () => {
      if (ticker) ticker.stop();
      if (wrongFlashClearId !== null) clearTimeout(wrongFlashClearId);
      releaseWakeLock();
    };
  });

  function handlePlayerTap(playerId) {
    const s = $gameState;
    if (s.gameOver) return;
    if (s.isPaused) return;

    if (playerId !== s.activePlayer) {
      flashWrongSide(playerId);
      pulseWrongTap();
      return;
    }

    primeVoice();
    primeBuzzer();
    playTurnEndChirp();
    gameState.endTurn(playerId);
    pulseTurnSuccess();
  }

  function handleTogglePause() {
    primeVoice();
    primeBuzzer();
    gameState.togglePause();
  }

  /** @type {'reset' | 'settings' | null} */
  let confirmAction = $state(null);

  function handleReset() {
    confirmAction = 'reset';
  }

  function handleSettings() {
    confirmAction = 'settings';
  }

  function cancelConfirm() {
    confirmAction = null;
  }

  function commitConfirm() {
    if (confirmAction === 'reset') gameState.reset();
    else if (confirmAction === 'settings') gameState.backToConfig();
    confirmAction = null;
  }

  function handleToggleAudio() {
    const next = !$settings.audioEnabled;
    settings.setAudioEnabled(next);
    setVoiceEnabled(next);
    setBuzzerEnabled(next);
  }

  let showOverlay = $derived($gameState.isPaused || $gameState.gameOver);
  let loserText = $derived(
    $gameState.loser !== null
      ? `Player ${$gameState.loser === 0 ? 'Bottom' : 'Top'} ran out of time`
      : ''
  );
</script>

<div class="game">
  <PlayerClock
    player={$gameState.players[1]}
    mode={$gameState.mode}
    isActive={$gameState.activePlayer === 1 && !$gameState.gameOver}
    isPaused={$gameState.isPaused}
    started={$gameState.started}
    gameOver={$gameState.gameOver}
    lostOnTime={$gameState.players[1].lostOnTime}
    rotated={true}
    wrongFlash={wrongFlashPlayer === 1}
    ontap={() => handlePlayerTap(1)}
  />

  <ControlBar
    isPaused={$gameState.isPaused}
    audioEnabled={$settings.audioEnabled}
    gameOver={$gameState.gameOver}
    ontogglePause={handleTogglePause}
    onreset={handleReset}
    onsettings={handleSettings}
    ontoggleAudio={handleToggleAudio}
  />

  <PlayerClock
    player={$gameState.players[0]}
    mode={$gameState.mode}
    isActive={$gameState.activePlayer === 0 && !$gameState.gameOver}
    isPaused={$gameState.isPaused}
    started={$gameState.started}
    gameOver={$gameState.gameOver}
    lostOnTime={$gameState.players[0].lostOnTime}
    rotated={false}
    wrongFlash={wrongFlashPlayer === 0}
    ontap={() => handlePlayerTap(0)}
  />

  {#if showOverlay}
    <PauseMenu
      gameOver={$gameState.gameOver}
      {loserText}
      onresume={handleTogglePause}
      onreset={handleReset}
      onsettings={handleSettings}
    />
  {/if}

  {#if confirmAction}
    {@const title =
      confirmAction === 'reset' ? 'Reset this game?' : 'Change settings?'}
    {@const detail =
      confirmAction === 'reset'
        ? 'Timers and move counts will restart with the same configuration.'
        : 'You will leave the current game and return to the setup screen.'}
    {@const confirmLabel =
      confirmAction === 'reset' ? 'Reset game' : 'Go to settings'}
    <div
      class="confirm-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-detail"
    >
      <div class="confirm-card" onclick={(e) => e.stopPropagation()} role="presentation">
        <h2 id="confirm-title" class="confirm-title">{title}</h2>
        <p id="confirm-detail" class="confirm-detail">{detail}</p>
        <div class="confirm-actions">
          <button type="button" class="confirm-cancel" onclick={cancelConfirm}>
            Cancel
          </button>
          <button type="button" class="confirm-ok" onclick={commitConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
      <button
        type="button"
        class="confirm-backdrop"
        aria-label="Dismiss"
        onclick={cancelConfirm}
      ></button>
    </div>
  {/if}
</div>

<style>
  .game {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: relative;
  }

  .confirm-overlay {
    position: absolute;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    pointer-events: none;
  }

  .confirm-backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    margin: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    cursor: pointer;
    pointer-events: auto;
  }

  .confirm-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 400px;
    background: #1c1c1c;
    border-radius: 18px;
    padding: 1.5rem 1.25rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
    pointer-events: auto;
  }

  .confirm-title {
    margin: 0 0 0.75rem;
    text-align: center;
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--fg);
  }

  .confirm-detail {
    margin: 0 0 1.25rem;
    text-align: center;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--muted);
    font-weight: 600;
  }

  .confirm-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .confirm-actions button {
    padding: 0.95rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
  }

  .confirm-cancel {
    background: #2a2a2a;
    color: var(--fg);
  }

  .confirm-ok {
    background: var(--accent);
    color: #1a1a1a;
  }

  .confirm-actions button:active {
    transform: scale(0.99);
  }
</style>
