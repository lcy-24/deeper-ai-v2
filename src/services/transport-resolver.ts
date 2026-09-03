// ============================================================
// 传输模式解析器
// ============================================================

import type { ModelMeta, TransportConfig } from '@/types';

const MANAGED_MODELS: string[] = (() => {
  try {
    const raw = import.meta.env.VITE_MANAGED_MODELS;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

/** 解析传输配置 */
export function resolveTransport(meta: ModelMeta): TransportConfig {
  const isManaged = GATEWAY_URL && MANAGED_MODELS.includes(meta.id);

  if (isManaged) {
    return {
      mode: 'managed',
      endpoint: `${GATEWAY_URL}/api/llm`,
      apiKey: '', // 由网关注入 JWT
      headers: {
        'x-deeper-provider': encodeURIComponent(meta.provider),
        'x-deeper-upstream': meta.endpoint,
      },
    };
  }

  return {
    mode: 'byok',
    endpoint: meta.endpoint,
    apiKey: resolveByokKey(meta.apiKeyEnv),
    headers: {},
  };
}

/** 解析 BYOK Key */
function resolveByokKey(envName: string): string {
  // 优先从 localStorage 读取
  const stored = localStorage.getItem(`ai-key-${envName}`);
  if (stored) return stored;

  // 从环境变量读取
  const envKey = (import.meta.env as Record<string, string>)[envName];
  return envKey || '';
}

/** 获取当前传输模式 */
export function getTransportMode(): 'managed' | 'byok' {
  return GATEWAY_URL && MANAGED_MODELS.length > 0 ? 'managed' : 'byok';
}