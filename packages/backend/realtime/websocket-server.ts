import { Elysia } from 'elysia';
import { publishMessage, channels, getAblyStatus } from './ably-integration';

// WebSocket plugin for Elysia
export const websocketPlugin = new Elysia({ name: 'websocket' })
  .ws('/ws/chat', {
    message(ws, message) {
      // Broadcast chat message to all clients
      publishMessage(channels.CHAT, 'message', {
        userId: ws.data.userId || 'anonymous',
        message,
        timestamp: new Date().toISOString(),
      });
    },
    open(ws) {
      console.log('WebSocket connection opened');
      publishMessage(channels.USER_PRESENCE, 'user_joined', {
        userId: ws.data.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    },
    close(ws) {
      console.log('WebSocket connection closed');
      publishMessage(channels.USER_PRESENCE, 'user_left', {
        userId: ws.data.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    },
  })
  .ws('/ws/ai-status', {
    message(ws, message) {
      // Handle AI status updates
      publishMessage(channels.AI_STATUS, 'status_update', {
        status: message,
        timestamp: new Date().toISOString(),
      });
    },
  })
  .get('/api/realtime/status', () => {
    return {
      ably: getAblyStatus(),
      channels: Object.values(channels),
      timestamp: new Date().toISOString(),
    };
  });

// Export for use in main server
export default websocketPlugin;
