// ============================================================
// Sidebar — 会话列表侧边栏（v1 风格：搜索/日期分组/头像/主题切换）
// ============================================================

import { useState } from 'react';
import type { ChatSession } from '@/types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onTogglePin: (id: string) => void;
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
  themeMode: 'light' | 'dark' | 'auto';
  onCycleTheme: () => void;
}

const AVATAR_COLORS = ['#4F46E5', '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

function avatarColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function dateGroup(ts: number): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  if (ts >= startOfToday) return '今天';
  if (ts >= startOfYesterday) return '昨天';
  return '更早';
}

function timeLabel(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return new Date(ts).toLocaleDateString('zh-CN');
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
  onNew,
  onTogglePin,
  isLoggedIn,
  userName,
  onLogout,
  themeMode,
  onCycleTheme,
}: SidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.trim().toLowerCase()))
    : sessions;

  const pinned = filtered.filter((s) => s.pinned);
  const unpinned = filtered.filter((s) => !s.pinned);

  // 按日期分组
  const groups = ['今天', '昨天', '更早'];
  const grouped = groups
    .map((g) => ({
      label: g,
      items: unpinned.filter((s) => dateGroup(s.updatedAt) === g),
    }))
    .filter((g) => g.items.length > 0);

  const themeIcon = themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '🖥️';

  return (
    <aside className="sidebar">
      {/* 顶部：品牌 + 主题切换 + 新建 + 搜索 */}
      <div className="sidebar-top">
        <div className="sidebar-brand-row">
          <div>
            <div className="sidebar-logo">Deeper AI</div>
            <div className="sidebar-subtitle">多模型AI开发工作站</div>
          </div>
          <button className="theme-toggle-btn" onClick={onCycleTheme} title="切换主题">
            {themeIcon}
          </button>
        </div>

        <button className="new-session-btn" onClick={onNew}>
          ＋ 新建会话
        </button>

        <div className="sidebar-search">
          <span className="search-icon">🔍</span>
          <input
            placeholder="搜索会话..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 会话列表 */}
      <div className="sidebar-sessions">
        {pinned.length > 0 && (
          <>
            <div className="date-group-label">
              <span>📌 已置顶</span>
              <span>{pinned.length}</span>
            </div>
            {pinned.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isActive={s.id === currentSessionId}
                onSelect={onSelect}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </>
        )}

        {grouped.map((g) => (
          <div key={g.label}>
            <div className="date-group-label">
              <span>{g.label}</span>
              <span>{g.items.length}</span>
            </div>
            {g.items.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                isActive={s.id === currentSessionId}
                onSelect={onSelect}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            ))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">💬</div>
            <div>{search ? '没有匹配的会话' : '暂无对话'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {search ? '换个关键词试试' : '点击 ＋ 新建会话 开始'}
            </div>
          </div>
        )}
      </div>

      {/* 底部：用户信息 */}
      <div className="sidebar-footer">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div className="session-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName || '已登录'}
            </span>
            <button className="btn btn-sm" onClick={onLogout} title="退出登录">
              退出
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            访客模式
          </div>
        )}
      </div>
    </aside>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div
      className={`sidebar-session-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(session.id)}
    >
      <div className="session-avatar" style={{ background: avatarColor(session.id) }}>
        {session.title.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {session.title}
        </div>
        <div className="session-meta">
          {session.messages.length} 条消息 · {timeLabel(session.updatedAt)}
        </div>
      </div>
      <div className={`session-actions ${session.pinned ? 'visible' : ''}`}>
        <button
          className={`icon-btn session-action-btn ${session.pinned ? 'pinned' : ''}`}
          onClick={(e) => { e.stopPropagation(); onTogglePin(session.id); }}
          title={session.pinned ? '取消置顶' : '置顶'}
        >
          📌
        </button>
        <button
          className="icon-btn session-action-btn danger"
          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
          title="删除"
        >
          ×
        </button>
      </div>
    </div>
  );
}
