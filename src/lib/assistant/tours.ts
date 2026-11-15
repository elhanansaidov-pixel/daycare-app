// U2 step-by-step guides. Each step highlights one element (CSS selector, usually [data-help=…]).
// `path` navigates first; `waitClick` advances by itself when she taps the highlighted element.

export interface TourStep {
  path?: string;
  target: string;
  text: string;
  waitClick?: boolean;
}
export interface Tour {
  id: string;
  title: string;
  topic: string;
  steps: TourStep[];
}

const h = (k: string) => `[data-help="${k}"]`;

export const TOURS: Tour[] = [
  {
    id: 'arrive',
    title: 'לסמן הגעה ואיסוף',
    topic: 'arrive',
    steps: [
      { path: '/', target: h('arrive'), text: 'כשילד מגיע, לוחצים על „הגעה” בכרטיס שלו. נסי עכשיו!', waitClick: true },
      { target: h('undo'), text: 'רשמת בטעות? לוחצים כאן על „ביטול”. הכפתור מופיע כמה שניות אחרי כל רישום.' },
      { target: h('arrive'), text: 'כשההורים אוספים, לוחצים שוב על אותו כפתור, והילד מסומן „נאסף”.' },
    ],
  },
  {
    id: 'undo',
    title: 'לבטל רישום שטעיתי בו',
    topic: 'undo',
    steps: [
      { path: '/', target: h('quick-pee'), text: 'כל לחיצה נרשמת מיד. נסי ללחוץ על „פיפי”.', waitClick: true },
      { target: h('undo'), text: 'למטה מופיעה הודעה עם „ביטול”. לוחצים עליו, והרישום נמחק.' },
      { target: h('child-link'), text: 'פספסת את הביטול? לוחצים על התמונה של הילד, ושם על הרישום ביומן. נפתח חלון עם כפתור „מחיקה”.' },
    ],
  },
  {
    id: 'multi',
    title: 'לרשום לכמה ילדים יחד',
    topic: 'multi',
    steps: [
      { path: '/', target: h('multi'), text: 'רוצה לרשום לכמה ילדים בבת אחת? לוחצים על „כמה ילדים יחד”.', waitClick: true },
      { target: 'article', text: 'עכשיו לוחצים על הכרטיסים של הילדים שרוצים. כל ילד שנבחר מקבל מסגרת.' },
      { target: h('multi-bar'), text: 'בוחרים פעולה למטה, והיא נרשמת לכל הילדים שבחרת. בסוף לוחצים „סיום בחירה”.' },
    ],
  },
  {
    id: 'feed',
    title: 'לרשום אוכל',
    topic: 'feed',
    steps: [
      { path: '/', target: h('quick-feed'), text: 'לרישום אוכל לוחצים על „אוכל” בכרטיס של הילד.', waitClick: true },
      { target: h('sheet'), text: 'בוחרים מה הוא אכל, אפשר להוסיף כמות, ולוחצים „שמירה” למטה.' },
    ],
  },
  {
    id: 'sleep',
    title: 'לרשום שינה',
    topic: 'sleep',
    steps: [
      { path: '/', target: h('quick-sleep'), text: 'כשילד נרדם לוחצים „שינה”. הכרטיס יראה כמה זמן הוא ישן.' },
      { target: h('quick-sleep'), text: 'כשהוא מתעורר, לוחצים על אותו כפתור („התעורר”). זמן השינה נשמר לבד.' },
    ],
  },
  {
    id: 'photo',
    title: 'להוסיף תמונה',
    topic: 'photo',
    steps: [
      { path: '/', target: h('quick-photo'), text: 'לתמונה לוחצים „תמונה” בכרטיס של הילד.', waitClick: true },
      { target: h('sheet'), text: 'בוחרים „מצלמה” או „מהגלריה”, מסמנים מי בתמונה ולוחצים „שמירה”. ההורים יראו אותה אצלם.' },
    ],
  },
  {
    id: 'summary',
    title: 'לשלוח סיכום להורים',
    topic: 'summary',
    steps: [
      { path: '/summary', target: h('summary-card'), text: 'כאן יש סיכום של היום לכל ילד. „תצוגה” מראה בדיוק מה ייכתב להורים.' },
      { target: h('summary-send'), text: 'הכפתור הירוק שולח בוואטסאפ. „העתקה” מעתיקה את הטקסט, כדי שתדביקי בעצמך.' },
    ],
  },
  {
    id: 'child',
    title: 'לראות את כל היום של ילד',
    topic: 'child',
    steps: [
      { path: '/', target: h('child-link'), text: 'לוחצים על התמונה או השם של הילד.', waitClick: true },
      { target: h('timeline'), text: 'כאן כל מה שנרשם היום. לחיצה על רישום פותחת אותו לתיקון או למחיקה.' },
      { target: h('child-tabs'), text: 'ב„כרטיס ילד” נמצאים הפרטים: אלרגיות, הורים וטלפונים.' },
    ],
  },
  {
    id: 'invite',
    title: 'להזמין הורה',
    topic: 'invite',
    steps: [
      { path: '/settings', target: h('settings-children'), text: 'נכנסים לילד ברשימה. שם, ב„הורים ואנשי קשר”, לוחצים „שליחת הזמנה בוואטסאפ”.' },
    ],
  },
  {
    id: 'reminders',
    title: 'להוסיף תזכורת',
    topic: 'reminder',
    steps: [
      { path: '/settings', target: h('settings-reminders'), text: 'כאן מוסיפים תזכורת, למשל תרופה בשעה 10:00. האפליקציה תזכיר לך בזמן.' },
    ],
  },
  {
    id: 'attendance',
    title: 'לראות נוכחות ודוח חודשי',
    topic: 'attendance',
    steps: [{ path: '/', target: h('nav-attendance'), text: 'בלשונית „נוכחות” רואים מי הגיע היום, ודוח של כל החודש.', waitClick: true }],
  },
  {
    id: 'install',
    title: 'לשים את האפליקציה במסך הבית',
    topic: 'install',
    steps: [{ path: '/settings', target: h('settings-install'), text: 'כאן מוסבר איך מוסיפים את האפליקציה למסך הבית, כמו אפליקציה רגילה.' }],
  },
];

export const tourById = (id: string) => TOURS.find((t) => t.id === id);
