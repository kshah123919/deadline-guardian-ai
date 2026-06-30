/**
 * Synthesizes sounds using the Web Audio API and Speech Synthesis API
 * to avoid external asset dependency issues.
 */
export function playReminderSound(
  mode: 'silent' | 'gentle' | 'bell' | 'voice',
  context?: {
    taskName: string;
    isCompleted?: boolean;
    elapsedMs?: number;
    awayMs?: number;
    estimatedDuration?: string;
  }
) {
  if (mode === 'silent') return;

  if (mode === 'voice') {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        
        let message = "Time to get back to your task.";
        
        if (context) {
          const { taskName, isCompleted, elapsedMs = 0, awayMs = 0, estimatedDuration } = context;
          
          // Helper to parse duration string to ms
          const parseDurationToMs = (dur: string | undefined): number => {
            if (!dur) return 25 * 60 * 1000; // default 25 minutes
            const cleaned = dur.toLowerCase().trim();
            const val = parseFloat(cleaned);
            if (isNaN(val)) return 25 * 60 * 1000;
            
            if (cleaned.includes('h')) {
              return val * 3600000;
            } else if (cleaned.includes('m')) {
              return val * 60000;
            } else if (cleaned.includes('s')) {
              return val * 1000;
            }
            return val * 3600000;
          };

          const targetMs = estimatedDuration ? parseDurationToMs(estimatedDuration) : 25 * 60 * 1000;
          const isFinished = elapsedMs >= targetMs || (elapsedMs + awayMs >= targetMs);
          const minutesAway = Math.round(awayMs / 60000);

          if (isCompleted) {
            // CASE 6: Already marked completed
            message = `Welcome back! Great job completing ${taskName}. What's next?`;
          } else if (isFinished) {
            // CASE 5: Focus timer ended while away
            message = `Your focus session for ${taskName} ended while you were away. Ready to start another session?`;
          } else if (awayMs >= 600000) {
            // CASE 4: Away more than 10 minutes
            message = `You've been away for ${minutesAway} minutes. Resume your focus session to stay on schedule.`;
          } else if (awayMs >= 120000) {
            // CASE 3: Away between 2 and 10 minutes
            message = `You were away for ${minutesAway} minutes. Your focus session is still active. Let's get back to ${taskName}.`;
          } else if (awayMs >= 30000) {
            // CASE 2: Away between 30 seconds and 2 minutes
            message = `Welcome back. Let's continue your ${taskName} task.`;
          }
        }

        const utterance = new SpeechSynthesisUtterance(message);
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
