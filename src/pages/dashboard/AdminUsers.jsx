import { useState, useEffect } from "react";
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Users, Search, Shield, Briefcase, Building2, User } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const ROLE_BADGE = {
  super_admin: { label: "Super Admin", cls: "bg-red-100 text-red-700", icon: Shield },
  consultant: { label: "Consulente", cls: "bg-violet-100 text-violet-700", icon: Briefcase },
  company: { label: "Azienda", cls: "bg-blue-100 text-blue-700", icon: Building2 },
  employee: { label: "Dipendente", cls: "bg-emerald-100 text-emerald-700", icon: User },
};

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    authService.me().then(async (me) => {
      if (me?.role !== "super_admin") { window.location.href = "/"; return; }
      setUser(me);
      const allUsers = await // TODO: Replace with service.User.list();
      setUsers(allUsers);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <PageLoader color="red" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestione Utenti</h1>
          <p className="text-sm text-slate-500">{users.length} utenti registrati sulla piattaforma</p>
        </div>

        {/* Stats per ruolo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(ROLE_BADGE).map(([role, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={role} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.cls}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{roleCounts[role] || 0}</p>
                  <p className="text-xs text-slate-500">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per nome o email..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti i ruoli</option>
            <option value="super_admin">Super Admin</option>
            <option value="consultant">Consulenti</option>
            <option value="company">Aziende</option>
            <option value="employee">Dipendenti</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Utente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Ruolo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Registrazione</th>
                   <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => {
                  const badge = ROLE_BADGE[u.role] || ROLE_BADGE.employee;
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-sm text-slate-600">
                            {(u.full_name || u.email || "U")[0].toUpperCase()}
                          </div>
                          <p className="font-medium text-slate-800">{u.full_name || "—"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {u.created_date ? format(new Date(u.created_date), "d MMM yyyy", { locale: it }) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {u.is_active !== false ? "Attivo" : "Inattivo"}
                        </span>
                      </td>
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nessun utente trovato</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}