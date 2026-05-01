import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { FileText, Check, CheckCheck, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS = {
  ferie: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  busta_paga: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  documenti: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  straordinario: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  permessi: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  performance: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  benefit: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
  altro: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
};

export default function MessageBubble({ message, isOwn, onDelete, currentUserEmail }) {
  const canDelete = isOwn && currentUserEmail === message.sender_email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3 mb-4', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-xs lg:max-w-md space-y-2', isOwn && 'order-2')}>
        {/* Category Badge */}
        {message.category && message.category !== 'altro' && (
          <div className="flex gap-2 items-center">
            <span className={cn('text-xs px-2 py-1 rounded-full border font-medium', CATEGORY_COLORS[message.category])}>
              {message.category.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            'px-4 py-3 rounded-xl break-words',
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-current border-opacity-20 pt-2">
              {message.attachments.map((att, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded bg-opacity-20',
                    isOwn ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs truncate font-medium', isOwn ? 'text-white' : 'text-slate-900 dark:text-white')}>
                      {att.file_name}
                    </p>
                    <p className={cn('text-xs opacity-75', isOwn ? 'text-white' : 'text-slate-700 dark:text-slate-400')}>
                      {(att.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <a
                    href={att.file_url}
                    download
                    className={cn('p-1 rounded hover:bg-opacity-30', isOwn ? 'hover:bg-white' : 'hover:bg-slate-300 dark:hover:bg-slate-600')}
                    title="Scarica allegato"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Time and Read Status */}
          <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-75">
            <span>{format(new Date(message.sent_at), 'HH:mm', { locale: it })}</span>
            {isOwn && (
              <>
                {message.read_at ? (
                  <CheckCheck className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </>
            )}
          </div>
        </div>

        {/* Delete Button */}
        {canDelete && (
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(message.id)}
              className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Trash2 className="w-3 h-3" /> Elimina
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}