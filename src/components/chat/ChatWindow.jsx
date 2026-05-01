/**
 * Chat Window Component - simplified
 * Per Chat page existing
 */
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ChatWindow({ conversation, user, employee }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Carica messaggi
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await base44.entities.WorkMessage.filter(
          { conversation_id: conversation.id },
          '-sent_at',
          100
        );
        setMessages(msgs.reverse());
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe per nuovi messaggi
    const unsubscribe = base44.entities.WorkMessage.subscribe((event) => {
      if (event.data?.conversation_id === conversation.id) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
        }
      }
    });

    return unsubscribe;
  }, [conversation.id]);

  // Auto-scroll a fine
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await base44.entities.WorkMessage.create({
        conversation_id: conversation.id,
        sender_email: user.email,
        sender_name: user.full_name,
        company_id: user.company_id,
        content: newMessage,
        message_type: 'text',
        sent_at: new Date().toISOString()
      });

      setNewMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Caricamento...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="font-semibold text-slate-800">{conversation.title}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Nessun messaggio ancora</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_email === user.email;
            return (
              <div key={msg.id} className={cn('flex gap-2', isOwn && 'justify-end')}>
                <div
                  className={cn(
                    'max-w-sm rounded-lg px-4 py-2',
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      isOwn ? 'text-blue-100' : 'text-slate-500'
                    )}
                  >
                    {format(new Date(msg.sent_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-3 bg-slate-50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Scrivi un messaggio..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}