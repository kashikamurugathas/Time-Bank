import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { messagingService } from './services/messaging.service.ts';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer) {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance.on('connection', (socket) => {
    // User joins personal room on login
    socket.on('join_user', (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Handle real-time chat message sending
    socket.on('send_message', async (data: { senderId: string; recipientId: string; content: string; relatedBookingId?: string }) => {
      try {
        const result = await messagingService.sendMessage(data.senderId, data.recipientId, data.content, data.relatedBookingId);
        // Emit to sender
        socket.emit('message_sent', result);
        // Emit to recipient room
        ioInstance?.to(`user_${data.recipientId}`).emit('new_message', {
          conversationId: result.conversationId,
          message: result.message
        });
      } catch (err: any) {
        socket.emit('message_error', { error: err.message });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { recipientId: string; isTyping: boolean }) => {
      ioInstance?.to(`user_${data.recipientId}`).emit('partner_typing', { isTyping: data.isTyping });
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}
