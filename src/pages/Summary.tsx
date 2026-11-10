import { useState } from 'react';
import { useData, useDay } from '../hooks/useData';
import { PageHeader } from '../components/Layout';
import DayNav from '../components/DayNav';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { buildSummary } from '../lib/summary';
import { Check, Copy, MessageCircleHeart, Send } from 'lucide-react';
import { waLink } from '../lib/util';

export default function Summary() {
  const { children, guardians, settings } = useData();
  const [day, setDay] = useState(new Date());
  const { events, photos } = useDay(day);
  const toast = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  return (
    <>
      <PageHeader sub="שליחה להורים בוואטסאפ" title="סיכום יומי" icon={MessageCircleHeart} />
      <div className="max-w-3xl mx-auto px-4 space-y-3">
        <DayNav day={day} setDay={setDay} />
        {children.map((c) => {
          const text = buildSummary(c, events, photos, day, settings);
          const gs = guardians.filter((g) => g.child_id === c.id && g.phone);
          const key = c.id + day.toDateString();
          const count = events.filter((e) => e.child_id === c.id).length;
          return (
            <article key={c.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar child={c} size={44} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight">
                    {c.name} {sent[key] && <span className="badge-ok align-middle"><Check size={12} strokeWidth={3} /> נשלח</span>}
                  </h3>
                  <p className="text-sm text-muted">{count} רישומים</p>
                </div>
                <button className="chip" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  {open === c.id ? 'הסתר' : 'תצוגה'}
                </button>
              </div>
              {open === c.id && (
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm bg-[#DCF8C6] text-[#111] rounded-2xl rounded-tr-sm p-3 leading-relaxed anim-pop">{text}</pre>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {gs.map((g) => (
                  <a
                    key={g.id}
                    href={waLink(g.phone, text)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn bg-[#25D366] text-white flex-1 min-w-[9rem]"
                    onClick={() => setSent((s) => ({ ...s, [key]: true }))}
                  >
                    <Send size={16} /> שליחה ל{g.relation || g.name}
                  </a>
                ))}
                <button
                  className="btn-ghost flex-1 min-w-[7rem]"
                  onClick={async () => {
                    await navigator.clipboard.writeText(text);
                    toast({ text: 'הועתק, אפשר להדביק בוואטסאפ', icon: '📋' });
                  }}
                >
                  <Copy size={16} /> העתקה
                </button>
              </div>
              {!gs.length && <p className="text-xs text-muted mt-2">טיפ: הוסיפו טלפון של הורה בכרטיס הילד כדי לשלוח בלחיצה.</p>}
            </article>
          );
        })}
      </div>
    </>
  );
}
