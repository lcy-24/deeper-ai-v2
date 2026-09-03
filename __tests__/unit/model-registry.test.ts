// ============================================================
// 模型注册表测试
// ============================================================

import { describe, it, expect } from 'vitest';
import { modelRegistry, getModelMeta, getModelsByGroup, getAllModelIds, getDefaultModel } from '@/services/model-registry';

describe('modelRegistry', () => {
  it('应包含至少 10 个模型', () => {
    expect(modelRegistry.length).toBeGreaterThanOrEqual(10);
  });

  it('每个模型应有唯一的 id', () => {
    const ids = modelRegistry.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每个模型应有必要的字段', () => {
    for (const model of modelRegistry) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(model.endpoint).toBeTruthy();
      expect(model.modelName).toBeTruthy();
      expect(model.capabilities.chat).toBe(true);
    }
  });

  it('getModelMeta 应能通过 id 获取模型', () => {
    const meta = getModelMeta('gpt-4o');
    expect(meta).toBeDefined();
    expect(meta?.name).toBe('GPT-4o');
    expect(meta?.provider).toBe('OpenAI');
  });

  it('getModelMeta 对不存在的 id 应返回 undefined', () => {
    expect(getModelMeta('non-existent')).toBeUndefined();
  });

  it('getModelsByGroup 应正确分组', () => {
    const international = getModelsByGroup('international');
    const domestic = getModelsByGroup('domestic');

    expect(international.length).toBeGreaterThan(0);
    expect(domestic.length).toBeGreaterThan(0);

    for (const m of international) {
      expect(m.group).toBe('international');
    }
    for (const m of domestic) {
      expect(m.group).toBe('domestic');
    }
  });

  it('getAllModelIds 应返回所有模型 id', () => {
    expect(getAllModelIds().length).toBe(modelRegistry.length);
  });

  it('getDefaultModel 应返回第一个模型', () => {
    expect(getDefaultModel().id).toBe(modelRegistry[0].id);
  });
});