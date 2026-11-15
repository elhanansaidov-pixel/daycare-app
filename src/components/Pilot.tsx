import { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { PILOTS, isAdmin, pilotOn, setPilotEnabled } from '../lib/pilots';

/** Small "pilot" tag shown next to a feature that only the admin sees. */
export function PilotBadge() {
  return (
    <span className="badge bg-warn/15 text-warn" title="פיילוט: רק אתה רואה את זה">
      🧪 פיילוט
    </span>
  );
}

/** Re-renders when a pilot is switched on/off on this device. */
export function usePilotsVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const f = () => setV((x) => x + 1);
    window.addEventListener('pilots-changed', f);
    return () => window.removeEventListener('pilots-changed', f);
  }, []);
  return v;
}

/** Settings section: list of pilots with on/off switches (admin only). */
export function PilotsSection() {
  usePilotsVersion();
  if (!isAdmin()) return null;
  return (
    <section className="card p-4 space-y-3">
      <h2 className="section-title">
        <FlaskConical size={20} className="text-warn" /> 🧪 פיילוטים
      </h2>
      <p className="text-sm text-muted">עדכונים שעלו לאתר אבל מוצגים רק לך. אפשר לכבות כל אחד במכשיר הזה.</p>
      {PILOTS.length === 0 ? (
        <p className="text-sm text-muted rounded-2xl bg-sunk p-3">אין כרגע פיילוטים פעילים.</p>
      ) : (
        <ul className="divide-y divide-line">
          {PILOTS.map(([id, icon, name]) => {
            const on = pilotOn(id);
            return (
              <li key={id} className="flex items-center gap-3 py-2.5">
                <span className="text-xl">{icon}</span>
                <span className="flex-1 font-semibold">
                  {name} <span className="text-xs text-muted font-normal">({id})</span>
                </span>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`פיילוט ${name}`}
                  className={`relative h-8 w-14 rounded-full transition ${on ? 'bg-ok' : 'bg-line'}`}
                  onClick={() => setPilotEnabled(id, !on)}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'right-1' : 'right-7'}`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
