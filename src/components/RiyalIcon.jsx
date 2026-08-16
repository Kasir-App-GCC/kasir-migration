export default function RiyalIcon({ size, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size || "1em"}
      height={size || "1em"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6h10" />
      <path d="M14 6v12" />
      <path d="M4 6c0 5 3 7 7 7" />
      <path d="M9 11h4" />
      <circle cx="11" cy="8.4" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}