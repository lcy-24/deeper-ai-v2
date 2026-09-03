// ============================================================
// TeamPanel — 团队管理面板
// ============================================================

interface TeamPanelProps {
  onClose: () => void;
}

export function TeamPanel({ onClose }: TeamPanelProps) {
  return (
    <aside className="settings-panel">
      <div className="settings-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>团队管理</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      <div className="settings-section">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="input" placeholder="输入邮箱邀请成员..." style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm">邀请</button>
        </div>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <div>暂无团队成员</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          邀请团队成员加入，共享 AI 额度和会话
        </div>
      </div>
    </aside>
  );
}