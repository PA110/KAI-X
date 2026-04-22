# 🌌 KAI-X — Galaxy Mind Map

**KAI-X** is an AI-powered 3D mind map where ideas float as living spheres in a galaxy. Built with Next.js 14, Three.js (@react-three/fiber), Tailwind CSS, and Zustand.

---

## ✨ Features

- **3D Galaxy** — Floating spheres connected by neon lines, drifting with soft physics
- **AI Expansion** — Double-click any sphere to generate 5 related sub-concepts via AI
- **Multiple AI Backends** — Switch between Gemini, Groq, and Mistral
- **Knowledge Mode** — Flat topic list with AI summaries, key points, and study questions
- **Bilingual** — English and Portuguese (auto-detected from browser)
- **Persistent Sessions** — Auto-saved to localStorage every 30 seconds
- **Dark Glassmorphism UI** — Neon glow, orbital controls, responsive

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API keys

```bash
cp .env.example .env.local
```

Edit `.env.local` and add at least one AI backend key:

```env
# Google Gemini (free tier available)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq (free tier with fast inference)
GROQ_API_KEY=your_groq_api_key_here

# Mistral AI
MISTRAL_API_KEY=your_mistral_api_key_here
```

**Getting API keys:**
- **Gemini**: https://aistudio.google.com/app/apikey
- **Groq**: https://console.groq.com/keys  
- **Mistral**: https://console.mistral.ai/api-keys

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production

```bash
npm run build
npm start
```

---

## 🎮 How to Use

### Galaxy Mode (Home)
1. Type a topic in the search bar at the top
2. Press **Enter** or click **Create Galaxy**
3. A central sphere appears with 5 related concept spheres around it
4. **Single-click** a sphere to see its info
5. **Double-click** a sphere to expand it into 5 more sub-concepts
6. Use mouse to **orbit, zoom, and pan** the galaxy
7. Switch AI backends and language in the **Settings (⚙)** panel
8. Access past galaxies via the **Book icon (📖)**

### Knowledge Mode
1. Click the **Brain icon (🧠)** in the top bar
2. Browse all mapped topics in the left panel
3. Click any topic to get an AI-powered summary, key points, and study questions
4. Use the search box to filter topics

---

## 📁 Project Structure

```
kai-x/
├── app/
│   ├── page.tsx              # Home: 3D Galaxy
│   ├── knowledge/page.tsx    # Knowledge Mode
│   ├── layout.tsx            # Root layout with fonts
│   ├── globals.css           # Tailwind + CSS variables
│   └── api/ai/route.ts       # AI proxy (server-side)
├── components/
│   ├── Galaxy.tsx            # Three.js scene
│   ├── Sphere.tsx            # Individual sphere node
│   ├── Controls.tsx          # HUD overlay
│   └── KnowledgeList.tsx     # Knowledge mode UI
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── store.ts              # Zustand state
│   └── ai.ts                 # Client AI helpers
├── .env.example              # API key template
└── README.md
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Framework + API routes |
| @react-three/fiber | Three.js React renderer |
| @react-three/drei | Three.js helpers (OrbitControls, Stars, Text) |
| Three.js | 3D rendering |
| Zustand | Global state management |
| Tailwind CSS | Styling |
| react-hot-toast | Notifications |
| framer-motion | UI animations |
| Orbitron + Space Mono | Display fonts |

---

## ⚠️ Notes

- **Sphere limit**: Max 100 spheres per galaxy for performance
- **API keys**: Keys are server-side only (via Next.js API routes) — never exposed to browser
- **Mobile**: Orbit controls adapted for touch; pinch to zoom supported

---

## 📜 License

MIT
