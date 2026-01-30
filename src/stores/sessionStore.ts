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
  fetchSessions: (params?: { team_id?: string; archived?: boolean }) => Promise<void>;
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
  searchSessions: (query: string) => Promise<Session[]>;

  // Material actions
  loadMaterials: (sessionId: string) => Promise<void>;
  addMaterial: (material: Material) => void;
  updateMaterial: (materialId: string, changes: Partial<Material>) => void;
  deleteMaterial: (materialId: string) => void;
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
    numHypotheses?: number
  ) => Promise<Hypothesis[]>;
  loadHypotheses: (sessionId: string) => Promise<void>;
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
        get().loadHypotheses(sessionId),
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
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteSession(sessionId);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete session';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  archiveSession: async (sessionId) => {
    await get().updateSession(sessionId, { is_archived: true });
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
      set({ materials: response.items });
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

  deleteMaterial: (materialId) => {
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== materialId),
      selectedMaterialIds: state.selectedMaterialIds.filter((id) => id !== materialId),
    }));
  },

  uploadMaterial: async (sessionId, file, materialType, title, metadata) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Initiate upload
      const { material_id, upload_url } = await apiClient.initiateUpload({
        session_id: sessionId,
        material_type: materialType,
        title,
        filename: file.name,
        metadata,
      });

      // 2. Upload file to presigned URL
      await apiClient.uploadFile(upload_url, file);

      // 3. Complete upload
      const material = await apiClient.completeUpload(material_id);

      // 4. Add to local state
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
      set({ participants });
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
  generateHypotheses: async (sessionId, researchGoal, focusArea, numHypotheses) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.generateHypotheses(sessionId, {
        research_goal: researchGoal,
        focus_area: focusArea,
        num_hypotheses: numHypotheses,
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

  loadHypotheses: async (sessionId) => {
    try {
      const response = await apiClient.getHypotheses(sessionId);
      set({ hypotheses: response.hypotheses });
    } catch (error) {
      console.error('Failed to load hypotheses:', error);
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
