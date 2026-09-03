// ============================================================
// Supabase 服务 — 认证 + 数据同步
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : null;

/** 获取当前用户 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** 邮箱登录 */
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase 未配置');
  return supabase.auth.signInWithPassword({ email, password });
}

/** 邮箱注册 */
export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase 未配置');
  return supabase.auth.signUp({ email, password });
}

/** 退出登录 */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** 获取 JWT Token */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** 同步会话到 Supabase */
export async function syncSessions(
  sessions: Array<{ id: string; title: string; modelId: string }>,
): Promise<void> {
  if (!supabase) return;
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from('chat_sessions').upsert(
    sessions.map((s) => ({
      id: s.id,
      user_id: user.id,
      title: s.title,
      model_id: s.modelId,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'id' },
  );
}

/** 同步消息到 Supabase */
export async function syncMessages(
  sessionId: string,
  messages: Array<{ id: string; role: string; content: string }>,
): Promise<void> {
  if (!supabase) return;
  const user = await getCurrentUser();
  if (!user) return;

  await supabase.from('messages').upsert(
    messages.map((m) => ({
      id: m.id,
      session_id: sessionId,
      user_id: user.id,
      role: m.role,
      content: m.content,
      created_at: new Date().toISOString(),
    })),
    { onConflict: 'id' },
  );
}