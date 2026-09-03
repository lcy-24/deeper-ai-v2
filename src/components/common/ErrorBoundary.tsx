// ============================================================
// ErrorBoundary — 错误边界组件
// ============================================================

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // 可在此处上报到 Sentry
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: 16, padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2>出错了</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
            {this.state.error?.message || '应用发生了未知错误'}
          </p>
          <button className="btn btn-primary" onClick={this.handleRetry}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}