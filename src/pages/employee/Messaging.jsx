import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import PageLoader from '@/components/layout/PageLoader';
import ConversationList from '@/components/messaging/ConversationList';
import MessageBubble from '@/components/messaging/MessageBubble';
import MessageInput from '@/components/messaging/MessageInput';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { toast } from 'sonner';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Messaging() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('altro');
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (!me.company_id) { setLoading(false); return; }

      // Load conversations
      const convs = await base44.entities.Conversation.filter({
        company_id: me.company_id,
        $or: [
          { participant_1_email: me.email },
          { participant_2_email: me.email }
        ]
      });

      setConversations(convs.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)));
      if (convs.length > 0) setSelectedConvId(convs[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedConvId) return;

    const loadMessages = async () => {
      const msgs = await base44.entities.Message.filter({ conversation_id: selectedConvId });
      setMessages(msgs.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at)));

      // Mark as read
      const unreadMsgs = msgs.filter(m => !m.read_at && m.receiver_email === user.email);
      for (const msg of unreadMsgs) {
        await base44.entities.Message.update(msg.id, { read_at: new Date().toISOString() });
      }

      // Update conversation unread count
      const conv = conversations.find(c => c.id === selectedConvId);
      if (conv) {
        const unreadCountField = conv.participant_1_email === user.email ? 'unread_count_p1' : 'unread_count_p2';
        await base44.entities.Conversation.update(conv.id, { [unreadCountField]: 0 });
      }
    };

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === selectedConvId) {
        if (event.type === 'create') {
          setMessages(prev => [...prev, event.data]);
        }
      }
    });

    return unsubscribe;
  }, [selectedConvId, user?.email]);

  const handleSendMessage = async (messageData) => {
    if (!selectedConvId || !user) return;

    setSendingMessage(true);
    try {
      const conv = conversations.find(c => c.id === selectedConvId);
      const receiverEmail = conv.participant_1_email === user.email ? conv.participant_2_email : conv.participant_1_email;

      // Upload attachments if any
      let attachmentUrls = [];
      for (const file of (messageData.attachments || [])) {
        if (file instanceof File) {
          const uploaded = await base44.integrations.Core.UploadFile({ file });
          attachmentUrls.push({
            file_url: uploaded.file_url,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            uploaded_at: new Date().toISOString()
          });
        }
      }

      // Create message
      const newMessage = await base44.entities.Message.create({
        conversation_id: selectedConvId,
        sender_email: user.email,
        sender_name: user.full_name,
        receiver_email: receiverEmail,
        company_id: user.company_id,
        content: messageData.content,
        category: messageData.category,
        attachments: attachmentUrls,
        sent_at: new Date().toISOString(),
        read_receipts: [{
          user_email: user.email,
          user_name: user.full_name,
          status: 'sent'
        }]
      });

      // Update conversation
      await base44.entities.Conversation.update(selectedConvId, {
        last_message: messageData.content,
        last_message_at: new Date().toISOString(),
        last_message_category: messageData.category
      });

      setMessages(prev => [...prev, newMessage]);
      setSelectedAttachments([]);
      setSelectedCategory('altro');
      toast.success('Messaggio inviato');
    } catch (error) {
      toast.error('Errore invio: ' + error.message);
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Eliminare il messaggio?')) return;
    try {
      await base44.entities.Message.delete(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Messaggio eliminato');
    } catch (error) {
      toast.error('Errore: ' + error.message);
    }
  };

  const handlePinConversation = async (convId) => {
    const conv = conversations.find(c => c.id === convId);
    await base44.entities.Conversation.update(convId, { pinned: !conv?.pinned });
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, pinned: !c.pinned } : c));
  };

  const handleArchiveConversation = async (convId) => {
    await base44.entities.Conversation.update(convId, { status: 'archived' });
    setConversations(prev => prev.filter(c => c.id !== convId));
    setSelectedConvId(null);
  };

  if (loading) return <PageLoader color="green" />;

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const getOtherParticipant = (conv) => {
    return conv.participant_1_email === user.email
      ? { email: conv.participant_2_email, name: conv.participant_2_name, role: conv.participant_2_role }
      : { email: conv.participant_1_email, name: conv.participant_1_name, role: conv.participant_1_role };
  };

  return (
    <AppShell user={user}>
      <div className="h-[calc(100vh-140px)] flex">
        {/* Conversation List */}
        <div className={cn('w-full md:w-72 flex-shrink-0', isMobile && selectedConvId && 'hidden')}>
          <ConversationList
            conversations={conversations}
            selectedConvId={selectedConvId}
            onSelectConv={setSelectedConvId}
            currentUserEmail={user?.email}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onPin={handlePinConversation}
            onArchive={handleArchiveConversation}
            isLoading={loading}
          />
        </div>

        {/* Chat Area */}
        {selectedConv && (
          <div className={cn('flex-1 flex flex-col bg-white dark:bg-slate-900', isMobile ? 'w-full' : 'border-l border-slate-200 dark:border-slate-700')}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              {isMobile && (
                <button onClick={() => setSelectedConvId(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1">
                <h2 className="font-bold text-slate-900 dark:text-white">{getOtherParticipant(selectedConv).name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{getOtherParticipant(selectedConv).role}</p>
              </div>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-500 dark:text-slate-400">Nessun messaggio. Inizia una conversazione!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_email === user.email}
                    onDelete={handleDeleteMessage}
                    currentUserEmail={user.email}
                  />
                ))
              )}
            </div>

            {/* Input */}
            <MessageInput
              onSend={handleSendMessage}
              isLoading={sendingMessage}
              onAttachmentChange={setSelectedAttachments}
              selectedAttachments={selectedAttachments}
              onCategoryChange={setSelectedCategory}
              selectedCategory={selectedCategory}
            />
          </div>
        )}

        {/* Empty State */}
        {!selectedConv && (
          <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 hidden md:flex">
            <p>Seleziona una conversazione per iniziare</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}