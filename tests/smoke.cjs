// Smoke test: runs the app in local (offline) mode and checks the main flows.
// Usage: npm test   (needs Playwright + Chromium available on the machine)
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const PORT = 5199;
const URL = `http://localhost:${PORT}/`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (ok, name) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
};

(async () => {
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  try {
    for (let i = 0; i < 40; i++) {
      try {
        if ((await fetch(URL)).ok) break;
      } catch {}
      await sleep(250);
    }
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(URL + '#/');
    await page.waitForSelector('article');

    check((await page.locator('article').count()) === 6, 'dashboard shows 6 children');
    const kafir = page.locator('article', { hasText: 'כפיר' });
    await kafir.locator('button[title="סמן הגעה"]').click();
    await sleep(300);
    check((await kafir.locator('button[title="סמן איסוף"]').count()) === 1, 'arrival marks child as present');
    await kafir.getByRole('button', { name: 'פיפי' }).click();
    await sleep(300);
    check((await page.getByRole('button', { name: 'ביטול' }).count()) === 1, 'diaper log shows undo toast');

    await page.goto(URL + '#/child/' + (await page.evaluate(() => JSON.parse(localStorage.getItem('daycare.v1.children'))[0].id)));
    await page.waitForSelector('ol');
    check((await page.locator('ol li').count()) >= 2, 'child timeline lists today events');

    // Regression: on a long, scrolled child page the event sheet must open on screen (not below the page).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('button', { name: 'אוכל' }).first().click();
    await sleep(600);
    const sheetBox = await page.locator('[role=dialog] [data-help="sheet"]').boundingBox();
    check(!!sheetBox && sheetBox.y >= 0 && sheetBox.y + sheetBox.height <= 844 + 1, 'event sheet opens fully on screen on the child page');
    await page.locator('[role=dialog] button[aria-label="סגירה"]').click();
    await sleep(300);

    // U1: "מה חסר" list on the child page, shown read-only in the parent portal
    await page.getByRole('button', { name: 'הוספת פריט חסר' }).click();
    await page.locator('[role=dialog] button', { hasText: 'חיתולים' }).click();
    await sleep(300);
    await page.locator('[role=dialog] button[aria-label="סגירה"]').click();
    check((await page.getByRole('button', { name: 'חיתולים הגיע' }).count()) === 1, 'U1: supply item added on child page');
    await page.goto(URL + '#/parent');
    await page.waitForTimeout(500);
    check((await page.getByText('מה להביא מחר').count()) === 1, 'U1: parent portal shows what to bring');

    // U4: the assistant ("העוזרת של ברכה")
    await page.goto(URL + '#/');
    await page.waitForSelector('article');
    const help = page.getByRole('button', { name: 'עזרה' });
    check((await help.count()) === 1, 'U4: help button shown');
    check((await page.getByTestId('tip-bubble').getByText('אני העוזרת שלך').count()) === 1, 'U4: welcome tip shown on first visit');
    await help.click();
    await page.getByLabel('שאלה לעוזרת').fill('טעיתי');
    await sleep(200);
    check((await page.getByTestId('faq-results').getByText('לחצתי בטעות, איך מבטלים?').count()) === 1, 'U4: "טעיתי" finds the undo answer');
    await page.getByLabel('שאלה לעוזרת').fill('מתי יש חנוכה');
    await sleep(1800);
    check((await page.getByTestId('faq-miss').count()) === 1, 'U4: unknown question shows the "sent to Elhanan" note');
    const usage = await page.evaluate(() => JSON.parse(localStorage.getItem('daycare.usage') || '[]'));
    check(usage.some((e) => e.kind === 'help_miss' && e.detail === 'מתי יש חנוכה') && usage.some((e) => e.kind === 'screen'), 'U4: usage log stored locally');
    await page.getByLabel('שאלה לעוזרת').fill('');
    await page.getByRole('button', { name: 'לסמן הגעה ואיסוף' }).click();
    await page.getByTestId('tour').getByText('שלב 1 מתוך 3').waitFor({ timeout: 3000 });
    await page.locator('[data-help="arrive"]').first().click();
    await page.getByTestId('tour').getByText('שלב 2 מתוך 3').waitFor({ timeout: 3000 }).then(() => check(true, 'U4: tour advances when the highlighted button is tapped'), () => check(false, 'U4: tour advances when the highlighted button is tapped'));
    await page.getByTestId('tour').getByRole('button', { name: 'יציאה' }).click();
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-help="quick-pee"]').nth(i % 3).click();
      await sleep(150);
    }
    await sleep(300);
    check((await page.getByTestId('tip-bubble').getByText('לכמה ילדים').count()) === 1, 'U4: multi-select tip after 5 separate logs');

    // U2 pilot: birthdays (today → festive card + party hat, within a week → reminder)
    await page.evaluate(() => {
      const kids = JSON.parse(localStorage.getItem('daycare.v1.children'));
      const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const t = new Date();
      kids[0].birth_date = ymd(new Date(t.getFullYear() - 2, t.getMonth(), t.getDate()));
      kids[1].birth_date = ymd(new Date(t.getFullYear() - 3, t.getMonth(), t.getDate() + 3));
      localStorage.setItem('daycare.v1.children', JSON.stringify(kids));
    });
    await page.goto(URL + '#/');
    await page.reload();
    await page.waitForSelector('article');
    check((await page.getByTestId('birthday-today').getByText('יום הולדת שנתיים').count()) === 1, 'U2: birthday card shown on the day');
    check((await page.locator('article [data-testid="party-hat"]').count()) === 1, 'U2: party hat on the birthday child');
    check((await page.getByTestId('birthday-soon').getByText('בעוד 3 ימים').count()) === 1, 'U2: upcoming birthday reminder');
    await page.goto(URL + '#/parent');
    await page.waitForTimeout(500);
    check((await page.getByTestId('parent-birthday').count()) === 1, 'U2: parents see the birthday greeting');

    // U3 pilot: closed days (settings → parents' portal, dashboard banner)
    await page.goto(URL + '#/settings');
    await page.waitForSelector('[data-help="closed-days"]');
    const next = await page.evaluate(() => {
      const n = new Date();
      n.setDate(n.getDate() + 1);
      if (n.getDay() === 6) n.setDate(n.getDate() + 1);
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    });
    await page.getByLabel('מתאריך').fill(next);
    await page.getByLabel('סיבה').fill('חופשת חנוכה');
    await page.getByRole('button', { name: 'הוספת ימים סגורים' }).click();
    await sleep(400);
    check((await page.getByTestId('closed-list').getByText('חופשת חנוכה').count()) === 1, 'U3: closed day saved in settings');
    await page.goto(URL + '#/');
    await page.waitForSelector('article');
    check((await page.getByTestId('closed-banner').getByText('המשפחתון סגור').count()) === 1, 'U3: dashboard warns about tomorrow');
    await page.goto(URL + '#/parent');
    await page.waitForTimeout(500);
    check((await page.getByTestId('parent-closed').getByText('חופשת חנוכה').count()) === 1, 'U3: parents see the closed days');

    await page.goto(URL + '#/settings');
    await page.waitForSelector('text=פיילוטים');
    check(true, 'admin sees pilots section in settings');

    await page.goto(URL + '#/parent');
    await page.waitForTimeout(500);
    check((await page.locator('h1').count()) >= 1, 'parent portal preview renders');

    check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
    await browser.close();
  } finally {
    try {
      process.kill(-server.pid);
    } catch {}
  }
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
