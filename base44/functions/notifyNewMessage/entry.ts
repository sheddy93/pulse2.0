import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { messageId, conversationId, receiverEmail, senderName, category } = await req.json();

    if (!messageId || !receiverEmail || !senderName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Recupera l'utente ricevente
    const users = await base44.entities.User.filter({ email: receiverEmail });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const categoryLabel = category?.replace('_', ' ').toUpperCase() || 'GENERICO';

    // Crea notifica
    await base44.entities.Notification.create({
      user_email: receiverEmail,
      type: 'message',
      title: `Nuovo messaggio da ${senderName}`,
      content: `${senderName} ti ha inviato un messaggio (${categoryLabel})`,
      related_entity: 'Message',
      related_id: messageId,
      is_read: false,
      created_at: new Date().toISOString()
    });

    // Invia email di notifica
    await base44.integrations.Core.SendEmail({
      to: receiverEmail,
      subject: `💬 Nuovo messaggio da ${senderName}`,
      body: `
        <h2>Hai un nuovo messaggio</h2>
        <p><strong>Da:</strong> ${senderName}</p>
        <p><strong>Categoria:</strong> ${categoryLabel}</p>
        <p><a href="https://pulseHr.app/dashboard/employee/messaging" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Leggi il messaggio</a></p>
      `
    });

    return Response.json({ success: true, notification_sent: true });
  } catch (error) {
    console.error('Error notifying message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});