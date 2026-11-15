import { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Tour as TourDef } from '../../lib/assistant/tours';

const visible = (sel: string): HTMLElement | null => {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
};

/** Dims the screen around one element and explains it. Taps on the page still work. */
export default function Tour({ tour, step, onStep, onEnd }: { tour: TourDef; step: number; onStep: (n: number) => void; onEnd: (done: boolean) => void }) {
  const s = tour.steps[step];
  const last = step === tour.steps.length - 1;
  const nav = useNavigate();
  const loc = useLocation();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    if (s.path && loc.pathname !== s.path) nav(s.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useLayoutEffect(() => {
    setRect(null);
    setLost(false);
    let scrolled = false;
    const t0 = Date.now();
    const tick = () => {
      const el = visible(s.target);
      if (el) {
        if (!scrolled) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          scrolled = true;
        }
        setRect(el.getBoundingClientRect());
        setLost(false);
      } else if (Date.now() - t0 > 1500) setLost(true);
    };
    tick();
    const iv = window.setInterval(tick, 150);
    return () => window.clearInterval(iv);
  }, [s.target, step]);

  useEffect(() => {
    if (!s.waitClick) return;
    const onClick = (e: MouseEvent) => {
      const el = visible(s.target);
      if (el && e.target instanceof Node && el.contains(e.target)) window.setTimeout(() => (last ? onEnd(true) : onStep(step + 1)), 450);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [s, step, last, onStep, onEnd]);

  const pad = 6;
  const below = rect ? rect.bottom + 200 < window.innerHeight : false;
  const bubbleStyle: React.CSSProperties = rect && !lost
    ? below
      ? { top: rect.bottom + pad + 12 }
      : { bottom: window.innerHeight - rect.top + pad + 12 }
    : { top: '35%' };

  return (
    <div data-testid="tour" className="fixed inset-0 z-[70] pointer-events-none">
      {rect && !lost ? (
        <div
          className="absolute rounded-2xl border-[3px] border-brand transition-all duration-200"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(20,12,8,.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(20,12,8,.45)]" />
      )}
      <div className="absolute inset-x-0 flex justify-center px-4" style={bubbleStyle}>
        <div className="pointer-events-auto card shadow-lift p-4 max-w-sm w-full anim-pop" role="dialog" aria-label={tour.title}>
          <p className="text-xs text-muted font-semibold mb-1">
            ✨ {tour.title} · שלב {step + 1} מתוך {tour.steps.length}
          </p>
          <p className="font-medium leading-relaxed">{s.text}</p>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary flex-1 !min-h-[44px]" onClick={() => (last ? onEnd(true) : onStep(step + 1))}>
              {last ? 'סיום' : s.waitClick ? 'דלגי' : 'הבא'}
            </button>
            {step > 0 && (
              <button className="btn-ghost !min-h-[44px]" onClick={() => onStep(step - 1)}>
                הקודם
              </button>
            )}
            <button className="btn-ghost !min-h-[44px]" onClick={() => onEnd(false)}>
              יציאה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
