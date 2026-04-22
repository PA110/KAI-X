// app/knowledge/page.tsx
// Knowledge mode: explore AI summaries of all mapped concepts.

import KnowledgeList from '@/components/KnowledgeList';

export const metadata = {
  title: 'KAI-X — Knowledge Mode',
  description: 'Explore AI-powered summaries and study questions for your mapped concepts.',
};

export default function KnowledgePage() {
  return <KnowledgeList />;
}
