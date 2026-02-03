import { useState, useEffect, useRef } from 'react';
import { Shield, Smartphone, Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';

interface SudoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loading: boolean;
  error: string | null;
  onVerifyTOTP: (code: string) => Promise<boolean>;
  clearError: () => void;
}

type Step = 'verify' | 'success';

export default function SudoModal({
  open,
  onClose,
  onSuccess,
  loading,
  error,
  onVerifyTOTP,
  clearError,
}: SudoModalProps) {
  const [step, setStep] = useState<Step>('verify');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('verify');
      setOtp(['', '', '', '', '', '']);
      clearError();
      // Focus first input when modal opens
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open, clearError]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every(d => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code: string) => {
    const success = await onVerifyTOTP(code);
    if (success) {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } else {
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-n2f-card border border-n2f-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-n2f-accent/10 p-2 rounded-full">
              <Shield className="h-5 w-5 text-n2f-accent" />
            </div>
            <h3 className="text-lg font-semibold text-n2f-text">Security Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-n2f-text-muted hover:text-n2f-text p-1"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step: Verify */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-n2f-text-secondary">
              <Smartphone className="h-4 w-4" />
              <span>Enter the 6-digit code from your authenticator app</span>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={loading}
                  className="w-12 h-14 text-center text-2xl font-bold bg-n2f-elevated border border-n2f-border rounded-lg text-n2f-text focus:outline-none focus:ring-2 focus:ring-n2f-accent disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {loading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-n2f-accent" />
              </div>
            )}

            <p className="text-xs text-n2f-text-muted text-center">
              Open Google Authenticator, Authy, or your preferred authenticator app
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="bg-emerald-900/30 p-3 rounded-full w-fit mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-n2f-text font-medium">Verification Successful</p>
            <p className="text-sm text-n2f-text-secondary mt-1">
              Sudo mode active for 15 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
