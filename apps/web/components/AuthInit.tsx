'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export function AuthInit() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Hanya jalankan checkAuth SEKALI saat initial mount
    // Gunakan ref untuk mencegah double-call di React StrictMode
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
      } catch (e: any) {
        // Jika 401, stop heartbeat dan trigger re-auth check
        if (e.response?.status === 401) {
          console.warn('[AUTH] Heartbeat received 401, checking session...')
          checkAuth();
        }
        // Silently ignore other errors (network issues, etc)
      }
    };

    // Send immediately on load/login
    sendHeartbeat();

    // Then every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    // Listen for session expired event from api.ts
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
