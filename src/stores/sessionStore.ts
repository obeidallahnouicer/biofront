import { create } from 'zustand';
import type {
  Session,
  Material,
  SessionParticipant,
  PresenceUser,
  CursorPosition,
  MaterialType,
  Hypothesis,
  RankedVariant,
} from '@/types';
import apiClient from '@/lib/api/client';
import wsClient from '@/lib/socket/client';

interface SessionState {
  // Session data
  sessions: Session[];
  currentSession: Session | null;
  materials: Material[];
  participants: SessionParticipant[];

  // Real-time collaboration
  presenceUsers: Map<string, PresenceUser>;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, string[]>;

  // AI features
  hypotheses: Hypothesis[];
  rankedVariants: RankedVariant[];

  // UI state
  isLoading: boolean;
  error: string | null;
  selectedMaterialIds: string[];

  // Session actions
  fetchSessions: (params?: { team_id?: string; include_archived?: boolean }) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  createSession: (data: {
    team_id: string;
    title: string;
    description?: string;
    topic_tags?: string[];
  }) => Promise<Session>;
  updateSession: (sessionId: string, data: Partial<Session>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  archiveSession: (sessionId: string) => Promise<void>;
  unarchiveSession: (sessionId: string) => Promise<void>;
  searchSessions: (query: string) => Promise<Session[]>;

  // Material actions
  loadMaterials: (sessionId: string) => Promise<void>;
  addMaterial: (material: Material) => void;
  updateMaterial: (materialId: string, changes: Partial<Material>) => void;
  updateMaterialMetadata: (materialId: string, metadata: Record<string, unknown>) => void;
  persistMaterialMetadata: (materialId: string, metadata: Record<string, unknown>) => Promise<void>;
  deleteMaterial: (materialId: string) => void;
  createMaterial: (
    sessionId: string,
    materialType: MaterialType,
    title: string,
    metadata?: Record<string, unknown>
  ) => Promise<Material>;
  uploadMaterial: (
    sessionId: string,
    file: File,
    materialType: MaterialType,
    title: string,
    metadata?: Record<string, unknown>
  ) => Promise<Material>;

  // Participant actions
  loadParticipants: (sessionId: string) => Promise<void>;

  // Real-time actions
  updatePresence: (userId: string, presence: PresenceUser) => void;
  removePresence: (userId: string) => void;
  updateCursor: (userId: string, cursor: CursorPosition) => void;
  removeCursor: (userId: string) => void;
  updateSelection: (userId: string, materialIds: string[]) => void;

  // AI actions
  generateHypotheses: (
    sessionId: string,
    researchGoal: string,
    focusArea?: string,
    numHypotheses?: number,
    llmModel?: string
  ) => Promise<Hypothesis[]>;
  rankVariants: (
    sessionId: string,
    sequences: Array<{ id?: string; sequence: string; name?: string }>,
    targetProperty: string,
    maxVariants?: number
  ) => Promise<RankedVariant[]>;

  // Selection actions
  selectMaterial: (materialId: string) => void;
  deselectMaterial: (materialId: string) => void;
  toggleMaterialSelection: (materialId: string) => void;
  selectMultipleMaterials: (materialIds: string[]) => void;
  clearSelection: () => void;

  // Utility actions
  setCurrentSession: (session: Session | null) => void;
  clearSession: () => void;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  sessions: [],
  currentSession: null,
  materials: [],
  participants: [],
  presenceUsers: new Map(),
  cursors: new Map(),
  selections: new Map(),
  hypotheses: [],
  rankedVariants: [],
  isLoading: false,
  error: null,
  selectedMaterialIds: [],

  // Session actions
  fetchSessions: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getSessions(params);
      set({ sessions: response.items });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const session = await apiClient.getSession(sessionId);
      set({ currentSession: session });

      // Join WebSocket room
      wsClient.joinSession(sessionId);

      // Load related data in parallel
      await Promise.all([
        get().loadMaterials(sessionId),
        get().loadParticipants(sessionId),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch session';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createSession: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const session = await apiClient.createSession(data);
      set((state) => ({ sessions: [...state.sessions, session] }));
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateSession: async (sessionId, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSession = await apiClient.updateSession(sessionId, data);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? updatedSession : s)),
        currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update session';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteSession: async (sessionId) => {
    await apiClient.archiveSession(sessionId);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, is_archived: true } : s
      ),
      currentSession: state.currentSession?.id === sessionId
        ? { ...state.currentSession, is_archived: true }
        : state.currentSession,
    }));
  },

  archiveSession: async (sessionId) => {
    await apiClient.archiveSession(sessionId);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, is_archived: true } : s
      ),
    }));
  },

  unarchiveSession: async (sessionId) => {
    await apiClient.unarchiveSession(sessionId);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, is_archived: false } : s
      ),
    }));
  },

  searchSessions: async (query) => {
    try {
      return await apiClient.searchSessions(query);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  // Material actions
  loadMaterials: async (sessionId) => {
    try {
      const response = await apiClient.getSessionMaterials(sessionId, { limit: 200 });
      const detailedMaterials = await Promise.all(
        response.items.map((item) => apiClient.getMaterial(item.id))
      );
      set({ materials: detailedMaterials });
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  },

  addMaterial: (material) => {
    set((state) => ({
      materials: [...state.materials, material],
    }));
  },

  updateMaterial: (materialId, changes) => {
    set((state) => ({
      materials: state.materials.map((m) =>
        m.id === materialId ? { ...m, ...changes } : m
      ),
    }));
  },

  updateMaterialMetadata: (materialId, metadata) => {
    set((state) => ({
      materials: state.materials.map((m) =>
        m.id === materialId ? { ...m, metadata: { ...(m.metadata || {}), ...metadata } } : m
      ),
    }));
  },

  persistMaterialMetadata: async (materialId, metadata) => {
    try {
      const material = await apiClient.updateMaterial(materialId, { metadata });
      get().updateMaterial(materialId, material);
    } catch (error) {
      console.error('Failed to persist material metadata:', error);
    }
  },

  deleteMaterial: (materialId) => {
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== materialId),
      selectedMaterialIds: state.selectedMaterialIds.filter((id) => id !== materialId),
    }));
  },

  createMaterial: async (sessionId, materialType, title, metadata) => {
    set({ isLoading: true, error: null });
    try {
      const material = await apiClient.createMaterial({
        session_id: sessionId,
        material_type: materialType,
        title,
        metadata: metadata ?? null,
      });
      get().addMaterial(material);
      return material;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create material';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadMaterial: async (sessionId, file, materialType, title, metadata) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Initiate upload
      const { material_id, upload_url, upload_id, parts, bucket, object_key } = await apiClient.initiateUpload({
        session_id: sessionId,
        material_type: materialType,
        title,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_size: file.size,
      });

      // 2. Calculate checksum (optional)
      let checksum: string | null = null;
      try {
        if (globalThis.crypto?.subtle) {
          const buffer = await file.arrayBuffer();
          const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(digest));
          checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }
      } catch {
        checksum = null;
      }

      // 3. Upload file to presigned URL (single or multipart)
      if (upload_url) {
        await apiClient.uploadFile(upload_url, file);
      } else if (upload_id && parts && parts.length > 0) {
        const partSize = Math.ceil(file.size / parts.length);
        const uploadedParts: Array<{ part_number: number; etag: string }> = [];
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const start = i * partSize;
          const end = Math.min(start + partSize, file.size);
          const chunk = file.slice(start, end);
          const etag = await apiClient.uploadPart(part.url, chunk, file.type || 'application/octet-stream');
          if (!etag) {
            throw new Error('Failed to upload part');
          }
          uploadedParts.push({ part_number: part.part_number, etag });
        }
        await apiClient.completeMultipartUpload({
          bucket,
          object_key,
          upload_id,
          parts: uploadedParts,
          checksum,
        });
      } else {
        throw new Error('Upload initialization failed')
      }

      // 4. Complete upload metadata
      const material = await apiClient.completeUpload(material_id, checksum);

      // 5. Patch metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        const updated = await apiClient.updateMaterial(material_id, { metadata });
        get().addMaterial(updated);
        return updated;
      }

      // 6. Add to local state
      get().addMaterial(material);

      return material;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload material';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Participant actions
  loadParticipants: async (sessionId) => {
    try {
      const participants = await apiClient.getSessionParticipants(sessionId);
      const users = await Promise.all(
        participants.map(async (participant) => {
          try {
            const user = await apiClient.getUser(participant.user_id);
            return { ...participant, user };
          } catch {
            return participant;
          }
        })
      );
      set({ participants: users });
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  },

  // Real-time actions
  updatePresence: (userId, presence) => {
    set((state) => {
      const newPresence = new Map(state.presenceUsers);
      newPresence.set(userId, presence);
      return { presenceUsers: newPresence };
    });
  },

  removePresence: (userId) => {
    set((state) => {
      const newPresence = new Map(state.presenceUsers);
      newPresence.delete(userId);
      return { presenceUsers: newPresence };
    });
  },

  updateCursor: (userId, cursor) => {
    set((state) => {
      const newCursors = new Map(state.cursors);
      newCursors.set(userId, cursor);
      return { cursors: newCursors };
    });
  },

  removeCursor: (userId) => {
    set((state) => {
      const newCursors = new Map(state.cursors);
      newCursors.delete(userId);
      return { cursors: newCursors };
    });
  },

  updateSelection: (userId, materialIds) => {
    set((state) => {
      const newSelections = new Map(state.selections);
      newSelections.set(userId, materialIds);
      return { selections: newSelections };
    });
  },

  // AI actions
  generateHypotheses: async (sessionId, researchGoal, focusArea, numHypotheses, llmModel) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.generateHypotheses({
        session_id: sessionId,
        research_goal: researchGoal,
        focus_area: focusArea,
        num_hypotheses: numHypotheses,
        llm_model: llmModel,
      });
      set({ hypotheses: response.hypotheses });
      return response.hypotheses;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate hypotheses';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  rankVariants: async (sessionId, sequences, targetProperty, maxVariants) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.rankVariants(sessionId, {
        sequences,
        target_property: targetProperty,
        max_variants_to_test: maxVariants,
      });
      set({ rankedVariants: response.ranked_variants });
      return response.ranked_variants;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rank variants';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Selection actions
  selectMaterial: (materialId) => {
    set((state) => ({
      selectedMaterialIds: [...state.selectedMaterialIds, materialId],
    }));
  },

  deselectMaterial: (materialId) => {
    set((state) => ({
      selectedMaterialIds: state.selectedMaterialIds.filter((id) => id !== materialId),
    }));
  },

  toggleMaterialSelection: (materialId) => {
    const { selectedMaterialIds } = get();
    if (selectedMaterialIds.includes(materialId)) {
      get().deselectMaterial(materialId);
    } else {
      get().selectMaterial(materialId);
    }
  },

  selectMultipleMaterials: (materialIds) => {
    set({ selectedMaterialIds: materialIds });
  },

  clearSelection: () => {
    set({ selectedMaterialIds: [] });
  },

  // Utility actions
  setCurrentSession: (session) => {
    set({ currentSession: session });
  },

  clearSession: () => {
    const currentSession = get().currentSession;
    if (currentSession) {
      wsClient.leaveSession(currentSession.id);
    }
    set({
      currentSession: null,
      materials: [],
      participants: [],
      presenceUsers: new Map(),
      cursors: new Map(),
      selections: new Map(),
      hypotheses: [],
      rankedVariants: [],
      selectedMaterialIds: [],
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
