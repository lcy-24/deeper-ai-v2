// ============================================================
// ChatPanel — 核心对话面板（v1 风格：Hero 欢迎页 / 底部工具栏 / 模型对比）
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { getModelMeta, modelRegistry } from '@/services/model-registry';

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  selectedModelId: string;
  onModelChange: (id: string) => void;
  onSend: (content: string, images?: string[]) => void;
  onStop: () => void;
  onOpenSettings: () => void;
  onOpenPanel: (panel: 'review' | 'mcp' | 'knowledge' | 'team' | 'subscription' | null) => void;
  onNewSession: () => void;
  onRegenerate: (index: number) => void;
}

export function ChatPanel({
  messages,
  isStreaming,
  selectedModelId,
  onModelChange,
  onSend,
  onStop,
  onOpenSettings,
  onOpenPanel,
  onNewSession,
  onRegenerate,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentMeta = getModelMeta(selectedModelId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
  }, [input, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="model-switch-btn" onClick={() => setShowModelDrawer(true)} title="切换模型">
            <span className="model-dot" style={{ background: currentMeta?.color ?? 'var(--accent-primary)' }} />
            {currentMeta?.name ?? selectedModelId}
            <span className="model-switch-arrow">⇄</span>
          </button>
          {currentMeta && (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {currentMeta.provider}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="header-msg-count">≡ {messages.length} 条消息</span>
          <button className="btn btn-sm" onClick={() => onOpenPanel('review')}>审查</button>
          <button className="btn btn-sm" onClick={() => onOpenPanel('mcp')}>MCP</button>
          <button className="btn btn-sm" onClick={() => onOpenPanel('knowledge')}>知识库</button>
          <button className="btn btn-sm" onClick={() => onOpenPanel('team')}>团队</button>
          <button className="btn btn-sm" onClick={onOpenSettings}>设置</button>
        </div>
      </div>

      {/* Messages / Welcome Hero */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-hero">
            <div className="welcome-icon">✓</div>
            <div className="welcome-title">Deeper AI</div>
            <div className="welcome-subtitle">面向开发者的多模型 AI 对话工作台</div>

            <div className="welcome-features">
              <span className="welcome-feature">
                <span className="dot" style={{ background: '#4F46E5' }} />
                {modelRegistry.length} 个国内外大模型
              </span>
              <span className="welcome-feature">
                <span className="dot" style={{ background: '#10B981' }} />
                AI Skills 技能预设
              </span>
              <span className="welcome-feature">
                <span className="dot" style={{ background: '#F59E0B' }} />
                流式对话 · Markdown
              </span>
            </div>

            <div className="welcome-hint">
              点击左侧 <kbd>＋ 新建会话</kbd> 开始对话，或展开 <kbd>技能面板</kbd> 选择预设
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isStreaming={isStreaming}
              onCopy={msg.role === 'assistant' ? () => {
                navigator.clipboard.writeText(msg.content).catch(() => {});
              } : undefined}
              onRegenerate={
                msg.role === 'assistant' && !isStreaming
                  ? () => onRegenerate(i)
                  : undefined
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            placeholder={`向 ${currentMeta?.name ?? selectedModelId} 提问... (Enter 发送, Shift+Enter 换行)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button className="chat-send-btn" style={{ background: 'var(--accent-error)' }} onClick={onStop}>
              停止
            </button>
          ) : (
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              发送
            </button>
          )}
        </div>
      </div>

      {/* 底部工具栏 */}
      <div className="chat-toolbar">
        <button className="toolbar-btn" onClick={onNewSession}>
          ⚡ 模板
        </button>
        <button className="toolbar-btn" onClick={() => onOpenPanel('review')}>
          🛡️ 代码审查
        </button>
        <button className="toolbar-btn" onClick={() => onOpenPanel('mcp')}>
          🐞 Debug
        </button>
        <button className="toolbar-btn" onClick={() => setShowCompare(true)}>
          📊 模型对比
        </button>
        <span className="toolbar-hint">Enter 发送</span>
      </div>

      {/* 模型对比弹窗 */}
      {showCompare && (
        <div className="model-compare-modal" onClick={() => setShowCompare(false)}>
          <div className="model-compare-card" onClick={(e) => e.stopPropagation()}>
            <h3>
              模型对比
              <button className="btn btn-sm" onClick={() => setShowCompare(false)}>×</button>
            </h3>
            <table className="model-compare-table">
              <thead>
                <tr>
                  <th>模型</th>
                  <th>提供商</th>
                  <th>上下文</th>
                  <th>输入价格</th>
                  <th>能力</th>
                </tr>
              </thead>
              <tbody>
                {modelRegistry.slice(0, 10).map((m) => (
                  <tr key={m.id} style={m.id === selectedModelId ? { background: 'var(--bg-secondary)' } : undefined}>
                    <td style={{ fontWeight: 600 }}>
                      {m.name} {m.id === selectedModelId && '✓'}
                    </td>
                    <td>{m.provider}</td>
                    <td>{(m.maxTokens / 1000).toFixed(0)}K</td>
                    <td>${m.pricing.input}/1M</td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {[
                        m.capabilities.vision && '视觉',
                        m.capabilities.functionCall && '函数',
                        m.capabilities.streaming && '流式',
                      ].filter(Boolean).join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 模型切换侧滑抽屉 */}
      {showModelDrawer && (
        <div className="drawer-overlay" onClick={() => setShowModelDrawer(false)}>
          <aside className="model-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="model-drawer-header">
              <span className="model-drawer-title">选择模型</span>
              <button className="icon-btn" onClick={() => setShowModelDrawer(false)} title="关闭">
                ×
              </button>
            </div>
            {(['international', 'domestic'] as const).map((group) => (
              <div key={group} className="model-drawer-group">
                <div className="model-drawer-group-label">
                  {group === 'international' ? '国际模型' : '国内模型'}
                </div>
                {modelRegistry
                  .filter((m) => m.group === group)
                  .map((m) => (
                    <button
                      key={m.id}
                      className={`model-drawer-item ${m.id === selectedModelId ? 'active' : ''}`}
                      onClick={() => {
                        onModelChange(m.id);
                        setShowModelDrawer(false);
                      }}
                    >
                      <span className="model-dot" style={{ background: m.color }} />
                      <span className="model-drawer-item-main">
                        <span className="model-drawer-item-name">{m.name}</span>
                        <span className="model-drawer-item-desc">
                          {m.provider} · {(m.maxTokens / 1000).toFixed(0)}K 上下文
                        </span>
                      </span>
                      {m.id === selectedModelId && <span className="model-drawer-check">✓</span>}
                    </button>
                  ))}
              </div>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
