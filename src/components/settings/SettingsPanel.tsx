// ============================================================
// SettingsPanel — 设置面板
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { modelRegistry } from '@/services/model-registry';

interface SettingsPanelProps {
  selectedModelId: string;
  onModelChange: (id: string) => void;
  temperature: number;
  onTemperatureChange: (t: number) => void;
  topP: number;
  onTopPChange: (p: number) => void;
  maxTokens: number;
  onMaxTokensChange: (tokens: number) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  onClose: () => void;
}

export function SettingsPanel({
  selectedModelId,
  onModelChange,
  temperature,
  onTemperatureChange,
  topP,
  onTopPChange,
  maxTokens,
  onMaxTokensChange,
  systemPrompt,
  onSystemPromptChange,
  onClose,
}: SettingsPanelProps) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [modelMenuOpen]);

  const selectedModel = modelRegistry.find((m) => m.id === selectedModelId);

  return (
    <aside className="settings-panel">
      <div className="settings-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>设置</h3>
        <button className="btn btn-sm" onClick={onClose}>×</button>
      </div>

      {/* 模型选择 */}
      <div className="settings-section">
        <h3>模型</h3>
        <div className={`model-select ${modelMenuOpen ? 'open' : ''}`} ref={modelMenuRef}>
          <button
            type="button"
            className="model-select-trigger"
            onClick={() => setModelMenuOpen((v) => !v)}
          >
            <span className="model-select-value">
              {selectedModel ? `${selectedModel.name} — ${selectedModel.provider}` : '选择模型'}
            </span>
            <span className="model-select-arrow">▼</span>
          </button>

          {modelMenuOpen && (
            <div className="model-select-menu">
              <div className="model-select-group">国际模型</div>
              {modelRegistry
                .filter((m) => m.group === 'international')
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`model-select-option ${m.id === selectedModelId ? 'active' : ''}`}
                    onClick={() => { onModelChange(m.id); setModelMenuOpen(false); }}
                  >
                    <span className="model-select-check">{m.id === selectedModelId ? '✓' : ''}</span>
                    <span className="model-dot" style={{ background: m.color }} />
                    <span>{m.name} — {m.provider}</span>
                  </button>
                ))}
              <div className="model-select-group">国内模型</div>
              {modelRegistry
                .filter((m) => m.group === 'domestic')
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`model-select-option ${m.id === selectedModelId ? 'active' : ''}`}
                    onClick={() => { onModelChange(m.id); setModelMenuOpen(false); }}
                  >
                    <span className="model-select-check">{m.id === selectedModelId ? '✓' : ''}</span>
                    <span className="model-dot" style={{ background: m.color }} />
                    <span>{m.name} — {m.provider}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 参数 */}
      <div className="settings-section">
        <h3>参数</h3>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 13 }}>Temperature</label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            className="slider"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 13 }}>Top P</label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{topP.toFixed(1)}</span>
          </div>
          <input
            type="range"
            className="slider"
            min="0"
            max="1"
            step="0.05"
            value={topP}
            onChange={(e) => onTopPChange(parseFloat(e.target.value))}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <label style={{ fontSize: 13 }}>Max Tokens</label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{maxTokens}</span>
          </div>
          <input
            type="range"
            className="slider"
            min="256"
            max="32768"
            step="256"
            value={maxTokens}
            onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
          />
        </div>
      </div>

      {/* System Prompt */}
      <div className="settings-section">
        <h3>System Prompt</h3>
        <textarea
          className="input"
          rows={6}
          placeholder="自定义系统提示词..."
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          style={{ fontFamily: 'inherit', resize: 'vertical' }}
        />
      </div>
    </aside>
  );
}