// components/Controls.tsx
// The HUD overlay: topic input, AI backend selector, language toggle,
// session manager, and info panel for selected node.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Brain,
  Zap,
  Globe,
  BookOpen,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  X,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { expandTopic, detectLanguage } from '@/lib/ai';
import type { AIBackend, Language } from '@/lib/types';
import { addChildNodes } from '@/lib/store';

const AI_BACKENDS: { id: AIBackend; label: string; color: string }[] = [
  { id: 'gemini',  label: 'Gemini',  color: 'text-blue-400' },
  { id: 'groq',    label: 'Groq',    color: 'text-orange-400' },
  { id: 'mistral', label: 'Mistral', color: 'text-purple-400' },
];

const TRANSLATIONS = {
  en: {
    title: 'KAI-X',
    tagline: 'Galaxy Mind Map',
    placeholder: 'Enter a topic to explore...',
    create: 'Create Galaxy',
    creating: 'Generating...',
    sessions: 'Past Galaxies',
    noSessions: 'No saved galaxies yet',
    knowledgeMode: 'Knowledge Mode',
    language: 'Language',
    aiBackend: 'AI Engine',
    selectNode: 'Double-click a sphere to expand',
    sphereCount: 'spheres',
    save: 'Save',
    delete: 'Delete',
    root: 'ROOT',
    depth: 'Depth',
    children: 'children',
    expandHint: 'Double-click to expand',
  },
  pt: {
    title: 'KAI-X',
    tagline: 'Mapa Mental Galáctico',
    placeholder: 'Digite um tópico para explorar...',
    create: 'Criar Galáxia',
    creating: 'Gerando...',
    sessions: 'Galáxias Salvas',
    noSessions: 'Nenhuma galáxia salva',
    knowledgeMode: 'Modo Conhecimento',
    language: 'Idioma',
    aiBackend: 'Motor de IA',
    selectNode: 'Clique duplo numa esfera para expandir',
    sphereCount: 'esferas',
    save: 'Salvar',
    delete: 'Excluir',
    root: 'RAIZ',
    depth: 'Profundidade',
    children: 'filhos',
    expandHint: 'Clique duplo para expandir',
  },
} as const;

export default function Controls() {
  const router = useRouter();
  const store = useStore();
  const {
    sessions, nodes, selectedNodeId,
    aiBackend, language, isLoading,
    setAIBackend, setLanguage, setLoading,
    createSession, loadSession, deleteSession,
    persistSession, loadSessions,
  } = store;

  const [topic, setTopic] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const t = TRANSLATIONS[language];
  const nodeCount = Object.keys(nodes).length;
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load persisted sessions
    loadSessions();
    // Auto-detect language
    const detected = detectLanguage();
    setLanguage(detected);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (nodeCount > 0) persistSession();
    }, 30_000);
    return () => clearInterval(interval);
  }, [nodeCount, persistSession]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error(language === 'pt' ? 'Digite um tópico' : 'Enter a topic');
      return;
    }

    setLoading(true);
    try {
      // Create the root node
      createSession(trimmed);

      // Wait a tick for store to update, then expand root
      await new Promise((r) => setTimeout(r, 100));
      
      const currentNodes = useStore.getState().nodes;
      const rootId = Object.values(currentNodes).find((n) => n.depth === 0)?.id;
      
      if (rootId) {
        const concepts = await expandTopic(trimmed, undefined, aiBackend, language);
        addChildNodes(useStore.getState(), rootId, concepts);
      }

      setTopic('');
      toast.success(
        language === 'pt' ? '🌌 Galáxia criada!' : '🌌 Galaxy created!'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [topic, aiBackend, language, createSession, setLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 p-3 flex items-center gap-3">
        {/* Logo */}
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-display text-sm font-bold text-glow-cyan tracking-widest">
            KAI-X
          </span>
        </div>

        {/* Topic input */}
        <div className="flex-1 flex gap-2 max-w-xl">
          <input
            className="input-neon flex-1"
            placeholder={t.placeholder}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="btn-neon whitespace-nowrap flex items-center gap-1.5"
            onClick={handleCreate}
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? (
              <>
                <div className="spinner w-4 h-4" />
                <span>{t.creating}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:block">{t.create}</span>
              </>
            )}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Sphere counter */}
          {nodeCount > 0 && (
            <div className="glass rounded-lg px-3 py-1.5 font-mono text-xs text-slate-400">
              <span className="text-cyan-400 font-bold">{nodeCount}</span> {t.sphereCount}
            </div>
          )}

          {/* Sessions toggle */}
          <button
            className="btn-neon p-2"
            onClick={() => { setShowSessions(!showSessions); setShowSettings(false); }}
            title={t.sessions}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Settings toggle */}
          <button
            className="btn-neon p-2"
            onClick={() => { setShowSettings(!showSettings); setShowSessions(false); }}
            title="Settings"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Knowledge mode */}
          <button
            className="btn-neon p-2 border-purple-500/30 text-purple-400 hover:border-purple-400/70"
            onClick={() => router.push('/knowledge')}
            title={t.knowledgeMode}
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Settings dropdown ────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed top-16 right-3 z-50 glass rounded-xl p-4 w-64 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Settings</span>
            <button onClick={() => setShowSettings(false)}>
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </button>
          </div>

          {/* AI Backend */}
          <div className="mb-4">
            <p className="font-mono text-xs text-slate-500 mb-2 uppercase tracking-wider">{t.aiBackend}</p>
            <div className="flex flex-col gap-1.5">
              {AI_BACKENDS.map((b) => (
                <button
                  key={b.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-all
                    ${aiBackend === b.id
                      ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300'
                      : 'glass-hover glass text-slate-400 hover:text-slate-200'
                    }`}
                  onClick={() => setAIBackend(b.id)}
                >
                  <Zap className={`w-3.5 h-3.5 ${b.color}`} />
                  {b.label}
                  {aiBackend === b.id && (
                    <span className="ml-auto text-cyan-400 text-xs">●</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="font-mono text-xs text-slate-500 mb-2 uppercase tracking-wider">{t.language}</p>
            <div className="flex gap-2">
              {(['en', 'pt'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-mono transition-all
                    ${language === lang
                      ? 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300'
                      : 'glass text-slate-400 hover:text-slate-200'
                    }`}
                  onClick={() => setLanguage(lang)}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sessions panel ───────────────────────────────────────────── */}
      {showSessions && (
        <div className="fixed top-16 right-3 z-50 glass rounded-xl p-4 w-72 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">{t.sessions}</span>
            <div className="flex gap-2">
              <button
                className="font-mono text-xs text-cyan-400 hover:text-cyan-300"
                onClick={() => { persistSession(); toast.success(language === 'pt' ? 'Salvo!' : 'Saved!'); }}
              >
                {t.save}
              </button>
              <button onClick={() => setShowSessions(false)}>
                <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
              </button>
            </div>
          </div>

          {sessions.length === 0 ? (
            <p className="text-slate-500 font-mono text-xs text-center py-4">{t.noSessions}</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="glass glass-hover rounded-lg p-2.5 flex items-center gap-2 group cursor-pointer"
                  onClick={() => { loadSession(session.id); setShowSessions(false); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-slate-200 truncate">{session.rootTopic}</p>
                    <p className="font-mono text-xs text-slate-500">
                      {Object.keys(session.nodes).length} nodes • {new Date(session.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400/70 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Selected node info panel ─────────────────────────────────── */}
      {selectedNode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass rounded-xl px-5 py-3 animate-slide-up">
          <div className="flex items-center gap-4">
            <div>
              {selectedNode.depth === 0 && (
                <span className="font-mono text-xs text-cyan-400/60 uppercase tracking-widest">
                  {t.root}
                </span>
              )}
              <p className="font-display text-sm font-bold text-slate-100 mt-0.5">
                {selectedNode.label}
              </p>
              <p className="font-mono text-xs text-slate-500">
                {t.depth} {selectedNode.depth} · {selectedNode.children.length} {t.children}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 hidden sm:block border-l border-slate-700 pl-4">
              {t.expandHint}
            </div>
            <button
              className="ml-2"
              onClick={() => useStore.getState().setSelectedNode(null)}
            >
              <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state hint ─────────────────────────────────────────── */}
      {nodeCount === 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none">
          <p className="font-mono text-sm text-slate-600 animate-pulse">
            {t.placeholder}
          </p>
        </div>
      )}
    </>
  );
}
