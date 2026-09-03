// ============================================================
// useSubscription — 订阅管理 Hook
// ============================================================

import { useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import type { PlanType, Subscription } from '@/types';

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL;

export function useSubscription() {
  const subscription = useStore((s) => s.subscription);
  const setSubscription = useStore((s) => s.setSubscription);
  const tokenStats = useStore((s) => s.tokenStats);

  const fetchSubscription = useCallback(async () => {
    if (!GATEWAY_URL) return;
    try {
      const resp = await fetch(`${GATEWAY_URL}/api/billing/subscription`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('supabase-auth')}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setSubscription(data as Subscription);
      }
    } catch {
      // 静默失败
    }
  }, [setSubscription]);

  const createCheckout = useCallback(async (plan: PlanType) => {
    if (!GATEWAY_URL) throw new Error('网关未配置');
    const resp = await fetch(`${GATEWAY_URL}/api/billing/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('supabase-auth')}`,
      },
      body: JSON.stringify({ plan }),
    });
    if (!resp.ok) throw new Error('创建支付会话失败');
    return resp.json();
  }, []);

  const usagePercent = subscription
    ? Math.min(100, Math.round((tokenStats.totalCost / subscription.monthlyQuota) * 100))
    : 0;

  return {
    subscription,
    usagePercent,
    fetchSubscription,
    createCheckout,
  };
}