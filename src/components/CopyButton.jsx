import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

// Small icon button that copies a value to the clipboard and briefly shows a
// check mark on success.
export default function CopyButton({ value, className = "" }) {
  const [copied, setCopied] = useState(false);
  const copy = async (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy"
      className={`p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition shrink-0 ${className}`}
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}