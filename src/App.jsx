import { useState, useEffect, useCallback, useRef } from "react";

// ─── Storage Helper ───
const DB = {
  get: async (key) => {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  set: async (key, val) => {
    try { await window.storage.set(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },
  del: async (key) => {
    try { await window.storage.delete(key); return true; }
    catch { return false; }
  },
  list: async (prefix) => {
    try { const r = await window.storage.list(prefix); return r?.keys || []; }
    catch { return []; }
  }
};

// ─── Default Data ───
const DEFAULT_GROUPS = [
  {
    id: "g1",
    name: "General Knowledge",
    description: "Test your knowledge of the world around you",
    icon: "🌍",
    questions: [
      { id: "q1", text: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correct: 1, explanation: "Paris has been the capital of France since the 10th century." },
      { id: "q2", text: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2, explanation: "Mars appears red due to iron oxide (rust) on its surface." },
      { id: "q3", text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, explanation: "The Pacific Ocean covers about 63 million square miles." },
      { id: "q4", text: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correct: 2, explanation: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519." },
      { id: "q5", text: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2, explanation: "Au comes from the Latin word 'Aurum' meaning gold." },
    ]
  },
  {
    id: "g2",
    name: "Science & Nature",
    description: "Explore the wonders of science and the natural world",
    icon: "🔬",
    questions: [
      { id: "q6", text: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, explanation: "Plants absorb CO₂ during photosynthesis to produce glucose and oxygen." },
      { id: "q7", text: "What is the hardest natural substance on Earth?", options: ["Platinum", "Diamond", "Titanium", "Quartz"], correct: 1, explanation: "Diamond scores 10 on the Mohs hardness scale." },
      { id: "q8", text: "How many bones are in the adult human body?", options: ["186", "206", "226", "256"], correct: 1, explanation: "Adults have 206 bones. Babies are born with about 270 that fuse over time." },
      { id: "q9", text: "What is the speed of light approximately?", options: ["200,000 km/s", "300,000 km/s", "400,000 km/s", "150,000 km/s"], correct: 1, explanation: "Light travels at approximately 299,792 km/s in a vacuum." },
      { id: "q10", text: "Which element has the atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], correct: 1, explanation: "Hydrogen is the lightest and most abundant element in the universe." },
    ]
  },
  {
    id: "g3",
    name: "History",
    description: "Journey through the events that shaped our world",
    icon: "📜",
    questions: [
      { id: "q11", text: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, explanation: "WWII ended in 1945 with the surrender of Japan on September 2." },
      { id: "q12", text: "Who was the first President of the United States?", options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"], correct: 1, explanation: "George Washington served as the first President from 1789 to 1797." },
      { id: "q13", text: "The Great Wall of China was primarily built to protect against invasions from which group?", options: ["Japanese", "Mongolians", "Koreans", "Indians"], correct: 1, explanation: "The Great Wall was built primarily to protect against Mongol invasions." },
      { id: "q14", text: "Which ancient civilization built the pyramids at Giza?", options: ["Romans", "Greeks", "Egyptians", "Persians"], correct: 2, explanation: "The Giza pyramids were built by ancient Egyptians around 2560 BC." },
      { id: "q15", text: "What year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], correct: 1, explanation: "The RMS Titanic sank on April 15, 1912, after hitting an iceberg." },
    ]
  }
];

// ─── Utility ───
const genId = () => Math.random().toString(36).substring(2, 10);
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

// ─── Icon Components ───
const Icons = {
  Flag: ({ filled }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Arrow: ({ dir }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {dir === "left" ? <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></> :
       <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  Edit: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Star: ({ filled }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Gear: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
};

// ─── Styles (injected into document) ───
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&display=swap');
  
  :root {
    --bg-deep: #0a0a0f;
    --bg-card: #12121a;
    --bg-elevated: #1a1a26;
    --bg-hover: #222233;
    --border: #2a2a3d;
    --border-light: #3a3a55;
    --text-primary: #e8e6f0;
    --text-secondary: #9896a8;
    --text-muted: #6a6880;
    --accent: #7c6ef0;
    --accent-hover: #9488f5;
    --accent-glow: rgba(124,110,240,0.15);
    --accent-soft: rgba(124,110,240,0.08);
    --success: #34d399;
    --success-soft: rgba(52,211,153,0.1);
    --error: #f87171;
    --error-soft: rgba(248,113,113,0.1);
    --warning: #fbbf24;
    --warning-soft: rgba(251,191,36,0.1);
    --flag: #f59e0b;
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --shadow: 0 4px 24px rgba(0,0,0,0.3);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.4);
    --font-display: 'Fraunces', serif;
    --font-body: 'DM Sans', sans-serif;
    --transition: 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  
  body {
    font-family: var(--font-body);
    background: var(--bg-deep);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Noise Overlay ── */
  .noise-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* ── Nav ── */
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid var(--border);
    background: rgba(10,10,15,0.8);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-logo {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    cursor: pointer;
    letter-spacing: -0.5px;
  }
  .nav-actions { display: flex; gap: 8px; align-items: center; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    white-space: nowrap;
  }
  .btn:hover { background: var(--bg-hover); border-color: var(--border-light); }
  .btn-primary {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
  .btn-ghost { background: transparent; border-color: transparent; }
  .btn-ghost:hover { background: var(--bg-elevated); }
  .btn-danger { color: var(--error); }
  .btn-danger:hover { background: var(--error-soft); border-color: var(--error); }
  .btn-sm { padding: 6px 14px; font-size: 13px; }
  .btn-icon { padding: 8px; width: 36px; height: 36px; justify-content: center; }

  /* ── Input ── */
  .input, .textarea, .select {
    width: 100%;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 14px;
    transition: border-color var(--transition);
    outline: none;
  }
  .input:focus, .textarea:focus, .select:focus { border-color: var(--accent); }
  .textarea { resize: vertical; min-height: 80px; }
  .select { cursor: pointer; appearance: none; }
  .input-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .input-group { margin-bottom: 16px; }

  /* ── Cards ── */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px;
    transition: all var(--transition);
  }
  .card-hover:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), var(--shadow);
    transform: translateY(-2px);
  }

  /* ── Page Container ── */
  .page {
    max-width: 960px;
    margin: 0 auto;
    padding: 40px 24px;
    width: 100%;
    position: relative;
    z-index: 1;
    animation: fadeIn 0.3s ease;
  }
  .page-wide { max-width: 1100px; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  /* ── Section Heading ── */
  .section-title {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .section-subtitle {
    color: var(--text-secondary);
    font-size: 15px;
    margin-bottom: 32px;
    line-height: 1.5;
  }

  /* ── Group Grid ── */
  .group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  .group-card {
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .group-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--accent-soft), transparent);
    opacity: 0;
    transition: opacity var(--transition);
    border-radius: var(--radius-lg);
    pointer-events: none;
  }
  .group-card:hover::after { opacity: 1; }
  .group-icon { font-size: 36px; margin-bottom: 16px; display: block; }
  .group-name {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .group-desc {
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 16px;
  }
  .group-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  /* ── Quiz ── */
  .quiz-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .quiz-progress-bar {
    width: 100%;
    height: 4px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 32px;
  }
  .quiz-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), #a78bfa);
    border-radius: 2px;
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .quiz-counter {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .quiz-question {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 32px;
    letter-spacing: -0.3px;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 18px 22px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 15px;
    cursor: pointer;
    transition: all var(--transition);
    text-align: left;
    margin-bottom: 12px;
    position: relative;
    overflow: hidden;
  }
  .option-btn:hover:not(.option-disabled) {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .option-letter {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 13px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    flex-shrink: 0;
    transition: all var(--transition);
  }
  .option-correct {
    border-color: var(--success) !important;
    background: var(--success-soft) !important;
  }
  .option-correct .option-letter {
    background: var(--success);
    border-color: var(--success);
    color: white;
  }
  .option-wrong {
    border-color: var(--error) !important;
    background: var(--error-soft) !important;
  }
  .option-wrong .option-letter {
    background: var(--error);
    border-color: var(--error);
    color: white;
  }
  .option-disabled { cursor: default; }

  .explanation-box {
    margin-top: 20px;
    padding: 16px 20px;
    border-radius: var(--radius);
    background: var(--accent-soft);
    border: 1px solid rgba(124,110,240,0.2);
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    animation: slideUp 0.3s ease;
  }
  .explanation-box strong {
    color: var(--accent);
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .quiz-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 32px;
    gap: 12px;
  }
  .flag-btn {
    color: var(--text-muted);
    transition: color var(--transition);
  }
  .flag-btn.flagged { color: var(--flag); }

  /* ── Results ── */
  .results-hero {
    text-align: center;
    padding: 48px 24px;
    margin-bottom: 32px;
  }
  .results-score {
    font-family: var(--font-display);
    font-size: 72px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--success));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
    margin-bottom: 8px;
  }
  .results-label {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: 32px;
  }
  .results-stats {
    display: flex;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 32px;
  }
  .stat-chip {
    padding: 10px 20px;
    border-radius: var(--radius);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    font-size: 14px;
    font-weight: 500;
  }
  .stat-chip .stat-num { font-weight: 700; margin-right: 4px; }

  .wrong-list { margin-top: 24px; }
  .wrong-item {
    padding: 20px;
    border-radius: var(--radius);
    background: var(--bg-card);
    border: 1px solid var(--border);
    margin-bottom: 12px;
    animation: slideUp 0.3s ease;
  }
  .wrong-item-q {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 15px;
  }
  .wrong-item-detail { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
  .wrong-item-detail span { font-weight: 600; }
  .wrong-item-detail .wrong-answer { color: var(--error); }
  .wrong-item-detail .right-answer { color: var(--success); }

  /* ── Admin ── */
  .admin-section {
    margin-bottom: 32px;
    animation: fadeIn 0.3s ease;
  }
  .admin-group-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-radius: var(--radius);
    background: var(--bg-card);
    border: 1px solid var(--border);
    margin-bottom: 8px;
    gap: 12px;
  }
  .admin-group-item:hover { border-color: var(--border-light); }
  .admin-q-item {
    padding: 14px 18px;
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    margin-bottom: 6px;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .admin-q-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }
  .modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
    max-width: 560px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: scaleIn 0.2s ease;
    box-shadow: var(--shadow-lg);
  }
  .modal-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 24px;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
  }

  /* ── Login ── */
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 24px;
  }
  .login-card {
    max-width: 400px;
    width: 100%;
    text-align: center;
  }
  .login-card .group-icon { font-size: 48px; margin-bottom: 24px; }
  .login-card .section-title { margin-bottom: 4px; }

  /* ── History ── */
  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 8px;
  }

  /* ── Badge ── */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .badge-success { background: var(--success-soft); color: var(--success); }
  .badge-error { background: var(--error-soft); color: var(--error); }
  .badge-warning { background: var(--warning-soft); color: var(--warning); }
  .badge-accent { background: var(--accent-soft); color: var(--accent); }

  /* ── Tabs ── */
  .tabs {
    display: flex;
    gap: 4px;
    background: var(--bg-elevated);
    padding: 4px;
    border-radius: var(--radius);
    margin-bottom: 24px;
  }
  .tab {
    flex: 1;
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
  }
  .tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 14px 22px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
    z-index: 300;
    animation: slideUp 0.3s ease;
    box-shadow: var(--shadow);
  }
  .toast-success { border-color: var(--success); }
  .toast-error { border-color: var(--error); }

  /* ── Question Nav Dots ── */
  .q-dots {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    justify-content: center;
  }
  .q-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition);
    color: var(--text-muted);
  }
  .q-dot.current { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
  .q-dot.answered-correct { border-color: var(--success); background: var(--success-soft); color: var(--success); }
  .q-dot.answered-wrong { border-color: var(--error); background: var(--error-soft); color: var(--error); }
  .q-dot.flagged-dot { box-shadow: 0 0 0 2px var(--flag); }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .nav { padding: 12px 16px; }
    .nav-logo { font-size: 18px; }
    .page { padding: 24px 16px; }
    .section-title { font-size: 24px; }
    .quiz-question { font-size: 20px; }
    .results-score { font-size: 56px; }
    .group-grid { grid-template-columns: 1fr; }
    .quiz-actions { flex-wrap: wrap; }
    .modal { padding: 24px; }
  }
`;

// ─── Main App ───
export default function QuizApp() {
  const [state, setState] = useState({
    page: "login", // login, home, quiz, results, admin, history, flagged
    user: null,
    groups: [],
    currentGroup: null,
    currentQIndex: 0,
    answers: {},    // { questionId: selectedIndex }
    flagged: {},    // { questionId: true }
    history: [],    // [{ groupId, groupName, score, total, date, wrong: [...] }]
    toast: null,
    adminTab: "groups", // groups, add-group, edit-group, bulk-import
    editingGroup: null,
    editingQuestion: null,
    showModal: null,
    loading: true,
  });

  const s = state;
  const set = (updates) => setState(prev => ({ ...prev, ...updates }));
  const toastTimeout = useRef(null);

  const showToast = (msg, type = "success") => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    set({ toast: { msg, type } });
    toastTimeout.current = setTimeout(() => set({ toast: null }), 3000);
  };

  // ─── Init ───
  useEffect(() => {
    (async () => {
      const user = await DB.get("quiz-user");
      const groups = await DB.get("quiz-groups");
      const history = await DB.get("quiz-history");
      set({
        user: user || null,
        groups: groups || DEFAULT_GROUPS,
        history: history || [],
        page: user ? "home" : "login",
        loading: false,
      });
      if (!groups) await DB.set("quiz-groups", DEFAULT_GROUPS);
    })();
  }, []);

  // ─── Persistence ───
  const saveGroups = async (groups) => {
    set({ groups });
    await DB.set("quiz-groups", groups);
  };
  const saveHistory = async (history) => {
    set({ history });
    await DB.set("quiz-history", history);
  };

  // ─── Inject Styles ───
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // ─── Auth ───
  const [loginForm, setLoginForm] = useState({ username: "", password: "", isSignup: false, displayName: "" });

  const handleLogin = async () => {
    const { username, password, isSignup, displayName } = loginForm;
    if (!username.trim() || !password.trim()) return showToast("Please fill in all fields", "error");
    if (isSignup && !displayName.trim()) return showToast("Please enter your name", "error");

    const users = (await DB.get("quiz-users")) || {};

    if (isSignup) {
      if (users[username]) return showToast("Username already taken", "error");
      const user = { username, password, displayName: displayName.trim(), isAdmin: Object.keys(users).length === 0 };
      users[username] = user;
      await DB.set("quiz-users", users);
      await DB.set("quiz-user", user);
      set({ user, page: "home" });
      showToast(`Welcome, ${user.displayName}!`);
    } else {
      const user = users[username];
      if (!user || user.password !== password) return showToast("Invalid credentials", "error");
      await DB.set("quiz-user", user);
      set({ user, page: "home" });
      showToast(`Welcome back, ${user.displayName}!`);
    }
  };

  const handleLogout = async () => {
    await DB.del("quiz-user");
    set({ user: null, page: "login" });
    setLoginForm({ username: "", password: "", isSignup: false, displayName: "" });
  };

  // ─── Quiz Logic ───
  const startQuiz = (group) => {
    set({ currentGroup: group, currentQIndex: 0, answers: {}, flagged: {}, page: "quiz" });
  };

  const selectAnswer = (qId, idx) => {
    if (s.answers[qId] !== undefined) return;
    set({ answers: { ...s.answers, [qId]: idx } });
  };

  const toggleFlag = (qId) => {
    const f = { ...s.flagged };
    if (f[qId]) delete f[qId];
    else f[qId] = true;
    set({ flagged: f });
  };

  const finishQuiz = async () => {
    const group = s.currentGroup;
    const qs = group.questions;
    let correct = 0;
    const wrong = [];
    qs.forEach(q => {
      if (s.answers[q.id] === q.correct) correct++;
      else wrong.push({ text: q.text, yourAnswer: q.options[s.answers[q.id]] || "Skipped", correctAnswer: q.options[q.correct], explanation: q.explanation });
    });
    const entry = { groupId: group.id, groupName: group.name, score: correct, total: qs.length, date: new Date().toISOString(), wrong };
    const newHistory = [entry, ...s.history].slice(0, 50);
    await saveHistory(newHistory);
    set({ page: "results", lastResult: entry });
  };

  // ─── Admin ───
  const [groupForm, setGroupForm] = useState({ name: "", description: "", icon: "📝" });
  const [qForm, setQForm] = useState({ text: "", options: ["", "", "", ""], correct: 0, explanation: "" });
  const [bulkText, setBulkText] = useState("");

  const resetGroupForm = () => setGroupForm({ name: "", description: "", icon: "📝" });
  const resetQForm = () => setQForm({ text: "", options: ["", "", "", ""], correct: 0, explanation: "" });

  const addGroup = async () => {
    if (!groupForm.name.trim()) return showToast("Group name required", "error");
    const g = { id: genId(), ...groupForm, questions: [] };
    await saveGroups([...s.groups, g]);
    resetGroupForm();
    showToast("Group created!");
    set({ adminTab: "groups" });
  };

  const deleteGroup = async (id) => {
    await saveGroups(s.groups.filter(g => g.id !== id));
    showToast("Group deleted");
    set({ showModal: null });
  };

  const updateGroup = async (id, updates) => {
    await saveGroups(s.groups.map(g => g.id === id ? { ...g, ...updates } : g));
    showToast("Group updated");
  };

  const addQuestion = async (groupId) => {
    if (!qForm.text.trim() || qForm.options.some(o => !o.trim())) return showToast("Fill in all fields", "error");
    const q = { id: genId(), ...qForm };
    await saveGroups(s.groups.map(g => g.id === groupId ? { ...g, questions: [...g.questions, q] } : g));
    resetQForm();
    showToast("Question added!");
  };

  const updateQuestion = async (groupId, qId, updates) => {
    await saveGroups(s.groups.map(g =>
      g.id === groupId ? { ...g, questions: g.questions.map(q => q.id === qId ? { ...q, ...updates } : q) } : g
    ));
    showToast("Question updated");
  };

  const deleteQuestion = async (groupId, qId) => {
    await saveGroups(s.groups.map(g =>
      g.id === groupId ? { ...g, questions: g.questions.filter(q => q.id !== qId) } : g
    ));
    showToast("Question deleted");
  };

  const importBulk = async (groupId) => {
    try {
      const lines = bulkText.trim().split("\n").filter(l => l.trim());
      const questions = [];
      let i = 0;
      while (i < lines.length) {
        const text = lines[i]?.trim();
        const opts = [];
        for (let j = 1; j <= 4; j++) {
          if (i + j < lines.length) opts.push(lines[i + j]?.replace(/^[A-D][\.\)]\s*/, "").trim());
        }
        const correctLine = lines[i + 5]?.trim();
        const correctIdx = correctLine ? "ABCD".indexOf(correctLine.toUpperCase().replace("ANSWER:", "").replace("CORRECT:", "").trim()) : 0;
        const explanation = lines[i + 6]?.trim() || "";
        if (text && opts.length === 4) {
          questions.push({ id: genId(), text, options: opts, correct: clamp(correctIdx, 0, 3), explanation });
        }
        i += 7;
      }
      if (questions.length === 0) return showToast("No valid questions found. Check format.", "error");
      await saveGroups(s.groups.map(g =>
        g.id === groupId ? { ...g, questions: [...g.questions, ...questions] } : g
      ));
      setBulkText("");
      showToast(`${questions.length} questions imported!`);
    } catch (e) {
      showToast("Import failed. Check format.", "error");
    }
  };

  // ─── Render ───
  if (s.loading) return (
    <div className="app-container noise-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div className="section-title" style={{ fontSize: 24 }}>Loading...</div>
      </div>
    </div>
  );

  const currentQ = s.currentGroup?.questions?.[s.currentQIndex];
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="app-container noise-bg">
      {/* ── Nav ── */}
      {s.page !== "login" && (
        <nav className="nav">
          <div className="nav-logo" onClick={() => set({ page: "home" })}>QuizVault</div>
          <div className="nav-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => set({ page: "home" })}>
              <Icons.Home /> Home
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => set({ page: "history" })}>
              <Icons.Chart /> History
            </button>
            {s.user?.isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => set({ page: "admin", adminTab: "groups" })}>
                <Icons.Gear /> Admin
              </button>
            )}
            <button className="btn btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </nav>
      )}

      {/* ── Login ── */}
      {s.page === "login" && (
        <div className="login-page">
          <div className="login-card card" style={{ animation: "scaleIn 0.4s ease" }}>
            <div className="group-icon">🧠</div>
            <div className="section-title">QuizVault</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: 14 }}>
              Test your knowledge across multiple topics
            </p>
            <div className="tabs" style={{ marginBottom: 24 }}>
              <button className={`tab ${!loginForm.isSignup ? "active" : ""}`} onClick={() => setLoginForm(f => ({ ...f, isSignup: false }))}>Sign In</button>
              <button className={`tab ${loginForm.isSignup ? "active" : ""}`} onClick={() => setLoginForm(f => ({ ...f, isSignup: true }))}>Sign Up</button>
            </div>
            {loginForm.isSignup && (
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input className="input" placeholder="Your name" value={loginForm.displayName}
                  onChange={e => setLoginForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Username</label>
              <input className="input" placeholder="Enter username" value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="Enter password" value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={handleLogin}>
              {loginForm.isSignup ? "Create Account" : "Sign In"}
            </button>
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 16 }}>
              {loginForm.isSignup ? "First account gets admin access" : "Don't have an account? Sign up above"}
            </p>
          </div>
        </div>
      )}

      {/* ── Home ── */}
      {s.page === "home" && (
        <div className="page">
          <div className="section-title">Choose a Quiz</div>
          <p className="section-subtitle">Welcome back, {s.user?.displayName}. Select a topic to get started.</p>
          <div className="group-grid">
            {s.groups.map(g => (
              <div key={g.id} className="card card-hover group-card" onClick={() => g.questions.length > 0 ? startQuiz(g) : showToast("This group has no questions yet", "error")}>
                <span className="group-icon">{g.icon}</span>
                <div className="group-name">{g.name}</div>
                <div className="group-desc">{g.description}</div>
                <div className="group-meta">
                  <span>{g.questions.length} questions</span>
                  {s.history.find(h => h.groupId === g.id) && (
                    <span style={{ color: "var(--success)" }}>
                      Best: {Math.max(...s.history.filter(h => h.groupId === g.id).map(h => Math.round(h.score / h.total * 100)))}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {s.groups.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
              No quiz groups available. {s.user?.isAdmin ? "Go to Admin to create one." : "Ask an admin to add some!"}
            </div>
          )}
        </div>
      )}

      {/* ── Quiz ── */}
      {s.page === "quiz" && currentQ && (
        <div className="page">
          <div className="quiz-progress-bar">
            <div className="quiz-progress-fill" style={{ width: `${((s.currentQIndex + 1) / s.currentGroup.questions.length) * 100}%` }} />
          </div>

          {/* Dots nav */}
          <div className="q-dots">
            {s.currentGroup.questions.map((q, i) => {
              let cls = "q-dot";
              if (i === s.currentQIndex) cls += " current";
              else if (s.answers[q.id] !== undefined) {
                cls += s.answers[q.id] === q.correct ? " answered-correct" : " answered-wrong";
              }
              if (s.flagged[q.id]) cls += " flagged-dot";
              return <button key={q.id} className={cls} onClick={() => set({ currentQIndex: i })}>{i + 1}</button>;
            })}
          </div>

          <div className="quiz-header">
            <div className="quiz-counter">
              Question {s.currentQIndex + 1} of {s.currentGroup.questions.length}
            </div>
            <button
              className={`btn btn-ghost btn-sm flag-btn ${s.flagged[currentQ.id] ? "flagged" : ""}`}
              onClick={() => toggleFlag(currentQ.id)}
              title={s.flagged[currentQ.id] ? "Unflag question" : "Flag for review"}
            >
              <Icons.Flag filled={!!s.flagged[currentQ.id]} />
              {s.flagged[currentQ.id] ? "Flagged" : "Flag"}
            </button>
          </div>

          <div className="quiz-question">{currentQ.text}</div>

          <div>
            {currentQ.options.map((opt, idx) => {
              const answered = s.answers[currentQ.id] !== undefined;
              const isSelected = s.answers[currentQ.id] === idx;
              const isCorrect = idx === currentQ.correct;
              let cls = "option-btn";
              if (answered) {
                cls += " option-disabled";
                if (isCorrect) cls += " option-correct";
                else if (isSelected && !isCorrect) cls += " option-wrong";
              }
              return (
                <button key={idx} className={cls} onClick={() => selectAnswer(currentQ.id, idx)}>
                  <span className="option-letter">
                    {answered && isCorrect ? <Icons.Check /> : answered && isSelected && !isCorrect ? <Icons.X /> : letters[idx]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {s.answers[currentQ.id] !== undefined && currentQ.explanation && (
            <div className="explanation-box">
              <strong>Explanation</strong>
              {currentQ.explanation}
            </div>
          )}

          <div className="quiz-actions">
            <button
              className="btn btn-sm"
              disabled={s.currentQIndex === 0}
              onClick={() => set({ currentQIndex: s.currentQIndex - 1 })}
              style={{ opacity: s.currentQIndex === 0 ? 0.4 : 1 }}
            >
              <Icons.Arrow dir="left" /> Previous
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              {Object.keys(s.flagged).length > 0 && (
                <button className="btn btn-sm" style={{ color: "var(--flag)" }}
                  onClick={() => set({ page: "flagged" })}>
                  <Icons.Flag filled /> Review Flagged ({Object.keys(s.flagged).length})
                </button>
              )}
            </div>

            {s.currentQIndex < s.currentGroup.questions.length - 1 ? (
              <button className="btn btn-primary btn-sm" onClick={() => set({ currentQIndex: s.currentQIndex + 1 })}>
                Next <Icons.Arrow dir="right" />
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={finishQuiz}>
                Finish Quiz <Icons.Arrow dir="right" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Flagged Review ── */}
      {s.page === "flagged" && (
        <div className="page">
          <div className="section-title">Flagged Questions</div>
          <p className="section-subtitle">Review the questions you flagged for later.</p>
          {Object.keys(s.flagged).length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No flagged questions</div>
          ) : (
            s.currentGroup.questions.filter(q => s.flagged[q.id]).map((q, i) => (
              <div key={q.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span className="badge badge-warning">Flagged</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    const idx = s.currentGroup.questions.findIndex(x => x.id === q.id);
                    set({ page: "quiz", currentQIndex: idx });
                  }}>Go to question</button>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{q.text}</div>
                {s.answers[q.id] !== undefined ? (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Your answer: <span style={{ color: s.answers[q.id] === q.correct ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                      {q.options[s.answers[q.id]]}
                    </span>
                    {s.answers[q.id] !== q.correct && (
                      <> — Correct: <span style={{ color: "var(--success)", fontWeight: 600 }}>{q.options[q.correct]}</span></>
                    )}
                  </div>
                ) : (
                  <span className="badge badge-accent">Not answered</span>
                )}
              </div>
            ))
          )}
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => set({ page: "quiz" })}>
            <Icons.Arrow dir="left" /> Back to Quiz
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {s.page === "results" && s.lastResult && (
        <div className="page">
          <div className="results-hero">
            <div className="results-score">{Math.round(s.lastResult.score / s.lastResult.total * 100)}%</div>
            <div className="results-label">
              {s.lastResult.score === s.lastResult.total ? "Perfect score! 🎉" :
               s.lastResult.score / s.lastResult.total >= 0.8 ? "Great job! 🌟" :
               s.lastResult.score / s.lastResult.total >= 0.5 ? "Not bad! Keep going 💪" :
               "Keep practicing! 📚"}
            </div>
            <div className="results-stats">
              <div className="stat-chip">
                <span className="stat-num" style={{ color: "var(--success)" }}>{s.lastResult.score}</span> Correct
              </div>
              <div className="stat-chip">
                <span className="stat-num" style={{ color: "var(--error)" }}>{s.lastResult.total - s.lastResult.score}</span> Wrong
              </div>
              <div className="stat-chip">
                <span className="stat-num">{s.lastResult.total}</span> Total
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => startQuiz(s.currentGroup)}>Retry This Quiz</button>
              <button className="btn" onClick={() => set({ page: "home" })}>Choose Another</button>
            </div>
          </div>

          {s.lastResult.wrong.length > 0 && (
            <div className="wrong-list">
              <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 16 }}>Questions You Missed</div>
              {s.lastResult.wrong.map((w, i) => (
                <div key={i} className="wrong-item">
                  <div className="wrong-item-q">{w.text}</div>
                  <div className="wrong-item-detail">
                    Your answer: <span className="wrong-answer">{w.yourAnswer}</span>
                    {" · "}Correct: <span className="right-answer">{w.correctAnswer}</span>
                  </div>
                  {w.explanation && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{w.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History ── */}
      {s.page === "history" && (
        <div className="page">
          <div className="section-title">Quiz History</div>
          <p className="section-subtitle">Your past quiz attempts and scores.</p>
          {s.history.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No quiz history yet. Take a quiz!</div>
          ) : (
            s.history.map((h, i) => (
              <div key={i} className="history-item">
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.groupName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(h.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`badge ${h.score / h.total >= 0.8 ? "badge-success" : h.score / h.total >= 0.5 ? "badge-warning" : "badge-error"}`}>
                    {h.score}/{h.total} ({Math.round(h.score / h.total * 100)}%)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Admin ── */}
      {s.page === "admin" && s.user?.isAdmin && (
        <div className="page page-wide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Admin Panel</div>
          </div>
          <p className="section-subtitle">Manage quiz groups and questions.</p>

          <div className="tabs" style={{ maxWidth: 500 }}>
            <button className={`tab ${s.adminTab === "groups" ? "active" : ""}`} onClick={() => set({ adminTab: "groups" })}>Groups</button>
            <button className={`tab ${s.adminTab === "add-group" ? "active" : ""}`} onClick={() => { resetGroupForm(); set({ adminTab: "add-group" }); }}>New Group</button>
          </div>

          {/* Groups List */}
          {s.adminTab === "groups" && (
            <div className="admin-section">
              {s.groups.map(g => (
                <div key={g.id}>
                  <div className="admin-group-item">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 24 }}>{g.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{g.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{g.questions.length} questions</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit group"
                        onClick={() => set({ editingGroup: g.id, adminTab: "edit-group" })}>
                        <Icons.Edit />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm btn-danger" title="Delete group"
                        onClick={() => set({ showModal: { type: "delete-group", groupId: g.id, name: g.name } })}>
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {s.groups.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No groups yet.</div>}
            </div>
          )}

          {/* Add Group */}
          {s.adminTab === "add-group" && (
            <div className="admin-section card">
              <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 20 }}>Create New Group</div>
              <div className="input-group">
                <label className="input-label">Icon (emoji)</label>
                <input className="input" value={groupForm.icon} onChange={e => setGroupForm(f => ({ ...f, icon: e.target.value }))} style={{ width: 80 }} />
              </div>
              <div className="input-group">
                <label className="input-label">Group Name</label>
                <input className="input" placeholder="e.g., Mathematics" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="textarea" placeholder="Brief description..." value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={addGroup}>
                <Icons.Plus /> Create Group
              </button>
            </div>
          )}

          {/* Edit Group */}
          {s.adminTab === "edit-group" && s.editingGroup && (() => {
            const g = s.groups.find(x => x.id === s.editingGroup);
            if (!g) return null;
            return (
              <div className="admin-section">
                <button className="btn btn-ghost btn-sm" onClick={() => set({ adminTab: "groups", editingGroup: null })} style={{ marginBottom: 16 }}>
                  <Icons.Arrow dir="left" /> Back to Groups
                </button>

                {/* Group Details Card */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 20 }}>Edit Group: {g.name}</div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ width: 80 }}>
                      <label className="input-label">Icon</label>
                      <input className="input" value={g.icon} onChange={e => updateGroup(g.id, { icon: e.target.value })} />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label className="input-label">Name</label>
                      <input className="input" value={g.name} onChange={e => updateGroup(g.id, { name: e.target.value })} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea className="textarea" value={g.description} onChange={e => updateGroup(g.id, { description: e.target.value })} />
                  </div>
                </div>

                {/* Questions */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Questions ({g.questions.length})</div>
                  </div>
                  {g.questions.map((q, qi) => (
                    <div key={q.id} className="admin-q-item">
                      <span className="admin-q-text">{qi + 1}. {q.text}</span>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit"
                          onClick={() => {
                            setQForm({ text: q.text, options: [...q.options], correct: q.correct, explanation: q.explanation || "" });
                            set({ editingQuestion: q.id, showModal: { type: "edit-question", groupId: g.id } });
                          }}>
                          <Icons.Edit />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm btn-danger" title="Delete"
                          onClick={() => deleteQuestion(g.id, q.id)}>
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  ))}
                  {g.questions.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "8px 0" }}>No questions yet.</div>}
                </div>

                {/* Add Question */}
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Add Question</div>
                  <div className="input-group">
                    <label className="input-label">Question</label>
                    <textarea className="textarea" placeholder="Enter the question..." value={qForm.text}
                      onChange={e => setQForm(f => ({ ...f, text: e.target.value }))} />
                  </div>
                  {qForm.options.map((opt, i) => (
                    <div className="input-group" key={i}>
                      <label className="input-label">
                        Option {letters[i]}
                        {qForm.correct === i && <span style={{ color: "var(--success)", marginLeft: 8 }}>✓ Correct</span>}
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="input" placeholder={`Option ${letters[i]}`} value={opt}
                          onChange={e => {
                            const opts = [...qForm.options];
                            opts[i] = e.target.value;
                            setQForm(f => ({ ...f, options: opts }));
                          }} />
                        <button className={`btn btn-sm ${qForm.correct === i ? "btn-primary" : ""}`}
                          onClick={() => setQForm(f => ({ ...f, correct: i }))}>
                          {qForm.correct === i ? "✓" : "Set Correct"}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="input-group">
                    <label className="input-label">Explanation (optional)</label>
                    <textarea className="textarea" placeholder="Why this is the correct answer..." value={qForm.explanation}
                      onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={() => addQuestion(g.id)}>
                    <Icons.Plus /> Add Question
                  </button>
                </div>

                {/* Bulk Import */}
                <div className="card">
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Bulk Import</div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                    Paste questions in this format (7 lines per question):
                    <br /><code style={{ background: "var(--bg-deep)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                      Question text → A. Option → B. Option → C. Option → D. Option → Answer: B → Explanation
                    </code>
                  </p>
                  <textarea className="textarea" style={{ minHeight: 140 }} placeholder={`What is 2+2?\nA. 3\nB. 4\nC. 5\nD. 6\nB\nTwo plus two equals four.`}
                    value={bulkText} onChange={e => setBulkText(e.target.value)} />
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => importBulk(g.id)}>
                    <Icons.Upload /> Import Questions
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Modals ── */}
      {s.showModal?.type === "delete-group" && (
        <div className="modal-overlay" onClick={() => set({ showModal: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete "{s.showModal.name}"?</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              This will permanently delete this group and all its questions. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => set({ showModal: null })}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteGroup(s.showModal.groupId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {s.showModal?.type === "edit-question" && (
        <div className="modal-overlay" onClick={() => { set({ showModal: null, editingQuestion: null }); resetQForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Edit Question</div>
            <div className="input-group">
              <label className="input-label">Question</label>
              <textarea className="textarea" value={qForm.text}
                onChange={e => setQForm(f => ({ ...f, text: e.target.value }))} />
            </div>
            {qForm.options.map((opt, i) => (
              <div className="input-group" key={i}>
                <label className="input-label">
                  Option {letters[i]}
                  {qForm.correct === i && <span style={{ color: "var(--success)", marginLeft: 8 }}>✓ Correct</span>}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" value={opt}
                    onChange={e => {
                      const opts = [...qForm.options];
                      opts[i] = e.target.value;
                      setQForm(f => ({ ...f, options: opts }));
                    }} />
                  <button className={`btn btn-sm ${qForm.correct === i ? "btn-primary" : ""}`}
                    onClick={() => setQForm(f => ({ ...f, correct: i }))}>
                    {qForm.correct === i ? "✓" : "Set"}
                  </button>
                </div>
              </div>
            ))}
            <div className="input-group">
              <label className="input-label">Explanation</label>
              <textarea className="textarea" value={qForm.explanation}
                onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { set({ showModal: null, editingQuestion: null }); resetQForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                updateQuestion(s.showModal.groupId, s.editingQuestion, { ...qForm });
                set({ showModal: null, editingQuestion: null });
                resetQForm();
              }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {s.toast && (
        <div className={`toast toast-${s.toast.type}`}>{s.toast.msg}</div>
      )}
    </div>
  );
}