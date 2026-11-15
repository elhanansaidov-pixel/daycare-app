// U2: birthdays – upcoming reminder and the festive day.
import type { Child } from './types';

const DAY = 864e5;
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Days until the next birthday (0 = today) and the age that will be reached. */
export function nextBirthday(birth: string | null, now = new Date()): { days: number; age: number } | null {
  if (!birth) return null;
  const [y, m, d] = birth.split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = midnight(now);
  let year = today.getFullYear();
  let next = new Date(year, m - 1, d);
  if (next < today) next = new Date(++year, m - 1, d);
  const age = year - y;
  if (age < 1) return null;
  return { days: Math.round((next.getTime() - today.getTime()) / DAY), age };
}

export const isBirthday = (c: Pick<Child, 'birth_date'>, now = new Date()) => nextBirthday(c.birth_date, now)?.days === 0;

export const ageWords = (age: number) => (age === 1 ? 'שנה' : age === 2 ? 'שנתיים' : `${age}`);

/** "יום הולדת שנתיים לכפיר" / "יום הולדת 3 למיכל" */
export const birthdayTitle = (c: Pick<Child, 'name'>, age: number) => `יום הולדת ${ageWords(age)} ל${c.name}`;
