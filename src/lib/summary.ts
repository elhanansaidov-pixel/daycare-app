import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Child, DayEvent, Photo, Settings } from './types';
import { DIAPER_ICON, DIAPER_LABEL, FEED_ICON, FEED_LABEL, durationLabel, hhmm, moodFor, portionFor } from './util';

export function buildSummary(c: Child, events: DayEvent[], photos: Photo[], day: Date, s: Settings): string {
  const ev = events.filter((e) => e.child_id === c.id).sort((a, b) => a.started_at.localeCompare(b.started_at));
  const w = (boy: string, girl: string) => (c.gender === 'girl' ? girl : boy);
  const L: string[] = [];
  L.push(`🌸 *סיכום היום של ${c.name}* · ${format(day, 'EEEE d.M', { locale: he })}`);

  const arrive = ev.find((e) => e.type === 'attendance' && e.subtype === 'arrive');
  const leave = [...ev].reverse().find((e) => e.type === 'attendance' && e.subtype === 'leave');
  if (arrive || leave) {
    L.push(
      [arrive && `👋 ${w('הגיע', 'הגיעה')}: ${hhmm(arrive.started_at)}`, leave && `🏠 ${w('נאסף', 'נאספה')}: ${hhmm(leave.started_at)}`]
        .filter(Boolean)
        .join('  |  '),
    );
  }

  const feeds = ev.filter((e) => e.type === 'feed');
  if (feeds.length) {
    L.push('', '🍽️ *אוכל*');
    for (const f of feeds) {
      const parts = [
        `${FEED_ICON[f.subtype ?? 'meal'] ?? ''} ${FEED_LABEL[f.subtype ?? 'meal'] ?? 'אוכל'}`,
        f.data.amount_ml ? `${f.data.amount_ml} מ״ל` : '',
        f.data.food ? `– ${f.data.food}` : '',
        f.data.portion ? `(${portionFor(c, f.data.portion)})` : '',
      ].filter(Boolean);
      L.push(`• ${hhmm(f.started_at)} ${parts.join(' ')}`);
    }
  }

  const sleeps = ev.filter((e) => e.type === 'sleep');
  if (sleeps.length) {
    const total = sleeps.reduce((t, e) => t + (e.ended_at ? new Date(e.ended_at).getTime() - new Date(e.started_at).getTime() : 0), 0);
    L.push('', `😴 *שינה*${total ? ` (סה״כ ${durationLabel(total)})` : ''}`);
    for (const e of sleeps) L.push(`• ${hhmm(e.started_at)}–${e.ended_at ? hhmm(e.ended_at) : w('עדיין ישן', 'עדיין ישנה')}`);
  }

  const diapers = ev.filter((e) => e.type === 'diaper');
  if (diapers.length) {
    const pee = diapers.filter((d) => d.subtype !== 'poop').length;
    const poop = diapers.filter((d) => d.subtype !== 'pee').length;
    L.push('', `🧷 *חיתולים* (${diapers.length}) · 💧${pee} 💩${poop}`);
    for (const d of diapers)
      L.push(`• ${hhmm(d.started_at)} ${DIAPER_ICON[d.subtype ?? 'pee']} ${DIAPER_LABEL[d.subtype ?? 'pee']}${d.data.texture ? ` (${d.data.texture})` : ''}`);
  }

  const notes = ev.filter((e) => e.type === 'note');
  if (notes.length) {
    L.push('', '📝 *הערות*');
    for (const n of notes) L.push(`• ${[n.data.mood && moodFor(c, n.data.mood), n.data.text].filter(Boolean).join(' – ')}`);
  }

  const pics = photos.filter((p) => p.child_ids.includes(c.id)).length;
  if (pics) L.push('', `📷 צולמו היום ${pics === 1 ? 'תמונה אחת' : `${pics} תמונות`}`);

  if (ev.length === 0 && !pics) L.push('', 'לא תועדו פעילויות היום.');
  L.push('', `באהבה${s.caregiver_name ? `, ${s.caregiver_name}` : ''} 💛${s.daycare_name ? ` · ${s.daycare_name}` : ''}`);
  return L.join('\n');
}
