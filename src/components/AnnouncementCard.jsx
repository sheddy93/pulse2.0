import React, { memo } from 'react';
import { Pin, Trash2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * AnnouncementCard - Memoized for performance
 * Renders single announcement card without re-rendering siblings
 */
const AnnouncementCard = memo(({ announcement, onDelete, onPin, user }) => {
  const isAuthor = announcement.author_email === user?.email;
  const isPinned = announcement.is_pinned;
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  const priorityColors = {
    1: 'border-l-slate-300',
    2: 'border-l-blue-300',
    3: 'border-l-yellow-300',
    4: 'border-l-orange-300',
    5: 'border-l-red-400'
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 border-l-4 ${priorityColors[announcement.priority] || priorityColors[3]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 text-lg">{announcement.title}</h3>
            {isPinned && <Pin className="w-4 h-4 text-orange-500" />}
          </div>
          <p className="text-xs text-slate-500">
            {announcement.author_name} • {formatDistanceToNow(new Date(announcement.published_at), { locale: it, addSuffix: true })}
          </p>
        </div>
        {isAuthor && (
          <div className="flex gap-2">
            <button
              onClick={() => onPin(announcement)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'text-orange-500' : 'text-slate-400'}`} />
            </button>
            <button
              onClick={() => onDelete(announcement)}
              className="p-1 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-700 mb-3 leading-relaxed">{announcement.content}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            announcement.visibility === 'all' ? 'bg-blue-100 text-blue-700' :
            announcement.visibility === 'managers' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {announcement.visibility === 'all' ? '👥 Tutti' :
             announcement.visibility === 'managers' ? '👔 Manager' :
             announcement.visibility === 'admins' ? '🔐 Admin' :
             '👤 Dipendenti'}
          </span>
        </div>
        {isExpired && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            Scaduta
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.announcement.id === nextProps.announcement.id &&
         prevProps.user?.email === nextProps.user?.email;
});

AnnouncementCard.displayName = 'AnnouncementCard';

export default AnnouncementCard;