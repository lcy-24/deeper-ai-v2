// ============================================================
// MCPConfigPanel — MCP 工具配置面板
// ============================================================

interface MCPConfigPanelProps {
  onClose: () => void;
}

const BUILTIN_SERVERS = [
  { id: 'browser-use', name: 'Browser Use', description: '浏览器自动化操作', price: '$0.001/次', enabled: true },
  { id: 'code-search', name: 'Code Search', description: '语义代码搜索', price: '$0.0005/次', enabled: true },
  { id: 'db-query', name: 'DB Query', description: '安全数据库查询', price: '$0.002/次', enabled: false },
];

export function MCPConfigPanel({ onClose }: MCPConfigPanelProps) {
  return (
    <aside className="settings-panel">
      <div className="settings-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>MCP 工具</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      <div className="settings-section">
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          MCP (Model Context Protocol) 工具扩展 AI 能力边界
        </p>

        {BUILTIN_SERVERS.map((server) => (
          <div
            key={server.id}
            style={{
              padding: 12,
              marginBottom: 8,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{server.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{server.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{server.price}</span>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: server.enabled ? 'var(--accent-success)' : 'var(--text-tertiary)',
              }} />
            </div>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h3>自定义 MCP Server</h3>
        <input className="input" placeholder="Server 名称" style={{ marginBottom: 8 }} />
        <input className="input" placeholder="命令 (如: npx @anthropic/mcp-server-xxx)" style={{ marginBottom: 8 }} />
        <button className="btn btn-primary" style={{ width: '100%' }}>添加 Server</button>
      </div>
    </aside>
  );
}