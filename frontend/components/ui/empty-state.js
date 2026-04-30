// components/ui/empty-state.js
'use client';

import Link from 'next/link';
import { Inbox, Users, FileText, Calendar, FolderOpen } from 'lucide-react';

const iconMap = {
  folder: FolderOpen,
  users: Users,
  document: FileText,
  calendar: Calendar,
  inbox: Inbox,
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionUrl,
  icon = 'folder',
  className = ''
}) {
  const IconComponent = iconMap[icon] || iconMap.folder;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in-50 ${className}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4 shadow-sm ring-1 ring-border">
        <IconComponent className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1.5 mb-6 max-w-sm">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {actionLabel && actionUrl ? (
        <Link
          href={actionUrl}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </Link>
      ) : actionLabel ? (
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

// Preset Empty States for common use cases
EmptyState.Employees = function EmployeesEmpty(props) {
  return (
    <EmptyState
      icon="users"
      title="Non hai ancora dipendenti"
      description="Aggiungi il primo dipendente per iniziare a gestire presenze e documenti."
      actionLabel="Aggiungi dipendente"
      actionUrl="/company/users/new"
      {...props}
    />
  );
};

EmptyState.Documents = function DocumentsEmpty(props) {
  return (
    <EmptyState
      icon="document"
      title="Nessun documento"
      description="Carica il primo documento per iniziare a gestire la documentazione HR."
      actionLabel="Carica documento"
      actionUrl="/company/documents"
      {...props}
    />
  );
};

EmptyState.Leave = function LeaveEmpty(props) {
  return (
    <EmptyState
      icon="calendar"
      title="Nessuna richiesta ferie"
      description="Qui vedrai le richieste di ferie e permessi dei tuoi dipendenti."
      {...props}
    />
  );
};

EmptyState.Inbox = function InboxEmpty(props) {
  return (
    <EmptyState
      icon="inbox"
      title="Nessun elemento"
      description="Non ci sono elementi da visualizzare."
      {...props}
    />
  );
};

export default EmptyState;