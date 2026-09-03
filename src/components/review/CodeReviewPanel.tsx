// ============================================================
// CodeReviewPanel — 代码审查面板
// ============================================================

import { useState } from 'react';

interface CodeReviewPanelProps {
  onClose: () => void;
}

interface ReviewIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  title: string;
  description: string;
  line?: number;
  suggestion?: string;
  ruleId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  major: '#F59E0B',
  minor: '#3B82F6',
  info: '#6B7280',
};

export function CodeReviewPanel({ onClose }: CodeReviewPanelProps) {
  const [code, setCode] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [score, setScore] = useState<number | null>(null);

  const handleReview = async () => {
    if (!code.trim()) return;
    setReviewing(true);

    // 模拟审查逻辑（实际项目会调用 analyzer.ts）
    await new Promise((r) => setTimeout(r, 1500));

    const mockIssues: ReviewIssue[] = [
      {
        id: '1',
        severity: 'critical',
        category: 'security',
        title: 'SQL 注入风险',
        description: '检测到使用字符串拼接构建 SQL 查询',
        line: 42,
        suggestion: '使用参数化查询或 ORM 的安全 API',
        ruleId: 'SEC-001',
      },
      {
        id: '2',
        severity: 'major',
        category: 'performance',
        title: 'N+1 查询问题',
        description: '在循环中执行数据库查询，可能导致性能问题',
        line: 78,
        suggestion: '使用批量查询或 JOIN 优化',
        ruleId: 'PERF-001',
      },
      {
        id: '3',
        severity: 'minor',
        category: 'style',
        title: '命名建议',
        description: '变量名 `x` 不够描述性',
        line: 15,
        suggestion: '使用更具描述性的变量名',
        ruleId: 'STYLE-001',
      },
    ];

    setIssues(mockIssues);
    setScore(85);
    setReviewing(false);
  };

  return (
    <aside className="settings-panel">
      <div className="settings-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>代码审查</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      <div className="settings-section">
        <textarea
          className="input"
          rows={10}
          placeholder="粘贴代码进行审查..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
        />
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8 }}
          onClick={handleReview}
          disabled={reviewing || !code.trim()}
        >
          {reviewing ? '审查中...' : '开始审查'}
        </button>
      </div>

      {score !== null && (
        <div className="settings-section">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: score >= 80 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
              {score}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>代码质量评分</div>
          </div>

          {issues.map((issue) => (
            <div
              key={issue.id}
              style={{
                padding: 12,
                marginBottom: 8,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${SEVERITY_COLORS[issue.severity]}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: SEVERITY_COLORS[issue.severity] + '20',
                  color: SEVERITY_COLORS[issue.severity],
                  fontWeight: 600,
                }}>
                  {issue.severity.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{issue.ruleId}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{issue.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{issue.description}</div>
              {issue.suggestion && (
                <div style={{ fontSize: 12, color: 'var(--accent-success)', marginTop: 4 }}>
                  💡 {issue.suggestion}
                </div>
              )}
              {issue.line && (
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Line {issue.line}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}