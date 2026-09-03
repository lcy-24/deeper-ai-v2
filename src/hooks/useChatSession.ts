// ============================================================
// useChatSession — 会话管理 Hook
// ============================================================

import { useCallback, useMemo } from 'react';
import { useStore } from '@/stores/useStore';
import type { Message } from '@/types';

export function useChatSession() {
  const sessions = useStore((s) => s.sessions);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const createSession = useStore((s) => s.createSession);
  const selectSession = useStore((s) => s.selectSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const updateSessionTitle = useStore((s) => s.updateSessionTitle);
  const togglePinSession = useStore((s) => s.togglePinSession);
  const addMessage = useStore((s) => s.addMessage);
  const updateLastAssistantMessage = useStore((s) => s.updateLastAssistantMessage);
  const selectedModelId = useStore((s) => s.selectedModelId);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId) ?? null,
    [sessions, currentSessionId],
  );

  const messages = currentSession?.messages ?? [];

  const handleNewSession = useCallback(() => {
    createSession(selectedModelId);
  }, [createSession, selectedModelId]);

  const handleSendMessage = useCallback(
    (content: string, images?: string[]) => {
      if (!currentSessionId) {
        const newId = createSession(selectedModelId);
        const msg: Message = {
          role: 'user',
          content,
          images,
        };
        addMessage(newId, msg);
        return newId;
      }
      const msg: Message = { role: 'user', content, images };
      addMessage(currentSessionId, msg);
      return currentSessionId;
    },
    [currentSessionId, selectedModelId, createSession, addMessage],
  );

  const handleAddAssistantMessage = useCallback(
    (sessionId: string, content: string) => {
      const msg: Message = { role: 'assistant', content };
      addMessage(sessionId, msg);
    },
    [addMessage],
  );

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    handleNewSession,
    selectSession,
    deleteSession,
    updateSessionTitle,
    togglePinSession,
    handleSendMessage,
    handleAddAssistantMessage,
    updateLastAssistantMessage,
  };
}