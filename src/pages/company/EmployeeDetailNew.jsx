/**
 * pages/company/EmployeeDetailNew.jsx
 * Dettaglio dipendente: view + edit
 * TODO MIGRATION: Supporta GET /api/employees/:id/
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { fetchEmployee, updateEmployeeData, deleteEmployeeData } from '@/services/employeeService';
import { ArrowLeft, Edit2, Trash2, Save, X } from 'lucide-react';

export default function EmployeeDetailNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me?.company_id) {
        window.location.href = '/';
        return;
      }
      setUser(me);

      try {
        const emp = await fetchEmployee(id);
        if (emp && emp.company_id === me.company_id) {
          setEmployee(emp);
          setFormData(emp);
        } else {
          navigate('/dashboard/company/employees');
        }
      } catch (err) {
        console.error('Error loading employee:', err);
        navigate('/dashboard/company/employees');
      }
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEmployeeData(id, formData);
      setEmployee(formData);
      setEditing(false);
      alert('Dipendente aggiornato');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Sei sicuro? Questa azione è irreversibile.')) return;
    try {
      await deleteEmployeeData(id);
      navigate('/dashboard/company/employees');
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Errore nella cancellazione');
    }
  };

  if (loading) return <PageLoader color="blue" />;
  if (!user || !employee) return null;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard/company/employees')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-slate-600 mt-1">{employee.job_title}</p>
          </div>
          {!editing && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifica
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Elimina
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        {!editing ? (
          <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200">
            <div className="p-6 grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <p className="text-slate-900 mt-1">{employee.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Telefono</label>
                <p className="text-slate-900 mt-1">{employee.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Data di assunzione</label>
                <p className="text-slate-900 mt-1">{new Date(employee.hire_date).toLocaleDateString('it-IT')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Tipo contratto</label>
                <p className="text-slate-900 mt-1">{employee.contract_type || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Ore settimanali</label>
                <p className="text-slate-900 mt-1">{employee.weekly_hours || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500">Stato</label>
                <p className="text-slate-900 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.employment_status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {employee.employment_status === 'active' ? 'Attivo' : 'Inattivo'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cognome</label>
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Telefono</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Qualifica</label>
                <input
                  type="text"
                  value={formData.job_title || ''}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data assunzione</label>
                <input
                  type="date"
                  value={formData.hire_date?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => {
                  setFormData(employee);
                  setEditing(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}