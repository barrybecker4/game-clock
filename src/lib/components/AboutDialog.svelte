<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const GITHUB_URL = 'https://github.com/barrybecker4/game-clock';

  function close() {
    dispatch('close');
  }
</script>

<div class="wrap">
  <div class="card" role="dialog" aria-modal="true" aria-labelledby="about-title">
    <h2 id="about-title" class="title">About</h2>
    <dl class="meta">
      <div class="row">
        <dt>Author</dt>
        <dd>Barry Becker</dd>
      </div>
      <div class="row">
        <dt>GitHub</dt>
        <dd>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">{GITHUB_URL}</a>
        </dd>
      </div>
    </dl>
    <button type="button" class="close-btn" on:click={close}>Close</button>
  </div>
  <button type="button" class="backdrop" aria-label="Dismiss" on:click={close} />
</div>

<style>
  .wrap {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    pointer-events: none;
  }

  .backdrop {
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

  .card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
    background: #1c1c1c;
    border-radius: 18px;
    padding: 1.5rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
    pointer-events: auto;
  }

  .title {
    margin: 0;
    text-align: center;
    font-size: 1.5rem;
    color: var(--fg);
  }

  .meta {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .row {
    display: grid;
    gap: 0.25rem;
  }

  .row dt {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
  }

  .row dd {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--fg);
    overflow-wrap: anywhere;
  }

  .row a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .row a:active {
    opacity: 0.9;
  }

  .close-btn {
    padding: 0.95rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    background: #2a2a2a;
    color: var(--fg);
  }

  .close-btn:active {
    transform: scale(0.99);
  }
</style>
