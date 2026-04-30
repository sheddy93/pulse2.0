import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Paperclip, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function ChatWindow({ conversation, user, employee }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Polling per nuovi messaggi ogni 2 secondi
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversation?.id) return;
    const msgs = await base44.entities.WorkMessage.filter({
      conversation_id: conversation.id
    });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    await base44.entities.WorkMessage.create({
      conversation_id: conversation.id,
      company_id: conversation.company_id,
      sender_email: user.email,
      sender_name: user.full_name,
      sender_employee_id: employee?.id,
      content: newMessage,
      attachments: attachments.map(att => ({
        file_url: att.url,
        file_name: att.name,
        file_size: att.size,
        file_type: att.type
      })),
      sent_at: new Date().toISOString()
    });

    // Aggiorna last_message_at della conversazione
    await base44.entities.WorkConversation.update(conversation.id, {
      last_message_at: new Date().toISOString(),
      last_message_preview: newMessage.substring(0, 50)
    });

    setNewMessage("");
    setAttachments([]);
    await loadMessages();
    setSending(false);
  };

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      setAttachments(prev => [...prev, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }]);
    });
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-slate-400">Caricamento messaggi...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-800">{conversation.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {conversation.participants.length} partecipanti
        </p>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Nessun messaggio. Inizia la conversazione!
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender_email === user.email;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-2 rounded-lg ${
                    isOwn 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-1 mt-1">
                      {msg.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.file_url}
                          download={att.file_name}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            isOwn
                              ? 'bg-blue-500 text-blue-50 hover:bg-blue-700'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          📎 {att.file_name}
                        </a>
                      ))}
                    </div>
                  )}

                  <p className={`text-xs ${isOwn ? 'text-slate-400 text-right' : 'text-slate-500'}`}>
                    {!isOwn && `${msg.sender_name} • `}
                    {format(new Date(msg.sent_at || msg.created_date), 'HH:mm', { locale: it })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 space-y-3 bg-slate-50">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                📎 {att.name}
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />

          <label className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
            <Paperclip className="w-4 h-4" />
            <input type="file" multiple onChange={handleFileAttach} className="hidden" />
          </label>

          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && attachments.length === 0)}
            className="p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}