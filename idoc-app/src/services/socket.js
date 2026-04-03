import storage from '../utils/storage';

// Django Channels uses standard WebSocket, not socket.io
const WS_BASE = 'wss://perfect-grace-production-b406.up.railway.app';

class SocketService {
  sockets = {};
  listeners = new Map();
  token = null;

  async connect() {
    try {
      this.token = await storage.getItem('access_token');
      // Connection is lazy — individual rooms connect on demand
      console.log('Socket service initialized');
      return this;
    } catch (error) {
      console.log('Socket init error (non-fatal):', error.message);
    }
  }

  disconnect() {
    Object.values(this.sockets).forEach((ws) => {
      try { ws.close(); } catch (_) {}
    });
    this.sockets = {};
    this.token = null;
  }

  // ─── Connect to a specific chat room ───
  joinRoom(roomId) {
    if (this.sockets[roomId]) return;
    const url = `${WS_BASE}/ws/chat/${roomId}/?token=${this.token || ''}`;
    try {
      const ws = new WebSocket(url);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          this.listeners.get(`message_${roomId}`)?.forEach((cb) => cb(data));
        } catch (_) {}
      };
      ws.onerror = () => console.log(`Chat WS error for room ${roomId}`);
      this.sockets[roomId] = ws;
    } catch (e) {
      console.log('WebSocket connect error (non-fatal):', e.message);
    }
  }

  leaveRoom(roomId) {
    try { this.sockets[roomId]?.close(); } catch (_) {}
    delete this.sockets[roomId];
  }

  sendMessage(roomId, message) {
    const ws = this.sockets[roomId];
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'chat_message', message }));
    }
  }

  onNewMessage(roomId, callback) {
    const key = `message_${roomId}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key)?.delete(callback);
  }

  // Stub methods kept for API compatibility
  onTyping(callback) { return () => {}; }
  emitTyping(roomId) {}
  onNotification(callback) { return () => {}; }
  onIncomingCall(callback) { return () => {}; }
  initiateCall(data) {}
  acceptCall(callId) {}
  rejectCall(callId) {}
  endCall(callId) {}
  onUserOnline(callback) { return () => {}; }
  onUserOffline(callback) { return () => {}; }
}

export const socketService = new SocketService();
export default socketService;
