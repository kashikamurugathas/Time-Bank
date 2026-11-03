import { execute, queryAll, queryOne, transaction } from '../db/index.ts';

export class MessagingService {
  // Get or create conversation between two users
  getOrCreateConversation(userAId: string, userBId: string, relatedBookingId?: string) {
    // Consistent ordering to satisfy UNIQUE(user1_id, user2_id)
    const [user1, user2] = [userAId, userBId].sort();

    let conv = queryOne<any>(
      `SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?`,
      [user1, user2]
    );

    if (!conv) {
      const convId = 'CONV_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      execute(
        `INSERT INTO conversations (id, user1_id, user2_id, related_booking_id) VALUES (?, ?, ?, ?)`,
        [convId, user1, user2, relatedBookingId || null]
      );
      conv = queryOne<any>('SELECT * FROM conversations WHERE id = ?', [convId]);
    }

    return conv;
  }

  async getUserConversations(userId: string) {
    const rows = queryAll<any>(
      `SELECT c.*,
              CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as partner_id,
              p.full_name as partner_name, p.profile_photo_url as partner_photo, p.city as partner_city,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_preview,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND recipient_id = ? AND is_read = 0) as unread_count
       FROM conversations c
       JOIN users u ON (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END) = u.id
       JOIN user_profiles p ON u.id = p.user_id
       WHERE c.user1_id = ? OR c.user2_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId, userId]
    );

    return rows;
  }

  async getMessages(conversationId: string, currentUserId: string) {
    const conv = queryOne<any>('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    if (!conv) throw new Error('Conversation not found.');

    if (conv.user1_id !== currentUserId && conv.user2_id !== currentUserId) {
      throw new Error('Unauthorized to view this conversation.');
    }

    const messages = queryAll<any>(
      `SELECT m.*, p.full_name as sender_name, p.profile_photo_url as sender_photo
       FROM messages m
       JOIN user_profiles p ON m.sender_id = p.user_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    // Auto mark as read for incoming messages
    execute(
      `UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND recipient_id = ? AND is_read = 0`,
      [conversationId, currentUserId]
    );

    return messages;
  }

  async sendMessage(senderId: string, recipientId: string, content: string, relatedBookingId?: string) {
    if (!content.trim()) throw new Error('Message content cannot be empty.');
    if (senderId === recipientId) throw new Error('Cannot send a message to yourself.');

    const conv = this.getOrCreateConversation(senderId, recipientId, relatedBookingId);
    const msgId = 'MSG_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    transaction(() => {
      execute(
        `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, is_read)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [msgId, conv.id, senderId, recipientId, content.trim()]
      );

      execute(
        `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [conv.id]
      );

      // In-app notification for recipient
      const sender = queryOne<any>('SELECT full_name FROM user_profiles WHERE user_id = ?', [senderId]);
      execute(
        `INSERT INTO notifications (id, user_id, title, content, type, link_url)
         VALUES (?, ?, 'New Message Received', ?, 'MESSAGE', ?)`,
        [
          'NOTIF_' + Date.now(),
          recipientId,
          `${sender?.full_name || 'A community member'}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
          `/messages?conv=${conv.id}`
        ]
      );
    });

    const savedMsg = queryOne<any>(
      `SELECT m.*, p.full_name as sender_name, p.profile_photo_url as sender_photo
       FROM messages m
       JOIN user_profiles p ON m.sender_id = p.user_id
       WHERE m.id = ?`,
      [msgId]
    );

    return {
      conversationId: conv.id,
      message: savedMsg
    };
  }

  async getUnreadCount(userId: string) {
    const res = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0`,
      [userId]
    );
    return res?.count || 0;
  }
}

export const messagingService = new MessagingService();
