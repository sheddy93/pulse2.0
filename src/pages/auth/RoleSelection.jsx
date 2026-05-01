import { useState } from 'react';
import { authService } from '@/services/authService';
import { Building2, Briefcase, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const [loading, setLoading] = useState(false);

  const selectRole = async (role) => {
    setLoading(true);
    try {
      const publicId = role === "company" 
        ? `COMP-${Date.now().toString().slice(-6)}`
        : role === "consultant"
        ? `CONS-${Date.now().toString().slice(-6)}`
        : null;
      
      await authService.updateMe({ 
        role,
        ...(publicId && { public_id: publicId }),
      });
      
      const dashboardMap = {
        company: "/auth/register/company",
        consultant: "/auth/register/consultant",
        employee: "/dashboard/employee",
      };
      window.location.href = dashboardMap[role] || "/dashboard";
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-slate-900">Benvenuto in PulseHR</h1>
          <p className="text-xl text-slate-600">Seleziona il tipo di account per continuare</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Azienda */}
          <button
            onClick={() => selectRole("company")}
            disabled={loading}
            className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 text-left space-y-4 disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Azienda</h2>
              <p className="text-slate-600 mt-2">Gestisci dipendenti, presenze, documenti e performance della tua azienda</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
              Continua <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Consulente */}
          <button
            onClick={() => selectRole("consultant")}
            disabled={loading}
            className="group p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-violet-400 hover:shadow-xl transition-all duration-300 text-left space-y-4 disabled:opacity-50"
          >
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center group-hover:bg-violet-200 transition-colors">
              <Briefcase className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Consulente</h2>
              <p className="text-slate-600 mt-2">Connettiti con aziende client e fornisci consulenza specializzata</p>
            </div>
            <div className="flex items-center gap-2 text-violet-600 font-semibold group-hover:gap-3 transition-all">
              Continua <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center text-sm text-blue-800">
          <p>Puoi cambiare il tuo ruolo in qualsiasi momento dalle impostazioni account</p>
        </div>
      </div>
    </div>
  );
}