import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, Search, Sparkles, X } from 'lucide-react';
import Sheet from '../Sheet';
import Tour from './Tour';
import { useData, useNow } from '../../hooks/useData';
import { readUsage, track } from '../../lib/assistant/usage';
import { computeProfile, SCREEN_LABEL, TOPIC_LABEL } from '../../lib/assistant/profile';
import { computeTips, dismissTip, markAssistantSeen, type Tip } from '../../lib/assistant/tips';
import { FAQ, searchFaq, type Faq } from '../../lib/assistant/faq';
import { TOURS, tourById } from '../../lib/assistant/tours';

const hhmm = (h: number) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;

function useUsageVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((x) => x + 1);
    window.addEventListener('usage-changed', on);
    return () => window.removeEventListener('usage-changed', on);
  }, []);
  return v;
}

/** U4: floating help button + tip bubble + help sheet + step-by-step guides. */
export default function Assistant() {
  const { children, today, settings } = useData();
  const nav = useNavigate();
  const usageV = useUsageVersion();
  const now = useNow(60000);
  const [open, setOpen] = useState(false);
  const [tour, setTour] = useState<{ id: string; step: number } | null>(null);
  const [, bump] = useState(0);

  const log = useMemo(() => readUsage(), [usageV]); // eslint-disable-line react-hooks/exhaustive-deps
  const profile = useMemo(() => computeProfile(log, now), [log, now]);
  const tips = computeTips({ children, today, log, profile, now, name: settings.caregiver_name });
  const bubble = tips[0];

  const shown = useRef(new Set<string>());
  useEffect(() => {
    if (bubble && !shown.current.has(bubble.id)) {
      shown.current.add(bubble.id);
      track('tip', 'show:' + bubble.id);
    }
  }, [bubble]);

  const dismiss = (t: Tip) => {
    dismissTip(t.id);
    if (t.id === 'welcome') markAssistantSeen();
    track('tip', 'dismiss:' + t.id);
    bump((x) => x + 1);
  };

  const startTour = useCallback((id: string, from?: string) => {
    setOpen(false);
    track('tour', `start:${id}${from ? ':' + from : ''}`);
    setTour({ id, step: 0 });
  }, []);

  const endTour = useCallback(
    (done: boolean) => {
      if (tour) track('tour', `${done ? 'done' : 'quit'}:${tour.id}:${tour.step}`);
      setTour(null);
    },
    [tour],
  );
  const setStep = useCallback((step: number) => setTour((t) => (t ? { ...t, step } : t)), []);
  const active = tour ? tourById(tour.id) : undefined;

  return (
    <>
      {!tour && (
        <div className="fixed left-3 bottom-[84px] z-30 flex items-end gap-2 safe-bottom pointer-events-none" dir="rtl">
          {bubble && !open && (
            <div className="pointer-events-auto card shadow-lift p-3 max-w-[15.5rem] text-sm anim-pop order-1" data-testid="tip-bubble">
              <p className="leading-relaxed">{bubble.text}</p>
              <div className="flex gap-2 mt-2">
                {bubble.tour && (
                  <button className="btn-primary !min-h-[36px] !px-3 !text-sm" onClick={() => (dismiss(bubble), startTour(bubble.tour!, bubble.id))}>
                    תראי לי
                  </button>
                )}
                <button className="btn-ghost !min-h-[36px] !px-3 !text-sm" onClick={() => dismiss(bubble)}>
                  הבנתי
                </button>
              </div>
            </div>
          )}
          <button
            aria-label="עזרה"
            className="pointer-events-auto order-2 h-14 w-14 rounded-full bg-brand text-white shadow-lift grid place-items-center active:scale-95 transition"
            onClick={() => {
              setOpen(true);
              markAssistantSeen();
              track('screen', 'assistant');
            }}
          >
            <span className="flex flex-col items-center leading-none">
              <Sparkles size={22} />
              <span className="text-[10px] font-bold mt-0.5">עזרה</span>
            </span>
          </button>
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Sparkles size={22} className="text-brand" /> העוזרת שלך
          </span>
        }
      >
        <AssistantBody
          tips={tips.slice(0, 2)}
          profile={profile}
          onDismiss={dismiss}
          onTour={startTour}
          onGo={(p) => {
            setOpen(false);
            nav(p);
          }}
        />
      </Sheet>

      {active && tour && <Tour tour={active} step={tour.step} onStep={setStep} onEnd={endTour} />}
    </>
  );
}

function AssistantBody({
  tips,
  profile,
  onDismiss,
  onTour,
  onGo,
}: {
  tips: Tip[];
  profile: ReturnType<typeof computeProfile>;
  onDismiss: (t: Tip) => void;
  onTour: (id: string, from?: string) => void;
  onGo: (path: string) => void;
}) {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchFaq(q), [q]);
  const [openId, setOpenId] = useState<string | null>(null);
  const tracked = useRef('');

  // Record the question once she stops typing (what was asked, and whether an answer was found).
  useEffect(() => {
    const query = q.trim();
    if (query.length < 3) return;
    const t = window.setTimeout(() => {
      if (tracked.current === query) return;
      tracked.current = query;
      if (results.length) track('help_q', `${results[0].id}|${query}`);
      else track('help_miss', query);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [q, results]);

  const learned = new Set(profile.learned);
  const struggling = new Set(profile.struggling);
  const tours = [...TOURS].sort((a, b) => Number(struggling.has(b.topic)) - Number(struggling.has(a.topic)) || Number(learned.has(a.topic)) - Number(learned.has(b.topic)));
  const popular: Faq[] = [
    ...FAQ.filter((f) => struggling.has(f.topic)),
    ...['undo', 'arrive-many', 'summary', 'edit', 'invite'].map((id) => FAQ.find((f) => f.id === id)!),
  ]
    .filter((f, i, a) => a.indexOf(f) === i)
    .slice(0, 5);

  return (
    <div className="space-y-5 pb-2">
      {tips.map((t) => (
        <div key={t.id} className="rounded-2xl bg-brandsoft/70 p-3 text-sm">
          <p className="leading-relaxed">💡 {t.text}</p>
          <div className="flex gap-2 mt-2">
            {t.tour && (
              <button className="btn-primary !min-h-[36px] !px-3 !text-sm" onClick={() => (onDismiss(t), onTour(t.tour!, t.id))}>
                תראי לי
              </button>
            )}
            <button className="btn-ghost !min-h-[36px] !px-3 !text-sm" onClick={() => onDismiss(t)}>
              הבנתי
            </button>
          </div>
        </div>
      ))}

      <section>
        <label className="relative block">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input !pr-10" placeholder="מה תרצי לשאול? למשל: איך מבטלים" value={q} onChange={(e) => setQ(e.target.value)} aria-label="שאלה לעוזרת" />
          {q && (
            <button className="absolute left-2 top-1/2 -translate-y-1/2 icon-btn !h-8 !w-8" onClick={() => setQ('')} aria-label="ניקוי">
              <X size={16} />
            </button>
          )}
        </label>
        <ul className="mt-2 space-y-2" data-testid="faq-results">
          {(q.trim() ? results : popular).map((f) => (
            <li key={f.id} className="rounded-2xl border border-line">
              <button className="w-full text-right p-3 font-semibold flex items-center gap-2" onClick={() => setOpenId(openId === f.id ? null : f.id)}>
                <span className="flex-1">{f.q}</span>
                <ChevronLeft size={16} className={`text-muted transition ${openId === f.id || q.trim() ? '-rotate-90' : ''}`} />
              </button>
              {(openId === f.id || q.trim()) && (
                <div className="px-3 pb-3 text-sm leading-relaxed">
                  <p>{f.a}</p>
                  {f.tour && (
                    <button className="btn-ghost !min-h-[36px] !px-3 !text-sm mt-2" onClick={() => onTour(f.tour!, 'faq:' + f.id)}>
                      ✨ תראי לי על המסך
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
        {q.trim().length >= 3 && !results.length && (
          <p className="text-sm text-muted mt-2" data-testid="faq-miss">
            לא מצאתי תשובה לזה. העברתי את השאלה לאלחנן, והוא יוסיף אותה בקרוב 💛
          </p>
        )}
      </section>

      {profile.shortcuts.length > 0 && (
        <section>
          <h3 className="font-bold mb-2">הקיצורים שלך</h3>
          <div className="flex flex-wrap gap-2">
            {profile.shortcuts.map((p) => (
              <button key={p} className="chip" onClick={() => onGo(p)}>
                {SCREEN_LABEL[p]}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="font-bold mb-2">מה תרצי ללמוד? אראה לך על המסך</h3>
        <ul className="grid grid-cols-1 gap-1.5">
          {tours.map((t) => (
            <li key={t.id}>
              <button className="w-full text-right rounded-2xl bg-sunk px-3 py-2.5 flex items-center gap-2 font-medium" onClick={() => onTour(t.id, 'menu')}>
                <span className="flex-1">{t.title}</span>
                {learned.has(t.topic) && (
                  <span className="badge-ok">
                    <Check size={12} strokeWidth={3} /> כבר יודעת
                  </span>
                )}
                {struggling.has(t.topic) && <span className="badge-warn">מומלץ</span>}
                <ChevronLeft size={16} className="text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {(profile.learned.length > 0 || profile.usualHour.feed !== undefined) && (
        <section className="rounded-2xl bg-sunk p-3 text-sm">
          <h3 className="font-bold mb-1">מה למדתי עלייך עד עכשיו</h3>
          {profile.learned.length > 0 && <p>✓ את כבר שולטת ב: {profile.learned.map((t) => TOPIC_LABEL[t] ?? t).join(', ')}.</p>}
          {profile.usualHour.feed !== undefined && <p>🍽️ בדרך כלל את רושמת אוכל בסביבות {hhmm(profile.usualHour.feed)}, אז אזכיר רק אם זה מתאחר.</p>}
          {profile.usualHour.sleep !== undefined && <p>😴 שינת צהריים מתחילה אצלך בדרך כלל בסביבות {hhmm(profile.usualHour.sleep)}.</p>}
        </section>
      )}
    </div>
  );
}
