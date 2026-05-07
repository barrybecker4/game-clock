/**
 * Voice announcements via Web Speech API.
 * Speech is used for byo-yomi entry ("Byo-yomi") and the last-10-seconds
 * countdown of each byo-yomi period.
 *
 * The synthesizer is queued, but we keep utterances short so they finish
 * before the next second arrives.
 */

let enabled = true;
let primed = false;
let preferredVoice = null;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang && v.lang.startsWith('en'));
  const candidates = englishVoices.length > 0 ? englishVoices : voices;

  const preferredNames = [
    'Samantha',
    'Karen',
    'Google US English',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Daniel',
  ];

  for (const name of preferredNames) {
    const match = candidates.find((v) => v.name === name);
    if (match) return match;
  }
  return candidates[0];
}

function ensureVoice() {
  if (preferredVoice) return preferredVoice;
  preferredVoice = pickVoice();
  if (!preferredVoice && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        preferredVoice = pickVoice();
      },
      { once: true },
    );
  }
  return preferredVoice;
}

export function setVoiceEnabled(value) {
  enabled = !!value;
  if (!enabled && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
}

/**
 * Some browsers (notably Safari/iOS) require a user gesture before any
 * speech synthesis is allowed. Call this from a tap/click handler to
 * "prime" the synthesizer with a silent utterance.
 */
export function primeVoice() {
  if (primed) return;
  if (typeof speechSynthesis === 'undefined') return;
  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    primed = true;
    ensureVoice();
  } catch (err) {
    console.warn('Failed to prime voice synth:', err);
  }
}

export function speak(text, { rate = 1.05, pitch = 1, volume = 1 } = {}) {
  if (!enabled) return;
  if (typeof speechSynthesis === 'undefined') return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const voice = ensureVoice();
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    speechSynthesis.speak(u);
  } catch (err) {
    console.warn('speak() failed:', err);
  }
}

export function cancelSpeech() {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
}
