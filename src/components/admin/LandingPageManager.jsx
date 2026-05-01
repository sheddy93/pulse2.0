import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Trash2, Edit2, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function LandingPageManager() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    section: 'hero',
    hero_title: '',
    hero_subtitle: '',
    hero_cta_text: '',
    hero_image: '',
  });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await base44.entities.LandingPageContent.filter({ section: 'hero' });
      if (data?.length > 0) {
        setContent(data[0]);
        setForm(data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading content:', err);
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, hero_image: file_url }));
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (content?.id) {
        await base44.entities.LandingPageContent.update(content.id, form);
      } else {
        await base44.entities.LandingPageContent.create(form);
      }
      setEditing(null);
      await loadContent();
    } catch (err) {
      console.error('Error saving:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Caricamento...</div>;

  return (
    <div className="space-y-6">
      {/* Hero Section Editor */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Sezione Hero</h3>
          <button
            onClick={() => setEditing(editing === 'hero' ? null : 'hero')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> {editing === 'hero' ? 'Chiudi' : 'Modifica'}
          </button>
        </div>

        {editing === 'hero' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titolo</label>
              <input
                type="text"
                value={form.hero_title || ''}
                onChange={(e) => setForm(f => ({ ...f, hero_title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Titolo hero"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sottotitolo</label>
              <input
                type="text"
                value={form.hero_subtitle || ''}
                onChange={(e) => setForm(f => ({ ...f, hero_subtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sottotitolo hero"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Testo CTA</label>
              <input
                type="text"
                value={form.hero_cta_text || ''}
                onChange={(e) => setForm(f => ({ ...f, hero_cta_text: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Testo bottone CTA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Immagine Hero</label>
              <div className="flex gap-3">
                <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="text-center">
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                        <p className="text-xs text-slate-500">Upload in corso...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                        <p className="text-xs text-slate-600">Carica immagine</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
              {form.hero_image && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg flex gap-3 items-center">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600 flex-1 truncate">{form.hero_image}</span>
                  <button
                    onClick={() => setForm(f => ({ ...f, hero_image: '' }))}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Salva modifiche
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Titolo</p>
              <p className="text-slate-900 font-medium">{form.hero_title || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Sottotitolo</p>
              <p className="text-slate-700">{form.hero_subtitle || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">CTA</p>
              <p className="text-slate-700">{form.hero_cta_text || '—'}</p>
            </div>
            {form.hero_image && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Immagine</p>
                <img src={form.hero_image} alt="Hero" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Gallery */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Gestisci Immagini</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {form.hero_image && (
            <div className="relative group">
              <img src={form.hero_image} alt="Hero" className="w-full h-32 object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="text-center">
              <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-600">Aggiungi immagine</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}