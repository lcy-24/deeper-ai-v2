/**
 * Deeper AI v2 网关 — LLM 反向代理
 *
 * 4 层架构:
 *   ① 鉴权层: Supabase JWT 校验
 *   ② 额度层: 查订阅 + 额度检查
 *   ③ 代理层: 服务端 Key 代理转发 + SSE 流式透传
 *   ④ 用量层: 异步记录 token 用量
 */
export declare const config: {
    path: string;
};
export default function handler(req: Request): Promise<Response>;
