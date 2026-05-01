/**
 * Biometric Authentication Button
 * Face ID / Touch ID per secure attendance
 */
import { useState, useEffect } from 'react';
import { Fingerprint, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBiometric } from '@/hooks/useBiometric';

export default function BiometricButton({ onSuccess, onError, disabled }) {
  const { isSupported, isAuthenticating, error, checkBiometricSupport, authenticate } = useBiometric();
  const [status, setStatus] = useState(null); // 'ready', 'success', 'error'

  useEffect(() => {
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  const handleBiometric = async () => {
    if (!isSupported) {
      onError('Biometric not available on this device');
      return;
    }

    setStatus(null);
    const challenge = Math.random().toString(36).substring(2, 15);
    const result = await authenticate(challenge);

    if (result.success) {
      setStatus('success');
      setTimeout(() => setStatus(null), 2000);
      onSuccess(result);
    } else {
      setStatus('error');
      onError(result.error);
      setTimeout(() => setStatus(null), 2000);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleBiometric}
      disabled={disabled || isAuthenticating}
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        status === 'success' && 'bg-emerald-600 text-white',
        status === 'error' && 'bg-red-600 text-white',
        !status && 'bg-blue-600 hover:bg-blue-700 text-white'
      )}
    >
      {isAuthenticating || status === 'success' ? (
        <>
          {status === 'success' ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <Loader className="w-8 h-8 animate-spin" />
          )}
          <span>{status === 'success' ? 'Verificato' : 'Scanning...'}</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-8 h-8" />
          <span>Riprova</span>
        </>
      ) : (
        <>
          <Fingerprint className="w-8 h-8" />
          <span>Biometrico</span>
        </>
      )}
    </button>
  );
}