import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Child } from '../lib/types';
import { birthdayTitle, nextBirthday } from '../lib/birthday';

const HINT_KEY = 'daycare.birthdayHintOff';

/** U2: today's birthdays (festive) and the ones coming within a week. */
export default function BirthdayStrip({ children }: { children: Child[] }) {
  const [hintOff, setHintOff] = useState(() => {
    try {
      return !!localStorage.getItem(HINT_KEY);
    } catch {
      return true;
    }
  });
  const list = children
    .map((c) => ({ c, b: nextBirthday(c.birth_date) }))
    .filter((x): x is { c: Child; b: { days: number; age: number } } => !!x.b && x.b.days <= 7)
    .sort((a, b) => a.b.days - b.b.days);
  const today = list.filter((x) => x.b.days === 0);
  const soon = list.filter((x) => x.b.days > 0);
  const missing = children.filter((c) => !c.birth_date);

  return (
    <>
      {today.map(({ c, b }) => (
        <div key={c.id} data-testid="birthday-today" className="rounded-3xl p-4 anim-pop text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${c.color}55, #FFE08A88)` }}>
          <p className="text-3xl leading-none mb-1">🎉🎂🎈</p>
          <p className="text-xl font-extrabold">היום {birthdayTitle(c, b.age)}!</p>
          <p className="text-sm mt-1">מזל טוב! הדמות של {c.name} חובשת היום כובע מסיבה, וההורים יראו ברכה בפורטל.</p>
        </div>
      ))}
      {soon.length > 0 && (
        <div className="rounded-3xl bg-brandsoft/70 p-3 text-sm space-y-1" data-testid="birthday-soon">
          {soon.map(({ c, b }) => (
            <p key={c.id} className="font-medium">
              🎂 {b.days === 1 ? 'מחר' : `בעוד ${b.days} ימים`}: {birthdayTitle(c, b.age)}
            </p>
          ))}
        </div>
      )}
      {!hintOff && missing.length > 0 && missing.length === children.length && (
        <div className="rounded-3xl border border-dashed border-line p-3 text-sm flex items-center gap-2">
          <span className="text-xl">🎂</span>
          <p className="flex-1">
            רוצה שאזכיר ימי הולדת? מוסיפים תאריך לידה ב
            <Link to={`/child/${missing[0].id}?tab=profile`} className="text-brand font-semibold underline underline-offset-2">
              כרטיס הילד
            </Link>
            .
          </p>
          <button
            className="text-muted text-xs font-semibold"
            onClick={() => {
              setHintOff(true);
              try {
                localStorage.setItem(HINT_KEY, '1');
              } catch {
                /* ignore */
              }
            }}
          >
            לא עכשיו
          </button>
        </div>
      )}
    </>
  );
}
