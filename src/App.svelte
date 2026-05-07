<script>
  import ConfigScreen from './lib/components/ConfigScreen.svelte';
  import GameClock from './lib/components/GameClock.svelte';
  import { gameState } from './lib/stores/gameState.js';
  import { settings } from './lib/stores/settings.js';
  import { setVoiceEnabled } from './lib/audio/voiceAnnouncer.js';
  import { setBuzzerEnabled } from './lib/audio/sounds.js';

  $: setVoiceEnabled($settings.audioEnabled);
  $: setBuzzerEnabled($settings.audioEnabled);
</script>

<main>
  {#if $gameState.screen === 'game'}
    <GameClock />
  {:else}
    <ConfigScreen />
  {/if}
</main>

<style>
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
</style>
