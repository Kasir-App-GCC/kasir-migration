import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { RotateCw, RotateCcw, Check, X, ZoomIn, ZoomOut, Pencil, Droplets, Undo2, SlidersHorizontal } from "lucide-react";

const COLORS = ["#ffffff", "#000000", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
const clampZoom = (z) => Math.min(Math.max(z, 1), 5);

const FILTERS = [
  { id: "original", ar: "الأصل", en: "Original", css: "none" },
  { id: "bw", ar: "أبيض وأسود", en: "B&W", css: "grayscale(1) contrast(1.05)" },
  { id: "warm", ar: "دافئ", en: "Warm", css: "sepia(0.4) saturate(1.4) brightness(1.03)" },
  { id: "cool", ar: "بارد", en: "Cool", css: "saturate(1.2) hue-rotate(-18deg) brightness(1.04)" },
  { id: "vivid", ar: "زاهي", en: "Vivid", css: "saturate(1.6) contrast(1.15)" },
  { id: "vintage", ar: "كلاسيكي", en: "Vintage", css: "sepia(0.3) contrast(1.1) brightness(1.05) saturate(1.2)" },
];

// Pre-upload editor (Instagram/WhatsApp style): the full original photo is shown
// first (contained, with a blurred background fill) — pinch/drag to zoom & crop,
// plus filters, draw, and blur. When multiple photos are queued, a horizontal
// thumbnail strip lets the user pick which to edit (Signal-style). What you see
// is what gets posted (1080×1080 JPEG).
export default function ImageEditor({ files, lang, onFileDone, onSkipFile }) {
  const ar = lang === "ar";
  const [rawIdx, setRawIdx] = useState(0);
  const activeIdx = Math.min(rawIdx, files.length - 1);
  const file = files[activeIdx];
  const [img, setImg] = useState(null);
  const [rot, setRot] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState("");
  const [color, setColor] = useState("#ef4444");
  const [brush, setBrush] = useState(14);
  const [strokes, setStrokes] = useState([]);
  const [blurStrokes, setBlurStrokes] = useState([]);
  const [filterIdx, setFilterIdx] = useState(0);
  const [log, setLog] = useState([]);
  const [box, setBox] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const stageRef = useRef(null);
  const wrapRef = useRef(null);
  const pointers = useRef(new Map());
  const pan = useRef(null);
  const pinch = useRef(null);
  const drawRef = useRef(null);
  const rafRef = useRef(null);
  const tf = useRef({ zoom, offset });
  tf.current = { zoom, offset };
  const filterCss = FILTERS[filterIdx].css;

  // Object URLs for the thumbnail strip.
  const thumbs = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => thumbs.forEach((u) => URL.revokeObjectURL(u)), [thumbs]);

  // Load the active file and reset all edits when it changes.
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); URL.revokeObjectURL(u); };
    im.src = u;
    setRot(0); setZoom(1); setOffset({ x: 0, y: 0 });
    setStrokes([]); setBlurStrokes([]); setFilterIdx(0); setLog([]); setTool("");
  }, [file]);

  // Measure the available area and render a true square that fits inside it.
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox(Math.max(0, Math.floor(Math.min(r.width, r.height))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dims = () => {
    const rot90 = rot % 180 !== 0;
    const iw = rot90 ? img.naturalHeight : img.naturalWidth;
    const ih = rot90 ? img.naturalWidth : img.naturalHeight;
    return { iw, ih };
  };

  const clamp = (x, y, z) => {
    const vp = stageRef.current;
    if (!vp || !img) return { x, y };
    const r = vp.getBoundingClientRect();
    const V = r.width || box;
    const { iw, ih } = dims();
    const fit = Math.min(V / iw, V / ih);
    const dispW = iw * fit * z;
    const dispH = ih * fit * z;
    const maxX = Math.max(0, (dispW - V) / 2);
    const maxY = Math.max(0, (dispH - V) / 2);
    return { x: Math.min(Math.max(x, -maxX), maxX), y: Math.min(Math.max(y, -maxY), maxY) };
  };

  const render = useCallback(() => {
    const canvas = stageRef.current;
    if (!canvas || !img || !box) return;
    const dpr = window.devicePixelRatio || 1;
    const V = box;
    canvas.width = Math.round(V * dpr);
    canvas.height = Math.round(V * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, V, V);
    const { iw, ih } = dims();
    const fit = Math.min(V / iw, V / ih);
    const bgCover = Math.max(V / iw, V / ih) * 1.12;
    const bgFilter = (filterCss && filterCss !== "none" ? filterCss + " " : "") + `blur(${Math.round(V * 0.05)}px)`;
    ctx.save();
    ctx.filter = bgFilter;
    ctx.translate(V / 2, V / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(bgCover, bgCover);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
    ctx.save();
    ctx.filter = filterCss;
    ctx.translate(V / 2 + offset.x, V / 2 + offset.y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(fit * zoom, fit * zoom);
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
      // Blurred image via downscale-upscale (reliable on mobile, no ctx.filter).
      const scale = 0.1;
      const small = document.createElement("canvas");
      small.width = Math.max(1, Math.round(V * dpr * scale));
      small.height = Math.max(1, Math.round(V * dpr * scale));
      const sctx = small.getContext("2d");
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      const blurred = document.createElement("canvas");
      blurred.width = Math.round(V * dpr); blurred.height = Math.round(V * dpr);
      const bctx = blurred.getContext("2d");
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(small, 0, 0, blurred.width, blurred.height);
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
  }, [img, rot, zoom, offset, strokes, blurStrokes, filterCss, box]);

  const schedule = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; render(); });
  }, [render]);
  useEffect(() => { schedule(); }, [schedule]);

  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const V = r.width;
      const px = e.clientX - r.left - V / 2;
      const py = e.clientY - r.top - V / 2;
      const { zoom: z, offset: o } = tf.current;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const nz = clampZoom(z * factor);
      const local = { x: (px - o.x) / z, y: (py - o.y) / z };
      const no = { x: px - local.x * nz, y: py - local.y * nz };
      setZoom(nz); setOffset(clamp(no.x, no.y, nz));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const rel = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, V: r.width, nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height };
  };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const beginPinch = () => {
    pan.current = null;
    drawRef.current = null;
    const [a, b] = [...pointers.current.values()];
    pinch.current = { dist: dist(a, b), zoom, mid: midOf(a, b), ox: offset.x, oy: offset.y };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = rel(e);
    pointers.current.set(e.pointerId, { cx: e.clientX, cy: e.clientY, x: p.x, y: p.y, nx: p.nx, ny: p.ny });
    if (pointers.current.size === 2) { beginPinch(); return; }
    if (pointers.current.size !== 1) return;
    if (tool !== "draw" && tool !== "blur") {
      pan.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    } else if (tool === "draw") {
      const stroke = { color, size: brush / p.V, points: [{ x: p.nx, y: p.ny }] };
      drawRef.current = { kind: "draw", stroke };
      setStrokes((s) => [...s, stroke]);
    } else if (tool === "blur") {
      const stroke = { size: brush / p.V, points: [{ x: p.nx, y: p.ny }] };
      drawRef.current = { kind: "blur", stroke };
      setBlurStrokes((s) => [...s, stroke]);
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = rel(e);
    pointers.current.set(e.pointerId, { cx: e.clientX, cy: e.clientY, x: p.x, y: p.y, nx: p.nx, ny: p.ny });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const d = dist(a, b);
      const ns = clampZoom((pinch.current.zoom * d) / pinch.current.dist);
      const m = midOf(a, b);
      const no = {
        x: m.x - (pinch.current.mid.x - pinch.current.ox) * (ns / pinch.current.zoom),
        y: m.y - (pinch.current.mid.y - pinch.current.oy) * (ns / pinch.current.zoom),
      };
      setZoom(ns); setOffset(clamp(no.x, no.y, ns));
    } else if (pan.current) {
      setOffset(clamp(pan.current.ox + e.clientX - pan.current.x, pan.current.oy + e.clientY - pan.current.y, zoom));
    } else if (drawRef.current) {
      drawRef.current.stroke.points.push({ x: p.nx, y: p.ny });
      drawRef.current.kind === "draw" ? setStrokes((s) => [...s]) : setBlurStrokes((s) => [...s]);
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (pinch.current && pointers.current.size < 2) {
      pinch.current = null;
      if (pointers.current.size === 1 && tool !== "draw" && tool !== "blur") {
        const [r] = [...pointers.current.values()];
        pan.current = { x: r.cx, y: r.cy, ox: offset.x, oy: offset.y };
      }
      return;
    }
    if (pointers.current.size > 0) return;
    if (drawRef.current) {
      const kind = drawRef.current.kind;
      setLog((l) => [...l, { type: kind }]);
      drawRef.current = null;
    } else if (pan.current) {
      pan.current = null;
    }
  };

  const undo = () => {
    if (!log.length) return;
    const last = log[log.length - 1];
    if (last.type === "draw") setStrokes((s) => s.slice(0, -1));
    else if (last.type === "blur") setBlurStrokes((s) => s.slice(0, -1));
    setLog((l) => l.slice(0, -1));
  };

  const onZoom = (z) => { setZoom(z); setOffset((prev) => clamp(prev.x, prev.y, z)); };

  const confirm = async () => {
    if (!img || submitting) return;
    setSubmitting(true);
    try {
      const V = box || stageRef.current.getBoundingClientRect().width;
      const C = 1080;
      const k = C / V;
      const canvas = document.createElement("canvas");
      canvas.width = C; canvas.height = C;
      const ctx = canvas.getContext("2d");
      const { iw, ih } = dims();
      const fit = Math.min(C / iw, C / ih);
      const bgCover = Math.max(C / iw, C / ih) * 1.12;
      const bgFilter = (filterCss && filterCss !== "none" ? filterCss + " " : "") + `blur(${Math.round(C * 0.05)}px)`;
      ctx.save();
      ctx.filter = bgFilter;
      ctx.translate(C / 2, C / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(bgCover, bgCover);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
      ctx.save();
      ctx.filter = filterCss;
      ctx.translate(C / 2 + offset.x * k, C / 2 + offset.y * k);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(fit * zoom, fit * zoom);
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
        const scale = 0.1;
        const small = document.createElement("canvas");
        small.width = Math.max(1, Math.round(C * scale));
        small.height = Math.max(1, Math.round(C * scale));
        const sctx = small.getContext("2d");
        sctx.drawImage(canvas, 0, 0, small.width, small.height);
        const blurred = document.createElement("canvas"); blurred.width = C; blurred.height = C;
        const bctx = blurred.getContext("2d");
        bctx.imageSmoothingEnabled = true;
        bctx.drawImage(small, 0, 0, C, C);
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
      const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
      const name = (file.name || "image").replace(/\.[^.]+$/, "");
      await onFileDone?.(new File([blob], name + ".jpg", { type: "image/jpeg" }), activeIdx);
    } finally {
      setSubmitting(false);
    }
  };

  const tools = [
    { id: "filter", label: ar ? "فلتر" : "Filter", Icon: SlidersHorizontal },
    { id: "draw", label: ar ? "رسم" : "Draw", Icon: Pencil },
    { id: "blur", label: ar ? "تمويه" : "Blur", Icon: Droplets },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col select-none">
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={() => onSkipFile?.(activeIdx)} className="p-2"><X size={22} /></button>
        <span className="font-semibold">{ar ? "تعديل الصورة" : "Edit photo"}</span>
        <button onClick={confirm} disabled={!img || submitting} className="p-2 text-emerald-400 disabled:opacity-40"><Check size={24} /></button>
      </div>

      <div ref={wrapRef} className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="relative rounded-2xl overflow-hidden bg-slate-900" style={{ width: box, height: box }}>
          <canvas
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: "none", cursor: tool === "draw" || tool === "blur" ? "crosshair" : "grab" }}
          />
        </div>
      </div>

      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
          {files.map((f, i) => (
            <button
              key={i}
              onClick={() => setRawIdx(i)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 ring-2 ${i === activeIdx ? "ring-emerald-400" : "ring-white/15"}`}
            >
              <img src={thumbs[i]} alt="" className="w-full h-full object-cover" />
              {i === activeIdx && <span className="absolute bottom-0 inset-x-0 bg-emerald-500/80 text-white text-[9px] text-center py-0.5">{ar ? "تعديل" : "Edit"}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-3 text-white">
        <div className="flex items-center justify-center gap-2">
          {tools.map((tl) => (
            <button key={tl.id} onClick={() => setTool(prev => prev === tl.id ? "" : tl.id)} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold ${tool === tl.id ? "bg-emerald-500 text-white" : "bg-white/10"}`}>
              <tl.Icon size={18} /> {tl.label}
            </button>
          ))}
          <button onClick={undo} disabled={!log.length} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 disabled:opacity-40">
            <Undo2 size={18} /> {ar ? "تراجع" : "Undo"}
          </button>
        </div>

        {tool === "filter" && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map((f, i) => (
              <button key={f.id} onClick={() => setFilterIdx(i)} className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filterIdx === i ? "bg-emerald-500 text-white" : "bg-white/10"}`}>
                {ar ? f.ar : f.en}
              </button>
            ))}
          </div>
        )}

        {tool === "draw" && (
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

        <div className="flex items-center justify-center gap-6">
          <button onClick={() => setRot((r) => r - 90)} className="p-3 rounded-full bg-white/10 active:bg-white/20"><RotateCcw size={20} /></button>
          <button onClick={() => setRot((r) => r + 90)} className="p-3 rounded-full bg-white/10 active:bg-white/20"><RotateCw size={20} /></button>
        </div>
        <div className="flex items-center gap-3">
          <ZoomOut size={18} className="shrink-0" />
          <input type="range" min={1} max={5} step={0.01} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} className="flex-1 accent-emerald-400" />
          <ZoomIn size={18} className="shrink-0" />
        </div>
        <p className="text-center text-xs text-white/50">{ar ? "اسحب للتحريك · قرّص للتكبير والقص · ما يظهر هنا يُنشر" : "Drag to move · pinch to zoom & crop · what you see is what gets posted"}</p>

        <button onClick={confirm} disabled={!img || submitting} className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold disabled:opacity-50">{submitting ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "تم" : "Done")}</button>
      </div>
    </div>
  );
}