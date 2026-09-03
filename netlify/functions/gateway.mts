/**
 * Deeper AI v2 网关 — LLM 反向代理
 *
 * 4 层架构:
 *   ① 鉴权层: Supabase JWT 校验
 *   ② 额度层: 查订阅 + 额度检查
 *   ③ 代理层: 服务端 Key 代理转发 + SSE 流式透传
 *   ④ 用量层: 异步记录 token 用量
 */

export const config = { path: '/api/llm/*' };

// 提供商 → 服务端 Key 环境变量
const PROVIDER_KEY_ENV: Record<string, string> = {
  OpenAI: 'MANAGED_OPENAI_KEY',
  Anthropic: 'MANAGED_ANTHROPIC_KEY',
  Google: 'MANAGED_GEMINI_KEY',
  阿里云: 'MANAGED_QWEN_KEY',
  深度求索: 'MANAGED_DEEPSEEK_KEY',
  智谱AI: 'MANAGED_GLM_KEY',
  月之暗面: 'MANAGED_KIMI_KEY',
  字节跳动: 'MANAGED_DOUBAO_KEY',
  百度: 'MANAGED_ERNIE_KEY',
};

// SSRF 白名单
const ALLOWED_HOSTS = new Set([
  'api.openai.com', 'api.anthropic.com',
  'generativelanguage.googleapis.com', 'dashscope.aliyuncs.com',
  'api.deepseek.com', 'open.bigmodel.cn', 'api.moonshot.cn',
  'ark.cn-beijing.volces.com', 'aip.baidubce.com',
]);

const ALLOWED_HOST_SUFFIXES = ['.maas.aliyuncs.com'];

function isAllowedHost(host: string): boolean {
  return ALLOWED_HOSTS.has(host) || ALLOWED_HOST_SUFFIXES.some((s) => host.endsWith(s));
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, x-deeper-provider, x-deeper-upstream, anthropic-version',
  'Access-Control-Max-Age': '86400',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function getEnv(name: string): string | undefined {
  return (globalThis as any).process?.env?.[name];
}

async function verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return { valid: false };

  try {
    const resp = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (resp.ok) {
      const data = await resp.json();
      return { valid: true, userId: data.id };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

async function checkQuota(userId: string): Promise<boolean> {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return true;

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/subscriptions?user_id=eq.${userId}&select=plan,monthly_quota,current_usage`;
    const resp = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
    if (!resp.ok) return true;
    const rows = await resp.json();
    const sub = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return !(sub && sub.monthly_quota > 0 && sub.current_usage >= sub.monthly_quota);
  } catch {
    return true;
  }
}

async function recordUsage(userId: string, modelId: string, provider: string, usage: any): Promise<void> {
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey || !usage) return;

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/usage_records`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        user_id: userId,
        model_id: modelId,
        provider,
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
        cost: 0,
        created_at: Date.now(),
      }),
    });
  } catch {
    // 用量记录失败不阻塞
  }
}

function extractSubPath(pathname: string): string {
  const markers = ['/api/llm', '/.netlify/functions/gateway'];
  for (const m of markers) {
    const i = pathname.indexOf(m);
    if (i >= 0) {
      let sub = pathname.slice(i + m.length);
      if (!sub.startsWith('/')) sub = '/' + sub;
      return sub;
    }
  }
  return pathname;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  // ① 鉴权层
  const allowAnon = getEnv('GATEWAY_ALLOW_ANON') === 'true';
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  let userId: string | null = null;

  if (!allowAnon) {
    if (!token || token === 'anon') {
      return json(401, { error: '未认证：缺少有效的登录令牌' });
    }
    const { valid, userId: uid } = await verifyToken(token);
    if (!valid) {
      return json(401, { error: '认证失败：令牌无效或已过期' });
    }
    userId = uid || null;
  }

  // ② 额度层
  if (userId) {
    const hasQuota = await checkQuota(userId);
    if (!hasQuota) {
      return json(429, { error: '额度不足：本月用量已达上限' });
    }
  }

  // ③ 代理层
  let provider = req.headers.get('x-deeper-provider') || '';
  try { provider = decodeURIComponent(provider); } catch { /* keep raw */ }
  const upstream = req.headers.get('x-deeper-upstream') || '';

  if (!provider || !upstream) {
    return json(400, { error: '缺少路由头' });
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(upstream);
  } catch {
    return json(400, { error: '非法的上游地址' });
  }
  if (!isAllowedHost(upstreamUrl.hostname)) {
    return json(403, { error: `不允许的上游主机: ${upstreamUrl.hostname}` });
  }

  const keyEnv = PROVIDER_KEY_ENV[provider];
  const serverKey = keyEnv ? getEnv(keyEnv) : undefined;
  if (!serverKey) {
    return json(502, { error: `网关未配置 ${provider} 的 API Key` });
  }

  const subPath = extractSubPath(new URL(req.url).pathname);
  const targetUrl = `${upstream.replace(/\/$/, '')}${subPath}`;

  const upstreamHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'Anthropic') {
    upstreamHeaders['x-api-key'] = serverKey;
    upstreamHeaders['anthropic-version'] = req.headers.get('anthropic-version') || '2023-06-01';
  } else {
    upstreamHeaders['Authorization'] = `Bearer ${serverKey}`;
  }

  const body = await req.text();

  try {
    const upstreamResp = await fetch(targetUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body,
    });

    const respHeaders = new Headers(CORS_HEADERS);
    const ct = upstreamResp.headers.get('content-type') || '';
    if (ct) respHeaders.set('Content-Type', ct);

    // ④ 用量层 — 非流式响应异步记录
    const isStreaming = ct.includes('text/event-stream');
    if (!isStreaming && upstreamResp.ok && userId) {
      try {
        const cloned = upstreamResp.clone();
        const respBody = await cloned.json();
        await recordUsage(userId, respBody?.model || '', provider, respBody?.usage);
      } catch { /* ignore */ }
    }

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err: any) {
    return json(502, { error: `上游请求失败: ${err?.message || 'unknown'}` });
  }
}