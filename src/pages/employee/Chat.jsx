import { useState, useEffect } from "react";
// Migration: removed base44 dependency
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import ChatWindow from "@/components/chat/ChatWindow";
import { Plus, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [newChatEmail, setNewChatEmail] = useState("");

  useEffect(() => {
    const init = async () => {
    const me = await authService.me();
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }

      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      const [convs, allEmps] = await Promise.all([
        base44.entities.WorkConversation.filter({
          company_id: me.company_id,
          $or: [
            { creator_email: me.email },
            { "participants.email": me.email }
          ]
        }),
        base44.entities.EmployeeProfile.filter({ company_id: me.company_id })
      ]);

      setConversations(convs.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)));
      setEmployees(allEmps);
      if (convs.length > 0) setSelectedConv(convs[0]);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatEmail || !employee) return;

    const targetEmp = employees.find(e => e.email === newChatEmail);
    if (!targetEmp) return;

    const conv = await base44.entities.WorkConversation.create({
      company_id: employee.company_id,
      title: `Chat con ${targetEmp.first_name} ${targetEmp.last_name}`,
      type: "one_on_one",
      creator_email: user.email,
      creator_name: user.full_name,
      participants: [
        { email: user.email, name: user.full_name, employee_id: employee.id },
        { email: targetEmp.email, name: `${targetEmp.first_name} ${targetEmp.last_name}`, employee_id: targetEmp.id }
      ]
    });

    const updated = await base44.entities.WorkConversation.filter({
      company_id: employee.company_id,
      $or: [
        { creator_email: user.email },
        { "participants.email": user.email }
      ]
    });

    setConversations(updated.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)));
    setSelectedConv(conv);
    setShowNewChat(false);
    setNewChatEmail("");
  };

  if (loading) return <PageLoader color="green" />;

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Chat Interna</h1>
          <button
            onClick={() => setShowNewChat(!showNewChat)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Nuova Chat
          </button>
        </div>

        {showNewChat && (
          <form onSubmit={handleCreateChat} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3">
            <select
              value={newChatEmail}
              onChange={e => setNewChatEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleziona un dipendente...</option>
              {employees
                .filter(e => e.email !== user.email)
                .map(e => (
                  <option key={e.id} value={e.email}>
                    {e.first_name} {e.last_name} ({e.job_title})
                  </option>
                ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
              Inizia Chat
            </button>
          </form>
        )}

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Lista Conversazioni */}
          <div className="w-72 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Conversazioni</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-slate-400 text-sm">Nessuna conversazione</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedConv?.id === conv.id ? 'bg-emerald-50 border-l-4 border-l-emerald-600' : ''
                    }`}
                  >
                    <h3 className="font-medium text-slate-800 text-sm truncate">{conv.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{conv.last_message_preview || 'Inizia conversazione...'}</p>
                    {conv.last_message_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(conv.last_message_at), 'd MMM HH:mm', { locale: it })}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 min-w-0">
            {selectedConv ? (
              <ChatWindow conversation={selectedConv} user={user} employee={employee} />
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-xl border border-slate-200 text-slate-400">
                Seleziona una conversazione per iniziare
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}