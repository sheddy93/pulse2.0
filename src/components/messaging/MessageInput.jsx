import React, { useState } from 'react';
import { Send, Paperclip, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'ferie', label: '📅 Ferie' },
  { value: 'busta_paga', label: '💰 Busta Paga' },
  { value: 'documenti', label: '📄 Documenti' },
  { value: 'straordinario', label: '⏰ Straordinario' },
  { value: 'permessi', label: '🗓️ Permessi' },
  { value: 'performance', label: '📊 Performance' },
  { value: 'benefit', label: '🎁 Benefit' },
  { value: 'altro', label: '💬 Altro' }
];

export default function MessageInput({
  onSend,
  isLoading,
  onAttachmentChange,
  selectedAttachments = [],
  onCategoryChange,
  selectedCategory = 'altro',
  placeholder = 'Scrivi un messaggio...'
}) {
  const [content, setContent] = useState('');
  const [showAttachmentHelp, setShowAttachmentHelp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && selectedAttachments.length === 0) return;

    onSend({
      content: content.trim(),
      category: selectedCategory,
      attachments: selectedAttachments
    });

    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Category Selector */}
      <div className="flex gap-2 items-center overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            type="button"
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all',
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Attachments Preview */}
      {selectedAttachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          {selectedAttachments.map((file, i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
              <span className="text-xs truncate font-medium text-slate-700 dark:text-slate-300">{file.name}</span>
              <button
                type="button"
                onClick={() => onAttachmentChange(selectedAttachments.filter((_, idx) => idx !== i))}
                className="text-red-600 hover:text-red-700 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors">
              <Paperclip className="w-4 h-4" />
              Allega file
              <input
                type="file"
                multiple
                onChange={(e) => onAttachmentChange([...selectedAttachments, ...Array.from(e.target.files || [])])}
                className="hidden"
                accept="*"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || (!content.trim() && selectedAttachments.length === 0)}
          className={cn(
            'p-2 rounded-lg transition-colors flex-shrink-0',
            isLoading || (!content.trim() && selectedAttachments.length === 0)
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
          title="Invia messaggio"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Dimensione massima file: 10 MB • Supporta: PDF, immagini, documenti
      </p>
    </form>
  );
}