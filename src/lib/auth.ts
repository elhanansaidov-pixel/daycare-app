import { supabase } from './supabase';

export type Role = 'caregiver' | 'parent';

export async function sendCode(email: string) {
  if (!supabase) throw new Error('no cloud');
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
  if (error) throw error;
}

export async function verifyCode(email: string, token: string) {
  if (!supabase) throw new Error('no cloud');
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' });
  if (error) throw error;
}

export async function getRole(): Promise<Role> {
  if (!supabase) return 'caregiver';
  const { data } = await supabase.rpc('is_staff');
  return data ? 'caregiver' : 'parent';
}

export async function signOut() {
  await supabase?.auth.signOut();
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('no cloud');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
}

const PENDING = 'daycare.pendingInvite';
export const setPendingInvite = (code: string) => {
  try {
    localStorage.setItem(PENDING, code);
  } catch {
    /* ignore */
  }
};
export const takePendingInvite = (): string | null => {
  try {
    const c = localStorage.getItem(PENDING);
    localStorage.removeItem(PENDING);
    return c;
  } catch {
    return null;
  }
};

/** Returns the child's name if the invite was valid, null otherwise. */
export async function redeemInvite(code: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('redeem_invite', { code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row?.child_name ?? null;
}

export async function rotateInvite(childId: string): Promise<string> {
  if (!supabase) throw new Error('no cloud');
  const { data, error } = await supabase.rpc('rotate_invite', { child: childId });
  if (error) throw error;
  return data as string;
}

export const inviteLink = (code: string) => `${location.origin}${location.pathname}#/join/${code}`;
