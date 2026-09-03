// ============================================================
// AI 模型适配器类型定义
// ============================================================

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system';

/** 聊天消息 */
export interface Message {
  role: MessageRole;
  content: string;
  /** 图片 URL（视觉模型） */
  images?: string[];
}

/** 聊天选项 */
export interface ChatOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stop?: string[];
}

/** 聊天响应 */
export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 流式响应块 */
export interface ChatChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** 嵌入选项 */
export interface EmbeddingOptions {
  model?: string;
}

// ============================================================
// 模型适配器接口
// ============================================================

/** AI 模型适配器统一接口 */
export interface AIModelAdapter {
  /** 模型 ID */
  readonly modelId: string;

  /** 非流式聊天 */
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;

  /** 流式聊天 */
  chatStream(
    messages: Message[],
    options?: ChatOptions,
  ): AsyncIterable<ChatChunk>;

  /** 文本嵌入（可选） */
  embed?(text: string, options?: EmbeddingOptions): Promise<number[]>;

  /** 模型能力 */
  readonly capabilities: ModelCapabilities;
}

// ============================================================
// 模型元数据
// ============================================================

/** 模型分组 */
export type ModelGroup = 'domestic' | 'international';

/** 模型能力 */
export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  functionCall: boolean;
  streaming: boolean;
  fileUpload: boolean;
  reasoning: boolean;
}

/** 模型定价 */
export interface ModelPricing {
  input: number;
  output: number;
  unit: 'per-1M-tokens' | 'per-1K-tokens';
}

/** 模型元数据 */
export interface ModelMeta {
  id: string;
  name: string;
  provider: string;
  group: ModelGroup;
  endpoint: string;
  modelName: string;
  apiKeyEnv: string;
  description: string;
  capabilities: ModelCapabilities;
  maxTokens: number;
  pricing: ModelPricing;
  icon?: string;
  color?: string;
  builtin?: boolean;
}

// ============================================================
// 网关配置
// ============================================================

/** 传输模式 */
export type TransportMode = 'managed' | 'byok';

/** 传输配置 */
export interface TransportConfig {
  mode: TransportMode;
  endpoint: string;
  apiKey: string;
  headers: Record<string, string>;
}

// ============================================================
// 服务层类型
// ============================================================

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

/** 订阅计划 */
export type PlanType = 'free' | 'pro' | 'enterprise';

/** 订阅信息 */
export interface Subscription {
  plan: PlanType;
  monthlyQuota: number;
  currentUsage: number;
  seatCount: number;
}

/** 用量记录 */
export interface UsageRecord {
  id: string;
  modelId: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: number;
}

/** 团队角色 */
export type TeamRole = 'admin' | 'member' | 'viewer';

/** 团队成员 */
export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: TeamRole;
  joinedAt: number;
  lastActiveAt: number;
}

/** 审计日志 */
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: number;
}