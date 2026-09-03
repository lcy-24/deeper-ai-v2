// ============================================================
// useModelConfig — 模型配置 Hook
// ============================================================

import { useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import { getModelMeta } from '@/services/model-registry';

export function useModelConfig() {
  const selectedModelId = useStore((s) => s.selectedModelId);
  const setSelectedModel = useStore((s) => s.setSelectedModel);
  const temperature = useStore((s) => s.temperature);
  const setTemperature = useStore((s) => s.setTemperature);
  const topP = useStore((s) => s.topP);
  const setTopP = useStore((s) => s.setTopP);
  const maxTokens = useStore((s) => s.maxTokens);
  const setMaxTokens = useStore((s) => s.setMaxTokens);
  const systemPrompt = useStore((s) => s.systemPrompt);
  const setSystemPrompt = useStore((s) => s.setSystemPrompt);
  const tokenStats = useStore((s) => s.tokenStats);
  const addTokenStats = useStore((s) => s.addTokenStats);

  const currentMeta = getModelMeta(selectedModelId);

  const handleModelChange = useCallback(
    (id: string) => setSelectedModel(id),
    [setSelectedModel],
  );

  return {
    selectedModelId,
    setSelectedModel: handleModelChange,
    temperature,
    setTemperature,
    topP,
    setTopP,
    maxTokens,
    setMaxTokens,
    systemPrompt,
    setSystemPrompt,
    tokenStats,
    addTokenStats,
    currentMeta,
  };
}