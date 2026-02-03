import { useState, useEffect, useCallback } from 'react';
import { getSudoStatus, verifySudoTOTP, isAuthenticated } from '../lib/api';

interface UseSudoReturn {
  /** Whether sudo mode is currently active */
  hasSudo: boolean;
  /** When sudo mode expires (ISO string) */
  sudoExpiresAt: string | null;
  /** Whether TOTP is enabled for this user */
  totpEnabled: boolean;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Verify TOTP code and activate sudo mode */
  verifyTOTP: (code: string) => Promise<boolean>;
  /** Refresh sudo status from server */
  refreshStatus: () => Promise<void>;
  /** Check sudo before action - returns true if has sudo */
  requireSudo: () => boolean;
  /** Clear error */
  clearError: () => void;
}

const SUDO_CHECK_INTERVAL = 60000; // Check every minute

export function useSudo(): UseSudoReturn {
  const [hasSudo, setHasSudo] = useState(false);
  const [sudoExpiresAt, setSudoExpiresAt] = useState<string | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    // Don't call API if not authenticated - prevents 401 redirect loop
    if (!isAuthenticated()) {
      return;
    }
    try {
      const res = await getSudoStatus();
      if (res.success && res.data) {
        setHasSudo(res.data.active);
        setSudoExpiresAt(res.data.expires_at || null);
        setTotpEnabled(res.data.totp_enabled || false);
      }
    } catch (err) {
      console.error('Failed to get sudo status:', err);
    }
  }, []);

  // Check sudo status on mount and periodically
  useEffect(() => {
    refreshStatus();

    const interval = setInterval(() => {
      refreshStatus();
    }, SUDO_CHECK_INTERVAL);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyTOTP = useCallback(async (code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const res = await verifySudoTOTP(code);
      if (res.success && res.data) {
        setHasSudo(true);
        setSudoExpiresAt(res.data.expires_at);
        return true;
      } else {
        setError(res.error?.message || 'Invalid verification code');
        return false;
      }
    } catch (err) {
      setError('Verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const requireSudo = useCallback((): boolean => {
    // Check if sudo is still valid
    if (sudoExpiresAt) {
      const expiryTime = new Date(sudoExpiresAt).getTime();
      if (Date.now() > expiryTime) {
        setHasSudo(false);
        setSudoExpiresAt(null);
        return false;
      }
    }
    return hasSudo;
  }, [hasSudo, sudoExpiresAt]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    hasSudo,
    sudoExpiresAt,
    totpEnabled,
    loading,
    error,
    verifyTOTP,
    refreshStatus,
    requireSudo,
    clearError,
  };
}
