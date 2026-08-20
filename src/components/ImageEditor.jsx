import React, { useEffect, useRef, useState, useCallback } from "react";
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut, Crop as CropIcon, Pencil, Type, Droplets, Undo2 } from "lucide-react";

const COLORS = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
const BLUR_PX = 14; // blur radius in stage CSS px

// Basic pre-upload editor: crop (rotate/pan/zoom) + draw + text + blur, then
// export a square 1080×1080 JPEG. Everything is composited on a single stage
// canvas so what you see is what you get.
export default function ImageEditor({ file, lang, onCancel, onDone }) {
  const ar = lang === "ar";
  const [img, setImg] = useState(null);
  const [rot, setRot] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState("crop"); // crop | draw | text | blur
  const [color, setColor] = useState("#ef4444");
  const [brush, setBrush] = useState(14);
  const [strokes, setStrokes] = useState([]); // {color,size,points:[{x,y}]} in 0..1
  const [blurStrokes, setBlurStrokes] = useState([]); // {size,points:[{x,y}]} in 0..1
  const [texts, setTexts] = useState([]); // {text,x,y,color,size}
  const [log, setLog] = useState([]); // {type:'draw'|'blur'|'text'} for undo
  const stageRef = useRef(null);
  const dragRef = useRef(null); // crop pan
  const drawRef = useRef(null); // active annotation stroke
  const rafRef = useRef(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); URL.revokeObjectURL(u); };
    im.src = u;
  }, [file]);

  const clamp = (x, y, s) => {
    const vp = stageRef.current;
    if (!vp) return { x, y };
    const r = vp.getBoundingClientRect();
    const maxX = ((s - 1) * r.width) / 2;
    const maxY = ((s - 1) * r.height) / 2;
    return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
  };

  const render = useCallback(() => {
    const canvas = stageRef.current;
    if (!canvas || !img) return;
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    const V = r.width;
    if (!V) return;
    canvas.width = Math.round(V * dpr);
    canvas.height = Math.round(V * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, V, V);
    // base image with crop transform
    ctx.save();
    ctx.translate(V / 2 + offset.x, V / 2 + offset.y);
    ctx.rotate((rot * Math.PI) / 180);
    const rot90 = rot % 180 !== 0;
    const iw = rot90 ? img.naturalHeight : img.naturalWidth;
    const ih = rot90 ? img.naturalWidth : img.naturalHeight;
    const cover = Math.max(V / iw, V / ih);
    ctx.scale(cover * scale, cover * scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
    // blur regions (blur the composited image, masked to blur strokes)
    if (blurStrokes.length) {
      const mask = document.createElement("canvas");
      mask.width = Math.round(V * dpr); mask.height = Math.round(V * dpr);
      const mctx = mask.getContext("2d");
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.strokeStyle = "#fff"; mctx.fillStyle = "#fff";
      mctx.lineCap = "round"; mctx.lineJoin = "round";
      blurStrokes.forEach((s) => {
        mctx.lineWidth = s.size * V;
        mctx.beginPath();
        s.points.forEach((p, i) => { const x = p.x * V, y = p.y * V; i ? mctx.lineTo(x, y) : mctx.moveTo(x, y); });
        mctx.stroke();
      });
      const blurred = document.createElement("canvas");
      blurred.width = Math.round(V * dpr); blurred.height = Math.round(V * dpr);
      const bctx = blurred.getContext("2d");
      bctx.filter = `blur(${BLUR_PX * dpr}px)`;
      bctx.drawImage(canvas, 0, 0);
      bctx.filter = "none";
      bctx.globalCompositeOperation = "destination-in";
      bctx.drawImage(mask, 0, 0);
      ctx.drawImage(blurred, 0, 0, Math.round(V * dpr), Math.round(V * dpr), 0, 0, V, V);
    }
    // draw strokes
    strokes.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.size * V;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => { const x = p.x * V, y = p.y * V; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    });
    // text
    texts.forEach((t) => {
      ctx.fillStyle = t.color;
      ctx.font = `bold ${Math.round(t.size * V)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t.text, t.x * V, t.y * V);
    });
  }, [img, rot, scale, offset, strokes, blurStrokes, texts]);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; render(); });
  }, [render]);

  useEffect(() => { schedule(); }, [schedule]);

  const pos = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, V: r.width };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e);
    if (tool === "crop") {
      dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    } else if (tool === "draw") {
      const stroke = { color, size: brush / p.V, points: [{ x: p.x, y: p.y }] };
      drawRef.current = { kind: "draw", stroke };
      setStrokes((s) => [...s, stroke]);
    } else if (tool === "blur") {
      const stroke = { size: brush / p.V, points: [{ x: p.x, y: p.y }] };
      drawRef.current = { kind: "blur", stroke };
      setBlurStrokes((s) => [...s, stroke]);
    } else if (tool === "text") {
      const txt = window.prompt(ar ? "اكتب النص" : "Enter text", "");
      if (txt && txt.trim()) {
        setTexts((s) => [...s, { text: txt.trim(), x: p.x, y: p.y, color, size: 0.07 }]);
        setLog((l) => [...l, { type: "text" }]);
      }
    }
  };
  const onPointerMove = (e) => {
    if (tool === "crop" && dragRef.current) {
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      setOffset(clamp(dragRef.current.ox + dx, dragRef.current.oy + dy, scale));
      return;
    }
    if (drawRef.current) {
      const p = pos(e);
      drawRef.current.stroke.points.push({ x: p.x, y: p.y });
      drawRef.current.kind === "draw" ? setStrokes((s) => [...s]) : setBlurStrokes((s) => [...s]);
    }
  };
  const onPointerUp = () => {
    if (tool === "crop") { dragRef.current = null; return; }
    if (drawRef.current) {
      setLog((l) => [...l, { type: drawRef.current.kind }]);
      drawRef.current = null;
    }
  };

  const undo = () => {
    if (!log.length) return;
    const last = log[log.length - 1];
    if (last.type === "draw") setStrokes((s) => s.slice(0, -1));
    else if (last.type === "blur") setBlurStrokes((s) => s.slice(0, -1));
    else if (last.type === "text") setTexts((s) => s.slice(0, -1));
    setLog((l) => l.slice(0, -1));
  };

  const onScale = (s) => { setScale(s); setOffset((prev) => clamp(prev.x, prev.y, s)); };

  const confirm = async () => {
    if (!img) return;
    const r = stageRef.current.getBoundingClientRect();
    const V = r.width;
    const C = 1080;
    const k = C / V;
    const canvas = document.createElement("canvas");
    canvas.width = C; canvas.height = C;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, C, C);
    ctx.save();
    ctx.translate(C / 2 + offset.x * k, C / 2 + offset.y * k);
    ctx.rotate((rot * Math.PI) / 180);
    const rot90 = rot % 180 !== 0;
    const iw = rot90 ? img.naturalHeight : img.naturalWidth;
    const ih = rot90 ? img.naturalWidth : img.naturalHeight;
    const cover = Math.max(C / iw, C / ih);
    ctx.scale(cover * scale, cover * scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
    if (blurStrokes.length) {
      const mask = document.createElement("canvas"); mask.width = C; mask.height = C;
      const mctx = mask.getContext("2d");
      mctx.strokeStyle = "#fff"; mctx.fillStyle = "#fff";
      mctx.lineCap = "round"; mctx.lineJoin = "round";
      blurStrokes.forEach((s) => {
        mctx.lineWidth = s.size * C;
        mctx.beginPath();
        s.points.forEach((p, i) => { const x = p.x * C, y = p.y * C; i ? mctx.lineTo(x, y) : mctx.moveTo(x, y); });
        mctx.stroke();
      });
      const blurred = document.createElement("canvas"); blurred.width = C; blurred.height = C;
      const bctx = blurred.getContext("2d");
      bctx.filter = `blur(${BLUR_PX * k}px)`;
      bctx.drawImage(canvas, 0, 0);
      bctx.filter = "none";
      bctx.globalCompositeOperation = "destination-in";
      bctx.drawImage(mask, 0, 0);
      ctx.drawImage(blurred, 0, 0);
    }
    strokes.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.size * C;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => { const x = p.x * C, y = p.y * C; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    });
    texts.forEach((t) => {
      ctx.fillStyle = t.color;
      ctx.font = `bold ${Math.round(t.size * C)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t.text, t.x * C, t.y * C);
    });
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
    const name = (file.name || "image").replace(/\.[^.]+$/, "");
    onDone(new File([blob], name + ".jpg", { type: "image/jpeg" }));
  };

  const tools = [
    { id: "crop", label: ar ? "اقتصاص" : "Crop", Icon: CropIcon },
    { id: "draw", label: ar ? "رسم" : "Draw", Icon: Pencil },
    { id: "text", label: ar ? "نص" : "Text", Icon: Type },
    { id: "blur", label: ar ? "تمويه" : "Blur", Icon: Droplets },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onCancel} className="p-2"><X size={22} /></button>
        <span className="font-semibold">{ar ? "تعديل الصورة" : "Edit photo"}</span>
        <button onClick={confirm} className="p-2 text-emerald-400"><Check size={24} /></button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="relative aspect-square w-full max-w-md rounded-2xl overflow-hidden bg-slate-900">
          <canvas
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: tool === "crop" ? "none" : "none", cursor: tool === "crop" ? "grab" : "crosshair" }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3 text-white">
        <div className="flex items-center justify-center gap-2">
          {tools.map((tl) => (
            <button
              key={tl.id}
              onClick={() => setTool(tl.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold ${tool === tl.id ? "bg-emerald-500 text-white" : "bg-white/10"}`}
            >
              <tl.Icon size={18} /> {tl.label}
            </button>
          ))}
          <button onClick={undo} disabled={!log.length} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 disabled:opacity-40">
            <Undo2 size={18} /> {ar ? "تراجع" : "Undo"}
          </button>
        </div>

        {(tool === "draw" || tool === "text") && (
          <div className="flex items-center justify-center gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-white scale-110" : "border-white/30"}`} style={{ background: c }} />
            ))}
          </div>
        )}
        {(tool === "draw" || tool === "blur") && (
          <div className="flex items-center gap-3">
            <span className="text-xs">{ar ? "الحجم" : "Size"}</span>
            <input type="range" min={4} max={48} step={1} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="flex-1 accent-emerald-400" />
          </div>
        )}

        {tool === "crop" && (
          <>
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setRot((r) => r - 90)} className="p-3 rounded-full bg-white/10 active:bg-white/20"><RotateCcw size={20} /></button>
              <button onClick={() => setRot((r) => r + 90)} className="p-3 rounded-full bg-white/10 active:bg-white/20"><RotateCw size={20} /></button>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut size={18} className="shrink-0" />
              <input type="range" min={1} max={3} step={0.01} value={scale} onChange={(e) => onScale(Number(e.target.value))} className="flex-1 accent-emerald-400" />
              <ZoomIn size={18} className="shrink-0" />
            </div>
          </>
        )}
        {tool === "text" && <p className="text-center text-xs text-white/60">{ar ? "اضغط على الصورة لإضافة نص" : "Tap the photo to add text"}</p>}

        <button onClick={confirm} className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold">{ar ? "تم" : "Done"}</button>
      </div>
    </div>
  );
}