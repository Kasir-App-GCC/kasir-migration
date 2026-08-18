import React from "react";
import { BadgeCheck } from "lucide-react";

export default function TrustedBadge({ size = 14, className = "" }) {
  return (
    <BadgeCheck
      size={size}
      className={`text-sky-500 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${className}`}
    />
  );
}