/** House-with-heart mark. */
export default function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4A184" />
          <stop offset="1" stopColor="#E2704F" />
        </linearGradient>
      </defs>
      <path
        d="M29.4 7.9a4 4 0 0 1 5.2 0l20.6 17.6A6 6 0 0 1 57.3 30v20a7 7 0 0 1-7 7H13.7a7 7 0 0 1-7-7V30a6 6 0 0 1 2.1-4.5Z"
        fill="url(#logo-g)"
      />
      <path
        d="M32 48.5s-11-6.4-11-13.6a5.9 5.9 0 0 1 11-3 5.9 5.9 0 0 1 11 3c0 7.2-11 13.6-11 13.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export function Wordmark({ name, sub, size = 40 }: { name: string; sub?: string; size?: number }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Logo size={size} className="shrink-0 drop-shadow-sm" />
      <div className="min-w-0 leading-tight">
        <p className="font-extrabold truncate">{name}</p>
        {sub && <p className="text-xs text-muted truncate">{sub}</p>}
      </div>
    </div>
  );
}
