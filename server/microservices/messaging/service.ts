import { messagesDb } from './db.ts';
import { eventBus } from '../common/event-bus.ts';
import { createLogger } from '../common/logger.ts';
import { usersDb } from '../users/db.ts';
import { getIO } from '../../socket.ts';

const logger = createLogger('messaging-service');

export class MessagingService {
  async getOrCreateConversation(userA: string, userB: string, relatedBookingId?: string) {
    const [u1, u2] = [userA, userB].sort();
    let conv = messagesDb.queryOne<any>(
      'SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?',
      [u1, u2]
    );

    if (!conv) {
      const id = `CONV_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      messagesDb.execute(
        `INSERT INTO conversations (id, user1_id, user2_id, related_booking_id)
         VALUES (?, ?, ?, ?)`,
        [id, u1, u2, relatedBookingId || null]
      );
      conv = messagesDb.queryOne<any>('SELECT * FROM conversations WHERE id = ?', [id]);
    }

    return conv;
  }

  async getUserConversations(userId: string) {
    const convs = messagesDb.queryAll<any>(
      `SELECT * FROM conversations
       WHERE user1_id = ? OR user2_id = ?
       ORDER BY last_message_at DESC`,
      [userId, userId]
    );

    return convs.map(c => {
      const otherUserId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const otherProfile = usersDb.queryOne<any>('SELECT full_name, profile_photo_url, city, district FROM user_profiles WHERE user_id = ?', [otherUserId]);
      const lastMsg = messagesDb.queryOne<any>(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1',
        [c.id]
      );
      const unreadCount = messagesDb.queryOne<any>(
        'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ? AND recipient_id = ? AND is_read = 0',
        [c.id, userId]
      )?.count || 0;

      return {
        id: c.id,
        otherUser: {
          id: otherUserId,
          fullName: otherProfile?.full_name || 'Member',
          profilePhotoUrl: otherProfile?.profile_photo_url || null,
          location: `${otherProfile?.city || ''}, ${otherProfile?.district || ''}`,
        },
        lastMessage: lastMsg ? {
          content: lastMsg.content,
          createdAt: lastMsg.created_at,
          isMine: lastMsg.sender_id === userId,
        } : null,
        unreadCount,
        lastMessageAt: c.last_message_at,
      };
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Mark incoming messages as read
    messagesDb.execute(
      `UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ? AND recipient_id = ? AND is_read = 0`,
      [conversationId, userId]
    );

    const msgs = messagesDb.queryAll<any>(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );

    return msgs.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      recipientId: m.recipient_id,
      content: m.content,
      isRead: Boolean(m.is_read),
      createdAt: m.created_at,
      isMine: m.sender_id === userId,
    }));
  }

  async sendMessage(senderId: string, recipientId: string, content: string, relatedBookingId?: string) {
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty.');
    }
    if (senderId === recipientId) {
      throw new Error('Cannot send a message to yourself.');
    }

    const conv = await this.getOrCreateConversation(senderId, recipientId, relatedBookingId);
    const msgId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    messagesDb.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content)
       VALUES (?, ?, ?, ?, ?)`,
      [msgId, conv.id, senderId, recipientId, content.trim()]
    );

    messagesDb.execute(
      `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [conv.id]
    );

    const senderProfile = usersDb.queryOne<any>('SELECT full_name FROM user_profiles WHERE user_id = ?', [senderId]);

    // Real-time socket emission
    const io = getIO();
    if (io) {
      io.to(recipientId).emit('new_message', {
        id: msgId,
        conversationId: conv.id,
        senderId,
        senderName: senderProfile?.full_name || 'Member',
        recipientId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      });
    }

    // Publish event for Email Notification Service
    eventBus.publish('message.sent', {
      messageId: msgId,
      conversationId: conv.id,
      senderId,
      senderName: senderProfile?.full_name || 'Member',
      recipientId,
      content: content.trim(),
    });

    return {
      id: msgId,
      conversationId: conv.id,
      senderId,
      recipientId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isMine: true,
    };
  }

  async getUnreadCount(userId: string) {
    const row = messagesDb.queryOne<any>(
      `SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND is_read = 0`,
      [userId]
    );
    return row?.count || 0;
  }
}

export const messagingService = new MessagingService();
