// lib/store.ts
// Zustand global state with localStorage persistence

import { create } from 'zustand';
import type {
  KaiXStore,
  GalaxySession,
  GalaxyNode,
  AIBackend,
  Language,
} from './types';
import { DEPTH_COLORS } from './types';

// ── Simple UID generator ──────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ── Position generator ────────────────────────────────────────────────────────
function generatePosition(
  parentPos: [number, number, number],
  depth: number,
  siblingIndex: number,
  totalSiblings: number
): [number, number, number] {
  if (depth === 0) return [0, 0, 0];

  const angleStep = (Math.PI * 2) / Math.max(totalSiblings, 1);
  const angle = siblingIndex * angleStep + (Math.random() - 0.5) * 0.4;
  const elevation = (Math.random() - 0.5) * 3;

  if (depth === 1) {
    const radius = 4 + Math.random() * 1;
    return [
      Math.cos(angle) * radius,
      elevation,
      Math.sin(angle) * radius,
    ];
  }

  const spread = 2.5 + Math.random() * 0.5;
  return [
    parentPos[0] + Math.cos(angle) * spread,
    parentPos[1] + elevation * 0.5,
    parentPos[2] + Math.sin(angle) * spread,
  ];
}

const STORAGE_KEY = 'kaix-sessions-v1';

export const useStore = create<KaiXStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  nodes: {},
  selectedNodeId: null,
  hoveredNodeId: null,
  isLoading: false,
  aiBackend: 'gemini' as AIBackend,
  language: 'en' as Language,

  createSession: (rootTopic: string) => {
    const sessionId = uid();
    const rootNode: GalaxyNode = {
      id: uid(),
      label: rootTopic,
      parentId: null,
      depth: 0,
      position: [0, 0, 0],
      color: DEPTH_COLORS[0],
      children: [],
      createdAt: Date.now(),
    };

    const session: GalaxySession = {
      id: sessionId,
      rootTopic,
      nodes: { [rootNode.id]: rootNode },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      language: get().language,
    };

    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: sessionId,
      nodes: session.nodes,
      selectedNodeId: null,
    }));
  },

  loadSession: (sessionId: string) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return;
    set({
      activeSessionId: sessionId,
      nodes: { ...session.nodes },
      selectedNodeId: null,
    });
  },

  deleteSession: (sessionId: string) => {
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== sessionId);
      const isActive = state.activeSessionId === sessionId;
      return {
        sessions,
        activeSessionId: isActive ? null : state.activeSessionId,
        nodes: isActive ? {} : state.nodes,
      };
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().sessions));
    } catch (_) {}
  },

  addNode: (node: GalaxyNode) => {
    set((state) => {
      const nodes = { ...state.nodes, [node.id]: node };
      if (node.parentId && nodes[node.parentId]) {
        nodes[node.parentId] = {
          ...nodes[node.parentId],
          children: [...(nodes[node.parentId].children ?? []), node.id],
        };
      }
      return { nodes };
    });
  },

  updateNode: (id: string, updates: Partial<GalaxyNode>) => {
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { ...state.nodes[id], ...updates },
      },
    }));
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  setLoading: (loading) => set({ isLoading: loading }),

  setAIBackend: (backend: AIBackend) => set({ aiBackend: backend }),
  setLanguage: (lang: Language) => set({ language: lang }),

  persistSession: () => {
    const { sessions, activeSessionId, nodes } = get();
    const updatedSessions = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, nodes: { ...nodes }, updatedAt: Date.now() }
        : s
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.warn('KAI-X: Failed to persist', e);
    }
    set({ sessions: updatedSessions });
  },

  loadSessions: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const sessions: GalaxySession[] = JSON.parse(raw);
        set({ sessions: Array.isArray(sessions) ? sessions : [] });
      }
    } catch (e) {
      console.warn('KAI-X: Failed to load sessions', e);
    }
  },
}));

export function getAllTopics(store: KaiXStore): string[] {
  const labels = new Set<string>();
  store.sessions.forEach((session) => {
    Object.values(session.nodes).forEach((node) => labels.add(node.label));
  });
  Object.values(store.nodes).forEach((node) => labels.add(node.label));
  return Array.from(labels).sort((a, b) => a.localeCompare(b));
}

export function addChildNodes(store: KaiXStore, parentId: string, labels: string[]): void {
  const parent = store.nodes[parentId];
  if (!parent || labels.length === 0) return;

  const existingCount = parent.children?.length ?? 0;
  const totalNew = labels.length;

  labels.forEach((label, i) => {
    const depth = parent.depth + 1;
    const node: GalaxyNode = {
      id: uid(),
      label,
      parentId,
      depth,
      position: generatePosition(
        parent.position,
        depth,
        existingCount + i,
        existingCount + totalNew
      ),
      color: DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)],
      children: [],
      createdAt: Date.now(),
    };
    store.addNode(node);
  });
}
