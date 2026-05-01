import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { Mail, FileText, Download, Eye, Trash2, ChevronDown, AlertCircle, Flag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const MESSAGE_TYPE_ICONS = {
  task: "⚙️",
  announcement: "📢",
  document: "📄",
  notification: "🔔"
};

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-700",
  normal: "bg-slate-100 text-slate-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function InboxMessages() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);

      // Get employee profile
      const emps = // TODO: Replace with service.EmployeeProfile.filter({
        user_email: me.email
      });

      if (emps[0]) {
        setEmployeeProfile(emps[0]);

        // Get all messages for this company
        const allMessages = // TODO: Replace with service.CompanyMessage.filter({
          company_id: emps[0].company_id
        });

        // Filter messages that are for this employee
        const relevantMessages = allMessages.filter(msg => {
          if (msg.recipient_type === "all") return true;
          if (msg.recipient_type === "individual" && msg.recipient_employees?.includes(emps[0].id)) return true;
          if (msg.recipient_type === "department" && msg.recipient_department === emps[0].department) return true;
          return false;
        });

        setMessages(relevantMessages.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = async (msgId) => {
    if (!employeeProfile) return;

    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const alreadyRead = msg.read_by?.some(r => r.employee_id === employeeProfile.id);
    if (alreadyRead) return;

    try {
      const updatedReadBy = [
        ...(msg.read_by || []),
        { employee_id: employeeProfile.id, read_at: new Date().toISOString() }
      ];

      // TODO: Replace with service.CompanyMessage.update(msgId, {
        read_by: updatedReadBy
      });

      setMessages(messages.map(m =>
        m.id === msgId ? { ...m, read_by: updatedReadBy } : m
      ));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (msgId) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo messaggio?")) return;

    setDeleting(msgId);
    try {
      // TODO: Replace with service.CompanyMessage.delete(msgId);
      toast.success("Messaggio eliminato");
      setMessages(messages.filter(m => m.id !== msgId));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const isRead = (msg) => {
    if (!employeeProfile) return false;
    return msg.read_by?.some(r => r.employee_id === employeeProfile.id);
  };

  if (loading) return <PageLoader />;

  const unreadCount = messages.filter(m => !isRead(m)).length;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messaggi</h1>
            <p className="text-slate-600">
              {unreadCount > 0 ? (
                <>
                  Hai <strong>{unreadCount}</strong> messaggio{unreadCount > 1 ? "i" : ""} non lett{unreadCount > 1 ? "i" : "o"}
                </>
              ) : (
                "Nessun messaggio non letto"
              )}
            </p>
          </div>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="bg-slate-50 rounded-lg p-12 text-center">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Nessun messaggio al momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const msgIsRead = isRead(msg);
              return (
                <div
                  key={msg.id}
                  className={`rounded-lg border-2 transition-all overflow-hidden ${
                    msgIsRead ? "border-slate-200 bg-white" : "border-blue-300 bg-blue-50"
                  }`}
                >
                  <button
                    onClick={() => {
                      if (!msgIsRead) handleMarkAsRead(msg.id);
                      setExpandedId(expandedId === msg.id ? null : msg.id);
                    }}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">{MESSAGE_TYPE_ICONS[msg.message_type]}</span>
                        <h3 className={`font-semibold ${msgIsRead ? "text-slate-700" : "text-blue-900"}`}>
                          {msg.subject}
                        </h3>
                        {msg.priority !== "normal" && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[msg.priority]}`}>
                            {msg.priority}
                          </span>
                        )}
                        {!msgIsRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mb-2">
                        Da <strong>{msg.sender_name}</strong> • {format(new Date(msg.sent_at), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                      </p>

                      {msg.due_date && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Scadenza: {format(new Date(msg.due_date), "d MMMM yyyy", { locale: it })}
                        </div>
                      )}
                    </div>

                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === msg.id ? "rotate-180" : ""}`} />
                  </button>

                  {expandedId === msg.id && (
                    <div className="border-t p-4 bg-slate-50 space-y-4">
                      {/* Contenuto */}
                      <div className="prose prose-sm max-w-none">
                        <p className="text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Allegati */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                          <p className="font-semibold text-slate-900 text-sm">Allegati ({msg.attachments.length})</p>
                          <div className="space-y-2">
                            {msg.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                              >
                                <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600">
                                    {att.file_name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {(att.file_size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Azioni */}
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={() => handleDelete(msg.id)}
                          disabled={deleting === msg.id}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" /> Elimina
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}