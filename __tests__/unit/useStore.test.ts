// ============================================================
// 状态管理 Store 测试
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/stores/useStore';

describe('useStore', () => {
  beforeEach(() => {
    // 重置状态
    useStore.setState({
      sessions: [],
      currentSessionId: null,
      selectedModelId: 'gpt-4o-mini',
      temperature: 0.7,
      topP: 1,
      maxTokens: 4096,
      systemPrompt: '',
      tokenStats: { totalTokens: 0, totalCost: 0 },
      subscription: null,
      isLoggedIn: false,
      userName: '',
    });
  });

  it('应能创建新会话', () => {
    const id = useStore.getState().createSession('gpt-4o');
    const { sessions, currentSessionId } = useStore.getState();

    expect(id).toBeTruthy();
    expect(sessions.length).toBe(1);
    expect(sessions[0].modelId).toBe('gpt-4o');
    expect(currentSessionId).toBe(id);
  });

  it('应能切换会话', () => {
    const id1 = useStore.getState().createSession('gpt-4o');
    const id2 = useStore.getState().createSession('claude-3.5-sonnet');

    useStore.getState().selectSession(id1);
    expect(useStore.getState().currentSessionId).toBe(id1);

    useStore.getState().selectSession(id2);
    expect(useStore.getState().currentSessionId).toBe(id2);
  });

  it('应能删除会话', () => {
    const id1 = useStore.getState().createSession('gpt-4o');
    const id2 = useStore.getState().createSession('claude-3.5-sonnet');

    useStore.getState().deleteSession(id1);
    expect(useStore.getState().sessions.length).toBe(1);
    expect(useStore.getState().sessions[0].id).toBe(id2);
  });

  it('应能添加消息', () => {
    const id = useStore.getState().createSession('gpt-4o');
    useStore.getState().addMessage(id, { role: 'user', content: 'Hello' });

    const session = useStore.getState().sessions.find((s) => s.id === id);
    expect(session?.messages.length).toBe(1);
    expect(session?.messages[0].content).toBe('Hello');
  });

  it('应能更新模型设置', () => {
    useStore.getState().setTemperature(1.5);
    useStore.getState().setMaxTokens(8000);
    useStore.getState().setSystemPrompt('You are a helpful assistant');

    const state = useStore.getState();
    expect(state.temperature).toBe(1.5);
    expect(state.maxTokens).toBe(8000);
    expect(state.systemPrompt).toBe('You are a helpful assistant');
  });

  it('应能更新 Token 统计', () => {
    useStore.getState().addTokenStats(100, 0.05);
    useStore.getState().addTokenStats(200, 0.10);

    const { tokenStats } = useStore.getState();
    expect(tokenStats.totalTokens).toBe(300);
    expect(tokenStats.totalCost).toBeCloseTo(0.15);
  });
});