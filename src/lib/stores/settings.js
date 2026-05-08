import { writable } from 'svelte/store';
import { loadSettings, saveSettings } from '../utils/persistence.js';

export const FISCHER_PRESETS = [
  { id: 'blitz', label: 'Blitz', mainTime: 180, increment: 5 },
  { id: 'rapid', label: 'Rapid', mainTime: 300, increment: 10 },
  { id: 'classical', label: 'Classical', mainTime: 900, increment: 30 },
  { id: 'long', label: 'Long', mainTime: 1800, increment: 30 },
];

export const BYOYOMI_PRESETS = [
  {
    id: 'blitz',
    label: 'Blitz',
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
    mainTime: 1800,
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

export function findFischerPresetId(values) {
  const match = FISCHER_PRESETS.find(
    (p) => p.mainTime === values.mainTime && p.increment === values.increment,
  );
  return match ? match.id : null;
}

export function findByoyomiPresetId(values) {
  const match = BYOYOMI_PRESETS.find(
    (p) =>
      p.mainTime === values.mainTime &&
      p.periods === values.periods &&
      p.periodTime === values.periodTime,
  );
  return match ? match.id : null;
}

const DEFAULT_SETTINGS = {
  mode: 'fischer',
  fischer: { mainTime: 300, increment: 10 },
  byoyomi: { mainTime: 300, periods: 3, periodTime: 10 },
  audioEnabled: true,
};

/** Drop legacy persisted keys so highlight state cannot desync from time values */
function sanitizePersisted(settingsValue) {
  const next = { ...settingsValue };
  delete next.selectedFischerPresetId;
  delete next.selectedByoyomiPresetId;
  return next;
}

function createSettings() {
  const stored = loadSettings();
  let initial =
    stored == null ? { ...DEFAULT_SETTINGS } : { ...DEFAULT_SETTINGS, ...stored };

  initial.fischer = { ...DEFAULT_SETTINGS.fischer, ...(initial.fischer || {}) };
  initial.byoyomi = { ...DEFAULT_SETTINGS.byoyomi, ...(initial.byoyomi || {}) };
  initial = sanitizePersisted(initial);

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set(value) {
      const next = sanitizePersisted(value);
      saveSettings(next);
      set(next);
    },
    update(fn) {
      update((current) => {
        const next = sanitizePersisted(fn(current));
        saveSettings(next);
        return next;
      });
    },
    setMode(mode) {
      this.update((s) => ({ ...s, mode }));
    },
    setFischer(values) {
      this.update((s) => ({
        ...s,
        fischer: { ...s.fischer, ...values },
      }));
    },
    setByoyomi(values) {
      this.update((s) => ({
        ...s,
        byoyomi: { ...s.byoyomi, ...values },
      }));
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
