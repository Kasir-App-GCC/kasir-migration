import React from "react";

const RIYAL_SVG_URL =
  "https://upload.wikimedia.org/wikipedia/commons/9/98/Saudi_Riyal_Symbol.svg";

/**
 * Official Saudi Riyal symbol.
 * Source: https://commons.wikimedia.org/wiki/File:Saudi_Riyal_Symbol.svg
 * Rendered from the source SVG so the exact official glyph is shown.
 */
export default function RiyalSymbol({ size = 14, className = "", style = {} }) {
  return (
    <img
      src={RIYAL_SVG_URL}
      alt="SAR"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.15em", ...style }}
      draggable={false}
    />
  );
}