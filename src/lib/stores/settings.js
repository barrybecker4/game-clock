import { writable } from 'svelte/store';
import { loadSettings, saveSettings } from '../utils/persistence.js';

export const FISCHER_PRESETS = [
  { id: 'bullet', label: 'Bullet', mainTime: 60, increment: 2 },
  { id: 'blitz', label: 'Blitz', mainTime: 180, increment: 5 },
  { id: 'rapid', label: 'Rapid', mainTime: 300, increment: 10 },
  { id: 'classical', label: 'Classical', mainTime: 900, increment: 30 },
  { id: 'long', label: 'Long', mainTime: 1800, increment: 30 },
];

export const BYOYOMI_PRESETS = [
  {
    id: 'quick',
    label: 'Quick',
    mainTime: 300,
    periods: 3,
    periodTime: 10,
  },
  {
    id: 'standard',
    label: 'Standard',
    mainTime: 600,
    periods: 5,
    periodTime: 20,
  },
  {
    id: 'tournament',
    label: 'Tournament',
    mainTime: 1200,
    periods: 5,
    periodTime: 30,
  },
  {
    id: 'long',
    label: 'Long',
    mainTime: 1800,
    periods: 5,
    periodTime: 60,
  },
];

const DEFAULT_SETTINGS = {
  mode: 'fischer',
  fischer: { mainTime: 300, increment: 10 },
  byoyomi: { mainTime: 600, periods: 5, periodTime: 30 },
  audioEnabled: true,
};

function createSettings() {
  const stored = loadSettings();
  const initial = stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
  initial.fischer = { ...DEFAULT_SETTINGS.fischer, ...(initial.fischer || {}) };
  initial.byoyomi = { ...DEFAULT_SETTINGS.byoyomi, ...(initial.byoyomi || {}) };

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set(value) {
      saveSettings(value);
      set(value);
    },
    update(fn) {
      update((current) => {
        const next = fn(current);
        saveSettings(next);
        return next;
      });
    },
    setMode(mode) {
      this.update((s) => ({ ...s, mode }));
    },
    setFischer(values) {
      this.update((s) => ({ ...s, fischer: { ...s.fischer, ...values } }));
    },
    setByoyomi(values) {
      this.update((s) => ({ ...s, byoyomi: { ...s.byoyomi, ...values } }));
    },
    setAudioEnabled(enabled) {
      this.update((s) => ({ ...s, audioEnabled: enabled }));
    },
    applyFischerPreset(preset) {
      this.update((s) => ({
        ...s,
        mode: 'fischer',
        fischer: { mainTime: preset.mainTime, increment: preset.increment },
      }));
    },
    applyByoyomiPreset(preset) {
      this.update((s) => ({
        ...s,
        mode: 'byoyomi',
        byoyomi: {
          mainTime: preset.mainTime,
          periods: preset.periods,
          periodTime: preset.periodTime,
        },
      }));
    },
  };
}

export const settings = createSettings();
