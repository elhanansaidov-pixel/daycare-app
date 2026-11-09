import type { Child } from '../lib/types';

export default function Avatar({ child, size = 48 }: { child: Child; size?: number }) {
  return (
    <div
      className="shrink-0 rounded-full grid place-items-center select-none"
      style={{ width: size, height: size, background: child.color + '33', boxShadow: `inset 0 0 0 2px ${child.color}` }}
      aria-hidden
    >
      <span style={{ fontSize: size * 0.52, lineHeight: 1 }}>{child.emoji}</span>
    </div>
  );
}
