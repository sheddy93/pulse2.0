import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, X, Send, Minimize2, Maximize2, Bot, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const QUICK_ACTIONS = [
  { label: "Ferie pendenti", prompt: "Mostrami le richieste di ferie in attesa di approvazione" },
  { label: "Scadenze doc.", prompt: "Ci sono documenti in scadenza nei prossimi 30 giorni?" },
  { label: "Straordinari", prompt: "Dammi un riepilogo degli straordinari del mese corrente" },
  { label: "Consigli HR", prompt: "Quali azioni HR dovrei prioritizzare questa settimana?" },
];

export default function HRAssistantWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const isAllowed = user && ["company", "consultant", "super_admin"].includes(user.role);

  useEffect(() => {
    if (isAllowed && open && !conversation) {
      initConversation();
    }
  }, [open, isAllowed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAllowed) return null;

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "hr_assistant",
        metadata: { name: `Sessione HR - ${user.full_name || user.email}` }
      });
      setConversation(conv);

      // Subscribe to real-time updates
      base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages([...data.messages]);
        setSending(false);
      });

      // Welcome message
      await base44.agents.addMessage(conv, {
        role: "user",
        content: `Ciao! Sono ${user.full_name || user.email}, ruolo: ${user.role}. Fammi una breve presentazione di cosa puoi fare per me.`
      });
    } catch (e) {
      console.error("Errore init assistente:", e);
    }
  };

  const sendMessage = async (text) => {
    if (!text?.trim() || !conversation || sending) return;
    setSending(true);
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: text });
  };

  const handleOpen = () => {
    setOpen(true);
    setHasUnread(false);
    setMinimized(false);
  };

  const visibleMessages = messages.filter(m => m.role !== "system" && m.content);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full shadow-xl hover:scale-110 transition-all flex items-center justify-center group"
          title="Assistente HR"
        >
          <Bot className="w-6 h-6" />
          {hasUnread && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
          <span className="absolute right-16 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">
            Assistente HR
          </span>
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className={cn(
          "fixed right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-200",
          minimized ? "bottom-6 w-72 h-14" : "bottom-6 w-96 h-[560px]"
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl text-white flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Assistente HR</p>
              {!minimized && <p className="text-xs text-blue-200">Powered by AI · PulseHR</p>}
            </div>
            <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {visibleMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Ciao! Sono il tuo Assistente HR</p>
                      <p className="text-xs text-slate-400 mt-1">Inizializzazione in corso...</p>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {visibleMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    )}>
                      {msg.role === "user" ? (
                        <p className="leading-relaxed">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="prose prose-sm max-w-none prose-slate [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions */}
              {visibleMessages.length > 0 && visibleMessages.length < 3 && (
                <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
                  {QUICK_ACTIONS.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qa.prompt)}
                      disabled={sending}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex-shrink-0">
                <div className="flex gap-2 items-end bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                    placeholder="Chiedi qualcosa all'assistente HR..."
                    rows={1}
                    disabled={sending || !conversation}
                    className="flex-1 bg-transparent text-sm resize-none focus:outline-none text-slate-700 placeholder-slate-400 max-h-20"
                    style={{ minHeight: "24px" }}
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || sending || !conversation}
                    className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}