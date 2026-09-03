// ============================================================
// SubscriptionPanel — 订阅管理面板
// ============================================================

import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionPanelProps {
  onClose: () => void;
}

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    features: ['全部模型', 'BYOK 自带 Key', '基础对话', '1 个席位'],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$29/月',
    features: ['托管 Key', '$100 月度额度', '代码审查', 'MCP 工具', '优先支持', '1 个席位'],
    recommended: true,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: '$99/月',
    features: ['$1000 月度额度', '团队管理', '审计日志', '预算分配', '私有化部署', '可扩展席位'],
  },
];

export function SubscriptionPanel({ onClose }: SubscriptionPanelProps) {
  const { subscription, usagePercent } = useSubscription();

  return (
    <aside className="settings-panel">
      <div className="settings-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>订阅管理</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      {subscription && (
        <div className="settings-section">
          <div style={{ marginBottom: 8 }}>
            <span className={`badge badge-${subscription.plan}`}>
              {subscription.plan.toUpperCase()}
            </span>
            <span style={{ fontSize: 13, marginLeft: 8, color: 'var(--text-secondary)' }}>
              ${subscription.currentUsage.toFixed(2)} / ${subscription.monthlyQuota}
            </span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'var(--bg-tertiary)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${usagePercent}%`,
              background: usagePercent > 80 ? 'var(--accent-error)' : 'var(--accent-success)',
              borderRadius: 3,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      <div className="settings-section">
        <h3>套餐方案</h3>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              padding: 16,
              marginBottom: 8,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-primary)',
              border: plan.recommended ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              position: 'relative',
            }}
          >
            {plan.recommended && (
              <span style={{
                position: 'absolute', top: -10, right: 12,
                background: 'var(--accent-primary)', color: 'white',
                padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              }}>
                推荐
              </span>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{plan.price}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ marginBottom: 2 }}>✓ {f}</div>
              ))}
            </div>
            <button
              className={`btn btn-sm ${plan.recommended ? 'btn-primary' : ''}`}
              style={{ width: '100%' }}
              disabled={subscription?.plan === plan.id}
            >
              {subscription?.plan === plan.id ? '当前方案' : '升级'}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}