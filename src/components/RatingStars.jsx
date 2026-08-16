import React from "react";

export default function RatingStars({ value = 0, size = 16, interactive = false, onChange }) {
  const [hover, setHover] = React.useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(display);
        const half = !filled && n - 0.5 <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(n)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            style={{ width: size, height: size }}
          >
            <svg
              viewBox="0 0 24 24"
              width={size}
              height={size}
              className={filled ? "fill-amber-400 text-amber-400" : half ? "fill-amber-300/70 text-amber-300" : "fill-muted text-muted-foreground/30"}
            >
              <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}