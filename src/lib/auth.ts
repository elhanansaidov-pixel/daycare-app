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
