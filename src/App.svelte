<script>
  import { onMount } from 'svelte';
  import ConfigScreen from './lib/components/ConfigScreen.svelte';
  import GameClock from './lib/components/GameClock.svelte';
  import { gameState } from './lib/stores/gameState.js';
  import { settings } from './lib/stores/settings.js';
  import { setVoiceEnabled } from './lib/audio/voiceAnnouncer.js';
  import { setBuzzerEnabled } from './lib/audio/sounds.js';

  const INSTALL_BANNER_DISMISSED_KEY = 'installBannerDismissed';

  let showInstallBanner = false;
  let hasInstallPrompt = false;
  let deferredInstallPrompt = null;
  let isIosManualInstall = false;

  function isStandaloneMode() {
    if (typeof window === 'undefined') return true;
    const iOSStandalone = window.navigator.standalone === true;
    const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const displayModeFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    return iOSStandalone || displayModeStandalone || displayModeFullscreen;
  }

  function isIosDevice() {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    const touchPoints = window.navigator.maxTouchPoints || 0;

    // iPhone/iPad/iPod classic UA
    const iosUA = /iphone|ipad|ipod/i.test(ua);
    // iPadOS desktop-mode Safari reports as Mac; detect by touch support.
    const iPadDesktopMode = /mac/i.test(platform) && touchPoints > 1;

    return iosUA || iPadDesktopMode;
  }

  function dismissInstallBanner() {
    showInstallBanner = false;
    try {
      window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, '1');
    } catch {
      // localStorage may be unavailable in private modes.
    }
  }

  async function installApp() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hasInstallPrompt = false;
    dismissInstallBanner();
  }

  $: setVoiceEnabled($settings.audioEnabled);
  $: setBuzzerEnabled($settings.audioEnabled);

  onMount(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === '1';
    } catch {
      dismissed = false;
    }
    showInstallBanner = !isStandaloneMode() && !dismissed;
    isIosManualInstall = isIosDevice() && !isStandaloneMode();

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      hasInstallPrompt = true;
      if (!isStandaloneMode()) showInstallBanner = true;
    };

    const onInstalled = () => {
      deferredInstallPrompt = null;
      hasInstallPrompt = false;
      showInstallBanner = false;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  });
</script>

<main>
  {#if showInstallBanner}
    <aside class="install-banner" role="status" aria-live="polite">
      <p>
        {#if isIosManualInstall}
          Install for full screen: tap Share, then Add to Home Screen
        {:else}
          Install for full screen
        {/if}
      </p>
      <div class="install-banner-actions">
        {#if hasInstallPrompt}
          <button class="banner-btn install-btn" on:click={installApp}>Install</button>
        {/if}
        <button class="banner-btn dismiss-btn" on:click={dismissInstallBanner} aria-label="Dismiss install prompt">
          Not now
        </button>
      </div>
    </aside>
  {/if}
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

  .install-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(12, 12, 12, 0.96);
    color: var(--fg);
    font-size: 0.92rem;
  }

  .install-banner p {
    margin: 0;
    font-weight: 600;
  }

  .install-banner-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .banner-btn {
    padding: 0.35rem 0.65rem;
    border-radius: 0.45rem;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1px solid transparent;
  }

  .install-btn {
    background: var(--accent);
    color: #111;
  }

  .dismiss-btn {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.24);
    color: var(--fg);
  }
</style>
