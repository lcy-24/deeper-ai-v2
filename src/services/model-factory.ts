// ============================================================
// 模型适配器工厂
// ============================================================

import type { AIModelAdapter, ModelMeta, TransportConfig } from '@/types';
import { createOpenAIAdapter } from './openai-adapter';
import { createClaudeAdapter } from './claude-adapter';
import { createOpenAICompatibleAdapter } from './openai-compatible-adapter';
import { resolveTransport } from './transport-resolver';

export class ModelFactory {
  private adapters = new Map<string, AIModelAdapter>();
  private metaMap = new Map<string, ModelMeta>();

  /** 注册模型 */
  register(meta: ModelMeta, adapter: AIModelAdapter): void {
    this.metaMap.set(meta.id, meta);
    this.adapters.set(meta.id, adapter);
  }

  /** 获取适配器 */
  getAdapter(modelId: string): AIModelAdapter {
    const adapter = this.adapters.get(modelId);
    if (!adapter) {
      throw new Error(`模型 "${modelId}" 未注册`);
    }
    return adapter;
  }

  /** 获取模型元数据 */
  getModelMeta(modelId: string): ModelMeta | undefined {
    return this.metaMap.get(modelId);
  }

  /** 获取所有可用模型 */
  getAvailableModels(): string[] {
    return Array.from(this.adapters.keys());
  }

  /** 获取默认模型 */
  getDefaultModel(): string {
    return this.getAvailableModels()[0] || '';
  }

  /** 批量初始化模型 */
  async initialize(models: ModelMeta[]): Promise<void> {
    for (const meta of models) {
      try {
        const transport = resolveTransport(meta);
        const adapter = this.createAdapter(meta, transport);
        this.register(meta, adapter);
      } catch {
        console.warn(`模型 "${meta.id}" 初始化失败，跳过`);
      }
    }
  }

  /** 创建适配器 */
  private createAdapter(meta: ModelMeta, transport: TransportConfig): AIModelAdapter {
    switch (meta.provider) {
      case 'Anthropic':
        return createClaudeAdapter(meta, transport);
      case 'OpenAI':
        return createOpenAIAdapter(meta, transport);
      default:
        return createOpenAICompatibleAdapter(meta, transport);
    }
  }
}

/** 全局模型工厂单例 */
export const modelFactory = new ModelFactory();