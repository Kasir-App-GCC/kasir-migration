import React, { useEffect, useRef, useState, useCallback } from "react";
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut, Crop as CropIcon, Pencil, Type, Droplets, Undo2, Trash2 } from "lucide-react";

const COLORS = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
const BLUR_PX = 14; // blur radius in stage CSS px
const clampScale = (s) => Math.min(Math.max(s, 1), 5);

// Basic pre-upload editor: crop (rotate/pan/zoom via slider, pinch, wheel) +
// draw + text (inline, draggable) + blur, then export a square 1080×1080 JPEG.
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
  const [editing, setEditing] = useState(null); // {index}
  const [stageSize, setStageSize] = useState(0);
  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const pan = useRef(null);
  const pinch = useRef(null);
  const drawRef = useRef(null);
  const dragText = useRef(null);
  const rafRef = useRef(null);
  const tf = useRef({ scale, offset });
  tf.current = { scale, offset };

  useEffect(() => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); URL.revokeObjectURL(u); };
    im.src = u;
  }, [file]);

  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const measure = () => setStageSize(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    strokes.forEach((s) => {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.size * V;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => { const x = p.x * V, y = p.y * V; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    });
    texts.forEach((t, i) => {
      if (editing && editing.index === i) return;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${Math.round(t.size * V)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t.text, t.x * V, t.y * V);
    });
  }, [img, rot, scale, offset, strokes, blurStrokes, texts, editing]);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; render(); });
  }, [render]);
  useEffect(() => { schedule(); }, [schedule]);

  // Native non-passive wheel listener so we can preventDefault and zoom under the cursor.
  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const onWheel = (e) => {
      if (tool !== "crop") return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const V = r.width;
      const px = e.clientX - r.left - V / 2;
      const py = e.clientY - r.top - V / 2;
      const { scale: s, offset: o } = tf.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const ns = clampScale(s * factor);
      const local = { x: (px - o.x) / s, y: (py - o.y) / s };
      const no = { x: px - local.x * ns, y: py - local.y * ns };
      setScale(ns); setOffset(clamp(no.x, no.y, ns));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [tool]);

  const rel = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, V: r.width, nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const hitText = (nx, ny) => {
    const V = stageRef.current.getBoundingClientRect().width;
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      const fs = t.size * V;
      const w = (t.text || "").length * fs * 0.55 + 12;
      const h = fs * 1.2;
      if (Math.abs(nx - t.x) * V < w / 2 && Math.abs(ny - t.y) * V < h / 2) return i;
    }
    return -1;
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = rel(e);
    pointers.set(e.pointerId, { cx: e.clientX, cy: e.clientY, x: p.x, y: p.y, nx: p.nx, ny: p.ny });
    if (tool === "crop") {
      if (pointers.size === 1) pan.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      if (pointers.size === 2) {
        pan.current = null;
        const [a, b] = [...pointers.values()];
        pinch.current = { dist: dist(a, b), scale, mid: midOf(a, b), ox: offset.x, oy: offset.y };
      }
    } else if (tool === "draw" && pointers.size === 1) {
      const stroke = { color, size: brush / p.V, points: [{ x: p.nx, y: p.ny }] };
      drawRef.current = { kind: "draw", stroke };
      setStrokes((s) => [...s, stroke]);
    } else if (tool === "blur" && pointers.size === 1) {
      const stroke = { size: brush / p.V, points: [{ x: p.nx, y: p.ny }] };
      drawRef.current = { kind: "blur", stroke };
      setBlurStrokes((s) => [...s, stroke]);
    } else if (tool === "text" && pointers.size === 1) {
      const hi = hitText(p.nx, p.ny);
      if (hi >= 0) {
        dragText.current = { index: hi, moved: false, ox: texts[hi].x, oy: texts[hi].y, sx: p.nx, sy: p.ny };
      } else {
        const idx = texts.length;
        setTexts((s) => [...s, { text: "", x: p.nx, y: p.ny, color, size: 0.07 }]);
        setEditing({ index: idx });
      }
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.has(e.pointerId)) return;
    const p = rel(e);
    pointers.set(e.pointerId, { cx: e.clientX, cy: e.clientY, x: p.x, y: p.y, nx: p.nx, ny: p.ny });
    if (tool === "crop") {
      if (pinch.current && pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = dist(a, b);
        const ns = clampScale((pinch.current.scale * d) / pinch.current.dist);
        const m = midOf(a, b);
        const no = {
          x: m.x - (pinch.current.mid.x - pinch.current.ox) * (ns / pinch.current.scale),
          y: m.y - (pinch.current.mid.y - pinch.current.oy) * (ns / pinch.current.scale),
        };
        setScale(ns); setOffset(clamp(no.x, no.y, ns));
      } else if (pan.current) {
        setOffset(clamp(pan.current.ox + e.clientX - pan.current.x, pan.current.oy + e.clientY - pan.current.y, scale));
      }
    } else if (drawRef.current) {
      drawRef.current.stroke.points.push({ x: p.nx, y: p.ny });
      drawRef.current.kind === "draw" ? setStrokes((s) => [...s]) : setBlurStrokes((s) => [...s]);
    } else if (tool === "text" && dragText.current) {
      const dx = p.nx - dragText.current.sx;
      const dy = p.ny - dragText.current.sy;
      if (Math.abs(dx) > 0.004 || Math.abs(dy) > 0.004) dragText.current.moved = true;
      const i = dragText.current.index;
      setTexts((s) => s.map((t, j) => (j === i ? { ...t, x: dragText.current.ox + dx, y: dragText.current.oy + dy } : t)));
    }
  };

  const onPointerUp = (e) => {
    const had = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (tool === "crop") {
      if (pointers.size < 2) pinch.current = null;
      if (pointers.size === 1) {
        const [r] = [...pointers.values()];
        pan.current = { x: r.cx, y: r.cy, ox: offset.x, oy: offset.y };
      }
      if (pointers.size === 0) pan.current = null;
    } else if (drawRef.current) {
      const kind = drawRef.current.kind;
      setLog((l) => [...l, { type: kind }]);
      drawRef.current = null;
    } else if (tool === "text" && dragText.current) {
      if (!dragText.current.moved) setEditing({ index: dragText.current.index });
      dragText.current = null;
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

  const commitText = () => {
    if (!editing) return;
    const t = texts[editing.index];
    if (!t || !t.text.trim()) setTexts((s) => s.filter((_, j) => j !== editing.index));
    setEditing(null);
  };
  const removeEditingText = () => {
    if (!editing) return;
    setTexts((s) => s.filter((_, j) => j !== editing.index));
    setEditing(null);
  };

  const confirm = async () => {
    if (editing) commitText();
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
  const editingText = editing != null ? texts[editing.index] : null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col select-none">
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
            style={{ touchAction: "none", cursor: tool === "crop" ? "grab" : tool === "text" ? "move" : "crosshair" }}
          />
          {editing && editingText && stageSize > 0 && (
            <div className="absolute z-10 flex flex-col items-center" style={{ left: editingText.x * stageSize, top: editingText.y * stageSize, transform: "translate(-50%,-50%)" }}>
              <input
                autoFocus
                value={editingText.text}
                onChange={(e) => setTexts((s) => s.map((t, j) => (j === editing.index ? { ...t, text: e.target.value.slice(0, 40) } : t)))}
                onBlur={commitText}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}
                placeholder={ar ? "اكتب…" : "Type…"}
                className="bg-black/40 text-center font-bold outline-none border-2 border-dashed border-white/80 rounded-md px-2 py-0.5 whitespace-nowrap"
                style={{ color: editingText.color, caretColor: editingText.color, fontSize: Math.round(editingText.size * stageSize), maxWidth: stageSize * 0.9 }}
              />
              <button onClick={removeEditingText} className="mt-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1"><Trash2 size={11} /> {ar ? "حذف" : "Delete"}</button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3 text-white">
        <div className="flex items-center justify-center gap-2">
          {tools.map((tl) => (
            <button key={tl.id} onClick={() => { if (editing) commitText(); setTool(tl.id); }} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold ${tool === tl.id ? "bg-emerald-500 text-white" : "bg-white/10"}`}>
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
              <input type="range" min={1} max={5} step={0.01} value={scale} onChange={(e) => onScale(Number(e.target.value))} className="flex-1 accent-emerald-400" />
              <ZoomIn size={18} className="shrink-0" />
            </div>
            <p className="text-center text-xs text-white/50">{ar ? "اسحب للتحريك · قرّص أو عجلة الفأرة للتكبير" : "Drag to pan · pinch or mouse-wheel to zoom"}</p>
          </>
        )}
        {tool === "text" && <p className="text-center text-xs text-white/60">{ar ? "اضغط لإضافة نص · اسحب النص لنقله · اضغط عليه لتعديله" : "Tap to add text · drag to move · tap again to edit"}</p>}
        {tool === "draw" && <p className="text-center text-xs text-white/60">{ar ? "ارسم بإصبعك أو بالماوس" : "Draw with your finger or mouse"}</p>}
        {tool === "blur" && <p className="text-center text-xs text-white/60">{ar ? "مرّر فوق المنطقة لتمويهها" : "Brush over areas to blur them"}</p>}

        <button onClick={confirm} className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold">{ar ? "تم" : "Done"}</button>
      </div>
    </div>
  );
}