// components/KnowledgeList.tsx
// Knowledge mode: flat list of all topics + AI-powered detail panel.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Brain,
  ArrowLeft,
  Search,
  ChevronRight,
  HelpCircle,
  List,
  Lightbulb,
  BookOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { useStore, getAllTopics } from '@/lib/store';
import { summarizeTopic } from '@/lib/ai';
import type { KnowledgeData, Language } from '@/lib/types';

const TRANSLATIONS = {
  en: {
    title: 'Knowledge Mode',
    back: 'Back to Galaxy',
    search: 'Search topics...',
    noTopics: 'No topics in your galaxies yet.\nCreate a galaxy first!',
    summary: 'Summary',
    keyPoints: 'Key Points',
    questions: 'Study Questions',
    loading: 'Generating knowledge...',
    error: 'Failed to load knowledge',
    selectTopic: 'Select a topic to explore its knowledge',
    topics: 'topics',
    aiPowered: 'AI-powered insights',
  },
  pt: {
    title: 'Modo Conhecimento',
    back: 'Voltar à Galáxia',
    search: 'Buscar tópicos...',
    noTopics: 'Nenhum tópico nas suas galáxias.\nCrie uma galáxia primeiro!',
    summary: 'Resumo',
    keyPoints: 'Pontos-Chave',
    questions: 'Perguntas de Estudo',
    loading: 'Gerando conhecimento...',
    error: 'Falha ao carregar conhecimento',
    selectTopic: 'Selecione um tópico para explorar seu conhecimento',
    topics: 'tópicos',
    aiPowered: 'Insights com IA',
  },
} as const;

export default function KnowledgeList() {
  const router = useRouter();
  const store = useStore();
  const { aiBackend, language, loadSessions } = store;

  const [search, setSearch] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [knowledgeData, setKnowledgeData] = useState<KnowledgeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = TRANSLATIONS[language as Language] ?? TRANSLATIONS.en;

  // ── Load topics ────────────────────────────────────────────────────────────

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const allTopics = getAllTopics(store);
    setTopics(allTopics);
  }, [store.sessions, store.nodes]);

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = topics.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  // ── Select topic ───────────────────────────────────────────────────────────

  const handleSelectTopic = async (topic: string) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null);
      setKnowledgeData(null);
      return;
    }
    setSelectedTopic(topic);
    setKnowledgeData(null);
    setIsLoading(true);

    try {
      const data = await summarizeTopic(topic, aiBackend, language as Language);
      setKnowledgeData({ topic, ...data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.error;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-slate-800/50 px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
        <button
          className="btn-neon p-2 flex items-center gap-2"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:block text-xs">{t.back}</span>
        </button>

        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h1 className="font-display text-lg font-bold text-glow-purple tracking-widest">
            {t.title}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          {t.aiPowered}
          <span className="glass rounded-md px-2 py-0.5 text-purple-400">
            {aiBackend}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: topic list ─────────────────────────────────── */}
        <aside className="w-64 shrink-0 glass border-r border-slate-800/50 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                className="input-neon pl-8 py-2 text-xs"
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="font-mono text-xs text-slate-500 mt-2 pl-1">
              {filtered.length} {t.topics}
            </p>
          </div>

          {/* Topic list */}
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="font-mono text-xs text-slate-500 whitespace-pre-line">{t.noTopics}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.map((topic) => (
                  <button
                    key={topic}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 transition-all font-mono text-sm
                      ${selectedTopic === topic
                        ? 'bg-purple-500/10 border border-purple-500/40 text-purple-300'
                        : 'glass glass-hover text-slate-300 hover:text-slate-100'
                      }`}
                    onClick={() => handleSelectTopic(topic)}
                  >
                    <span className="flex-1 truncate">{topic}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform
                      ${selectedTopic === topic ? 'text-purple-400 rotate-90' : 'text-slate-600'}
                    `} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Right panel: knowledge detail ─────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6">
          {!selectedTopic ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 
                flex items-center justify-center mb-6 animate-float">
                <Brain className="w-10 h-10 text-purple-400/60" />
              </div>
              <p className="font-display text-lg text-slate-500 tracking-wider">{t.selectTopic}</p>
            </div>
          ) : isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="spinner w-10 h-10" />
              <p className="font-mono text-sm text-slate-400 animate-pulse">{t.loading}</p>
            </div>
          ) : knowledgeData ? (
            <div className="max-w-2xl mx-auto animate-fade-in">
              {/* Topic heading */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="font-mono text-xs text-purple-400/60 uppercase tracking-widest mb-1">
                    {t.title}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-slate-100">
                    {knowledgeData.topic}
                  </h2>
                </div>
                <button
                  className="p-2 text-slate-500 hover:text-slate-300"
                  onClick={() => { setSelectedTopic(null); setKnowledgeData(null); }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary */}
              <section className="glass rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    {t.summary}
                  </h3>
                </div>
                <p className="text-slate-300 leading-relaxed text-sm font-body">
                  {knowledgeData.summary}
                </p>
              </section>

              {/* Key points */}
              <section className="glass rounded-xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <h3 className="font-mono text-sm font-bold text-yellow-400 uppercase tracking-wider">
                    {t.keyPoints}
                  </h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {knowledgeData.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="font-mono text-xs text-yellow-500/60 shrink-0 mt-0.5 w-5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-slate-300 text-sm leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Study questions */}
              <section className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <h3 className="font-mono text-sm font-bold text-purple-400 uppercase tracking-wider">
                    {t.questions}
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {knowledgeData.questions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 
                        border border-purple-500/15"
                    >
                      <span className="text-purple-400 font-mono text-xs shrink-0 mt-0.5">
                        Q{i + 1}
                      </span>
                      <span className="text-slate-300 text-sm leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Regenerate */}
              <div className="mt-4 flex justify-center">
                <button
                  className="btn-neon text-xs border-purple-500/30 text-purple-400 
                    hover:border-purple-400/70 flex items-center gap-2"
                  onClick={() => handleSelectTopic(knowledgeData.topic)}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Regenerate with {aiBackend}
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
