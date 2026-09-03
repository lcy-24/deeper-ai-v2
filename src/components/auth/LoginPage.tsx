// ============================================================
// LoginPage — 登录 / 注册页
// ============================================================

import { useState } from 'react';

interface LoginPageProps {
  onLogin: (name: string) => void;
  onGuest: () => void;
}

export function LoginPage({ onLogin, onGuest }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);
    // 模拟认证请求
    setTimeout(() => {
      const displayName = mode === 'register' ? name.trim() : email.split('@')[0];
      localStorage.setItem('deeper-ai-user', JSON.stringify({ email, name: displayName }));
      onLogin(displayName);
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">D</div>
          <h1>Deeper AI</h1>
          <p>面向开发者的多模型 AI 对话工作台</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            登录
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="login-field">
              <label>昵称</label>
              <input
                type="text"
                placeholder="你的昵称"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="login-field">
            <label>邮箱</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="login-field">
            <label>密码</label>
            <input
              type="password"
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
          </button>
        </form>

        <div className="login-divider"><span>或</span></div>

        <button className="btn login-guest" onClick={onGuest}>
          以访客身份体验 →
        </button>

        <p className="login-footer">
          登录即表示同意《服务条款》与《隐私政策》
        </p>
      </div>
    </div>
  );
}
