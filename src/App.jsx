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
    id: "g1", name: "General Knowledge", description: "Test your knowledge of the world around you", icon: "🌍",
    questions: [
      { id: "q1", text: "What is the capital of France?", options: ["London", "Paris", "Berlin", "Madrid"], correct: 1, explanation: "Paris has been the capital of France since the 10th century." },
      { id: "q2", text: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correct: 2, explanation: "Mars appears red due to iron oxide (rust) on its surface." },
      { id: "q3", text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, explanation: "The Pacific Ocean covers about 63 million square miles." },
      { id: "q4", text: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correct: 2, explanation: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519." },
      { id: "q5", text: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2, explanation: "Au comes from the Latin word 'Aurum' meaning gold." },
    ]
  },
  {
    id: "g2", name: "Science & Nature", description: "Explore the wonders of science and the natural world", icon: "🔬",
    questions: [
      { id: "q6", text: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct: 2, explanation: "Plants absorb CO₂ during photosynthesis to produce glucose and oxygen." },
      { id: "q7", text: "What is the hardest natural substance on Earth?", options: ["Platinum", "Diamond", "Titanium", "Quartz"], correct: 1, explanation: "Diamond scores 10 on the Mohs hardness scale." },
      { id: "q8", text: "How many bones are in the adult human body?", options: ["186", "206", "226", "256"], correct: 1, explanation: "Adults have 206 bones. Babies are born with about 270 that fuse over time." },
      { id: "q9", text: "What is the speed of light approximately?", options: ["200,000 km/s", "300,000 km/s", "400,000 km/s", "150,000 km/s"], correct: 1, explanation: "Light travels at approximately 299,792 km/s in a vacuum." },
      { id: "q10", text: "Which element has the atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], correct: 1, explanation: "Hydrogen is the lightest and most abundant element in the universe." },
    ]
  },
  {
    id: "g3", name: "History", description: "Journey through the events that shaped our world", icon: "📜",
    questions: [
      { id: "q11", text: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, explanation: "WWII ended in 1945 with the surrender of Japan on September 2." },
      { id: "q12", text: "Who was the first President of the United States?", options: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"], correct: 1, explanation: "George Washington served as the first President from 1789 to 1797." },
      { id: "q13", text: "The Great Wall of China was primarily built to protect against invasions from which group?", options: ["Japanese", "Mongolians", "Koreans", "Indians"], correct: 1, explanation: "The Great Wall was built primarily to protect against Mongol invasions." },
      { id: "q14", text: "Which ancient civilization built the pyramids at Giza?", options: ["Romans", "Greeks", "Egyptians", "Persians"], correct: 2, explanation: "The Giza pyramids were built by ancient Egyptians around 2560 BC." },
      { id: "q15", text: "What year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], correct: 1, explanation: "The RMS Titanic sank on April 15, 1912, after hitting an iceberg." },
    ]
  }
];

const genId = () => Math.random().toString(36).substring(2, 10);
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Icons ───
const Icons = {
  Flag: ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Arrow: ({ dir }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{dir === "left" ? <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></> : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}</svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Chart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Gear: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Ban: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  CheckCircle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Shuffle: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
};

// ─── Styles ───
const getStyles = (theme) => `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&display=swap');
  
  :root {
    --bg-deep: ${theme === "dark" ? "#0a0a0f" : "#f5f5f8"};
    --bg-card: ${theme === "dark" ? "#12121a" : "#ffffff"};
    --bg-elevated: ${theme === "dark" ? "#1a1a26" : "#eeeef2"};
    --bg-hover: ${theme === "dark" ? "#222233" : "#e4e4ec"};
    --border: ${theme === "dark" ? "#2a2a3d" : "#d8d8e4"};
    --border-light: ${theme === "dark" ? "#3a3a55" : "#c0c0d0"};
    --text-primary: ${theme === "dark" ? "#e8e6f0" : "#1a1a2e"};
    --text-secondary: ${theme === "dark" ? "#9896a8" : "#5a5870"};
    --text-muted: ${theme === "dark" ? "#6a6880" : "#8888a0"};
    --accent: #7c6ef0;
    --accent-hover: #9488f5;
    --accent-glow: rgba(124,110,240,0.15);
    --accent-soft: ${theme === "dark" ? "rgba(124,110,240,0.08)" : "rgba(124,110,240,0.06)"};
    --success: #34d399;
    --success-soft: ${theme === "dark" ? "rgba(52,211,153,0.1)" : "rgba(52,211,153,0.08)"};
    --error: #f87171;
    --error-soft: ${theme === "dark" ? "rgba(248,113,113,0.1)" : "rgba(248,113,113,0.08)"};
    --warning: #fbbf24;
    --warning-soft: ${theme === "dark" ? "rgba(251,191,36,0.1)" : "rgba(251,191,36,0.08)"};
    --flag: #f59e0b;
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --shadow: ${theme === "dark" ? "0 4px 24px rgba(0,0,0,0.3)" : "0 4px 24px rgba(0,0,0,0.06)"};
    --shadow-lg: ${theme === "dark" ? "0 8px 40px rgba(0,0,0,0.4)" : "0 8px 40px rgba(0,0,0,0.1)"};
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
    transition: background 0.3s, color 0.3s;
  }
  .app-container { min-height: 100vh; display: flex; flex-direction: column; }
  .noise-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    opacity: ${theme === "dark" ? "0.03" : "0.015"};
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px; border-bottom: 1px solid var(--border);
    background: ${theme === "dark" ? "rgba(10,10,15,0.8)" : "rgba(245,245,248,0.85)"};
    backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100;
  }
  .nav-logo {
    font-family: var(--font-display); font-size: 22px; font-weight: 700;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    cursor: pointer; letter-spacing: -0.5px;
  }
  .nav-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--bg-elevated);
    color: var(--text-primary); font-family: var(--font-body);
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all var(--transition); white-space: nowrap;
  }
  .btn:hover { background: var(--bg-hover); border-color: var(--border-light); }
  .btn-primary { background: var(--accent); border-color: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
  .btn-ghost { background: transparent; border-color: transparent; }
  .btn-ghost:hover { background: var(--bg-elevated); }
  .btn-danger { color: var(--error); }
  .btn-danger:hover { background: var(--error-soft); border-color: var(--error); }
  .btn-success { color: var(--success); }
  .btn-success:hover { background: var(--success-soft); border-color: var(--success); }
  .btn-sm { padding: 6px 14px; font-size: 13px; }
  .btn-icon { padding: 8px; width: 36px; height: 36px; justify-content: center; }

  .input, .textarea, .select {
    width: 100%; padding: 10px 14px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--bg-deep);
    color: var(--text-primary); font-family: var(--font-body);
    font-size: 14px; transition: border-color var(--transition); outline: none;
  }
  .input:focus, .textarea:focus, .select:focus { border-color: var(--accent); }
  .textarea { resize: vertical; min-height: 80px; }
  .input-label {
    display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;
  }
  .input-group { margin-bottom: 16px; }

  .card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 28px; transition: all var(--transition);
  }
  .card-hover:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent), var(--shadow);
    transform: translateY(-2px);
  }

  .page {
    max-width: 960px; margin: 0 auto; padding: 40px 24px;
    width: 100%; position: relative; z-index: 1; animation: fadeIn 0.3s ease;
  }
  .page-wide { max-width: 1100px; }

  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }

  .section-title { font-family: var(--font-display); font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
  .section-subtitle { color: var(--text-secondary); font-size: 15px; margin-bottom: 32px; line-height: 1.5; }

  .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .group-card { cursor: pointer; position: relative; overflow: hidden; }
  .group-card::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--accent-soft), transparent);
    opacity: 0; transition: opacity var(--transition); border-radius: var(--radius-lg); pointer-events: none;
  }
  .group-card:hover::after { opacity: 1; }
  .group-icon { font-size: 36px; margin-bottom: 16px; display: block; }
  .group-name { font-family: var(--font-display); font-size: 20px; font-weight: 600; margin-bottom: 6px; }
  .group-desc { color: var(--text-secondary); font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
  .group-meta { display: flex; gap: 16px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }

  .quiz-progress-bar { width: 100%; height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; margin-bottom: 32px; }
  .quiz-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #a78bfa); border-radius: 2px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }
  .quiz-counter { font-size: 13px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
  .quiz-question { font-family: var(--font-display); font-size: 26px; font-weight: 600; line-height: 1.4; margin-bottom: 32px; letter-spacing: -0.3px; }

  .option-btn {
    display: flex; align-items: center; gap: 16px; width: 100%;
    padding: 18px 22px; border-radius: var(--radius);
    border: 1px solid var(--border); background: var(--bg-card);
    color: var(--text-primary); font-family: var(--font-body);
    font-size: 15px; cursor: pointer; transition: all var(--transition);
    text-align: left; margin-bottom: 12px; position: relative; overflow: hidden;
  }
  .option-btn:hover:not(.option-disabled) { border-color: var(--accent); background: var(--accent-soft); }
  .option-letter {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; font-size: 13px; background: var(--bg-elevated);
    border: 1px solid var(--border); flex-shrink: 0; transition: all var(--transition);
  }
  .option-correct { border-color: var(--success) !important; background: var(--success-soft) !important; }
  .option-correct .option-letter { background: var(--success); border-color: var(--success); color: white; }
  .option-wrong { border-color: var(--error) !important; background: var(--error-soft) !important; }
  .option-wrong .option-letter { background: var(--error); border-color: var(--error); color: white; }
  .option-disabled { cursor: default; }

  .explanation-box {
    margin-top: 20px; padding: 16px 20px; border-radius: var(--radius);
    background: var(--accent-soft); border: 1px solid rgba(124,110,240,0.2);
    font-size: 14px; line-height: 1.6; color: var(--text-secondary); animation: slideUp 0.3s ease;
  }
  .explanation-box strong { color: var(--accent); display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; }

  .quiz-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
  .flag-btn { color: var(--text-muted); transition: color var(--transition); }
  .flag-btn.flagged { color: var(--flag); }

  .results-hero { text-align: center; padding: 48px 24px; margin-bottom: 32px; }
  .results-score {
    font-family: var(--font-display); font-size: 72px; font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--success));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    line-height: 1; margin-bottom: 8px;
  }
  .results-label { font-size: 16px; color: var(--text-secondary); margin-bottom: 32px; }
  .results-stats { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
  .stat-chip {
    padding: 10px 20px; border-radius: var(--radius);
    background: var(--bg-elevated); border: 1px solid var(--border);
    font-size: 14px; font-weight: 500;
  }
  .stat-chip .stat-num { font-weight: 700; margin-right: 4px; }

  .wrong-item {
    padding: 20px; border-radius: var(--radius);
    background: var(--bg-card); border: 1px solid var(--border);
    margin-bottom: 12px; animation: slideUp 0.3s ease;
  }
  .wrong-item-q { font-weight: 600; margin-bottom: 8px; font-size: 15px; }
  .wrong-item-detail { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
  .wrong-item-detail .wrong-answer { color: var(--error); font-weight: 600; }
  .wrong-item-detail .right-answer { color: var(--success); font-weight: 600; }

  .admin-group-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-radius: var(--radius);
    background: var(--bg-card); border: 1px solid var(--border);
    margin-bottom: 8px; gap: 12px;
  }
  .admin-group-item:hover { border-color: var(--border-light); }
  .admin-q-item {
    padding: 14px 18px; border-radius: var(--radius-sm);
    background: var(--bg-elevated); border: 1px solid var(--border);
    margin-bottom: 6px; font-size: 14px; display: flex;
    justify-content: space-between; align-items: center; gap: 12px;
  }
  .admin-q-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px); display: flex; align-items: center;
    justify-content: center; z-index: 200; padding: 24px; animation: fadeIn 0.2s ease;
  }
  .modal {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 32px; max-width: 560px;
    width: 100%; max-height: 90vh; overflow-y: auto; animation: scaleIn 0.2s ease;
    box-shadow: var(--shadow-lg);
  }
  .modal-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 24px; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }

  .login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
  .login-card { max-width: 400px; width: 100%; text-align: center; }
  .login-card .group-icon { font-size: 48px; margin-bottom: 24px; }

  .history-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); margin-bottom: 8px;
  }

  .badge {
    display: inline-flex; align-items: center; padding: 3px 10px;
    border-radius: 20px; font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .badge-success { background: var(--success-soft); color: var(--success); }
  .badge-error { background: var(--error-soft); color: var(--error); }
  .badge-warning { background: var(--warning-soft); color: var(--warning); }
  .badge-accent { background: var(--accent-soft); color: var(--accent); }

  .tabs {
    display: flex; gap: 4px; background: var(--bg-elevated);
    padding: 4px; border-radius: var(--radius); margin-bottom: 24px;
  }
  .tab {
    flex: 1; padding: 10px 16px; border-radius: var(--radius-sm);
    border: none; background: transparent; color: var(--text-secondary);
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all var(--transition);
  }
  .tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

  .toast {
    position: fixed; bottom: 24px; right: 24px;
    padding: 14px 22px; background: var(--bg-elevated);
    border: 1px solid var(--border); border-radius: var(--radius);
    font-size: 14px; z-index: 300; animation: slideUp 0.3s ease; box-shadow: var(--shadow);
  }
  .toast-success { border-color: var(--success); }
  .toast-error { border-color: var(--error); }

  .q-dots { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 24px; justify-content: center; }
  .q-dot {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--border); background: var(--bg-elevated);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; cursor: pointer;
    transition: all var(--transition); color: var(--text-muted);
  }
  .q-dot.current { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
  .q-dot.answered-correct { border-color: var(--success); background: var(--success-soft); color: var(--success); }
  .q-dot.answered-wrong { border-color: var(--error); background: var(--error-soft); color: var(--error); }
  .q-dot.flagged-dot { box-shadow: 0 0 0 2px var(--flag); }

  /* User management table */
  .user-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); margin-bottom: 8px; gap: 12px; flex-wrap: wrap;
  }
  .user-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px; }
  .user-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--accent-soft); display: flex; align-items: center;
    justify-content: center; color: var(--accent); font-weight: 700; font-size: 16px;
    flex-shrink: 0;
  }
  .user-stats {
    display: flex; gap: 16px; font-size: 12px; color: var(--text-muted);
    flex-wrap: wrap;
  }
  .user-actions { display: flex; gap: 4px; }

  /* Pending banner */
  .pending-page {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; padding: 24px; text-align: center;
  }
  .pending-card { max-width: 440px; width: 100%; }
  .pending-icon { font-size: 64px; margin-bottom: 24px; display: block; animation: pulse 2s infinite; }

  /* Notification dot */
  .notif-dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--error);
    position: absolute; top: -2px; right: -2px;
  }

  @media (max-width: 640px) {
    .nav { padding: 12px 16px; }
    .nav-logo { font-size: 18px; }
    .nav-actions { gap: 4px; }
    .page { padding: 24px 16px; }
    .section-title { font-size: 24px; }
    .quiz-question { font-size: 20px; }
    .results-score { font-size: 56px; }
    .group-grid { grid-template-columns: 1fr; }
    .modal { padding: 24px; }
    .user-row { flex-direction: column; align-items: flex-start; }
  }
`;

// ─── Main App ───
export default function QuizApp() {
  const [state, setState] = useState({
    page: "login",
    user: null,
    users: {},
    groups: [],
    currentGroup: null,
    shuffledQuestions: [],
    currentQIndex: 0,
    answers: {},
    flagged: {},
    history: [],
    allHistory: {},
    toast: null,
    adminTab: "groups",
    editingGroup: null,
    editingQuestion: null,
    showModal: null,
    loading: true,
    theme: "dark",
  });

  const s = state;
  const set = (u) => setState(p => ({ ...p, ...u }));
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
      const users = (await DB.get("quiz-users")) || {};
      const groups = await DB.get("quiz-groups");
      const history = await DB.get("quiz-history");
      const allHistory = (await DB.get("quiz-all-history")) || {};
      const theme = (await DB.get("quiz-theme")) || "dark";
      set({
        user: user || null,
        users,
        groups: groups || DEFAULT_GROUPS,
        history: history || [],
        allHistory,
        theme,
        page: user ? (user.status === "pending" ? "pending" : "home") : "login",
        loading: false,
      });
      if (!groups) await DB.set("quiz-groups", DEFAULT_GROUPS);
    })();
  }, []);

  // ─── Inject styles ───
  useEffect(() => {
    const el = document.getElementById("quiz-styles") || document.createElement("style");
    el.id = "quiz-styles";
    el.textContent = getStyles(s.theme);
    if (!el.parentNode) document.head.appendChild(el);
  }, [s.theme]);

  const toggleTheme = async () => {
    const t = s.theme === "dark" ? "light" : "dark";
    set({ theme: t });
    await DB.set("quiz-theme", t);
  };

  // ─── Persistence ───
  const saveGroups = async (groups) => { set({ groups }); await DB.set("quiz-groups", groups); };
  const saveHistory = async (history) => { set({ history }); await DB.set("quiz-history", history); };
  const saveUsers = async (users) => { set({ users }); await DB.set("quiz-users", users); };
  const saveAllHistory = async (allHistory) => { set({ allHistory }); await DB.set("quiz-all-history", allHistory); };

  // ─── Auth ───
  const [loginForm, setLoginForm] = useState({ username: "", password: "", isSignup: false, displayName: "" });

  const handleLogin = async () => {
    const { username, password, isSignup, displayName } = loginForm;
    if (!username.trim() || !password.trim()) return showToast("Please fill in all fields", "error");
    if (isSignup && !displayName.trim()) return showToast("Please enter your name", "error");

    const users = (await DB.get("quiz-users")) || {};

    if (isSignup) {
      if (users[username]) return showToast("Username already taken", "error");
      const isFirst = Object.keys(users).length === 0;
      const user = {
        username, password, displayName: displayName.trim(),
        isAdmin: isFirst,
        status: isFirst ? "approved" : "pending",
        createdAt: new Date().toISOString(),
      };
      users[username] = user;
      await DB.set("quiz-users", users);
      await DB.set("quiz-user", user);
      set({ user, users, page: isFirst ? "home" : "pending" });
      if (isFirst) showToast(`Welcome, ${user.displayName}! You are the admin.`);
      else showToast("Account created! Waiting for admin approval.");
    } else {
      const user = users[username];
      if (!user || user.password !== password) return showToast("Invalid credentials", "error");
      if (user.status === "banned") return showToast("Your account has been suspended", "error");
      await DB.set("quiz-user", user);
      const userHistory = (await DB.get("quiz-all-history")) || {};
      set({
        user, users, history: userHistory[username] || [],
        page: user.status === "pending" ? "pending" : "home"
      });
      if (user.status === "approved") showToast(`Welcome back, ${user.displayName}!`);
    }
  };

  const handleLogout = async () => {
    await DB.del("quiz-user");
    set({ user: null, page: "login", history: [] });
    setLoginForm({ username: "", password: "", isSignup: false, displayName: "" });
  };

  // ─── User Management ───
  const updateUserStatus = async (username, status) => {
    const users = { ...s.users };
    if (!users[username]) return;
    users[username] = { ...users[username], status };
    await saveUsers(users);
    if (s.user?.username === username) {
      const u = { ...s.user, status };
      set({ user: u });
      await DB.set("quiz-user", u);
    }
    showToast(`User ${username} ${status === "approved" ? "approved" : status === "banned" ? "banned" : "updated"}`);
  };

  const deleteUser = async (username) => {
    const users = { ...s.users };
    delete users[username];
    await saveUsers(users);
    const ah = { ...s.allHistory };
    delete ah[username];
    await saveAllHistory(ah);
    showToast(`User ${username} deleted`);
    set({ showModal: null });
  };

  const toggleAdmin = async (username) => {
    const users = { ...s.users };
    if (!users[username]) return;
    users[username] = { ...users[username], isAdmin: !users[username].isAdmin };
    await saveUsers(users);
    showToast(`${username} is ${users[username].isAdmin ? "now an admin" : "no longer an admin"}`);
  };

  // ─── Quiz ───
  const startQuiz = (group) => {
    const shuffled = shuffle(group.questions);
    set({ currentGroup: group, shuffledQuestions: shuffled, currentQIndex: 0, answers: {}, flagged: {}, page: "quiz" });
  };

  const selectAnswer = (qId, idx) => {
    if (s.answers[qId] !== undefined) return;
    set({ answers: { ...s.answers, [qId]: idx } });
  };

  const toggleFlag = (qId) => {
    const f = { ...s.flagged };
    if (f[qId]) delete f[qId]; else f[qId] = true;
    set({ flagged: f });
  };

  const finishQuiz = async () => {
    const qs = s.shuffledQuestions;
    let correct = 0;
    const wrong = [];
    qs.forEach(q => {
      if (s.answers[q.id] === q.correct) correct++;
      else wrong.push({ text: q.text, yourAnswer: q.options[s.answers[q.id]] || "Skipped", correctAnswer: q.options[q.correct], explanation: q.explanation });
    });
    const entry = { groupId: s.currentGroup.id, groupName: s.currentGroup.name, score: correct, total: qs.length, date: new Date().toISOString(), wrong };
    const newHistory = [entry, ...s.history].slice(0, 50);
    await saveHistory(newHistory);
    // Save to all history
    const ah = { ...s.allHistory };
    ah[s.user.username] = newHistory;
    await saveAllHistory(ah);
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
    await saveGroups([...s.groups, { id: genId(), ...groupForm, questions: [] }]);
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
  };

  const addQuestion = async (groupId) => {
    if (!qForm.text.trim() || qForm.options.some(o => !o.trim())) return showToast("Fill in all fields", "error");
    await saveGroups(s.groups.map(g => g.id === groupId ? { ...g, questions: [...g.questions, { id: genId(), ...qForm }] } : g));
    resetQForm();
    showToast("Question added!");
  };

  const updateQuestion = async (groupId, qId, updates) => {
    await saveGroups(s.groups.map(g => g.id === groupId ? { ...g, questions: g.questions.map(q => q.id === qId ? { ...q, ...updates } : q) } : g));
    showToast("Question updated");
  };

  const deleteQuestion = async (groupId, qId) => {
    await saveGroups(s.groups.map(g => g.id === groupId ? { ...g, questions: g.questions.filter(q => q.id !== qId) } : g));
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
      if (questions.length === 0) return showToast("No valid questions found", "error");
      await saveGroups(s.groups.map(g => g.id === groupId ? { ...g, questions: [...g.questions, ...questions] } : g));
      setBulkText("");
      showToast(`${questions.length} questions imported!`);
    } catch { showToast("Import failed", "error"); }
  };

  // ─── Computed ───
  const pendingUsers = Object.values(s.users).filter(u => u.status === "pending");
  const pendingCount = pendingUsers.length;
  const letters = ["A", "B", "C", "D"];

  const getUserStats = (username) => {
    const h = s.allHistory[username] || [];
    if (h.length === 0) return { quizzes: 0, avgScore: 0, bestScore: 0 };
    const scores = h.map(e => Math.round(e.score / e.total * 100));
    return {
      quizzes: h.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
    };
  };

  if (s.loading) return (
    <div className="app-container noise-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="section-title" style={{ fontSize: 24 }}>Loading...</div>
    </div>
  );

  const currentQ = s.shuffledQuestions?.[s.currentQIndex];

  return (
    <div className="app-container noise-bg">
      {/* ── Nav ── */}
      {s.page !== "login" && s.page !== "pending" && (
        <nav className="nav">
          <div className="nav-logo" onClick={() => set({ page: "home" })}>QuizVault</div>
          <div className="nav-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => set({ page: "home" })}><Icons.Home /> Home</button>
            <button className="btn btn-ghost btn-sm" onClick={() => set({ page: "history" })}><Icons.Chart /> History</button>
            {s.user?.isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => set({ page: "admin", adminTab: "groups" })} style={{ position: "relative" }}>
                <Icons.Gear /> Admin
                {pendingCount > 0 && <span className="notif-dot" />}
              </button>
            )}
            <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleTheme} title="Toggle theme">
              {s.theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <button className="btn btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </nav>
      )}

      {/* ── Login ── */}
      {s.page === "login" && (
        <div className="login-page">
          <div className="login-card card" style={{ animation: "scaleIn 0.4s ease" }}>
            <span className="group-icon" style={{ fontSize: 48, marginBottom: 24, display: "block" }}>🧠</span>
            <div className="section-title">QuizVault</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: 14 }}>Test your knowledge across multiple topics</p>
            <div style={{ position: "absolute", top: 16, right: 16 }}>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleTheme}>
                {s.theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
              </button>
            </div>
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
              {loginForm.isSignup ? "Your account will need admin approval before you can access quizzes" : "Don't have an account? Sign up above"}
            </p>
          </div>
        </div>
      )}

      {/* ── Pending Approval ── */}
      {s.page === "pending" && (
        <div className="pending-page">
          <div className="pending-card card">
            <span className="pending-icon">⏳</span>
            <div className="section-title" style={{ marginBottom: 12 }}>Awaiting Approval</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
              Your account has been created successfully. Please wait for an administrator to approve your access. You'll be able to take quizzes once approved.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn" onClick={async () => {
                const users = (await DB.get("quiz-users")) || {};
                const u = users[s.user?.username];
                if (u && u.status === "approved") {
                  await DB.set("quiz-user", u);
                  set({ user: u, users, page: "home" });
                  showToast("You've been approved! Welcome!");
                } else {
                  showToast("Still pending. Please check back later.", "error");
                }
              }}>Check Status</button>
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </div>
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
              <div key={g.id} className="card card-hover group-card" onClick={() => g.questions.length > 0 ? startQuiz(g) : showToast("No questions yet", "error")}>
                <span className="group-icon">{g.icon}</span>
                <div className="group-name">{g.name}</div>
                <div className="group-desc">{g.description}</div>
                <div className="group-meta">
                  <span>{g.questions.length} questions</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icons.Shuffle /> Shuffled</span>
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
            <div className="quiz-progress-fill" style={{ width: `${((s.currentQIndex + 1) / s.shuffledQuestions.length) * 100}%` }} />
          </div>
          <div className="q-dots">
            {s.shuffledQuestions.map((q, i) => {
              let cls = "q-dot";
              if (i === s.currentQIndex) cls += " current";
              else if (s.answers[q.id] !== undefined) cls += s.answers[q.id] === q.correct ? " answered-correct" : " answered-wrong";
              if (s.flagged[q.id]) cls += " flagged-dot";
              return <button key={q.id} className={cls} onClick={() => set({ currentQIndex: i })}>{i + 1}</button>;
            })}
          </div>
          <div className="quiz-header">
            <div className="quiz-counter">Question {s.currentQIndex + 1} of {s.shuffledQuestions.length}</div>
            <button className={`btn btn-ghost btn-sm flag-btn ${s.flagged[currentQ.id] ? "flagged" : ""}`}
              onClick={() => toggleFlag(currentQ.id)}>
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
            <div className="explanation-box"><strong>Explanation</strong>{currentQ.explanation}</div>
          )}
          <div className="quiz-actions">
            <button className="btn btn-sm" disabled={s.currentQIndex === 0}
              onClick={() => set({ currentQIndex: s.currentQIndex - 1 })}
              style={{ opacity: s.currentQIndex === 0 ? 0.4 : 1 }}>
              <Icons.Arrow dir="left" /> Previous
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.keys(s.flagged).length > 0 && (
                <button className="btn btn-sm" style={{ color: "var(--flag)" }}
                  onClick={() => set({ page: "flagged" })}>
                  <Icons.Flag filled /> Review ({Object.keys(s.flagged).length})
                </button>
              )}
            </div>
            {s.currentQIndex < s.shuffledQuestions.length - 1 ? (
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

      {/* ── Flagged ── */}
      {s.page === "flagged" && (
        <div className="page">
          <div className="section-title">Flagged Questions</div>
          <p className="section-subtitle">Review the questions you flagged.</p>
          {Object.keys(s.flagged).length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No flagged questions</div>
          ) : s.shuffledQuestions.filter(q => s.flagged[q.id]).map(q => (
            <div key={q.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="badge badge-warning">Flagged</span>
                <button className="btn btn-ghost btn-sm" onClick={() => {
                  set({ page: "quiz", currentQIndex: s.shuffledQuestions.findIndex(x => x.id === q.id) });
                }}>Go to question</button>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{q.text}</div>
              {s.answers[q.id] !== undefined ? (
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Your answer: <span style={{ color: s.answers[q.id] === q.correct ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                    {q.options[s.answers[q.id]]}
                  </span>
                  {s.answers[q.id] !== q.correct && <> — Correct: <span style={{ color: "var(--success)", fontWeight: 600 }}>{q.options[q.correct]}</span></>}
                </div>
              ) : <span className="badge badge-accent">Not answered</span>}
            </div>
          ))}
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
               s.lastResult.score / s.lastResult.total >= 0.5 ? "Not bad! Keep going 💪" : "Keep practicing! 📚"}
            </div>
            <div className="results-stats">
              <div className="stat-chip"><span className="stat-num" style={{ color: "var(--success)" }}>{s.lastResult.score}</span> Correct</div>
              <div className="stat-chip"><span className="stat-num" style={{ color: "var(--error)" }}>{s.lastResult.total - s.lastResult.score}</span> Wrong</div>
              <div className="stat-chip"><span className="stat-num">{s.lastResult.total}</span> Total</div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => startQuiz(s.currentGroup)}>Retry This Quiz</button>
              <button className="btn" onClick={() => set({ page: "home" })}>Choose Another</button>
            </div>
          </div>
          {s.lastResult.wrong.length > 0 && (
            <div>
              <div style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 16 }}>Questions You Missed</div>
              {s.lastResult.wrong.map((w, i) => (
                <div key={i} className="wrong-item">
                  <div className="wrong-item-q">{w.text}</div>
                  <div className="wrong-item-detail">
                    Your answer: <span className="wrong-answer">{w.yourAnswer}</span>{" · "}Correct: <span className="right-answer">{w.correctAnswer}</span>
                  </div>
                  {w.explanation && <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>{w.explanation}</div>}
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
          ) : s.history.map((h, i) => (
            <div key={i} className="history-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{h.groupName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {new Date(h.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span className={`badge ${h.score / h.total >= 0.8 ? "badge-success" : h.score / h.total >= 0.5 ? "badge-warning" : "badge-error"}`}>
                {h.score}/{h.total} ({Math.round(h.score / h.total * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Admin ── */}
      {s.page === "admin" && s.user?.isAdmin && (
        <div className="page page-wide">
          <div className="section-title">Admin Panel</div>
          <p className="section-subtitle">Manage quiz groups, questions, and users.</p>

          <div className="tabs" style={{ maxWidth: 600 }}>
            <button className={`tab ${s.adminTab === "groups" ? "active" : ""}`} onClick={() => set({ adminTab: "groups" })}>Groups</button>
            <button className={`tab ${s.adminTab === "add-group" ? "active" : ""}`} onClick={() => { resetGroupForm(); set({ adminTab: "add-group" }); }}>New Group</button>
            <button className={`tab ${s.adminTab === "users" ? "active" : ""}`} onClick={() => set({ adminTab: "users" })} style={{ position: "relative" }}>
              Users {pendingCount > 0 && <span style={{ background: "var(--error)", color: "white", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>{pendingCount}</span>}
            </button>
          </div>

          {/* ── Users Tab ── */}
          {s.adminTab === "users" && (
            <div>
              {/* Pending Users */}
              {pendingUsers.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--warning)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icons.Clock /> Pending Approval ({pendingUsers.length})
                  </div>
                  {pendingUsers.map(u => (
                    <div key={u.username} className="user-row" style={{ borderColor: "var(--warning)", borderStyle: "dashed" }}>
                      <div className="user-info">
                        <div className="user-avatar">{u.displayName?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>@{u.username} · Signed up {new Date(u.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="user-actions">
                        <button className="btn btn-sm btn-success" onClick={() => updateUserStatus(u.username, "approved")}>
                          <Icons.CheckCircle /> Approve
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => updateUserStatus(u.username, "banned")}>
                          <Icons.Ban /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* All Users */}
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>All Users ({Object.keys(s.users).length})</div>
              {Object.values(s.users).sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0)).map(u => {
                const stats = getUserStats(u.username);
                return (
                  <div key={u.username} className="user-row">
                    <div className="user-info">
                      <div className="user-avatar" style={{ background: u.isAdmin ? "var(--accent-soft)" : undefined, color: u.isAdmin ? "var(--accent)" : undefined }}>
                        {u.displayName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                          {u.displayName}
                          {u.isAdmin && <span className="badge badge-accent">Admin</span>}
                          {u.status === "pending" && <span className="badge badge-warning">Pending</span>}
                          {u.status === "banned" && <span className="badge badge-error">Banned</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>@{u.username}</div>
                      </div>
                    </div>
                    <div className="user-stats">
                      <span><strong>{stats.quizzes}</strong> quizzes</span>
                      <span>Avg: <strong>{stats.avgScore}%</strong></span>
                      <span>Best: <strong>{stats.bestScore}%</strong></span>
                    </div>
                    <div className="user-actions">
                      {u.username !== s.user.username && (
                        <>
                          {u.status === "pending" && (
                            <button className="btn btn-sm btn-success" onClick={() => updateUserStatus(u.username, "approved")}>
                              <Icons.CheckCircle />
                            </button>
                          )}
                          {u.status !== "banned" ? (
                            <button className="btn btn-sm btn-ghost" onClick={() => updateUserStatus(u.username, "banned")} title="Ban user">
                              <Icons.Ban />
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-ghost btn-success" onClick={() => updateUserStatus(u.username, "approved")} title="Unban user">
                              <Icons.CheckCircle />
                            </button>
                          )}
                          <button className="btn btn-sm btn-ghost" onClick={() => toggleAdmin(u.username)} title={u.isAdmin ? "Remove admin" : "Make admin"}>
                            <Icons.Shield />
                          </button>
                          <button className="btn btn-sm btn-ghost btn-danger" onClick={() => set({ showModal: { type: "delete-user", username: u.username, name: u.displayName } })} title="Delete user">
                            <Icons.Trash />
                          </button>
                        </>
                      )}
                      {u.username === s.user.username && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>You</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Groups Tab ── */}
          {s.adminTab === "groups" && (
            <div>
              {s.groups.map(g => (
                <div key={g.id} className="admin-group-item">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 24 }}>{g.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{g.questions.length} questions</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => set({ editingGroup: g.id, adminTab: "edit-group" })}><Icons.Edit /></button>
                    <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => set({ showModal: { type: "delete-group", groupId: g.id, name: g.name } })}><Icons.Trash /></button>
                  </div>
                </div>
              ))}
              {s.groups.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No groups yet.</div>}
            </div>
          )}

          {/* ── Add Group ── */}
          {s.adminTab === "add-group" && (
            <div className="card">
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
              <button className="btn btn-primary" onClick={addGroup}><Icons.Plus /> Create Group</button>
            </div>
          )}

          {/* ── Edit Group ── */}
          {s.adminTab === "edit-group" && s.editingGroup && (() => {
            const g = s.groups.find(x => x.id === s.editingGroup);
            if (!g) return null;
            return (
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => set({ adminTab: "groups", editingGroup: null })} style={{ marginBottom: 16 }}>
                  <Icons.Arrow dir="left" /> Back to Groups
                </button>
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
                <div className="card" style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Questions ({g.questions.length})</div>
                  {g.questions.map((q, qi) => (
                    <div key={q.id} className="admin-q-item">
                      <span className="admin-q-text">{qi + 1}. {q.text}</span>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => {
                          setQForm({ text: q.text, options: [...q.options], correct: q.correct, explanation: q.explanation || "" });
                          set({ editingQuestion: q.id, showModal: { type: "edit-question", groupId: g.id } });
                        }}><Icons.Edit /></button>
                        <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={() => deleteQuestion(g.id, q.id)}><Icons.Trash /></button>
                      </div>
                    </div>
                  ))}
                  {g.questions.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No questions yet.</div>}
                </div>
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
                        Option {letters[i]} {qForm.correct === i && <span style={{ color: "var(--success)", marginLeft: 8 }}>✓ Correct</span>}
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="input" placeholder={`Option ${letters[i]}`} value={opt}
                          onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm(f => ({ ...f, options: o })); }} />
                        <button className={`btn btn-sm ${qForm.correct === i ? "btn-primary" : ""}`}
                          onClick={() => setQForm(f => ({ ...f, correct: i }))}>{qForm.correct === i ? "✓" : "Set Correct"}</button>
                      </div>
                    </div>
                  ))}
                  <div className="input-group">
                    <label className="input-label">Explanation (optional)</label>
                    <textarea className="textarea" placeholder="Why this is the correct answer..." value={qForm.explanation}
                      onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={() => addQuestion(g.id)}><Icons.Plus /> Add Question</button>
                </div>
                <div className="card">
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Bulk Import</div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
                    Paste questions (7 lines each): Question → A. Option → B. Option → C. Option → D. Option → Answer letter → Explanation
                  </p>
                  <textarea className="textarea" style={{ minHeight: 140 }} placeholder={`What is 2+2?\nA. 3\nB. 4\nC. 5\nD. 6\nB\nTwo plus two equals four.`}
                    value={bulkText} onChange={e => setBulkText(e.target.value)} />
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => importBulk(g.id)}><Icons.Upload /> Import</button>
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
              This will permanently delete this group and all its questions.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => set({ showModal: null })}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteGroup(s.showModal.groupId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {s.showModal?.type === "delete-user" && (
        <div className="modal-overlay" onClick={() => set({ showModal: null })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete user "{s.showModal.name}"?</div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
              This will permanently delete this user and all their quiz history.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => set({ showModal: null })}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteUser(s.showModal.username)}>Delete User</button>
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
              <textarea className="textarea" value={qForm.text} onChange={e => setQForm(f => ({ ...f, text: e.target.value }))} />
            </div>
            {qForm.options.map((opt, i) => (
              <div className="input-group" key={i}>
                <label className="input-label">
                  Option {letters[i]} {qForm.correct === i && <span style={{ color: "var(--success)", marginLeft: 8 }}>✓ Correct</span>}
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" value={opt} onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm(f => ({ ...f, options: o })); }} />
                  <button className={`btn btn-sm ${qForm.correct === i ? "btn-primary" : ""}`}
                    onClick={() => setQForm(f => ({ ...f, correct: i }))}>{qForm.correct === i ? "✓" : "Set"}</button>
                </div>
              </div>
            ))}
            <div className="input-group">
              <label className="input-label">Explanation</label>
              <textarea className="textarea" value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { set({ showModal: null, editingQuestion: null }); resetQForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                updateQuestion(s.showModal.groupId, s.editingQuestion, { ...qForm });
                set({ showModal: null, editingQuestion: null }); resetQForm();
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {s.toast && <div className={`toast toast-${s.toast.type}`}>{s.toast.msg}</div>}
    </div>
  );
}