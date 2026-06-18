<script>
  let { gameOver = false, loserText = '', onresume, onreset, onsettings } = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true">
  <div class="card">
    {#if gameOver}
      <h2 class="title danger">Lost on Time!</h2>
      <p class="sub">{loserText}</p>
    {:else}
      <h2 class="title">Paused</h2>
    {/if}

    <div class="actions">
      {#if !gameOver}
        <button class="primary" onclick={() => onresume?.()}>Resume</button>
      {/if}
      <button class="secondary" onclick={() => onreset?.()}>
        {gameOver ? 'New Game (Same Settings)' : 'Reset Game'}
      </button>
      <button class="ghost" onclick={() => onsettings?.()}>Change Settings</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1.5rem;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: #1c1c1c;
    border-radius: 18px;
    padding: 1.5rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  }
  .title {
    margin: 0;
    text-align: center;
    font-size: 1.5rem;
    color: var(--fg);
  }
  .title.danger {
    color: var(--danger);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .sub {
    margin: 0;
    text-align: center;
    color: var(--muted);
    font-weight: 600;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  button {
    padding: 0.95rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
  }
  .primary {
    background: var(--accent);
    color: #1a1a1a;
  }
  .secondary {
    background: #2a2a2a;
    color: var(--fg);
  }
  .ghost {
    background: transparent;
    color: var(--muted);
    border: 1px solid #2a2a2a;
  }
  button:active {
    transform: scale(0.99);
  }
</style>
