import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Plus, Copy, Eye, EyeOff, Trash2, Check, Clock, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ROLES = {
  super_admin: "Super Admin",
  company_owner: "Proprietario Azienda",
  company_admin: "Admin Azienda",
  hr_manager: "HR Manager",
  manager: "Manager",
  employee: "Dipendente",
  consultant: "Consulente",
  labor_consultant: "Consulente Lavoro",
  external_consultant: "Consulente Esterno",
  safety_consultant: "Consulente Sicurezza"
};

const STATUS_COLORS = {
  active: "bg-blue-100 text-blue-700",
  used: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-700",
  revoked: "bg-red-100 text-red-700"
};

export default function TemporaryLogins() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logins, setLogins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPassword, setShowPassword] = useState({});

  const [formData, setFormData] = useState({
    user_email: "",
    user_role: "employee",
    expiry_hours: 48
  });

  const userRole = user?.role || "employee";
  const isAdmin = ["super_admin"].includes(userRole);
  const isCompanyAdmin = ["company_owner", "company_admin", "hr_manager"].includes(userRole);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      let query = {};
      if (userRole === "super_admin") {
        query = { company_id: null };
      } else if (isCompanyAdmin && me.company_id) {
        query = { company_id: me.company_id };
      }

      if (Object.keys(query).length > 0) {
        const result = await // TODO: Replace with service.TemporaryLogin.filter(query);
        setLogins(result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const generatePassword = () => {
    return Math.random().toString(36).slice(-12).toUpperCase();
  };

  const handleGenerate = async () => {
    if (!formData.user_email) {
      toast.error("Email obbligatoria");
      return;
    }

    setGenerating(true);
    try {
      const plainPassword = generatePassword();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + formData.expiry_hours);

      const tempLogin = await // TODO: Replace with service.TemporaryLogin.create({
        company_id: isCompanyAdmin ? user.company_id : null,
        user_email: formData.user_email,
        user_role: formData.user_role,
        temp_password: plainPassword,
        plain_password: plainPassword,
        generated_by: user.email,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        expiry_hours: formData.expiry_hours,
        status: "active"
      });

      // Send email with temporary login
      await base44.integrations.Core.SendEmail({
        to: formData.user_email,
        subject: "Credenziali di Accesso Temporanee - PulseHR",
        body: `Ciao,\n\nTi è stato fornito un accesso temporaneo a PulseHR.\n\nEmail: ${formData.user_email}\nPassword Temporanea: ${plainPassword}\nValida fino a: ${format(expiresAt, "d MMMM yyyy HH:mm", { locale: it })}\n\nEffettua il login e cambia la password al primo accesso.\n\nLink: ${window.location.origin}/`
      });

      toast.success("Login temporaneo generato e email inviata");
      setShowModal(false);
      setFormData({ user_email: "", user_role: "employee", expiry_hours: 48 });

      const result = await // TODO: Replace with service.TemporaryLogin.filter(
        isAdmin ? { company_id: null } : { company_id: user.company_id }
      );
      setLogins(result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (loginId) => {
    if (!window.confirm("Revocare questo login temporaneo?")) return;

    try {
      await // TODO: Replace with service.TemporaryLogin.update(loginId, { status: "revoked" });
      toast.success("Login revocato");

      const result = await // TODO: Replace with service.TemporaryLogin.filter(
        isAdmin ? { company_id: null } : { company_id: user.company_id }
      );
      setLogins(result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiato negli appunti");
  };

  if (loading) return <PageLoader />;

  const availableRoles = isAdmin
    ? Object.keys(ROLES).filter(r => r !== "employee")
    : ["employee", "manager", "hr_manager"];

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Login Temporanei</h1>
            <p className="text-slate-600">Genera credenziali temporanee per nuovi utenti</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" /> Genera Login
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Genera Login Temporaneo</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Utente</label>
                <input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Ruolo</label>
                <select
                  value={formData.user_role}
                  onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableRoles.map(role => (
                    <option key={role} value={role}>{ROLES[role]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Validità (ore)</label>
                <select
                  value={formData.expiry_hours}
                  onChange={(e) => setFormData({ ...formData, expiry_hours: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 ora</option>
                  <option value={24}>24 ore</option>
                  <option value={48}>48 ore (2 giorni)</option>
                  <option value={72}>72 ore (3 giorni)</option>
                  <option value={168}>168 ore (1 settimana)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generazione...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Genera
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logins List */}
        <div className="space-y-3">
          {logins.length === 0 ? (
            <div className="bg-slate-50 rounded-lg p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nessun login temporaneo generato.</p>
            </div>
          ) : (
            logins.map(login => {
              const expiresAt = new Date(login.expires_at);
              const isExpired = expiresAt < new Date();

              return (
                <div
                  key={login.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900">{login.user_email}</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[login.status]}`}>
                        {login.status.charAt(0).toUpperCase() + login.status.slice(1)}
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 space-y-1">
                      <p>Ruolo: <strong>{ROLES[login.user_role]}</strong></p>
                      <p>Generato da: {login.generated_by}</p>
                      <p>
                        Scade: {format(expiresAt, "d MMMM yyyy HH:mm", { locale: it })}
                        {isExpired && login.status === "active" && " (SCADUTO)"}
                      </p>
                      {login.first_login_at && (
                        <p className="text-emerald-600">Primo login: {format(new Date(login.first_login_at), "d MMMM yyyy HH:mm", { locale: it })}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {login.status === "active" && !login.used && (
                      <>
                        <button
                          onClick={() => setShowPassword({ ...showPassword, [login.id]: !showPassword[login.id] })}
                          className="p-2 hover:bg-slate-100 rounded text-slate-600"
                        >
                          {showPassword[login.id] ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>

                        {showPassword[login.id] && (
                          <button
                            onClick={() => copyToClipboard(login.plain_password)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                            title="Copia password"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleRevoke(login.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600"
                          title="Revoca"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {login.status === "used" && (
                      <Check className="w-5 h-5 text-emerald-600" />
                    )}

                    {login.status === "expired" && (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}