<script>
  import { onMount, onDestroy } from 'svelte';
  import PlayerClock from './PlayerClock.svelte';
  import ControlBar from './ControlBar.svelte';
  import PauseMenu from './PauseMenu.svelte';
  import { gameState } from '../stores/gameState.js';
  import { settings } from '../stores/settings.js';
  import { createTicker } from '../utils/timer.js';
  import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock.js';
  import { setVoiceEnabled, primeVoice } from '../audio/voiceAnnouncer.js';
  import { setBuzzerEnabled, primeBuzzer } from '../audio/buzzer.js';

  let ticker;

  onMount(() => {
    ticker = createTicker((delta) => gameState.tick(delta));
    ticker.start();
    requestWakeLock();
    setVoiceEnabled($settings.audioEnabled);
    setBuzzerEnabled($settings.audioEnabled);
  });

  onDestroy(() => {
    if (ticker) ticker.stop();
    releaseWakeLock();
  });

  function handlePlayerTap(playerId) {
    if ($gameState.gameOver) return;
    if ($gameState.isPaused) return;
    primeVoice();
    primeBuzzer();
    gameState.endTurn(playerId);
  }

  function handleTogglePause() {
    gameState.togglePause();
  }

  function handleReset() {
    gameState.reset();
  }

  function handleSettings() {
    gameState.backToConfig();
  }

  function handleToggleAudio() {
    const next = !$settings.audioEnabled;
    settings.setAudioEnabled(next);
    setVoiceEnabled(next);
    setBuzzerEnabled(next);
  }

  $: showOverlay = $gameState.isPaused || $gameState.gameOver;
  $: loserText =
    $gameState.loser !== null
      ? `Player ${$gameState.loser === 0 ? 'Bottom' : 'Top'} ran out of time`
      : '';
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
    on:click={() => handlePlayerTap(1)}
  />

  <ControlBar
    isPaused={$gameState.isPaused}
    audioEnabled={$settings.audioEnabled}
    gameOver={$gameState.gameOver}
    on:togglePause={handleTogglePause}
    on:reset={handleReset}
    on:settings={handleSettings}
    on:toggleAudio={handleToggleAudio}
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
    on:click={() => handlePlayerTap(0)}
  />

  {#if showOverlay}
    <PauseMenu
      gameOver={$gameState.gameOver}
      {loserText}
      on:resume={handleTogglePause}
      on:reset={handleReset}
      on:settings={handleSettings}
    />
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
</style>
