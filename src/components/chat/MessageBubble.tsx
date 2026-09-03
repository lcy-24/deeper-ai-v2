// ============================================================
// MessageBubble — 消息气泡组件
// ============================================================

import { useState } from 'react';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, isStreaming, onCopy, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const showActions = !isUser && !!message.content && !isStreaming;

  return (
    <div className={`message-row ${isUser ? 'user' : ''}`}>
      <div>
        <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
          {renderContent(message.content)}
        </div>
        {showActions && (
          <div className="message-actions">
            <button
              className="icon-btn"
              title="复制"
              onClick={() => {
                onCopy?.();
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? '✓ 已复制' : '⧉ 复制'}
            </button>
            <button className="icon-btn" title="重新生成" onClick={onRegenerate}>
              ↻ 重新生成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** 简单 Markdown 渲染 */
function renderContent(content: string): React.ReactNode {
  if (!content) return <span style={{ opacity: 0.5 }}>思考中...</span>;

  // 简单的代码块处理
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.split('\n');
      const lang = lines[0].replace('```', '').trim();
      const code = lines.slice(1, -1).join('\n');
      return (
        <pre key={i}>
          {lang && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{lang}</div>}
          <code>{code}</code>
        </pre>
      );
    }

    // 内联代码
    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={i}>
        {inlineParts.map((inline, j) => {
          if (inline.startsWith('`') && inline.endsWith('`')) {
            return (
              <code key={j} style={{
                background: 'var(--bg-tertiary)',
                padding: '1px 4px',
                borderRadius: 3,
                fontSize: '0.9em',
              }}>
                {inline.slice(1, -1)}
              </code>
            );
          }
          return <span key={j}>{inline}</span>;
        })}
      </span>
    );
  });
}