/**
 * Synthesizes sounds using the Web Audio API and Speech Synthesis API
 * to avoid external asset dependency issues.
 */
export function playReminderSound(mode: 'silent' | 'gentle' | 'bell' | 'voice') {
  if (mode === 'silent') return;

  if (mode === 'voice') {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Time to get back to your task.");
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
    return;
  }

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (mode === 'gentle') {
      // Short dual-tone notification
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(880, ctx.currentTime, 0.15);
      playTone(1100, ctx.currentTime + 0.1, 0.25);
    } else if (mode === 'bell') {
      // Harmonic bell chime
      const now = ctx.currentTime;
      const playHarmonic = (freq: number, amplitude: number, decay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(amplitude, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
        
        osc.start(now);
        osc.stop(now + decay);
      };
      // Bell harmonics
      playHarmonic(523.25, 0.08, 2.0); // Fundamental (C5)
      playHarmonic(783.99, 0.04, 1.5); // Perfect fifth (G5)
      playHarmonic(1046.50, 0.02, 1.0); // Octave (C6)
    }
  } catch (e) {
    console.warn("Web Audio API blocked or not supported by browser:", e);
  }
}
