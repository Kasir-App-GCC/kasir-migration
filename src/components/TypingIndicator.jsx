import React from "react";

/**
 * Animated three-dot typing indicator. Shown in the chat header subtitle
 * and as a floating bubble above the message list when the other party is
 * typing. The dots bounce in sequence with a staggered delay.
 */
export default function TypingIndicator({ label, lang }) {
  const ar = lang === "ar";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-center gap-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: "600ms" }}
          />
        ))}
      </span>
      {label && <span className="text-xs font-medium">{ar ? "يكتب..." : "typing..."}</span>}
    </span>
  );
}