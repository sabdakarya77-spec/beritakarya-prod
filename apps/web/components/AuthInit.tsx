'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

/**
 * Lightweight auth check — only verifies session, no heartbeat.
 * Used on public pages to minimize JS overhead for anonymous users.
 */
export function AuthCheck() {
  const { checkAuth } = useAuthStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

/**
 * Full auth init with heartbeat — for dashboard pages only.
 */
export function AuthInit() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Heartbeat system for real online status
  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      try {
        await api.post('/users/heartbeat');
      } catch (e: unknown) {
        const axiosErr = e as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          console.warn('[AUTH] Heartbeat received 401, checking session...')
          checkAuth();
        }
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    const handleSessionExpired = () => {
      clearInterval(interval);
      checkAuth();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session-expired', handleSessionExpired);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:session-expired', handleSessionExpired);
      }
    };
  }, [user, isLoading, checkAuth]);

  return null;
}
