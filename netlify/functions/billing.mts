/**
 * Deeper AI v2 计费服务 — Stripe 集成
 */

export const config = { path: '/api/billing/*' };

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
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

async function getUserId(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const supabaseUrl = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return null;

  try {
    const resp = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.id;
    }
  } catch { /* ignore */ }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/billing/, '');

  switch (path) {
    case '/subscription': {
      const userId = await getUserId(req);
      if (!userId) return json(401, { error: '未认证' });

      const supabaseUrl = getEnv('SUPABASE_URL');
      const anonKey = getEnv('SUPABASE_ANON_KEY');
      if (!supabaseUrl || !anonKey) return json(500, { error: '配置错误' });

      const resp = await fetch(
        `${supabaseUrl.replace(/\/$/, '')}/rest/v1/subscriptions?user_id=eq.${userId}&select=*`,
        { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } },
      );
      if (!resp.ok) return json(404, { error: '未找到订阅' });
      const rows = await resp.json();
      return json(200, rows[0] || null);
    }

    case '/create-checkout': {
      if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
      const userId = await getUserId(req);
      if (!userId) return json(401, { error: '未认证' });

      const { plan } = await req.json();
      const priceMap: Record<string, string> = {
        pro: getEnv('STRIPE_PRICE_PRO') || '',
        enterprise: getEnv('STRIPE_PRICE_ENTERPRISE') || '',
      };
      const priceId = priceMap[plan];
      if (!priceId) return json(400, { error: '无效的套餐' });

      const stripeKey = getEnv('STRIPE_SECRET_KEY');
      if (!stripeKey) return json(500, { error: 'Stripe 未配置' });

      const sessionResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          mode: 'subscription',
          success_url: `${url.origin}/?checkout=success`,
          cancel_url: `${url.origin}/?checkout=cancel`,
          client_reference_id: userId,
        }),
      });

      const session = await sessionResp.json();
      return json(200, { url: session.url });
    }

    default:
      return json(404, { error: 'Not found' });
  }
}