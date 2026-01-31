import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Team,
  TeamMember,
  TeamRole,
  Session,
  SessionParticipant,
  SessionActivity,
  Material,
  MaterialType,
  Hypothesis,
  RankedVariant,
  SimilarMaterial,
  PaginatedResponse,
  TokenResponse,
  UploadInitiateResponse,
  TeamInvitationToken,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    const response = await axios.post<TokenResponse>(`${API_BASE_URL}/api/v1/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: new_refresh_token } = response.data;
    this.setTokens(access_token, new_refresh_token);
    return access_token;
  }

  // ==================== AUTH METHODS ====================

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/api/v1/auth/login', { email, password });
    const { access_token, refresh_token } = response.data;
    this.setTokens(access_token, refresh_token);
    return response.data;
  }

  async register(data: { email: string; password: string; full_name: string }): Promise<User> {
    const response = await this.client.post<User>('/api/v1/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.client.post('/api/v1/auth/logout', undefined, {
          params: { refresh_token: refreshToken },
        });
      }
    } finally {
      this.clearTokens();
    }
  }

  async getOAuthAuthorizationUrl(provider: 'google' | 'microsoft' | 'orcid'): Promise<string> {
    const response = await this.client.get<{ authorization_url: string }>(
      `/api/v1/oauth/${provider}/authorize`
    );
    return response.data.authorization_url;
  }

  async exchangeOAuthCode(provider: 'google' | 'microsoft' | 'orcid', code: string, state: string): Promise<{
    access_token: string;
    refresh_token: string;
    user_id: string;
    email: string;
  }> {
    const response = await this.client.get<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      email: string;
    }>(`/api/v1/oauth/${provider}/callback`, {
      params: { code, state },
    });
    return response.data;
  }

  // ==================== USER METHODS ====================

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/v1/users/me');
    return response.data;
  }

  async updateCurrentUser(data: Partial<User>): Promise<User> {
    const response = await this.client.patch<User>('/api/v1/users/me', data);
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/api/v1/users/${userId}`);
    return response.data;
  }

  // ==================== TEAM METHODS ====================

  async createTeam(data: { name: string; description?: string }): Promise<Team> {
    const response = await this.client.post<Team>('/api/v1/teams', data);
    return response.data;
  }

  async getTeams(): Promise<Team[]> {
    const response = await this.client.get<Team[]>('/api/v1/teams');
    return response.data;
  }

  async getTeam(teamId: string): Promise<Team> {
    const response = await this.client.get<Team>(`/api/v1/teams/${teamId}`);
    return response.data;
  }

  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const response = await this.client.patch<Team>(`/api/v1/teams/${teamId}`, data);
    return response.data;
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.client.delete(`/api/v1/teams/${teamId}`);
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await this.client.get<TeamMember[]>(`/api/v1/teams/${teamId}/members`);
    return response.data;
  }

  async inviteTeamMember(teamId: string, email: string, role: TeamRole): Promise<TeamInvitationToken> {
    const response = await this.client.post<TeamInvitationToken>(
      `/api/v1/teams/${teamId}/invitations`,
      { email, role }
    );
    return response.data;
  }

  async acceptTeamInvitation(token: string): Promise<void> {
    await this.client.post(`/api/v1/teams/invitations/${token}/accept`);
  }

  async updateTeamMember(teamId: string, memberId: string, role: TeamRole): Promise<TeamMember> {
    const response = await this.client.patch<TeamMember>(`/api/v1/teams/${teamId}/members/${memberId}`, { role });
    return response.data;
  }

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    await this.client.delete(`/api/v1/teams/${teamId}/members/${memberId}`);
  }

  // ==================== SESSION METHODS ====================

  async createSession(data: {
    team_id: string;
    title: string;
    description?: string;
    topic_tags?: string[];
  }): Promise<Session> {
    const response = await this.client.post<Session>('/api/v1/sessions', data);
    return response.data;
  }

  async getSessions(params?: {
    team_id?: string;
    include_archived?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Session>> {
    const response = await this.client.get<PaginatedResponse<Session>>('/api/v1/sessions', { params });
    return response.data;
  }

  async getSession(sessionId: string): Promise<Session> {
    const response = await this.client.get<Session>(`/api/v1/sessions/${sessionId}`);
    return response.data;
  }

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    const response = await this.client.patch<Session>(`/api/v1/sessions/${sessionId}`, data);
    return response.data;
  }

  async archiveSession(sessionId: string): Promise<void> {
    await this.client.post(`/api/v1/sessions/${sessionId}/archive`);
  }

  async unarchiveSession(sessionId: string): Promise<void> {
    await this.client.post(`/api/v1/sessions/${sessionId}/unarchive`);
  }

  async getSessionParticipants(sessionId: string): Promise<SessionParticipant[]> {
    const response = await this.client.get<SessionParticipant[]>(`/api/v1/sessions/${sessionId}/participants`);
    return response.data;
  }

  async addSessionParticipant(sessionId: string, userId: string, permission: string): Promise<SessionParticipant> {
    const response = await this.client.post<SessionParticipant>(`/api/v1/sessions/${sessionId}/participants`, {
      user_id: userId,
      permission,
    });
    return response.data;
  }

  async getSessionActivity(sessionId: string, params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<SessionActivity>> {
    const response = await this.client.get<PaginatedResponse<SessionActivity>>(`/api/v1/sessions/${sessionId}/activity`, { params });
    return response.data;
  }

  async searchSessions(query: string): Promise<Session[]> {
    const response = await this.client.get<Session[]>('/api/v1/sessions/search', {
      params: { q: query },
    });
    return response.data;
  }

  // ==================== MATERIAL METHODS ====================

  async initiateUpload(data: {
    session_id: string;
    material_type: MaterialType;
    title: string;
    filename: string;
    content_type: string;
    file_size: number;
  }): Promise<UploadInitiateResponse> {
    const response = await this.client.post<UploadInitiateResponse>('/api/v1/materials/upload/initiate', data);
    return response.data;
  }

  async completeUpload(materialId: string, checksum?: string | null): Promise<Material> {
    const response = await this.client.post<Material>(`/api/v1/materials/upload/${materialId}/complete`, {
      checksum: checksum ?? null,
    });
    return response.data;
  }

  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });
  }

  async uploadPart(uploadUrl: string, chunk: Blob, contentType: string): Promise<string | null> {
    const response = await axios.put(uploadUrl, chunk, {
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
      },
    });
    const etag = response.headers?.etag;
    return etag ? String(etag).replace(/\"/g, '') : null;
  }

  async getSessionMaterials(
    sessionId: string,
    params?: { material_type?: MaterialType; skip?: number; limit?: number }
  ): Promise<PaginatedResponse<Material>> {
    const response = await this.client.get<PaginatedResponse<Material>>(`/api/v1/sessions/${sessionId}/materials`, {
      params,
    });
    return response.data;
  }

  async getMaterial(materialId: string): Promise<Material> {
    const response = await this.client.get<Material>(`/api/v1/materials/${materialId}`);
    return response.data;
  }

  async updateMaterial(materialId: string, data: Partial<Material>): Promise<Material> {
    const response = await this.client.patch<Material>(`/api/v1/materials/${materialId}`, data);
    return response.data;
  }

  async createMaterial(data: {
    session_id: string;
    material_type: MaterialType;
    title: string;
    metadata?: Record<string, unknown> | null;
    file_url?: string | null;
  }): Promise<Material> {
    const response = await this.client.post<Material>('/api/v1/materials', data);
    return response.data;
  }

  async deleteMaterial(materialId: string): Promise<void> {
    await this.client.delete(`/api/v1/materials/${materialId}`);
  }

  async searchMaterials(query: string, sessionId?: string): Promise<Material[]> {
    const response = await this.client.get<Material[]>('/api/v1/materials/search', {
      params: { q: query, session_id: sessionId },
    });
    return response.data;
  }

  async getSimilarMaterials(materialId: string): Promise<SimilarMaterial[]> {
    const response = await this.client.post<{ results: SimilarMaterial[] }>(`/api/v1/search/similarity`, {
      material_id: materialId,
      collection: 'materials',
    });
    return response.data.results;
  }

  async getPresignedDownloadUrl(bucket: string, objectKey: string): Promise<string> {
    const response = await this.client.post<{ url: string }>(`/api/v1/uploads/presigned-download`, {
      bucket,
      object_key: objectKey,
    });
    return response.data.url;
  }

  async completeMultipartUpload(data: {
    bucket: string;
    object_key: string;
    upload_id: string;
    parts: Array<{ part_number: number; etag: string }>;
    checksum?: string | null;
  }): Promise<{ file_url: string; checksum: string | null }>{
    const response = await this.client.post<{ file_url: string; checksum: string | null }>(
      `/api/v1/uploads/complete`,
      data
    );
    return response.data;
  }

  // ==================== AI FEATURES ====================

  async generateHypotheses(
    data: {
      session_id: string;
      research_goal: string;
      focus_area?: string;
      num_hypotheses?: number;
      llm_model?: string;
    }
  ): Promise<{
    hypotheses: Hypothesis[];
    model_used: string;
    evidence_count: number;
    patterns_identified: number;
  }> {
    const response = await this.client.post<{
      hypotheses: Hypothesis[];
      model_used: string;
      evidence_count: number;
      patterns_identified: number;
    }>(
      `/api/v1/hypotheses/generate`,
      data
    );
    return response.data;
  }

  async rankVariants(
    sessionId: string,
    data: {
      sequences: Array<{ id?: string; sequence: string; name?: string }>;
      target_property: string;
      max_variants_to_test?: number;
    }
  ): Promise<{
    ranking_id: string;
    ranked_variants: RankedVariant[];
    recommended_for_testing: RankedVariant[];
    summary: Record<string, number>;
  }> {
    const response = await this.client.post(
      `/api/v1/variants/sessions/${sessionId}/rank`,
      data
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
