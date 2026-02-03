import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useSudo } from '../hooks/useSudo';
import SudoModal from '../components/SudoModal';

interface SudoContextValue {
  /** Whether sudo mode is currently active */
  hasSudo: boolean;
  /** When sudo mode expires (ISO string) */
  sudoExpiresAt: string | null;
  /** Whether TOTP is enabled */
  totpEnabled: boolean;
  /** Request sudo verification - shows modal if not already verified */
  requestSudo: () => Promise<boolean>;
  /** Wrap a sensitive action with sudo check */
  withSudo: <T>(action: () => Promise<T>) => Promise<T | null>;
}

const SudoContext = createContext<SudoContextValue | null>(null);

export function SudoProvider({ children }: { children: ReactNode }) {
  const sudo = useSudo();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestSudo = useCallback(async (): Promise<boolean> => {
    // Check if already has sudo
    if (sudo.requireSudo()) {
      return true;
    }

    // Check if TOTP is enabled
    if (!sudo.totpEnabled) {
      // Can't use sudo without TOTP - redirect to settings
      return false;
    }

    // Show modal and wait for verification
    return new Promise((resolve) => {
      setPendingAction(() => () => resolve(true));
      setModalOpen(true);
    });
  }, [sudo]);

  const withSudo = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    // Check if already has sudo
    if (sudo.requireSudo()) {
      return action();
    }

    // Request sudo verification
    const hasAccess = await requestSudo();
    if (hasAccess) {
      return action();
    }
    return null;
  }, [sudo, requestSudo]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setPendingAction(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    if (pendingAction) {
      pendingAction();
    }
    setPendingAction(null);
  }, [pendingAction]);

  return (
    <SudoContext.Provider
      value={{
        hasSudo: sudo.hasSudo,
        sudoExpiresAt: sudo.sudoExpiresAt,
        totpEnabled: sudo.totpEnabled,
        requestSudo,
        withSudo,
      }}
    >
      {children}
      <SudoModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        loading={sudo.loading}
        error={sudo.error}
        onVerifyTOTP={sudo.verifyTOTP}
        clearError={sudo.clearError}
      />
    </SudoContext.Provider>
  );
}

export function useSudoContext() {
  const context = useContext(SudoContext);
  if (!context) {
    throw new Error('useSudoContext must be used within a SudoProvider');
  }
  return context;
}
