// ============================================================
// useSupabaseSync — 云端同步 Hook
// ============================================================

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores/useStore';
import { syncSessions, getCurrentUser } from '@/services/supabase-service';

export function useSupabaseSync() {
  const sessions = useStore((s) => s.sessions);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    const sync = async () => {
      const now = Date.now();
      // 至少间隔 5 秒同步一次
      if (now - lastSyncRef.current < 5000) return;
      lastSyncRef.current = now;

      try {
        const user = await getCurrentUser();
        if (!user) return;

        await syncSessions(
          sessions.map((s) => ({
            id: s.id,
            title: s.title,
            modelId: s.modelId,
          })),
        );
      } catch {
        // 同步失败不阻塞
      }
    };

    sync();
  }, [sessions, isLoggedIn]);
}