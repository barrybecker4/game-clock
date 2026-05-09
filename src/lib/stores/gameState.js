import { writable, get } from 'svelte/store';
import { speak, cancelSpeech } from '../audio/voiceAnnouncer.js';
import { playBuzzer, playByoyomiChime } from '../audio/sounds.js';
import { saveGame, loadGame, clearGame } from '../utils/persistence.js';

const MS_PER_SECOND = 1000;

/**
 * Byo-yomi period length (seconds): below this, voice counts only the last
 * `BYOYOMI_SHORT_AUDIBLE_TAIL_SEC` seconds; at/above, the last
 * `BYOYOMI_LONG_AUDIBLE_TAIL_SEC` seconds.
 */
const BYOYOMI_LONG_AUDIBLE_THRESHOLD_SEC = 15;

const BYOYOMI_SHORT_AUDIBLE_TAIL_SEC = 5;
const BYOYOMI_LONG_AUDIBLE_TAIL_SEC = 10;

/**
 * MM:SS uses `floor(periodTime / MS_PER_SECOND)` for the seconds digit. That digit is N
 * while periodTime ∈ [N·MS_PER_SECOND, (N+1)·MS_PER_SECOND). Spoken digits 1…tail therefore
 * need `periodTime < (tail + 1)·MS_PER_SECOND`, not `<= tail·MS_PER_SECOND` (which skipped
 * the whole second where the clock still shows `tail`).
 */

/** Lowest floor-second value spoken during the byo-yomi countdown. */
const BYOYOMI_COUNTDOWN_MIN_SPOKEN_SEC = 1;

/** No second spoken yet for this player / period (`spokenThisPeriod`). */
const SPOKEN_NONE = -1;

const BYOYOMI_ENTRY_SPEAK_RATE = 0.95;
const BYOYOMI_COUNTDOWN_SPEAK_RATE = 1.08;
const BYOYOMI_COUNTDOWN_SPEAK_PITCH = 1.28;
const BYOYOMI_COUNTDOWN_VOICE_STYLE = 'pleasantWoman';

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
      mainTime: config.mainTime * MS_PER_SECOND,
      inByoyomi: false,
      periodTime: 0,
      periodsLeft: 0,
      moveCount: 0,
      lostOnTime: false,
    };
  }
  return {
    mainTime: config.mainTime * MS_PER_SECOND,
    inByoyomi: config.mainTime === 0,
    periodTime: config.periodTime * MS_PER_SECOND,
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
    spokenThisPeriod: [SPOKEN_NONE, SPOKEN_NONE],
    announcedByoyomi: [false, false],
  };
}

function createGameState() {
  const stored = loadGame();
  let initial =
    stored && stored.screen === 'game' ? { ...stored } : freshState();
  if (initial.screen === 'game') {
    delete initial.suppressFirstByoyomiCountdown;
  }
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
      spokenThisPeriod: [SPOKEN_NONE, SPOKEN_NONE],
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
        spokenThisPeriod: [SPOKEN_NONE, SPOKEN_NONE],
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
          s.config.increment * MS_PER_SECOND;
      } else if (s.mode === 'byoyomi') {
        // If the player completed a move while in byo-yomi, the period
        // resets back to the full period time (Japanese rules).
        if (active.inByoyomi && active.periodTime > 0) {
          active.periodTime = s.config.periodTime * MS_PER_SECOND;
        }
      }

      const nextActive = playerId === 0 ? 1 : 0;
      const announced = [...s.announcedByoyomi];
      // Clear the speaking-state for the player whose turn just started, so that
      // any byo-yomi countdown can announce again on the new turn.
      const spoken = [...s.spokenThisPeriod];
      spoken[nextActive] = SPOKEN_NONE;

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
              // Hiragana + ja-JP + Japanese voice when available (秒読み / byōyomi).
              speak('びょうよみ', {
                lang: 'ja-JP',
                rate: BYOYOMI_ENTRY_SPEAK_RATE,
              });
            }
            spoken[s.activePlayer] = SPOKEN_NONE;
          }
        } else {
          active.periodTime -= deltaMs;

          const periodSec = s.config.periodTime;
          const shortAudiblePeriod =
            periodSec < BYOYOMI_LONG_AUDIBLE_THRESHOLD_SEC;
          const audibleTailSec = shortAudiblePeriod
            ? BYOYOMI_SHORT_AUDIBLE_TAIL_SEC
            : BYOYOMI_LONG_AUDIBLE_TAIL_SEC;
          const audibleCeilingMs = (audibleTailSec + 1) * MS_PER_SECOND;
          const audibleMaxSec = audibleTailSec;

          // Same second digit as the clock (floor); window upper bound is exclusive so the
          // top digit (e.g. 5 or 10) is included while it is still on screen.
          if (active.periodTime > 0 && active.periodTime < audibleCeilingMs) {
            const seconds = Math.floor(active.periodTime / MS_PER_SECOND);
            if (
              seconds !== spoken[s.activePlayer] &&
              seconds >= BYOYOMI_COUNTDOWN_MIN_SPOKEN_SEC &&
              seconds <= audibleMaxSec
            ) {
              spoken[s.activePlayer] = seconds;
              speak(String(seconds), {
                rate: BYOYOMI_COUNTDOWN_SPEAK_RATE,
                pitch: BYOYOMI_COUNTDOWN_SPEAK_PITCH,
                voiceStyle: BYOYOMI_COUNTDOWN_VOICE_STYLE,
              });
            }
          }

          if (active.periodTime <= 0) {
            // Period exhausted without a move.
            active.periodsLeft -= 1;
            if (active.periodsLeft > 0) {
              active.periodTime = s.config.periodTime * MS_PER_SECOND;
              spoken[s.activePlayer] = SPOKEN_NONE;
              playByoyomiChime();
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
