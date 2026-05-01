/**
 * API Management Page
 * Gestisci API keys e integrations
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContextDecoupled';
import { toast } from 'sonner';

const SCOPES = [
  { value: 'read:employees', label: 'Read Employees' },
  { value: 'write:employees', label: 'Create/Update Employees' },
  { value: 'read:leave', label: 'Read Leave Requests' },
  { value: 'write:leave', label: 'Create Leave Requests' },
  { value: 'read:attendance', label: 'Read Attendance' },
  { value: 'write:attendance', label: 'Log Attendance' },
  { value: 'read:payroll', label: 'Read Payroll' }
];

export default function APIManagement() {
  const { user } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newKeyModal, setNewKeyModal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scopes: []
  });

  useEffect(() => {
    loadKeys();
  }, [user?.company_id]);

  const loadKeys = async () => {
    try {
      if (!user?.company_id) return;
      const apiKeys = await base44.entities.APIKey.filter({
        company_id: user.company_id
      });
      setKeys(apiKeys);
    } catch (error) {
      toast.error('Error loading API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await base44.functions.invoke('generateApiKey', {
        name: formData.name,
        scopes: formData.scopes
      });
      
      setNewKeyModal(response.api_key);
      setShowForm(false);
      setFormData({ name: '', scopes: [] });
      
      // Refresh list
      setTimeout(loadKeys, 500);
    } catch (error) {
      toast.error('Error creating API key');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this API key?')) {
      try {
        await base44.entities.APIKey.delete(id);
        toast.success('API key deleted');
        loadKeys();
      } catch (error) {
        toast.error('Error deleting API key');
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) return <PageLoader />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">API Management</h1>
            <p className="text-sm text-slate-600 mt-1">Manage API keys for third-party integrations</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" /> New API Key
          </Button>
        </div>

        {/* New Key Modal */}
        {newKeyModal && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-emerald-900">API Key Created</h3>
                <p className="text-sm text-emerald-700 mt-1">Save this key securely. You won't see it again.</p>
              </div>
              <button onClick={() => setNewKeyModal(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
            </div>
            <div className="bg-white p-4 rounded font-mono text-sm break-all border border-emerald-200 flex items-center justify-between gap-2">
              <span>{newKeyModal}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(newKeyModal)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
            <Input
              placeholder="API Key Name (e.g., Slack Integration)"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Permissions</p>
              <div className="grid md:grid-cols-2 gap-3">
                {SCOPES.map(scope => (
                  <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.scopes.includes(scope.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, scopes: [...formData.scopes, scope.value]});
                        } else {
                          setFormData({...formData, scopes: formData.scopes.filter(s => s !== scope.value)});
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-blue-600">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {/* API Keys List */}
        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-600">No API keys yet</div>
          ) : (
            keys.map(key => (
              <div key={key.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{key.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {key.key_prefix}*** • {key.scopes.length} permissions • Created {new Date(key.created_date).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(key.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Documentation */}
        <div className="bg-slate-50 p-6 rounded-lg space-y-4">
          <h2 className="font-bold text-slate-900">API Documentation</h2>
          <div className="space-y-2 text-sm text-slate-700 font-mono">
            <p><strong>Base URL:</strong> https://your-app.com/api/v1</p>
            <p><strong>Auth:</strong> Authorization: Bearer {`{api_key}`}</p>
            <p className="mt-4"><strong>Example:</strong></p>
            <code className="block bg-white p-2 rounded border border-slate-200 mt-2">
              curl -H "Authorization: Bearer pk_live_xxx" \<br/>
              &nbsp;&nbsp;https://your-app.com/api/v1/employees
            </code>
          </div>
        </div>
      </div>
    </AppShell>
  );
}