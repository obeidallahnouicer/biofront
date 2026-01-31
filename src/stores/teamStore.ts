import { create } from 'zustand';
import type { Team, TeamMember, TeamRole } from '@/types';
import apiClient from '@/lib/api/client';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;

  fetchTeams: () => Promise<void>;
  fetchTeam: (teamId: string) => Promise<void>;
  fetchMembers: (teamId: string) => Promise<void>;
  createTeam: (data: { name: string; description?: string }) => Promise<Team>;
  updateTeam: (teamId: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  inviteMember: (teamId: string, email: string, role: TeamRole) => Promise<string>;
  updateMember: (teamId: string, memberId: string, role: TeamRole) => Promise<void>;
  removeMember: (teamId: string, memberId: string) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  currentTeam: null,
  members: [],
  isLoading: false,
  error: null,

  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const teams = await apiClient.getTeams();
      set({ teams });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch teams';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const team = await apiClient.getTeam(teamId);
      set({ currentTeam: team });
      // Also fetch members
      await get().fetchMembers(teamId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch team';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMembers: async (teamId) => {
    try {
      const members = await apiClient.getTeamMembers(teamId);
      const withUsers = await Promise.all(
        members.map(async (member) => {
          try {
            const user = await apiClient.getUser(member.user_id);
            return { ...member, user };
          } catch {
            return member;
          }
        })
      );
      set({ members: withUsers });
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  },

  createTeam: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const team = await apiClient.createTeam(data);
      set((state) => ({ teams: [...state.teams, team] }));
      return team;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create team';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTeam: async (teamId, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTeam = await apiClient.updateTeam(teamId, data);
      set((state) => ({
        teams: state.teams.map((t) => (t.id === teamId ? updatedTeam : t)),
        currentTeam: state.currentTeam?.id === teamId ? updatedTeam : state.currentTeam,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update team';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteTeam(teamId);
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== teamId),
        currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete team';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  inviteMember: async (teamId, email, role) => {
    set({ isLoading: true, error: null });
    try {
      const { token } = await apiClient.inviteTeamMember(teamId, email, role);
      // Refresh members list
      await get().fetchMembers(teamId);
      return token;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite member';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateMember: async (teamId, memberId, role) => {
    set({ isLoading: true, error: null });
    try {
      const updatedMember = await apiClient.updateTeamMember(teamId, memberId, role);
      set((state) => ({
        members: state.members.map((m) => (m.id === memberId ? updatedMember : m)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update member';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeMember: async (teamId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.removeTeamMember(teamId, memberId);
      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentTeam: (team) => {
    set({ currentTeam: team });
  },

  clearError: () => {
    set({ error: null });
  },
}));
