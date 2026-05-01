/**
 * Hook per Biometric Authentication
 * Supporta Face ID (iOS), Face Unlock (Android), Touch ID/Fingerprint
 */
import { useState, useCallback } from 'react';

export function useBiometric() {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState(null);

  // Controlla supporto biometrico
  const checkBiometricSupport = useCallback(async () => {
    try {
      if (!window.PublicKeyCredential) {
        setIsSupported(false);
        return false;
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsSupported(available);
      return available;
    } catch (err) {
      console.error('Biometric check error:', err);
      setIsSupported(false);
      return false;
    }
  }, []);

  // Autentica con biometrico
  const authenticate = useCallback(async (challenge) => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const options = {
        challenge: new Uint8Array(challenge.split('').map(c => c.charCodeAt(0))),
        timeout: 60000,
        userVerification: 'preferred',
        allowCredentials: [],
      };

      const assertion = await navigator.credentials.get({
        publicKey: options,
      });

      if (!assertion) {
        throw new Error('Biometric authentication failed');
      }

      return {
        success: true,
        clientData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.clientDataJSON))),
        authenticatorData: btoa(String.fromCharCode(...new Uint8Array(assertion.response.authenticatorData))),
        signature: btoa(String.fromCharCode(...new Uint8Array(assertion.response.signature))),
      };
    } catch (err) {
      const message = err.name === 'NotAllowedError' 
        ? 'Biometric authentication cancelled'
        : err.message;
      setError(message);
      console.error('Biometric auth error:', err);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return {
    isSupported,
    isAuthenticating,
    error,
    checkBiometricSupport,
    authenticate,
  };
}