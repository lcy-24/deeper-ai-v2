// ============================================================
// 重试中间件测试
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { withRetry, getCircuitState } from '@/services/retry-middleware';

describe('withRetry', () => {
  it('成功调用应直接返回结果', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry('test', fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('失败后应重试最多 3 次', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue('success');

    const result = await withRetry('test-retry', fn, { baseDelayMs: 10, maxDelayMs: 50 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('全部重试失败后应抛出错误', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      withRetry('test-fail', fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50 }),
    ).rejects.toThrow('always fail');

    expect(fn).toHaveBeenCalledTimes(3); // 初始 + 2 次重试
  });

  it('熔断器应在连续失败后打开', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));

    // 多次失败触发熔断
    for (let i = 0; i < 5; i++) {
      await expect(
        withRetry('test-circuit', fn, { maxRetries: 0, circuitBreakerThreshold: 5, baseDelayMs: 10 }),
      ).rejects.toThrow();
    }

    const state = getCircuitState('test-circuit');
    expect(state?.isOpen).toBe(true);
  });
});