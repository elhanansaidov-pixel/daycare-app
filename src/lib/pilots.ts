// Pilot features: shipped to the live site but visible only to the admin account until released.
// Add an entry to PILOTS while an update is in pilot; remove it (and its pilotOn checks) on release.

export const ADMIN_EMAILS = ['elhanansaidov@gmail.com'];

/** [id, icon, name] */
export const PILOTS: [string, string, string][] = [
  ['U1', '🛍️', 'מה חסר'],
  ['U2', '🎂', 'ימי הולדת'],
  ['U3', '📅', 'ימים שהמשפחתון סגור'],
];

const OFF_KEY = 'daycare.pilotsOff';
let admin = false;

/** Called once the signed-in user is known. Local (offline) mode counts as admin for development. */
export function setAdmin(emailOrLocal: string | null | undefined) {
  admin = emailOrLocal === 'local' || (!!emailOrLocal && ADMIN_EMAILS.includes(emailOrLocal.toLowerCase()));
}

export const isAdmin = () => admin;

function offList(): string[] {
  try {
    return JSON.parse(localStorage.getItem(OFF_KEY) || '[]');
  } catch {
    return [];
  }
}

/** True only for the admin, and only if the pilot was not switched off on this device. */
export function pilotOn(id: string): boolean {
  return admin && !offList().includes(id);
}

export function setPilotEnabled(id: string, on: boolean) {
  const off = new Set(offList());
  if (on) off.delete(id);
  else off.add(id);
  try {
    localStorage.setItem(OFF_KEY, JSON.stringify([...off]));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('pilots-changed'));
}
