import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, RefreshCw, Camera, Check, Trash2, ImagePlus } from "lucide-react";

// OfferUp-style in-app camera: live preview, shutter, thumbnail strip of
// captured shots, front/back switch, and a gallery fallback. Returns the
// captured File[] to onDone.
export default function CameraCapture({ lang, max = 10, onDone, onClose }) {
  const ar = lang === "ar";
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState("environment");
  const [shots, setShots] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState(false);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(
    async (fc) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setReady(false);
        setError(ar ? "الكاميرا غير مدعومة" : "Camera not supported");
        return;
      }
      try {
        stop();
        setReady(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: fc } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
        setError("");
      } catch (e) {
        setReady(false);
        setError(ar ? "تعذّر الوصول للكاميرا — جرّب المعرض" : "Couldn't access camera — try gallery");
      }
    },
    [ar, stop]
  );

  useEffect(() => {
    start(facing);
    return stop;
  }, [facing, start, stop]);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
        setShots((s) => [...s, file].slice(0, max));
      },
      "image/jpeg",
      0.92
    );
    setFlash(true);
    setTimeout(() => setFlash(false), 160);
  };

  const removeShot = (i) => setShots((s) => s.filter((_, idx) => idx !== i));

  const finish = () => {
    stop();
    onDone?.(shots);
  };

  const close = () => {
    stop();
    onClose?.();
  };

  const onGallery = (e) => {
    const files = Array.from(e.target.files || []).slice(0, max - shots.length);
    e.target.value = "";
    if (files.length) setShots((s) => [...s, ...files].slice(0, max));
  };

  const thumbs = useMemo(() => shots.map((f) => URL.createObjectURL(f)), [shots]);
  useEffect(() => () => thumbs.forEach((u) => URL.revokeObjectURL(u)), [thumbs]);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col select-none">
      {flash && <div className="absolute inset-0 bg-white z-30 pointer-events-none" />}

      <div className="flex items-center justify-between p-4 text-white z-20">
        <button onClick={close} className="p-2 -m-2"><X size={24} /></button>
        <span className="font-semibold">{ar ? "التقاط الصور" : "Take photos"}</span>
        <span className="text-sm font-semibold w-8 text-center">{shots.length}/{max}</span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-4 p-6 text-center">
            <Camera size={40} />
            <p className="text-sm">{error}</p>
            <label className="px-4 py-2.5 rounded-xl bg-white/15 flex items-center gap-2 cursor-pointer">
              <ImagePlus size={18} /> {ar ? "اختر من المعرض" : "Choose from gallery"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={onGallery} />
            </label>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
          />
        )}
        {!error && ready && (
          <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/40" />
              ))}
            </div>
          </div>
        )}
      </div>

      {shots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 z-20">
          {thumbs.map((src, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/20">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeShot(i)}
                className="absolute top-0.5 end-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <Trash2 size={11} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 inset-x-0 bg-emerald-500/80 text-white text-[8px] text-center py-0.5">
                  {ar ? "غلاف" : "Cover"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-8 py-6 z-20">
        <label className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white cursor-pointer active:scale-95 transition">
          <ImagePlus size={22} />
          <input type="file" accept="image/*" multiple className="hidden" onChange={onGallery} />
        </label>

        <button
          onClick={capture}
          disabled={!ready || shots.length >= max}
          className="w-20 h-20 rounded-full bg-white ring-4 ring-white/30 flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
          aria-label={ar ? "التقاط" : "Capture"}
        >
          <span className="w-16 h-16 rounded-full bg-white border-4 border-black/80" />
        </button>

        <button
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-95 transition"
          aria-label={ar ? "تبديل الكاميرا" : "Switch camera"}
        >
          <RefreshCw size={22} />
        </button>
      </div>

      {shots.length > 0 && (
        <div className="px-4 pb-5 z-20">
          <button
            onClick={finish}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <Check size={20} /> {ar ? `استخدام ${shots.length} صورة` : `Use ${shots.length} photo${shots.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}