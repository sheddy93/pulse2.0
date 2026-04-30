"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  User,
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Send,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * ApprovalWorkflow - Multi-step approval system
 * Handles leave requests, document approvals, expense reports
 */

// Approval statuses
const APPROVAL_STATUS = {
  PENDING: { id: "pending", label: "In attesa", color: "warning", icon: Clock },
  APPROVED: { id: "approved", label: "Approvato", color: "success", icon: CheckCircle2 },
  REJECTED: { id: "rejected", label: "Rifiutato", color: "danger", icon: XCircle },
  REVISION: { id: "revision", label: "In revisione", color: "info", icon: RefreshCw },
};

// Approval types
const APPROVAL_TYPES = {
  LEAVE: {
    id: "leave",
    label: "Richiesta Ferie",
    icon: Calendar,
    color: "accent",
  },
  OVERTIME: {
    id: "overtime",
    label: "Straordinario",
    icon: Clock,
    color: "warning",
  },
  DOCUMENT: {
    id: "document",
    label: "Documento",
    icon: FileText,
    color: "primary",
  },
  EXPENSE: {
    id: "expense",
    label: "Nota spese",
    icon: Building2,
    color: "info",
  },
};

// Mock approval requests
const MOCK_APPROVALS = [
  {
    id: "apr_1",
    type: "leave",
    title: "Ferie Pasquali",
    requester: {
      name: "Marco Bianchi",
      avatar: "MB",
      department: "Vendite",
    },
    details: {
      startDate: "20/04/2026",
      endDate: "25/04/2026",
      days: 5,
      reason: "Vacanza familiare",
    },
    status: "pending",
    priority: "high",
    createdAt: "22/04/2026 09:30",
    approvers: [
      { name: "Laura Rossi", role: "HR Manager", status: "approved", date: "22/04" },
      { name: "Giuseppe Verdi", role: "Direttore", status: "pending" },
    ],
    comments: [],
  },
  {
    id: "apr_2",
    type: "overtime",
    title: "Straordinario progetto Alpha",
    requester: {
      name: "Laura Rossi",
      avatar: "LR",
      department: "IT",
    },
    details: {
      hours: 8,
      date: "24/04/2026",
      reason: "Urgente consegna progetto",
    },
    status: "pending",
    priority: "medium",
    createdAt: "23/04/2026 14:00",
    approvers: [
      { name: "Giuseppe Verdi", role: "Direttore", status: "pending" },
    ],
    comments: [],
  },
  {
    id: "apr_3",
    type: "document",
    title: "Aggiornamento Policy Aziendale",
    requester: {
      name: "HR Department",
      avatar: "HR",
      department: "Risorse Umane",
    },
    details: {
      version: "2.1",
      changes: "Aggiornamento policy remote working",
    },
    status: "revision",
    priority: "high",
    createdAt: "20/04/2026 10:00",
    approvers: [
      { name: "Avvocato", role: "Legale", status: "approved", date: "21/04" },
      { name: "CEO", role: "Amministratore", status: "revision" },
    ],
    comments: [
      { author: "Avvocato", text: "Approvato con modifiche minori", date: "21/04" }
    ],
  },
];

/**
 * Approval flow step (single approver)
 */
function ApprovalStep({ approver, isFirst, isLast }) {
  const StatusIcon = APPROVAL_STATUS[approver.status?.toUpperCase()]?.icon || Clock;
  const colorClass = {
    approved: "text-success bg-success/10 border-success/30",
    rejected: "text-danger bg-danger/10 border-danger/30",
    pending: "text-warning bg-warning/10 border-warning/30",
    revision: "text-info bg-info/10 border-info/30",
  }[approver.status] || "text-muted bg-bg-muted border-border";

  return (
    <div className="flex items-start gap-3">
      {/* Connector line */}
      {!isFirst && (
        <div className="absolute left-5 top-0 w-0.5 h-3 -mt-3 bg-border" />
      )}
      
      {/* Avatar with status */}
      <div className={cn(
        "relative w-10 h-10 rounded-full flex items-center justify-center border-2 z-10",
        colorClass
      )}>
        <User className="w-5 h-5" />
        
        {/* Status indicator */}
        <div className={cn(
          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface",
          approver.status === "approved" && "bg-success text-white",
          approver.status === "rejected" && "bg-danger text-white",
          approver.status === "pending" && "bg-warning text-white",
          approver.status === "revision" && "bg-info text-white",
          !approver.status && "bg-border text-muted"
        )}>
          <StatusIcon className="w-3 h-3" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{approver.name}</p>
            <p className="text-xs text-muted">{approver.role}</p>
          </div>
          {approver.date && (
            <span className="text-xs text-muted">{approver.date}</span>
          )}
        </div>
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <ArrowRight className="w-4 h-4 text-border mt-3" />
      )}
    </div>
  );
}

/**
 * Approval request card
 */
function ApprovalCard({ approval, onApprove, onReject, onComment, onDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");

  const typeConfig = APPROVAL_TYPES[approval.type] || APPROVAL_TYPES.DOCUMENT;
  const statusConfig = APPROVAL_STATUS[approval.status.toUpperCase()] || APPROVAL_STATUS.PENDING;
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  const priorityColors = {
    high: "text-danger bg-danger/10",
    medium: "text-warning bg-warning/10",
    low: "text-muted bg-bg-muted",
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      onComment?.(approval.id, comment);
      setComment("");
      setShowCommentInput(false);
    }
  };

  return (
    <Card className={cn(
      "border transition-all duration-200",
      approval.status === "pending" && "border-warning/30 bg-warning/5",
      approval.status === "approved" && "border-success/30 bg-success/5",
      approval.status === "rejected" && "border-danger/30 bg-danger/5",
      approval.status === "revision" && "border-info/30 bg-info/5",
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              `bg-${typeConfig.color}/10`
            )}>
              <TypeIcon className={cn("w-6 h-6", `text-${typeConfig.color}`)} />
            </div>

            <div>
              <CardTitle className="text-base">{approval.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {/* Requester */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {approval.requester.avatar}
                  </div>
                  <span className="text-xs text-muted">{approval.requester.name}</span>
                </div>
                <span className="text-xs text-border">•</span>
                <span className="text-xs text-muted">{approval.requester.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority */}
            <span className={cn(
              "text-[10px] font-medium px-2 py-1 rounded-full capitalize",
              priorityColors[approval.priority]
            )}>
              {approval.priority}
            </span>

            {/* Status */}
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1",
              statusConfig.id === "pending" && "bg-warning/10 text-warning",
              statusConfig.id === "approved" && "bg-success/10 text-success",
              statusConfig.id === "rejected" && "bg-danger/10 text-danger",
              statusConfig.id === "revision" && "bg-info/10 text-info"
            )}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Details summary */}
        <div className="flex items-center gap-4 text-sm text-muted mb-4">
          {approval.details.startDate && (
            <>
              <span>{approval.details.startDate} - {approval.details.endDate}</span>
              <span className="text-xs bg-bg-muted px-2 py-0.5 rounded">
                {approval.details.days} giorni
              </span>
            </>
          )}
          {approval.details.hours && (
            <span>{approval.details.hours} ore - {approval.details.date}</span>
          )}
          {approval.details.version && (
            <span>Versione {approval.details.version}</span>
          )}
          <span className="text-xs ml-auto">{approval.createdAt}</span>
        </div>

        {/* Expandable sections */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors mb-3"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {isExpanded ? "Nascondi" : "Mostra"} dettagli
        </button>

        {isExpanded && (
          <div className="space-y-4 mb-4">
            {/* Approval flow */}
            <div>
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Flusso di approvazione
              </h4>
              <div className="space-y-2">
                {approval.approvers.map((approver, index) => (
                  <ApprovalStep
                    key={index}
                    approver={approver}
                    isFirst={index === 0}
                    isLast={index === approval.approvers.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Comments */}
            {approval.comments.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Commenti
                </h4>
                <div className="space-y-2">
                  {approval.comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-bg-muted rounded-lg">
                      <User className="w-4 h-4 text-muted mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{c.author}</span>
                          <span className="text-[10px] text-muted">{c.date}</span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comment input */}
            {showCommentInput ? (
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Aggiungi un commento..."
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                />
                <button
                  onClick={handleSubmitComment}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Action buttons */}
        {approval.status === "pending" && (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <button
              onClick={() => onApprove?.(approval.id)}
              className="flex-1 px-4 py-2.5 bg-success/10 text-success hover:bg-success/20 rounded-lg inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approva
            </button>
            <button
              onClick={() => onReject?.(approval.id)}
              className="flex-1 px-4 py-2.5 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg inline-flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Rifiuta
            </button>
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent inline-flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        )}

        {approval.status === "revision" && (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <button
              onClick={() => onApprove?.(approval.id)}
              className="flex-1 px-4 py-2.5 bg-success/10 text-success hover:bg-success/20 rounded-lg inline-flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approva revisione
            </button>
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="px-4 py-2.5 border border-border text-foreground rounded-lg hover:bg-accent inline-flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Approval request list with filters
 */
export function ApprovalWorkflowList({ 
  approvals = MOCK_APPROVALS,
  onApprove,
  onReject,
  onComment,
  onDetails,
  className 
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filters = [
    { id: "all", label: "Tutti" },
    { id: "pending", label: "In attesa" },
    { id: "approved", label: "Approvati" },
    { id: "rejected", label: "Rifiutati" },
  ];

  const typeFilters = [
    { id: "all", label: "Tutti i tipi" },
    { id: "leave", label: "Ferie" },
    { id: "overtime", label: "Straordinari" },
    { id: "document", label: "Documenti" },
  ];

  const filteredApprovals = approvals.filter(a => {
    const statusMatch = activeFilter === "all" || a.status === activeFilter;
    const typeMatch = typeFilter === "all" || a.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const pendingCount = approvals.filter(a => a.status === "pending").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <div className="flex items-center gap-1 bg-bg-muted p-1 rounded-lg">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  activeFilter === filter.id
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                {filter.label}
                {filter.id === "pending" && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-warning/10 text-warning rounded text-[10px]">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-background border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-auto"
        >
          {typeFilters.map(filter => (
            <option key={filter.id} value={filter.id}>{filter.label}</option>
          ))}
        </select>
      </div>

      {/* Approval cards */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12 bg-bg-muted/30 rounded-xl border border-border">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted">Nessuna richiesta da visualizzare</p>
          </div>
        ) : (
          filteredApprovals.map(approval => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={onApprove}
              onReject={onReject}
              onComment={onComment}
              onDetails={onDetails}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Approval statistics widget
 */
export function ApprovalStats({ approvals = MOCK_APPROVALS, className }) {
  const stats = {
    pending: approvals.filter(a => a.status === "pending").length,
    approved: approvals.filter(a => a.status === "approved").length,
    rejected: approvals.filter(a => a.status === "rejected").length,
    thisWeek: approvals.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.createdAt) > weekAgo;
    }).length,
  };

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", className)}>
      <div className="bg-card border border-border rounded-xl shadow-soft p-4 text-center">
        <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
        <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
        <p className="text-xs text-muted">In attesa</p>
      </div>
      <div className="bg-card border border-border rounded-xl shadow-soft p-4 text-center">
        <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
        <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
        <p className="text-xs text-muted">Approvati</p>
      </div>
      <div className="bg-card border border-border rounded-xl shadow-soft p-4 text-center">
        <XCircle className="w-5 h-5 text-danger mx-auto mb-2" />
        <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
        <p className="text-xs text-muted">Rifiutati</p>
      </div>
      <div className="bg-card border border-border rounded-xl shadow-soft p-4 text-center">
        <RefreshCw className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
        <p className="text-xs text-muted">Questa settimana</p>
      </div>
    </div>
  );
}

export default ApprovalWorkflow;
