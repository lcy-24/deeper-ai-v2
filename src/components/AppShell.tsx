// ============================================================
// AppShell — 应用外壳（登录门控 + v1 风格布局）
// ============================================================

import { useState, lazy, Suspense, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import { useTheme } from '@/hooks/useTheme';
import { useChatSession } from '@/hooks/useChatSession';
import { useModelConfig } from '@/hooks/useModelConfig';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { LoginPage } from '@/components/auth/LoginPage';
import { sendChatStream } from '@/services/chat-service';
import { modelFactory } from '@/services/model-factory';
import { modelRegistry } from '@/services/model-registry';
import type { Message } from '@/types';
import '@/styles/theme.css';

// 懒加载面板（注意：需使用 default export）
const CodeReviewPanel = lazy(() => import('@/components/review/CodeReviewPanel').then(m => ({ default: m.CodeReviewPanel })));
const MCPConfigPanel = lazy(() => import('@/components/mcp/MCPConfigPanel').then(m => ({ default: m.MCPConfigPanel })));
const KnowledgePanel = lazy(() => import('@/components/knowledge/KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const TeamPanel = lazy(() => import('@/components/team/TeamPanel').then(m => ({ default: m.TeamPanel })));
const SubscriptionPanel = lazy(() => import('@/components/settings/SubscriptionPanel').then(m => ({ default: m.SubscriptionPanel })));

const LazyFallback = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.15)', zIndex: 299,
  }}>
    <div className="loading-spinner" />
  </div>
);

type PanelType = 'settings' | 'review' | 'mcp' | 'knowledge' | 'team' | 'subscription' | null;

export default function AppShell() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { themeMode, cycleTheme } = useTheme();
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const userName = useStore((s) => s.userName);
  const setLoggedIn = useStore((s) => s.setLoggedIn);

  const {
    sessions, currentSessionId, messages,
    handleNewSession, selectSession, deleteSession,
    togglePinSession,
    handleSendMessage, handleAddAssistantMessage,
    updateLastAssistantMessage,
  } = useChatSession();

  const {
    selectedModelId, setSelectedModel, temperature, setTemperature,
    topP, setTopP, maxTokens, setMaxTokens,
    systemPrompt, setSystemPrompt,
  } = useModelConfig();

  useSupabaseSync();

  // 初始化模型工厂
  useState(() => {
    modelFactory.initialize(modelRegistry);
  });

  // 恢复登录状态
  useState(() => {
    try {
      const raw = localStorage.getItem('deeper-ai-user');
      if (raw) {
        const user = JSON.parse(raw);
        setLoggedIn(true, user.name);
      }
    } catch { /* ignore */ }
  });

  // 发送消息
  const onSend = useCallback(async (content: string, images?: string[]) => {
    const sessionId = handleSendMessage(content, images);
    if (!sessionId) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);

    const session = useStore.getState().sessions.find((s) => s.id === sessionId);
    const allMessages: Message[] = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...(session?.messages ?? []),
    ];

    handleAddAssistantMessage(sessionId, '');

    await sendChatStream(
      selectedModelId,
      allMessages,
      { temperature, topP, maxTokens, systemPrompt },
      {
        onChunk: (chunk) => {
          if (!chunk.done) {
            updateLastAssistantMessage(sessionId, chunk.content);
          }
        },
        onDone: (fullContent) => {
          const state = useStore.getState();
          const s = state.sessions.find((sess) => sess.id === sessionId);
          if (s && s.messages.length > 0) {
            const lastMsg = s.messages[s.messages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = fullContent;
            }
          }
          setIsStreaming(false);
          setAbortController(null);
        },
        onError: (err) => {
          console.error('Chat error:', err);
          const reason = err instanceof Error ? err.message : String(err);
          useStore.setState((st) => ({
            sessions: st.sessions.map((s) => {
              if (s.id !== sessionId) return s;
              const msgs = [...s.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.role === 'assistant' && !last.content) {
                msgs[msgs.length - 1] = {
                  ...last,
                  content: `⚠️ 请求失败：${reason}\n\n请确认已在「设置」中为该模型配置 API Key。`,
                };
              }
              return { ...s, messages: msgs };
            }),
          }));
          setIsStreaming(false);
          setAbortController(null);
        },
      },
      controller.signal,
    );
  }, [
    handleSendMessage, handleAddAssistantMessage, updateLastAssistantMessage,
    selectedModelId, temperature, topP, maxTokens, systemPrompt,
  ]);

  const onStop = useCallback(() => {
    abortController?.abort();
    setIsStreaming(false);
  }, [abortController]);

  // 重新生成：截断到该 assistant 消息之前的 user 消息，重新发送
  const onRegenerate = useCallback((index: number) => {
    const state = useStore.getState();
    const sessionId = state.currentSessionId;
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session || isStreaming) return;

    let userIdx = -1;
    for (let i = index - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') { userIdx = i; break; }
    }
    if (userIdx < 0) return;

    const userMsg = session.messages[userIdx];
    useStore.setState((st) => ({
      sessions: st.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: s.messages.slice(0, userIdx) } : s,
      ),
    }));
    onSend(userMsg.content, userMsg.images);
  }, [isStreaming, onSend]);

  // 快捷键
  useKeyboardShortcuts([
    {
      key: 'k', ctrl: true,
      handler: () => handleNewSession(),
      description: '新建会话',
    },
    {
      key: ',', ctrl: true,
      handler: () => setActivePanel((p) => p === 'settings' ? null : 'settings'),
      description: '打开设置',
    },
  ]);

  // 登录门控
  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(name) => setLoggedIn(true, name)}
        onGuest={() => setLoggedIn(true, '访客')}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelect={selectSession}
        onDelete={deleteSession}
        onNew={handleNewSession}
        onTogglePin={togglePinSession}
        isLoggedIn={isLoggedIn}
        userName={userName}
        onLogout={() => {
          localStorage.removeItem('deeper-ai-user');
          setLoggedIn(false);
        }}
        themeMode={themeMode}
        onCycleTheme={cycleTheme}
      />

      <div className="app-main">
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModel}
          onSend={onSend}
          onStop={onStop}
          onOpenSettings={() => setActivePanel((p) => p === 'settings' ? null : 'settings')}
          onOpenPanel={setActivePanel}
          onNewSession={handleNewSession}
          onRegenerate={onRegenerate}
        />
      </div>

      {activePanel === 'settings' && (
        <SettingsPanel
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModel}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          topP={topP}
          onTopPChange={setTopP}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          systemPrompt={systemPrompt}
          onSystemPromptChange={setSystemPrompt}
          onClose={() => setActivePanel(null)}
        />
      )}

      <Suspense fallback={<LazyFallback />}>
        {activePanel === 'review' && <CodeReviewPanel onClose={() => setActivePanel(null)} />}
        {activePanel === 'mcp' && <MCPConfigPanel onClose={() => setActivePanel(null)} />}
        {activePanel === 'knowledge' && <KnowledgePanel onClose={() => setActivePanel(null)} />}
        {activePanel === 'team' && <TeamPanel onClose={() => setActivePanel(null)} />}
        {activePanel === 'subscription' && <SubscriptionPanel onClose={() => setActivePanel(null)} />}
      </Suspense>
    </div>
  );
}
