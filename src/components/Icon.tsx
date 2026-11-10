import type { SVGProps } from 'react';
import {
  Baby,
  Camera,
  Cookie,
  Droplet,
  Apple,
  LogIn,
  LogOut,
  Milk,
  Moon,
  NotebookPen,
  Soup,
  Sun,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { IconKey } from '../lib/util';

/** Poop glyph drawn in the same stroke style as lucide. */
export function PoopIcon({ size = 24, strokeWidth = 2, className, ...rest }: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d="M7 20h10a3 3 0 0 0 0-6H7a3 3 0 0 0 0 6Z" />
      <path d="M8.5 14a2.5 2.5 0 0 1 0-5h7a2.5 2.5 0 0 1 0 5" />
      <path d="M10 9a2 2 0 0 1 2-2c.8 0 1.5-.9 1.2-2.5C15 5 16 6.5 15.5 9" />
    </svg>
  );
}

type Glyph = LucideIcon | typeof PoopIcon;

const MAP: Record<IconKey, { I: Glyph; tone: string }> = {
  pee: { I: Droplet, tone: 'pee' },
  poop: { I: PoopIcon, tone: 'poop' },
  both: { I: PoopIcon, tone: 'poop' },
  diaper: { I: Baby, tone: 'pee' },
  bottle: { I: Milk, tone: 'feed' },
  porridge: { I: Soup, tone: 'feed' },
  meal: { I: UtensilsCrossed, tone: 'feed' },
  snack: { I: Cookie, tone: 'feed' },
  fruit: { I: Apple, tone: 'feed' },
  feed: { I: UtensilsCrossed, tone: 'feed' },
  sleep: { I: Moon, tone: 'sleep' },
  wake: { I: Sun, tone: 'warn' },
  arrive: { I: LogIn, tone: 'ok' },
  leave: { I: LogOut, tone: 'muted' },
  note: { I: NotebookPen, tone: 'note' },
  photo: { I: Camera, tone: 'photo' },
};

export function EvIcon({ k, size = 22, className = '', strokeWidth = 2 }: { k: IconKey; size?: number; className?: string; strokeWidth?: number }) {
  const { I } = MAP[k];
  return <I size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}

export const toneOf = (k: IconKey) => MAP[k].tone;

/** Colored round bubble with the event icon (or an emoji, for moods). */
export function Bubble({ k, emoji, size = 36, className = '' }: { k: IconKey; emoji?: string; size?: number; className?: string }) {
  const tone = MAP[k].tone;
  return (
    <span
      className={`inline-grid place-items-center rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size, color: `rgb(var(--${tone}))`, background: `rgb(var(--${tone}) / .14)` }}
    >
      {emoji ? <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>{emoji}</span> : <EvIcon k={k} size={Math.round(size * 0.5)} />}
    </span>
  );
}
