import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pin, Search, Plus, Archive, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CATEGORY_ICONS = {
  ferie: '📅',
  busta_paga: '💰',
  documenti: '📄',
  straordinario: '⏰',
  permessi: '🗓️',
  performance: '📊',
  benefit: '🎁',
  altro: '💬'
};

export default function ConversationList({
  conversations = [],
  selectedConvId,
  onSelectConv,
  currentUserEmail,
  searchQuery,
  onSearchChange,
  onPin,
  onArchive,
  isLoading = false
}) {
  const getUnreadCount = (conv) => {
    return conv.participant_1_email === currentUserEmail ? conv.unread_count_p1 : conv.unread_count_p2;
  };

  const getOtherParticipant = (conv) => {
    return conv.participant_1_email === currentUserEmail
      ? { email: conv.participant_2_email, name: conv.participant_2_name }
      : { email: conv.participant_1_email, name: conv.participant_1_name };
  };

  const filteredConversations = conversations.filter(conv =>
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getOtherParticipant(conv).name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConvs = filteredConversations.filter(c => c.pinned);
  const regularConvs = filteredConversations.filter(c => !c.pinned);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Messaggi</h2>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca conversazioni..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="w-6 h-6 border-3 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">Nessuna conversazione</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Pinned */}
            {pinnedConvs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1.5 uppercase">Fissati</p>
                {pinnedConvs.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedConvId === conv.id}
                    onSelect={() => onSelectConv(conv.id)}
                    getUnreadCount={getUnreadCount}
                    getOtherParticipant={getOtherParticipant}
                    onPin={onPin}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            )}

            {/* Regular */}
            {regularConvs.length > 0 && (
              <div>
                {pinnedConvs.length > 0 && (
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1.5 uppercase">Tutti</p>
                )}
                {regularConvs.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isSelected={selectedConvId === conv.id}
                    onSelect={() => onSelectConv(conv.id)}
                    getUnreadCount={getUnreadCount}
                    getOtherParticipant={getOtherParticipant}
                    onPin={onPin}
                    onArchive={onArchive}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  isSelected,
  onSelect,
  getUnreadCount,
  getOtherParticipant,
  onPin,
  onArchive
}) {
  const other = getOtherParticipant(conv);
  const unreadCount = getUnreadCount(conv);
  const categoryIcon = CATEGORY_ICONS[conv.category] || '💬';

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-2 py-2 rounded-lg transition-colors relative group',
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/30'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
          'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
        )}>
          {other.name?.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <p className={cn('text-sm font-semibold truncate', isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-white')}>
              {other.name}
            </p>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className={cn('text-xs truncate', isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-slate-500 dark:text-slate-400')}>
            {categoryIcon} {conv.last_message || 'Nessun messaggio'}
          </p>
          {conv.last_message_at && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {format(new Date(conv.last_message_at), 'd MMM HH:mm', { locale: it })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="hidden group-hover:flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin(conv.id);
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(conv.id);
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.button>
  );
}