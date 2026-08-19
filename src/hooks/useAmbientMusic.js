import { useEffect, useRef, useState } from "react";

// Gentle, self-contained ambient chord loop via the Web Audio API.
// No external audio assets — starts on first user interaction (autoplay policy).
export default function useAmbientMusic() {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const start = () => {
      if (audioRef.current) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1100;
      filter.connect(master);

      // Am – F – C – G
      const chords = [
        [220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63],
        [261.63, 329.63, 392.0],
        [196.0, 246.94, 293.66],
      ];
      let i = 0;
      const playChord = () => {
        const now = ctx.currentTime;
        chords[i % chords.length].forEach((f) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.value = f;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.13, now + 1.2);
          g.gain.linearRampToValueAtTime(0.13, now + 3.0);
          g.gain.linearRampToValueAtTime(0, now + 4);
          osc.connect(g);
          g.connect(filter);
          osc.start(now);
          osc.stop(now + 4.1);
        });
        i++;
      };
      playChord();
      const interval = setInterval(playChord, 4000);
      audioRef.current = { ctx, master, interval };
      setStarted(true);
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);
    };

    const onFirst = () => start();
    window.addEventListener("pointerdown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      if (audioRef.current) {
        clearInterval(audioRef.current.interval);
        audioRef.current.ctx.close().catch(() => {});
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.master.gain.cancelScheduledValues(a.ctx.currentTime);
    a.master.gain.linearRampToValueAtTime(muted ? 0 : 0.5, a.ctx.currentTime + 0.3);
  }, [muted]);

  return { muted, toggle: () => setMuted((m) => !m), started };
}