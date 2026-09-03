/**
 * Deeper AI v2 — MCP 代理网关
 */

export const config = { path: '/api/mcp/*' };

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

const BUILTIN_SERVERS = [
  { id: 'browser-use', name: 'Browser Use', description: '浏览器自动化', pricePerCall: 0.001 },
  { id: 'code-search', name: 'Code Search', description: '语义代码搜索', pricePerCall: 0.0005 },
  { id: 'db-query', name: 'DB Query', description: '安全数据库查询', pricePerCall: 0.002 },
];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function getEnv(name: string): string | undefined {
  return (globalThis as any).process?.env?.[name];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/mcp/, '');

  // GET /api/mcp/servers — 获取可用 Server 列表
  if (req.method === 'GET' && path === '/servers') {
    return json(200, BUILTIN_SERVERS);
  }

  // POST /api/mcp/invoke — 代理 MCP 调用
  if (req.method === 'POST' && path === '/invoke') {
    const { serverId, method, params } = await req.json();

    const server = BUILTIN_SERVERS.find((s) => s.id === serverId);
    if (!server) {
      return json(404, { error: `MCP Server "${serverId}" 未找到` });
    }

    // TODO: 实际调用 MCP Server
    return json(200, {
      jsonrpc: '2.0',
      id: params?.id || 1,
      result: { message: `MCP Server "${serverId}" 调用成功`, method },
    });
  }

  return json(404, { error: 'Not found' });
}