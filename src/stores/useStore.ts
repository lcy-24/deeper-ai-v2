// ============================================================
// 全局状态管理 — Zustand Store
// ============================================================

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChatSession, Message, Subscription } from '@/types';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  selectedModelId: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  tokenStats: { totalTokens: number; totalCost: number };
  subscription: Subscription | null;
  isLoggedIn: boolean;
  userName: string;
}

interface ChatActions {
  // 会话
  createSession: (modelId: string) => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  togglePinSession: (id: string) => void;

  // 消息
  addMessage: (sessionId: string, message: Message) => void;
  updateLastAssistantMessage: (sessionId: string, content: string) => void;

  // 模型
  setSelectedModel: (id: string) => void;
  setTemperature: (t: number) => void;
  setTopP: (p: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemPrompt: (prompt: string) => void;

  // Token
  addTokenStats: (tokens: number, cost: number) => void;

  // 认证
  setLoggedIn: (loggedIn: boolean, name?: string) => void;

  // 订阅
  setSubscription: (sub: Subscription | null) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem('deeper-ai-sessions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  localStorage.setItem('deeper-ai-sessions', JSON.stringify(sessions));
}

export const useStore = create<ChatState & ChatActions>()(
  immer((set, get) => ({
    // 初始状态
    sessions: loadSessions(),
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

    // 会话操作
    createSession: (modelId) => {
      const id = generateId();
      const session: ChatSession = {
        id,
        title: '新对话',
        modelId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((state) => {
        state.sessions.unshift(session);
        state.currentSessionId = id;
      });
      saveSessions(get().sessions);
      return id;
    },

    selectSession: (id) => {
      set((state) => { state.currentSessionId = id; });
    },

    deleteSession: (id) => {
      set((state) => {
        state.sessions = state.sessions.filter((s) => s.id !== id);
        if (state.currentSessionId === id) {
          state.currentSessionId = state.sessions[0]?.id ?? null;
        }
      });
      saveSessions(get().sessions);
    },

    updateSessionTitle: (id, title) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === id);
        if (session) session.title = title;
      });
      saveSessions(get().sessions);
    },

    togglePinSession: (id) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === id);
        if (session) session.pinned = !session.pinned;
      });
      saveSessions(get().sessions);
    },

    // 消息操作
    addMessage: (sessionId, message) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          session.messages.push(message);
          session.updatedAt = Date.now();
        }
      });
      saveSessions(get().sessions);
    },

    updateLastAssistantMessage: (sessionId, content) => {
      set((state) => {
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          const lastMsg = session.messages[session.messages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = content;
          }
        }
      });
      saveSessions(get().sessions);
    },

    // 模型设置
    setSelectedModel: (id) => set({ selectedModelId: id }),
    setTemperature: (t) => set({ temperature: t }),
    setTopP: (p) => set({ topP: p }),
    setMaxTokens: (tokens) => set({ maxTokens: tokens }),
    setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

    // Token
    addTokenStats: (tokens, cost) => {
      set((state) => {
        state.tokenStats.totalTokens += tokens;
        state.tokenStats.totalCost += cost;
      });
    },

    // 认证
    setLoggedIn: (loggedIn, name) => {
      set({ isLoggedIn: loggedIn, userName: name || '' });
    },

    // 订阅
    setSubscription: (sub) => set({ subscription: sub }),
  })),
);

/** 获取当前会话 */
export function getCurrentSession(): ChatSession | null {
  const { sessions, currentSessionId } = useStore.getState();
  return sessions.find((s) => s.id === currentSessionId) ?? null;
}