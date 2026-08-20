import React, { useEffect, useRef, useState } from "react";
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut } from "lucide-react";

// Basic pre-upload editor: rotate (90° steps), pan (drag), and zoom (slider),
// then export a square 1080×1080 JPEG. Shown full-screen over the form.
export default function ImageEditor({ file, lang, onCancel, onDone }) {
  const ar = lang === "ar";
  const [url, setUrl] = useState(null);
  const [img, setImg] = useState(null);
  const [rot, setRot] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewportRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    const im = new Image();
    im.onload = () => setImg(im);
    im.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const clamp = (x, y, s) => {
    const vp = viewportRef.current;
    if (!vp) return { x, y };
    const r = vp.getBoundingClientRect();
    const maxX = ((s - 1) * r.width) / 2;
    const maxY = ((s - 1) * r.height) / 2;
    return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clamp(dragRef.current.ox + dx, dragRef.current.oy + dy, scale));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const onScale = (s) => {
    setScale(s);
    setOffset((prev) => clamp(prev.x, prev.y, s));
  };

  const confirm = async () => {
    if (!img) return;
    const vp = viewportRef.current.getBoundingClientRect();
    const V = vp.width;
    const C = 1080;
    const rotRad = (rot % 360) * Math.PI / 180;
    const rot90 = rot % 180 !== 0;
    const iw = rot90 ? img.naturalHeight : img.naturalWidth;
    const ih = rot90 ? img.naturalWidth : img.naturalHeight;
    const coverScaleC = Math.max(C / iw, C / ih);
    const canvas = document.createElement("canvas");
    canvas.width = C;
    canvas.height = C;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, C, C);
    ctx.translate(C / 2 + offset.x * (C / V), C / 2 + offset.y * (C / V));
    ctx.rotate(rotRad);
    ctx.scale(coverScaleC * scale, coverScaleC * scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    const name = (file.name || "image").replace(/\.[^.]+$/, "");
    onDone(new File([blob], name + ".jpg", { type: "image/jpeg" }));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onCancel} className="p-2"><X size={22} /></button>
        <span className="font-semibold">{ar ? "تعديل الصورة" : "Edit photo"}</span>
        <button onClick={confirm} className="p-2 text-emerald-400"><Check size={24} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          ref={viewportRef}
          className="relative aspect-square w-full max-w-md rounded-2xl overflow-hidden bg-slate-900"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ touchAction: "none" }}
        >
          {url && (
            <img
              src={url}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover select-none"
              style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rot}deg) scale(${scale})`, transformOrigin: "center" }}
            />
          )}
        </div>
      </div>
      <div className="p-4 space-y-4 text-white">
        <div className="flex items-center justify-center gap-6">
          <button onClick={() => setRot((r) => r - 90)} className="p-3 rounded-full bg-white/10 active:bg-white/20"><RotateCcw size={22} /></button>
          <button onClick={() => setRot((r) => r + 90)} className="p-3 rounded-full bg-white/10 active:bg-white/20"><RotateCw size={22} /></button>
        </div>
        <div className="flex items-center gap-3">
          <ZoomOut size={18} className="shrink-0" />
          <input type="range" min={1} max={3} step={0.01} value={scale} onChange={(e) => onScale(Number(e.target.value))} className="flex-1 accent-emerald-400" />
          <ZoomIn size={18} className="shrink-0" />
        </div>
        <button onClick={confirm} className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold">{ar ? "تم" : "Done"}</button>
      </div>
    </div>
  );
}