import { useEffect, useRef, useState } from "react";

// Plays a per-scene voice-over MP3. Starts on first user interaction
// (browser autoplay policy), with a mute toggle.
export default function useVoiceover(urls, scene) {
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const onFirst = () => {
      setStarted(true);
      window.removeEventListener("pointerdown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst);
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);

  useEffect(() => {
    if (!started || !urls[scene]) return;
    const a = new Audio(urls[scene]);
    audioRef.current = a;
    a.muted = muted;
    a.play().catch(() => {});
    return () => { try { a.pause(); } catch {} };
  }, [scene, started, urls]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  return { muted, toggle: () => setMuted((m) => !m) };
}