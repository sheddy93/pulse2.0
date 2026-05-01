import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { UserCog, UserPlus, Shield, Users, Briefcase, Settings } from "lucide-react";
import { COMPANY_SUB_ROLES, getRoleLabel } from "@/lib/roles";
import PermissionsEditor from "@/components/admin/PermissionsEditor";

const ROLE_ICONS = {
  company_admin: Shield,
  hr_manager: Users,
  manager: Briefcase,
  company_owner: UserCog,
};

export default function AdminsList() {
  const [user, setUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPermissions, setEditingPermissions] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me.company_id) {
        // Get all users of this company with admin roles
        const allUsers = await // TODO: Replace with service.User.list();
        const companyAdmins = allUsers.filter(u =>
          u.company_id === me.company_id &&
          ["company_owner", "company_admin", "hr_manager", "manager"].includes(u.role)
        );
        setAdmins(companyAdmins);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader color="blue" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Aziendali</h1>
            <p className="text-sm text-slate-500">{admins.length} amministratori</p>
          </div>
          {["company", "company_owner"].includes(user?.role) && (
            <Link to="/dashboard/company/admins/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              <UserPlus className="w-4 h-4" /> Aggiungi Admin
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {admins.length === 0 ? (
            <div className="py-16 text-center">
              <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-600">Nessun admin aziendale</p>
              <p className="text-sm text-slate-500 mt-1">Crea il primo admin per delegare la gestione</p>
              {["company", "company_owner"].includes(user?.role) && (
                <Link to="/dashboard/company/admins/new"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                  Crea Admin
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {admins.map(admin => {
                const Icon = ROLE_ICONS[admin.role] || UserCog;
                return (
                  <div key={admin.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{admin.full_name || "—"}</p>
                      <p className="text-sm text-slate-500">{admin.email}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                      {getRoleLabel(admin.role)}
                    </span>
                    {["company", "company_owner"].includes(user?.role) && (
                      <button
                        onClick={() => setEditingPermissions(admin)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Permessi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingPermissions && (
        <PermissionsEditor
          targetUser={editingPermissions}
          companyId={user?.company_id}
          grantedBy={user?.email}
          onClose={() => setEditingPermissions(null)}
        />
      )}
    </AppShell>
  );
}