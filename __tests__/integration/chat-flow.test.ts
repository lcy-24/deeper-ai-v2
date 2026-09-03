// ============================================================
// 聊天流程集成测试
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/stores/useStore';

describe('Chat 集成流程', () => {
  beforeEach(() => {
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

  it('完整对话流程', () => {
    // 1. 创建会话
    const sessionId = useStore.getState().createSession('gpt-4o-mini');
    expect(sessionId).toBeTruthy();

    // 2. 发送用户消息
    useStore.getState().addMessage(sessionId, {
      role: 'user',
      content: '帮我写一个 Hello World',
    });

    // 3. AI 回复（模拟流式输出）
    useStore.getState().addMessage(sessionId, {
      role: 'assistant',
      content: '',
    });
    useStore.getState().updateLastAssistantMessage(sessionId, '当然');

    let session = useStore.getState().sessions.find((s) => s.id === sessionId);
    expect(session?.messages.length).toBe(2);
    expect(session?.messages[1].content).toBe('当然');

    // 4. 更新标题
    useStore.getState().updateSessionTitle(sessionId, 'Hello World 示例');
    session = useStore.getState().sessions.find((s) => s.id === sessionId);
    expect(session?.title).toBe('Hello World 示例');
  });

  it('多会话切换', () => {
    const id1 = useStore.getState().createSession('gpt-4o');
    useStore.getState().addMessage(id1, { role: 'user', content: 'Msg 1' });

    const id2 = useStore.getState().createSession('claude-3.5-sonnet');
    useStore.getState().addMessage(id2, { role: 'user', content: 'Msg 2' });

    expect(useStore.getState().currentSessionId).toBe(id2);
    expect(useStore.getState().sessions.length).toBe(2);

    useStore.getState().selectSession(id1);
    const session = useStore.getState().sessions.find((s) => s.id === id1);
    expect(session?.messages[0].content).toBe('Msg 1');
  });
});