import type { Child } from '../lib/types';

export default function Avatar({ child, size = 48, ring = true }: { child: Pick<Child, 'color' | 'emoji' | 'avatar' | 'name'>; size?: number; ring?: boolean }) {
  const border = Math.max(2, Math.round(size / 24));
  return (
    <div
      className="shrink-0 rounded-full grid place-items-center select-none overflow-hidden"
      style={{
        width: size,
        height: size,
        background: child.color + '2E',
        boxShadow: ring ? `0 0 0 ${border}px rgb(var(--card)), 0 0 0 ${border * 2}px ${child.color}` : undefined,
      }}
      aria-hidden
    >
      {child.avatar ? (
        <img src={child.avatar} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{child.emoji}</span>
      )}
    </div>
  );
}
