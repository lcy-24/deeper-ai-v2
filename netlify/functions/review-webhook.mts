/**
 * Deeper AI v2 — GitHub PR 代码审查 Webhook
 */

export const config = { path: '/api/review/webhook' };

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256, X-GitHub-Event',
};

function getEnv(name: string): string | undefined {
  return (globalThis as any).process?.env?.[name];
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const secret = getEnv('GITHUB_WEBHOOK_SECRET');
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = 'sha256=' + Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === signature;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const body = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';

  const isValid = await verifySignature(body, signature);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const event = req.headers.get('x-github-event');
  const payload = JSON.parse(body);

  if (event === 'pull_request' && payload.action === 'opened') {
    // TODO: 拉取 PR diff → 调用审查引擎 → 评论到 PR
    console.log(`[Review] PR #${payload.pull_request?.number} opened`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}