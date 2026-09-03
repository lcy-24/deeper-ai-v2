// ============================================================
// KnowledgePanel — 知识库面板
// ============================================================

interface KnowledgePanelProps {
  onClose: () => void;
}

export function KnowledgePanel({ onClose }: KnowledgePanelProps) {
  return (
    <aside className="settings-panel">
      <div className="settings-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>知识库</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      <div className="settings-section">
        <div style={{ marginBottom: 12 }}>
          <input className="input" placeholder="搜索知识库..." />
        </div>
        <button className="btn" style={{ width: '100%', marginBottom: 8 }}>
          📁 上传文件
        </button>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div>知识库为空</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          上传文件建立知识库，AI 将能检索你的文档内容
        </div>
      </div>
    </aside>
  );
}