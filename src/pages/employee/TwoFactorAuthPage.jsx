import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Shield, Copy, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoFactorAuthPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totp, setTotp] = useState(null);
  const [isTotpEnabled, setIsTotpEnabled] = useState(false);
  const [step, setStep] = useState('menu'); // menu, setup, verify, manage
  const [token, setToken] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      
      // Controlla se 2FA è già abilitato
      const totpSecrets = await base44.entities.TotpSecret.filter({
        user_email: me.email
      });
      
      if (totpSecrets.length > 0) {
        setIsTotpEnabled(totpSecrets[0].is_enabled);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleGenerateSecret = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateTotpSecretReal', {});
      setTotp(result.data);
      setStep('setup');
      toast.success('QR Code generato - scansiona con Google Authenticator');
    } catch (err) {
      toast.error('Errore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      toast.error('Inserisci un codice valido a 6 cifre');
      return;
    }

    setVerifying(true);
    try {
      const result = await base44.functions.invoke('enableTwoFactorAuth', {
        token
      });
      
      setIsTotpEnabled(true);
      setStep('manage');
      setToken('');
      setTotp(null);
      toast.success('2FA abilitato con successo!');
    } catch (err) {
      toast.error('Errore: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!window.confirm('Sei sicuro di voler disabilitare il 2FA? La sicurezza del tuo account diminuirà.')) {
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('disableTwoFactorAuth', {});
      setIsTotpEnabled(false);
      setStep('menu');
      toast.success('2FA disabilitato');
    } catch (err) {
      toast.error('Errore: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato');
  };

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Autenticazione a Due Fattori</h1>
            <p className="text-sm text-slate-500">Proteggi il tuo account con un ulteriore livello di sicurezza</p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-xl border-2 ${isTotpEnabled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {isTotpEnabled ? (
              <>
                <Check className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">2FA Abilitato</p>
                  <p className="text-sm text-green-800">Il tuo account è protetto con autenticazione a due fattori</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">2FA Disabilitato</p>
                  <p className="text-sm text-amber-800">Abilita 2FA per proteggere il tuo account</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Menu Step */}
        {step === 'menu' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Opzioni</h2>
            
            {!isTotpEnabled ? (
              <button
                onClick={handleGenerateSecret}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Abilita Autenticazione a Due Fattori
              </button>
            ) : (
              <button
                onClick={handleDisableTwoFactor}
                disabled={loading}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Disabilita 2FA
              </button>
            )}
          </div>
        )}

        {/* Setup Step */}
        {step === 'setup' && totp && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="font-semibold text-slate-800">Configura Autenticatore</h2>

            {/* QR Code */}
            <div className="bg-slate-50 p-6 rounded-lg flex flex-col items-center gap-4">
              <p className="text-sm text-slate-600 text-center">Scansiona questo codice QR con Google Authenticator, Authy, o Microsoft Authenticator</p>
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                {totp?.qr_code_url && (
                  <img 
                    src={totp.qr_code_url} 
                    alt="QR Code" 
                    width={300}
                    height={300}
                    className="w-48 h-48"
                  />
                )}
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Chiave Segreta (backup)</label>
              <div className="flex gap-2">
                <input
                  type={showSecret ? 'text' : 'password'}
                  readOnly
                  value={totp.secret}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(totp.secret)}
                  className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Codici di Backup</label>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showBackupCodes ? '▼ Nascondi' : '▶ Mostra'} codici di backup
              </button>
              
              {showBackupCodes && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 mb-3">Salva questi codici in luogo sicuro. Sono per accesso di emergenza.</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {totp.backup_codes.map((code, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
                        <span className="flex-1">{code}</span>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verify Token Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Verifica il Codice</label>
              <p className="text-xs text-slate-500">Inserisci il codice a 6 cifre dal tuo autenticatore</p>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg text-center font-mono text-2xl tracking-widest focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('menu');
                  setToken('');
                  setTotp(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleEnableTwoFactor}
                disabled={verifying || token.length !== 6}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {verifying ? 'Verifica...' : 'Abilita'}
              </button>
            </div>
          </div>
        )}

        {/* Manage Step */}
        {step === 'manage' && isTotpEnabled && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Impostazioni 2FA</h2>
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✅ 2FA è attivo. Inserisci un codice a 6 cifre ad ogni login.
              </p>
            </div>

            <button
              onClick={handleDisableTwoFactor}
              className="w-full px-4 py-2.5 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Disabilita 2FA
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}