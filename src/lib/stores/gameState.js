import { writable, get } from 'svelte/store';
import { speak, cancelSpeech } from '../audio/voiceAnnouncer.js';
import { playBuzzer } from '../audio/buzzer.js';
import { saveGame, loadGame, clearGame } from '../utils/persistence.js';

/**
 * Game state shape:
 * {
 *   screen: 'config' | 'game',
 *   mode: 'fischer' | 'byoyomi',
 *   config: { ... },                // snapshot of the settings used to start
 *   players: [
 *     {
 *       id: 0|1,
 *       mainTime: number (ms),      // remaining main time
 *       inByoyomi: boolean,
 *       periodTime: number (ms),    // remaining time in current period
 *       periodsLeft: number,        // periods remaining (incl. current)
 *       moveCount: number,
 *       lostOnTime: boolean,
 *     }
 *   ],
 *   activePlayer: 0 | 1,
 *   started: boolean,               // first move been made (clock started)
 *   isPaused: boolean,
 *   gameOver: boolean,
 *   loser: 0 | 1 | null,
 *   spokenThisPeriod: number[],     // last seconds value we have spoken for
 *   announcedByoyomi: boolean[],    // whether the "byo-yomi" word was spoken for this player
 * }
 */

function buildPlayer(config, mode) {
  if (mode === 'fischer') {
    return {
      mainTime: config.mainTime * 1000,
      inByoyomi: false,
      periodTime: 0,
      periodsLeft: 0,
      moveCount: 0,
      lostOnTime: false,
    };
  }
  return {
    mainTime: config.mainTime * 1000,
    inByoyomi: config.mainTime === 0,
    periodTime: config.periodTime * 1000,
    periodsLeft: config.periods,
    moveCount: 0,
    lostOnTime: false,
  };
}

function freshState() {
  return {
    screen: 'config',
    mode: 'fischer',
    config: null,
    players: [null, null],
    activePlayer: 0,
    started: false,
    isPaused: false,
    gameOver: false,
    loser: null,
    spokenThisPeriod: [-1, -1],
    announcedByoyomi: [false, false],
  };
}

function createGameState() {
  const stored = loadGame();
  const initial = stored && stored.screen === 'game' ? stored : freshState();
  // If a stored game existed, ensure it's paused on resume so the user can decide.
  if (initial.screen === 'game') {
    initial.isPaused = true;
  }

  const { subscribe, set, update } = writable(initial);

  function persist(state) {
    if (state.screen === 'game') {
      saveGame(state);
    } else {
      clearGame();
    }
  }

  function setState(next) {
    persist(next);
    set(next);
  }

  function updateState(fn) {
    update((current) => {
      const next = fn(current);
      persist(next);
      return next;
    });
  }

  function activePlayerHasTime(player) {
    if (!player) return true;
    if (player.inByoyomi) {
      return player.periodTime > 0 || player.periodsLeft > 0;
    }
    return player.mainTime > 0;
  }

  function startGame(settingsValue) {
    cancelSpeech();
    const mode = settingsValue.mode;
    const cfg =
      mode === 'fischer' ? settingsValue.fischer : settingsValue.byoyomi;

    const players = [buildPlayer(cfg, mode), buildPlayer(cfg, mode)];

    setState({
      screen: 'game',
      mode,
      config: { ...cfg },
      players,
      activePlayer: 0,
      started: false,
      isPaused: false,
      gameOver: false,
      loser: null,
      spokenThisPeriod: [-1, -1],
      announcedByoyomi: [
        players[0].inByoyomi,
        players[1].inByoyomi,
      ],
    });
  }

  function backToConfig() {
    cancelSpeech();
    setState(freshState());
  }

  function reset() {
    cancelSpeech();
    updateState((s) => {
      if (!s.config) return s;
      const players = [
        buildPlayer(s.config, s.mode),
        buildPlayer(s.config, s.mode),
      ];
      return {
        ...s,
        players,
        activePlayer: 0,
        started: false,
        isPaused: false,
        gameOver: false,
        loser: null,
        spokenThisPeriod: [-1, -1],
        announcedByoyomi: [players[0].inByoyomi, players[1].inByoyomi],
      };
    });
  }

  function pause() {
    updateState((s) => {
      if (s.screen !== 'game' || s.gameOver) return s;
      cancelSpeech();
      return { ...s, isPaused: true };
    });
  }

  function resume() {
    updateState((s) => {
      if (s.screen !== 'game' || s.gameOver) return s;
      return { ...s, isPaused: false };
    });
  }

  function togglePause() {
    const s = get({ subscribe });
    if (s.isPaused) resume();
    else pause();
  }

  /**
   * Player taps their own side of the screen to end their turn.
   * Only the active player ending their turn does anything.
   */
  function endTurn(playerId) {
    updateState((s) => {
      if (s.screen !== 'game' || s.gameOver) return s;
      if (s.isPaused) return s;
      if (playerId !== s.activePlayer) return s;

      const players = s.players.map((p) => ({ ...p }));
      const active = players[playerId];
      active.moveCount += 1;

      if (s.mode === 'fischer') {
        // Add the increment, but only if the player hasn't already lost.
        active.mainTime = Math.max(0, active.mainTime) +
          s.config.increment * 1000;
      } else if (s.mode === 'byoyomi') {
        // If the player completed a move while in byo-yomi, the period
        // resets back to the full period time (Japanese rules).
        if (active.inByoyomi && active.periodTime > 0) {
          active.periodTime = s.config.periodTime * 1000;
        }
      }

      const nextActive = playerId === 0 ? 1 : 0;
      const announced = [...s.announcedByoyomi];
      // Clear the speaking-state for the player whose turn just started, so that
      // any byo-yomi countdown can announce again on the new turn.
      const spoken = [...s.spokenThisPeriod];
      spoken[nextActive] = -1;

      return {
        ...s,
        players,
        activePlayer: nextActive,
        started: true,
        announcedByoyomi: announced,
        spokenThisPeriod: spoken,
      };
    });
  }

  /**
   * Called by the ticker on each animation frame.
   * `deltaMs` is the wall-clock time since the previous tick.
   */
  function tick(deltaMs) {
    if (deltaMs <= 0) return;
    updateState((s) => {
      if (s.screen !== 'game') return s;
      if (s.isPaused || s.gameOver || !s.started) return s;

      const players = s.players.map((p) => ({ ...p }));
      const active = players[s.activePlayer];
      const announced = [...s.announcedByoyomi];
      const spoken = [...s.spokenThisPeriod];

      let lostOnTime = false;

      if (s.mode === 'fischer') {
        active.mainTime -= deltaMs;
        if (active.mainTime <= 0) {
          active.mainTime = 0;
          active.lostOnTime = true;
          lostOnTime = true;
        }
      } else {
        if (!active.inByoyomi) {
          active.mainTime -= deltaMs;
          if (active.mainTime <= 0) {
            // Spill remaining negative ms into the period? Simpler: just enter byo-yomi cleanly.
            active.mainTime = 0;
            active.inByoyomi = true;
            // Announce byo-yomi entry (only once per player).
            if (!announced[s.activePlayer]) {
              announced[s.activePlayer] = true;
              speak('Byo yomi');
            }
            // Reset the spoken-tracker for the new period.
            spoken[s.activePlayer] = -1;
          }
        } else {
          active.periodTime -= deltaMs;

          // Audible countdown for the last 10 seconds (match MM:SS display: floor).
          if (active.periodTime > 0 && active.periodTime <= 10000) {
            const seconds = Math.floor(active.periodTime / 1000);
            if (seconds !== spoken[s.activePlayer] && seconds >= 1 && seconds <= 10) {
              spoken[s.activePlayer] = seconds;
              speak(String(seconds), { rate: 1.15 });
            }
          }

          if (active.periodTime <= 0) {
            // Period exhausted without a move.
            active.periodsLeft -= 1;
            if (active.periodsLeft > 0) {
              active.periodTime = s.config.periodTime * 1000;
              spoken[s.activePlayer] = -1;
            } else {
              active.periodTime = 0;
              active.lostOnTime = true;
              lostOnTime = true;
            }
          }
        }
      }

      let next = {
        ...s,
        players,
        announcedByoyomi: announced,
        spokenThisPeriod: spoken,
      };

      if (lostOnTime) {
        cancelSpeech();
        playBuzzer();
        next = {
          ...next,
          gameOver: true,
          loser: s.activePlayer,
          isPaused: true,
        };
      }

      return next;
    });
  }

  return {
    subscribe,
    startGame,
    backToConfig,
    reset,
    pause,
    resume,
    togglePause,
    endTurn,
    tick,
  };
}

export const gameState = createGameState();
