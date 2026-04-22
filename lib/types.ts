// lib/types.ts
// Core type definitions for KAI-X

/** Supported AI backends */
export type AIBackend = 'gemini' | 'groq' | 'mistral';

/** Supported UI languages */
export type Language = 'en' | 'pt';

/** Sphere color themes by depth level */
export type SphereColor = 'nebula' | 'plasma' | 'nova' | 'corona' | 'pulsar';

/** A single node in the galaxy mind map */
export interface GalaxyNode {
  id: string;
  label: string;
  parentId: string | null;   // null = root node
  depth: number;             // 0 = center, 1 = first ring, etc.
  position: [number, number, number]; // Three.js world coords
  color: SphereColor;
  isLoading?: boolean;       // True while AI fetches sub-topics
  children: string[];        // Child node IDs
  createdAt: number;         // Timestamp for ordering
}

/** A persisted galaxy session */
export interface GalaxySession {
  id: string;
  rootTopic: string;
  nodes: Record<string, GalaxyNode>;
  createdAt: number;
  updatedAt: number;
  language: Language;
}

/** App-wide Zustand store shape */
export interface KaiXStore {
  // Sessions
  sessions: GalaxySession[];
  activeSessionId: string | null;

  // Active galaxy nodes (derived from active session)
  nodes: Record<string, GalaxyNode>;
  
  // UI state
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  isLoading: boolean;
  
  // Settings
  aiBackend: AIBackend;
  language: Language;
  
  // Actions
  createSession: (rootTopic: string) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  
  addNode: (node: GalaxyNode) => void;
  updateNode: (id: string, updates: Partial<GalaxyNode>) => void;
  
  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  setAIBackend: (backend: AIBackend) => void;
  setLanguage: (lang: Language) => void;
  
  persistSession: () => void;
  loadSessions: () => void;
}

/** Response from AI route */
export interface AIResponse {
  concepts?: string[];   // For sub-topic expansion
  summary?: string;      // For knowledge mode
  keyPoints?: string[];  // For knowledge mode
  questions?: string[];  // For knowledge mode
  error?: string;
}

/** Request to AI route */
export interface AIRequest {
  action: 'expand' | 'summarize';
  topic: string;
  backend: AIBackend;
  language: Language;
  parentContext?: string; // Parent topic for better context
}

/** Knowledge panel data for a topic */
export interface KnowledgeData {
  topic: string;
  summary: string;
  keyPoints: string[];
  questions: string[];
}

/** Color palette per sphere theme */
export const SPHERE_COLORS: Record<SphereColor, { 
  hex: string; 
  glow: string; 
  emissive: string;
}> = {
  nebula:  { hex: '#38bdf8', glow: 'rgba(56,189,248,0.6)',   emissive: '#0ea5e9' },
  plasma:  { hex: '#a78bfa', glow: 'rgba(167,139,250,0.6)',  emissive: '#8b5cf6' },
  nova:    { hex: '#34d399', glow: 'rgba(52,211,153,0.6)',   emissive: '#10b981' },
  corona:  { hex: '#fb923c', glow: 'rgba(251,146,60,0.6)',   emissive: '#f97316' },
  pulsar:  { hex: '#f472b6', glow: 'rgba(244,114,182,0.6)',  emissive: '#ec4899' },
};

/** Color assigned based on depth */
export const DEPTH_COLORS: SphereColor[] = [
  'nebula',   // depth 0 - root (cyan)
  'plasma',   // depth 1 (purple)
  'nova',     // depth 2 (green)
  'corona',   // depth 3 (orange)
  'pulsar',   // depth 4+ (pink)
];

/** Max spheres before refusing new ones */
export const MAX_SPHERES = 100;
