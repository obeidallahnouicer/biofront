import { io, Socket } from 'socket.io-client';
import type { CursorPosition, PresenceUser, Material } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

type EventCallback<T> = (data: T) => void;

interface SessionStateData {
  session_id: string;
  participants: PresenceUser[];
  cursors: Record<string, CursorPosition>;
}

interface UserJoinedData {
  user_id: string;
  session_id: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface UserLeftData {
  user_id: string;
  session_id: string;
}

interface MaterialAddedData {
  session_id: string;
  material_id: string;
  material_data: Material;
  added_by: string;
}

interface MaterialUpdatedData {
  session_id: string;
  material_id: string;
  changes: Partial<Material>;
  updated_by: string;
}

interface MaterialDeletedData {
  session_id: string;
  material_id: string;
  deleted_by: string;
}

interface YjsUpdateData {
  material_id: string;
  update: string;
  origin: string;
}

interface YjsAwarenessData {
  material_id: string;
  awareness_update: string;
  user_id: string;
}

interface YjsSyncData {
  material_id: string;
  state: string;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentSessionId: string | null = null;
  private eventListeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      path: '/ws/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;

      // Rejoin session if we were in one
      if (this.currentSessionId) {
        this.joinSession(this.currentSessionId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });
  }

  disconnect(): void {
    if (this.currentSessionId) {
      this.leaveSession(this.currentSessionId);
    }
    this.socket?.disconnect();
    this.socket = null;
    this.currentSessionId = null;
    this.eventListeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ==================== SESSION EVENTS ====================

  joinSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.socket?.emit('join_session', { session_id: sessionId });
  }

  leaveSession(sessionId: string): void {
    this.socket?.emit('leave_session', { session_id: sessionId });
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  // ==================== CURSOR TRACKING ====================

  sendCursorPosition(sessionId: string, x: number, y: number, elementId?: string): void {
    this.socket?.emit('cursor_move', {
      session_id: sessionId,
      x,
      y,
      element_id: elementId,
    });
  }

  onCursorUpdate(callback: EventCallback<CursorPosition>): () => void {
    this.socket?.on('cursor_update', callback);
    return () => this.socket?.off('cursor_update', callback);
  }

  // ==================== PRESENCE ====================

  sendHeartbeat(sessionId?: string): void {
    this.socket?.emit('heartbeat', { session_id: sessionId || this.currentSessionId });
  }

  onUserJoined(callback: EventCallback<UserJoinedData>): () => void {
    this.socket?.on('user_joined', callback);
    return () => this.socket?.off('user_joined', callback);
  }

  onUserLeft(callback: EventCallback<UserLeftData>): () => void {
    this.socket?.on('user_left', callback);
    return () => this.socket?.off('user_left', callback);
  }

  onSessionState(callback: EventCallback<SessionStateData>): () => void {
    this.socket?.on('session_state', callback);
    return () => this.socket?.off('session_state', callback);
  }

  onPresenceUpdate(callback: EventCallback<PresenceUser>): () => void {
    this.socket?.on('presence_update', callback);
    return () => this.socket?.off('presence_update', callback);
  }

  // ==================== MATERIAL EVENTS ====================

  onMaterialAdded(callback: EventCallback<MaterialAddedData>): () => void {
    this.socket?.on('material_added', callback);
    return () => this.socket?.off('material_added', callback);
  }

  onMaterialUpdated(callback: EventCallback<MaterialUpdatedData>): () => void {
    this.socket?.on('material_updated', callback);
    return () => this.socket?.off('material_updated', callback);
  }

  onMaterialDeleted(callback: EventCallback<MaterialDeletedData>): () => void {
    this.socket?.on('material_deleted', callback);
    return () => this.socket?.off('material_deleted', callback);
  }

  // ==================== SELECTION EVENTS ====================

  sendSelectionChange(sessionId: string, materialIds: string[]): void {
    this.socket?.emit('selection_change', {
      session_id: sessionId,
      material_ids: materialIds,
    });
  }

  onSelectionChange(callback: EventCallback<{ user_id: string; material_ids: string[] }>): () => void {
    this.socket?.on('selection_change', callback);
    return () => this.socket?.off('selection_change', callback);
  }

  // ==================== Y.JS CRDT EVENTS ====================

  subscribeMaterial(materialId: string): void {
    this.socket?.emit('material:subscribe', { material_id: materialId });
  }

  unsubscribeMaterial(materialId: string): void {
    this.socket?.emit('material:unsubscribe', { material_id: materialId });
  }

  sendYjsSyncStep1(materialId: string): void {
    this.socket?.emit('yjs:sync_step1', { material_id: materialId });
  }

  onYjsSyncStep2(callback: EventCallback<YjsSyncData>): () => void {
    this.socket?.on('yjs:sync_step2', callback);
    return () => this.socket?.off('yjs:sync_step2', callback);
  }

  sendYjsUpdate(materialId: string, update: Uint8Array): void {
    this.socket?.emit('yjs:update', {
      material_id: materialId,
      update: Buffer.from(update).toString('base64'),
    });
  }

  onYjsUpdate(callback: EventCallback<YjsUpdateData>): () => void {
    this.socket?.on('yjs:update', callback);
    return () => this.socket?.off('yjs:update', callback);
  }

  sendYjsAwarenessUpdate(materialId: string, awarenessUpdate: Uint8Array): void {
    this.socket?.emit('yjs:awareness_update', {
      material_id: materialId,
      awareness_update: Buffer.from(awarenessUpdate).toString('base64'),
    });
  }

  onYjsAwarenessUpdate(callback: EventCallback<YjsAwarenessData>): () => void {
    this.socket?.on('yjs:awareness_update', callback);
    return () => this.socket?.off('yjs:awareness_update', callback);
  }

  // ==================== UTILITY METHODS ====================

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  on<T>(event: string, callback: EventCallback<T>): () => void {
    this.socket?.on(event, callback as EventCallback<unknown>);
    return () => this.socket?.off(event, callback as EventCallback<unknown>);
  }

  off(event: string, callback?: EventCallback<unknown>): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  once<T>(event: string, callback: EventCallback<T>): void {
    this.socket?.once(event, callback as EventCallback<unknown>);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;
