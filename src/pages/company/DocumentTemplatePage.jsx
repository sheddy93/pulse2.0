/**
 * Document Template Management
 * Crea e gestisci template documenti
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContextDecoupled';
import { toast } from 'sonner';

export default function DocumentTemplatePage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    template_type: 'custom',
    html_content: '',
    signature_required: true,
    category: 'custom'
  });

  useEffect(() => {
    loadTemplates();
  }, [user?.company_id]);

  const loadTemplates = async () => {
    try {
      if (!user?.company_id) return;
      // TODO: Replace with service.DocumentTemplate.filter() call
      setTemplates([]);
    } catch (error) {
      toast.error('Errore caricamento template');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // TODO: Replace with service.DocumentTemplate.update() call
        toast.success('Template aggiornato');
      } else {
        // TODO: Replace with service.DocumentTemplate.create() call
        toast.success('Template creato');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        template_type: 'custom',
        html_content: '',
        signature_required: true,
        category: 'custom'
      });
      loadTemplates();
    } catch (error) {
      toast.error('Errore');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Elimina questo template?')) {
      try {
        // TODO: Replace with service.DocumentTemplate.delete() call
        toast.success('Template eliminato');
        loadTemplates();
      } catch (error) {
        toast.error('Errore eliminazione');
      }
    }
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Template Documenti</h1>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" /> Nuovo Template
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <Input
              placeholder="Nome template"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <textarea
              placeholder="Contenuto HTML (usa {{employee_name}}, {{job_title}}, ecc.)"
              value={formData.html_content}
              onChange={(e) => setFormData({...formData, html_content: e.target.value})}
              className="w-full h-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600">Salva</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
            </div>
          </form>
        )}

        <div className="grid gap-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{tmpl.name}</h3>
                <p className="text-sm text-slate-600">{tmpl.template_type}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(tmpl.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}