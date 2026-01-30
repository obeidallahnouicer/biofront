// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  orcid_id?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

// Team types
export enum TeamRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer"
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  user?: User;
  role: TeamRole;
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by_id: string;
  invited_by?: User;
  expires_at: string;
  created_at: string;
}

// Session types
export enum SessionPermission {
  ADMIN = "admin",
  WRITE = "write",
  READ = "read"
}

export interface Session {
  id: string;
  team_id: string;
  team?: Team;
  title: string;
  description?: string;
  topic_tags: string[];
  created_by_id: string;
  created_by?: User;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  user?: User;
  permission: SessionPermission;
  joined_at: string;
}

export interface SessionActivity {
  id: string;
  session_id: string;
  user_id: string;
  user?: User;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// Material types
export enum MaterialType {
  PAPER = "paper",
  SEQUENCE = "sequence",
  IMAGE = "image",
  EXPERIMENT = "experiment",
  NOTE = "note"
}

export interface Material {
  id: string;
  session_id: string;
  uploaded_by_id: string;
  uploaded_by?: User;
  material_type: MaterialType;
  title: string;
  file_url?: string;
  download_url?: string;
  metadata: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  created_at: string;
  updated_at: string;
}

// Paper metadata
export interface PaperMetadata {
  doi?: string;
  authors?: string[];
  publication_date?: string;
  journal?: string;
  abstract?: string;
  keywords?: string[];
  pdf_url?: string;
}

// Sequence metadata
export interface SequenceMetadata {
  sequence_type: "protein" | "dna" | "rna";
  sequence: string;
  length: number;
  organism?: string;
  uniprot_id?: string;
  gene_name?: string;
  accession?: string;
}

// Image metadata
export interface ImageMetadata {
  image_type: string;
  dimensions?: { width: number; height: number };
  channels?: string[];
  magnification?: string;
  capture_date?: string;
  microscope_type?: string;
}

// Experiment metadata
export interface ExperimentMetadata {
  experiment_type: string;
  conditions: Record<string, unknown>;
  outcomes: Record<string, unknown>;
  date_performed?: string;
  protocol?: string;
}

// Note metadata
export interface NoteMetadata {
  content: string;
  mentions?: string[];
  linked_materials?: string[];
}

// AI Feature types
export interface Hypothesis {
  id: string;
  session_id: string;
  statement: string;
  rationale: string;
  experimental_approach: string;
  expected_outcomes: string[];
  required_resources: string[];
  evidence: EvidenceItem[];
  feasibility_score: number;
  evidence_score: number;
  novelty_score: number;
  overall_score: number;
  created_at: string;
}

export interface EvidenceItem {
  source: string;
  relevance: string;
  doi?: string;
  similarity_score: number;
}

export interface RankedVariant {
  sequence: {
    id: string;
    sequence: string;
    name?: string;
  };
  success_score: number;
  confidence: number;
  evidence: EvidenceItem[];
  recommended_priority: "high" | "medium" | "low";
  explanation?: string;
}

export interface VariantRankingResult {
  ranking_id: string;
  ranked_variants: RankedVariant[];
  recommended_for_testing: RankedVariant[];
}

export interface SimilarMaterial {
  material: Material;
  similarity_score: number;
  similarity_type: string;
}

// WebSocket types
export interface PresenceUser {
  user_id: string;
  user?: User;
  status: "online" | "away" | "offline";
  last_seen: string;
}

export interface CursorPosition {
  user_id: string;
  user?: User;
  x: number;
  y: number;
  element_id?: string;
  color?: string;
}

export interface SelectionState {
  user_id: string;
  user?: User;
  material_ids: string[];
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  detail: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

export interface UploadInitiateResponse {
  material_id: string;
  upload_url: string;
  expires_in: number;
}

// Canvas types for workspace
export interface CanvasNode {
  id: string;
  type: "material" | "note" | "group";
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: Material | NoteMetadata;
  zIndex: number;
}

export interface CanvasConnection {
  id: string;
  source_id: string;
  target_id: string;
  label?: string;
  style?: "solid" | "dashed" | "dotted";
}

export interface CanvasState {
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  full_name: string;
  confirm_password: string;
}

export interface CreateTeamFormData {
  name: string;
  description?: string;
}

export interface CreateSessionFormData {
  team_id: string;
  title: string;
  description?: string;
  topic_tags?: string[];
}

export interface InviteMemberFormData {
  email: string;
  role: TeamRole;
}

export interface GenerateHypothesesFormData {
  research_goal: string;
  focus_area?: string;
  num_hypotheses?: number;
}

export interface RankVariantsFormData {
  sequences: Array<{ id?: string; sequence: string; name?: string }>;
  target_property: string;
  max_variants_to_test?: number;
}
