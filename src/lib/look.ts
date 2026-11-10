import type { Child } from './types';

export type Animal = 'lion' | 'bunny' | 'butterfly' | 'bear' | 'chick' | 'whale' | 'fox' | 'panda' | 'frog' | 'unicorn' | 'koala' | 'ladybug';
export type HairStyle = 'none' | 'short' | 'curly' | 'swoop' | 'bangs' | 'tuft' | 'baby' | 'wild' | 'flip';
export type Mouth = 'smile' | 'cheeky' | 'grin' | 'open';
export type Toy = 'none' | 'teether' | 'book' | 'rattle' | 'teddy';
export type Face = 'round' | 'chubby';
export type Print = 'none' | 'helicopter' | 'stripes' | 'skate' | 'stars' | 'hearts';
export type Extra = 'glasses' | 'freckles' | 'bow' | 'pacifier' | 'blush' | 'lashes' | 'mole';

export interface Look {
  animal: Animal;
  skin: number;
  hair: HairStyle;
  hairColor: number;
  eyes: 'round' | 'sparkle';
  eyeColor: number;
  extras: Extra[];
  face?: Face;
  mouth?: Mouth;
  print?: Print;
  toy?: Toy;
}

export const ANIMALS: { key: Animal; emoji: string; label: string }[] = [
  { key: 'lion', emoji: '🦁', label: 'אריה' },
  { key: 'bunny', emoji: '🐰', label: 'ארנב' },
  { key: 'butterfly', emoji: '🦋', label: 'פרפר' },
  { key: 'bear', emoji: '🐻', label: 'דובי' },
  { key: 'chick', emoji: '🐥', label: 'אפרוח' },
  { key: 'whale', emoji: '🐳', label: 'לווייתן' },
  { key: 'fox', emoji: '🦊', label: 'שועל' },
  { key: 'panda', emoji: '🐼', label: 'פנדה' },
  { key: 'frog', emoji: '🐸', label: 'צפרדע' },
  { key: 'unicorn', emoji: '🦄', label: 'חד-קרן' },
  { key: 'koala', emoji: '🐨', label: 'קואלה' },
  { key: 'ladybug', emoji: '🐞', label: 'פרת משה רבנו' },
];

export const SKINS = ['#FCE3D2', '#F6CFB2', '#EAB894', '#D39C74', '#AD744F', '#7E5136'];
export const HAIR_COLORS = ['#2B211C', '#4B3326', '#6F4A31', '#9C6C45', '#E2B86E', '#C8673A'];
export const HAIR_COLOR_LABELS = ['שחור', 'חום כהה', 'חום', 'חום בהיר', 'בלונד', 'ג׳ינג׳י'];
export const EYE_COLORS = ['#2C221E', '#5B3A24', '#3B6EA8', '#4A8A58', '#8C6B38'];
export const EYE_COLOR_LABELS = ['כהות', 'חומות', 'כחולות', 'ירוקות', 'דבש'];
export const HAIR_STYLES: { key: HairStyle; label: string }[] = [
  { key: 'short', label: 'קצר' },
  { key: 'bangs', label: 'פוני' },
  { key: 'swoop', label: 'הצידה' },
  { key: 'curly', label: 'מתולתל' },
  { key: 'tuft', label: 'קווצה' },
  { key: 'baby', label: 'שיער תינוק' },
  { key: 'wild', label: 'תלתלים פרועים' },
  { key: 'flip', label: 'פוני עם קצוות' },
  { key: 'none', label: 'בלי' },
];
export const EXTRAS: { key: Extra; label: string }[] = [
  { key: 'blush', label: 'לחיים ורודות' },
  { key: 'freckles', label: 'נמשים' },
  { key: 'glasses', label: 'משקפיים' },
  { key: 'bow', label: 'סרט' },
  { key: 'pacifier', label: 'מוצץ' },
  { key: 'lashes', label: 'ריסים' },
  { key: 'mole', label: 'נקודת חן' },
];

export const animalByEmoji = (emoji: string): Animal => ANIMALS.find((a) => a.emoji === emoji)?.key ?? 'bear';
export const emojiOf = (a: Animal) => ANIMALS.find((x) => x.key === a)?.emoji ?? '🐻';

export function defaultLook(c: Pick<Child, 'emoji' | 'gender'>): Look {
  const girl = c.gender === 'girl';
  return {
    animal: animalByEmoji(c.emoji),
    skin: 1,
    hair: girl ? 'bangs' : 'short',
    hairColor: 1,
    eyes: 'sparkle',
    eyeColor: 1,
    extras: girl ? ['blush', 'bow'] : ['blush'],
  };
}

export function lookOf(c: Pick<Child, 'emoji' | 'gender' | 'look'>): Look {
  return { ...defaultLook(c), ...(c.look ?? {}) };
}

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export function randomLook(base: Look): Look {
  return {
    ...base,
    hair: pick(HAIR_STYLES).key,
    hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
    eyes: pick(['round', 'sparkle'] as const),
    eyeColor: Math.floor(Math.random() * EYE_COLORS.length),
    extras: EXTRAS.filter(() => Math.random() < 0.3).map((e) => e.key),
  };
}

export const FACES: { key: Face; label: string }[] = [
  { key: 'round', label: 'עגול' },
  { key: 'chubby', label: 'לחיים שמנמנות' },
];
export const MOUTHS: { key: Mouth; label: string }[] = [
  { key: 'smile', label: 'חיוך' },
  { key: 'cheeky', label: 'חיוך שובב' },
  { key: 'grin', label: 'חיוך עם שיניים' },
  { key: 'open', label: 'פה פתוח' },
];
export const PRINTS: { key: Print; label: string }[] = [
  { key: 'none', label: 'חלק' },
  { key: 'helicopter', label: 'מסוק' },
  { key: 'stripes', label: 'פסים' },
  { key: 'skate', label: 'סקייטבורד' },
  { key: 'stars', label: 'כוכבים' },
  { key: 'hearts', label: 'לבבות' },
];
export const TOYS: { key: Toy; label: string }[] = [
  { key: 'none', label: 'בלי' },
  { key: 'teether', label: 'נשכן פרח' },
  { key: 'book', label: 'ספר בד' },
  { key: 'rattle', label: 'רעשן' },
  { key: 'teddy', label: 'דובי' },
];
