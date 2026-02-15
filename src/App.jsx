import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── Utilities ───
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const genToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("");
const hashPw = async (pw) => {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

// ─── Icons ───
const I = {
  Flag: ({ filled }) => <svg width="20" height="20" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Arr: ({d}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d==="l"?<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>:<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}</svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Chart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Gear: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  Upload: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Ban: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  CheckC: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Shuf: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
};

// ─── Styles ───
const css = `
:root{
  --bg:#0b0f19;--bg1:#0f1626;--bg2:#121b30;--bd:#1f2a44;--txt:#e8eefc;--mut:#9fb2d9;--pri:#5b8cff;--pri2:#9f7bff;
  --g:#33d17a;--r:#ff4d6d;--y:#ffd166;--c:#2dd4bf;
  --r:14px;
  --sh:0 12px 30px rgba(0,0,0,.35);
  --sh2:0 8px 20px rgba(0,0,0,.25);
  --tr:180ms ease;
  --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
[data-theme="light"]{
  --bg:#f6f8ff;--bg1:#ffffff;--bg2:#f1f5ff;--bd:#d8e0f3;--txt:#0f172a;--mut:#475569;--pri:#2563eb;--pri2:#7c3aed;
  --sh:0 10px 25px rgba(2,6,23,.10);
  --sh2:0 6px 16px rgba(2,6,23,.08);
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:radial-gradient(1200px 700px at 20% -10%, rgba(91,140,255,.25), transparent 55%),radial-gradient(900px 600px at 110% 20%, rgba(159,123,255,.22), transparent 55%),var(--bg);color:var(--txt);font-family:var(--font)}
a{color:inherit}
button{font-family:inherit}
input,textarea,select{font-family:inherit}
::selection{background:rgba(91,140,255,.35)}
.app{min-height:100vh}
.nav{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:14px 22px;background:rgba(10,14,25,.72);backdrop-filter:blur(12px);border-bottom:1px solid rgba(31,42,68,.8)}
[data-theme="light"] .nav{background:rgba(255,255,255,.75);border-bottom:1px solid rgba(216,224,243,.9)}
.logo{font-weight:800;letter-spacing:.2px;font-size:20px;cursor:pointer;display:flex;align-items:center;gap:10px}
.nav-r{display:flex;gap:10px;align-items:center}
.pg{max-width:1120px;margin:0 auto;padding:28px 22px 46px}
.card{background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,0)), var(--bg1);border:1px solid var(--bd);border-radius:var(--r);box-shadow:var(--sh);padding:22px}
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
@media(max-width:980px){.grid{grid-template-columns:1fr}}
.h1{font-size:28px;margin:0 0 12px;font-weight:800}
.h2{font-size:18px;margin:0 0 10px;font-weight:800;color:var(--txt)}
.p{margin:0;color:var(--mut);line-height:1.6}
.hr{height:1px;background:var(--bd);margin:18px 0}
.row{display:flex;gap:12px;align-items:center}
.col{display:flex;flex-direction:column;gap:10px}
.ip{width:100%;padding:12px 12px;border-radius:12px;background:var(--bg2);border:1px solid var(--bd);color:var(--txt);outline:none;transition:box-shadow var(--tr), border var(--tr)}
.ip:focus{border-color:rgba(91,140,255,.65);box-shadow:0 0 0 4px rgba(91,140,255,.18)}
.ta{min-height:120px;resize:vertical}
.b{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--bd);background:rgba(255,255,255,.03);color:var(--txt);padding:10px 12px;border-radius:12px;cursor:pointer;transition:transform var(--tr), box-shadow var(--tr), border var(--tr), background var(--tr)}
.b:hover{transform:translateY(-1px);box-shadow:var(--sh2);border-color:rgba(91,140,255,.35)}
.b:active{transform:translateY(0)}
.b.bg{background:linear-gradient(135deg, rgba(91,140,255,.22), rgba(159,123,255,.18))}
.b.pri{background:linear-gradient(135deg, rgba(91,140,255,.95), rgba(159,123,255,.85));border-color:transparent;color:white}
.b.dng{background:rgba(255,77,109,.12);border-color:rgba(255,77,109,.35)}
.b.ok{background:rgba(51,209,122,.12);border-color:rgba(51,209,122,.35)}
.b.sm{padding:8px 10px;border-radius:10px}
.b.xs{padding:6px 8px;border-radius:10px;font-size:12px}
.b.ic{padding:10px 10px}
.b:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{padding:8px 10px;border-radius:999px;border:1px solid var(--bd);background:rgba(255,255,255,.03);color:var(--mut);cursor:pointer;transition:background var(--tr), border var(--tr)}
.pill.on{background:rgba(91,140,255,.16);border-color:rgba(91,140,255,.35);color:var(--txt)}
.badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid var(--bd);background:rgba(255,255,255,.03);color:var(--mut);font-size:12px}
.badge.ok{border-color:rgba(51,209,122,.45);background:rgba(51,209,122,.10);color:var(--txt)}
.badge.wrn{border-color:rgba(255,209,102,.45);background:rgba(255,209,102,.10);color:var(--txt)}
.badge.dng{border-color:rgba(255,77,109,.45);background:rgba(255,77,109,.10);color:var(--txt)}
.ans{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}
.opt{padding:12px;border-radius:14px;border:1px solid var(--bd);background:rgba(255,255,255,.03);cursor:pointer;transition:transform var(--tr), border var(--tr), background var(--tr), box-shadow var(--tr)}
.opt:hover{transform:translateY(-1px);border-color:rgba(91,140,255,.35);box-shadow:var(--sh2)}
.opt.sel{border-color:rgba(91,140,255,.75);background:rgba(91,140,255,.14)}
.opt.cor{border-color:rgba(51,209,122,.75);background:rgba(51,209,122,.12)}
.opt.wrg{border-color:rgba(255,77,109,.75);background:rgba(255,77,109,.12)}
.qq{font-size:22px;margin:0 0 8px;font-weight:800}
.sub{display:flex;gap:10px;flex-wrap:wrap;align-items:center;color:var(--mut);font-size:13px}
.kpi{display:flex;gap:8px;align-items:center}
.k{width:10px;height:10px;border-radius:2px}
.k.g{background:var(--g)}.k.r{background:var(--r)}.k.y{background:var(--y)}.k.c{background:var(--c)}
.tabs{display:flex;gap:8px;flex-wrap:wrap}
.tab{padding:10px 12px;border-radius:12px;border:1px solid var(--bd);background:rgba(255,255,255,.03);cursor:pointer;color:var(--mut)}
.tab.on{color:var(--txt);border-color:rgba(91,140,255,.35);background:rgba(91,140,255,.12)}
.tbl{width:100%;border-collapse:separate;border-spacing:0 10px}
.tr{background:rgba(255,255,255,.03);border:1px solid var(--bd);border-radius:14px}
.tr td{padding:12px 12px;border-top:1px solid var(--bd)}
.tr td:first-child{border-left:1px solid var(--bd);border-radius:14px 0 0 14px}
.tr td:last-child{border-right:1px solid var(--bd);border-radius:0 14px 14px 0}
.tr td{border-bottom:1px solid var(--bd)}
.tr:first-of-type td{border-top:1px solid var(--bd)}
.tr td{border-top:none}
.tr td:first-child{border-top-left-radius:14px;border-bottom-left-radius:14px}
.tr td:last-child{border-top-right-radius:14px;border-bottom-right-radius:14px}
.ttl{font-weight:800}
.mut{color:var(--mut)}
.right{margin-left:auto}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:22px;z-index:20}
.md{max-width:760px;width:100%;background:var(--bg1);border:1px solid var(--bd);border-radius:18px;box-shadow:var(--sh);padding:26px}
.md-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.md-t{font-size:18px;font-weight:900;margin:0}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);padding:10px 14px;border-radius:999px;border:1px solid var(--bd);background:rgba(15,22,38,.88);backdrop-filter:blur(10px);z-index:30;box-shadow:var(--sh);font-weight:700}
[data-theme="light"] .toast{background:rgba(255,255,255,.85)}
.toast-s{border-color:rgba(51,209,122,.35)}
.toast-e{border-color:rgba(255,77,109,.35)}
.toast-w{border-color:rgba(255,209,102,.35)}
.hc{display:flex;align-items:center;gap:10px}
.ctr{display:flex;align-items:center;justify-content:center}
.ring{width:120px;height:120px;border-radius:999px;border:10px solid rgba(255,255,255,.06);border-top-color:rgba(91,140,255,.9);animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.rs{font-size:64px;font-weight:900;margin:0}
.lg{font-size:16px;font-weight:800;margin:0}
.px{font-size:12px}
.gg{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.bx{padding:14px;border-radius:16px;border:1px solid var(--bd);background:rgba(255,255,255,.03);cursor:pointer;transition:transform var(--tr), box-shadow var(--tr), border var(--tr)}
.bx:hover{transform:translateY(-1px);box-shadow:var(--sh2);border-color:rgba(91,140,255,.35)}
.bx .t{font-weight:900;margin:0 0 4px}
.bx .d{margin:0;color:var(--mut);font-size:13px}
.small{font-size:13px;color:var(--mut)}
.sep{height:1px;background:var(--bd);margin:10px 0}
.ur{display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;border:1px solid var(--bd);background:rgba(255,255,255,.03)}
.ura{display:flex;align-items:center;gap:10px}
.av{width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg, rgba(91,140,255,.7), rgba(159,123,255,.55));display:flex;align-items:center;justify-content:center;font-weight:900;color:white}
.ur .nm{font-weight:900}
.ur .em{font-size:12px;color:var(--mut)}
.ur .st{font-size:12px;color:var(--mut)}
.ur .act{display:flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.agi{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-radius:var(--r);background:var(--bg1);border:1px solid var(--bd);margin-bottom:8px;gap:12px}
.pct-bar{height:6px;border-radius:3px;background:var(--bg2);overflow:hidden;margin-top:4px}.pct-fill{height:100%;border-radius:3px;transition:width .3s}
@media(max-width:640px){.nav{padding:12px 16px}.logo{font-size:18px}.pg{padding:24px 16px}.st{font-size:24px}.qq{font-size:20px}.rs{font-size:56px}.gg{grid-template-columns:1fr}.md{padding:24px}.ur{flex-direction:column;align-items:flex-start}}
`;

// ─── Main App ───
export default function QuizApp() {
  const [s, _set] = useState({
    page: "login", user: null, groups: [], questions: {},
    curGroup: null, shuffled: [], qi: 0, ans: {}, flags: {},
    history: [], users: [],
    toast: null, theme: "dark", adminTab: "groups",
    editGroup: null, editQ: null, modal: null, loading: true,
  });
  const set = (u) => _set(p => ({ ...p, ...u }));
  const tRef = useRef(null);
  const toast = (m, t = "s") => {
    if (tRef.current) clearTimeout(tRef.current);
    set({ toast: { m, t } });
    tRef.current = setTimeout(() => set({ toast: null }), 3000);
  };

  const [lf, setLf] = useState({ u: "", p: "", p2: "", signup: false, remember: false });
  const [gf, setGf] = useState({ name: "", description: "", icon: "📝" });
  const [qf, setQf] = useState({ text: "", options: ["","","",""], correct: 0, explanation: "" });
  const [bulk, setBulk] = useState("");
  const [newPw, setNewPw] = useState("");
  const letters = ["A","B","C","D"];

  // ─── Init: check session ───
  useEffect(() => {
    (async () => {
      const theme = localStorage.getItem("qv-theme") || "dark";
      const token = localStorage.getItem("qv-token");
      if (token) {
        const { data: sess } = await supabase.from("sessions").select("user_id, expires_at").eq("token", token).maybeSingle();
        if (sess?.user_id && new Date(sess.expires_at).getTime() > Date.now()) {
          const { data: user } = await supabase.from("users").select("*").eq("id", sess.user_id).maybeSingle();
          if (user) {
            set({ user, theme, page: user.status === "approved" ? "home" : "pending" });
            await bootstrap(user);
            set({ loading: false });
            return;
          }
        }
      }
      set({ theme, loading: false });
    })();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", s.theme);
    localStorage.setItem("qv-theme", s.theme);
  }, [s.theme]);

  // ─── Bootstrap data ───
  const bootstrap = async (user) => {
    await loadGroups();
    await loadHistory(user?.id);
    if (user?.is_admin) await loadUsers();
  };

  const loadGroups = async () => {
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    set({ groups: data || [] });
  };

  const loadHistory = async (uid) => {
    const { data } = await supabase.from("attempts").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    set({ history: data || [] });
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    set({ users: data || [] });
  };

  const loadQuestions = async (gid) => {
    const { data } = await supabase.from("questions").select("*").eq("group_id", gid).order("created_at", { ascending: true });
    const questions = {};
    questions[gid] = data || [];
    set({ questions: { ...s.questions, ...questions } });
  };

  // ─── Auth ───
  const login = async () => {
    const u = lf.u.trim().toLowerCase();
    const p = lf.p;
    if (!u || !p) return toast("Enter email/username and password.", "w");

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${u},username.eq.${u}`)
      .maybeSingle();

    if (!user) return toast("User not found.", "e");

    const hp = await hashPw(p);
    if (hp !== user.password_hash) return toast("Wrong password.", "e");

    if (user.status === "banned") return toast("This account is banned.", "e");

    const token = genToken();
    const exp = new Date(Date.now() + (lf.remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24)).toISOString();
    await supabase.from("sessions").insert({ token, user_id: user.id, expires_at: exp });
    localStorage.setItem("qv-token", token);
    set({ user, page: user.status === "approved" ? "home" : "pending" });
    await bootstrap(user);
    toast("Welcome back.");
  };

  const signup = async () => {
    const u = lf.u.trim().toLowerCase();
    const p = lf.p;
    const p2 = lf.p2;
    if (!u || !p || !p2) return toast("Fill all fields.", "w");
    if (p !== p2) return toast("Passwords do not match.", "e");
    if (p.length < 6) return toast("Password too short.", "w");

    const isEmail = u.includes("@");
    const username = isEmail ? u.split("@")[0] : u;
    const email = isEmail ? u : null;

    const { data: exists } = await supabase.from("users").select("id").or(`username.eq.${username}${email ? `,email.eq.${email}` : ""}`);
    if (exists && exists.length) return toast("User already exists.", "e");

    const hp = await hashPw(p);
    const { data: created, error } = await supabase.from("users").insert({
      username, email, password_hash: hp, status: "pending", is_admin: false,
    }).select("*").single();

    if (error) return toast("Signup failed.", "e");
    set({ user: created, page: "pending" });
    toast("Account created. Await approval.", "s");
  };

  const logout = async () => {
    const token = localStorage.getItem("qv-token");
    if (token) await supabase.from("sessions").delete().eq("token", token);
    localStorage.removeItem("qv-token");
    set({ page: "login", user: null, curGroup: null, shuffled: [], qi: 0, ans: {}, flags: {}, history: [], users: [] });
    toast("Logged out.");
  };

  // ─── Admin actions ───
  const approveUser = async (uid, status) => {
    await supabase.from("users").update({ status }).eq("id", uid);
    await loadUsers();
    toast("Updated user.");
  };

  const toggleAdmin = async (uid, is_admin) => {
    await supabase.from("users").update({ is_admin: !is_admin }).eq("id", uid);
    await loadUsers();
    toast("Updated role.");
  };

  const deleteUser = async (uid) => {
    if (!confirm("Delete user and their attempts?")) return;
    await supabase.from("attempts").delete().eq("user_id", uid);
    await supabase.from("sessions").delete().eq("user_id", uid);
    await supabase.from("users").delete().eq("id", uid);
    await loadUsers();
    toast("User deleted.");
  };

  const resetUserPw = async (uid) => {
    const pw = newPw.trim();
    if (!pw || pw.length < 6) return toast("New password too short.", "w");
    const hp = await hashPw(pw);
    await supabase.from("users").update({ password_hash: hp }).eq("id", uid);
    setNewPw("");
    toast("Password reset.");
  };

  // ─── Groups ───
  const saveGroup = async () => {
    if (!gf.name.trim()) return toast("Group name required.", "w");
    if (s.editGroup) {
      await supabase.from("groups").update({ name: gf.name, description: gf.description, icon: gf.icon }).eq("id", s.editGroup.id);
      toast("Group updated.");
    } else {
      await supabase.from("groups").insert({ name: gf.name, description: gf.description, icon: gf.icon });
      toast("Group created.");
    }
    setGf({ name: "", description: "", icon: "📝" });
    set({ editGroup: null });
    await loadGroups();
  };

  const editGroup = (g) => {
    set({ editGroup: g, adminTab: "groups" });
    setGf({ name: g.name || "", description: g.description || "", icon: g.icon || "📝" });
  };

  const delGroup = async (gid) => {
    if (!confirm("Delete this group and all questions in it?")) return;
    await supabase.from("questions").delete().eq("group_id", gid);
    await supabase.from("groups").delete().eq("id", gid);
    await loadGroups();
    toast("Group deleted.");
  };

  // ─── Questions ───
  const saveQuestion = async () => {
    if (!s.curGroup) return toast("Pick a group.", "w");
    if (!qf.text.trim()) return toast("Question required.", "w");
    const opts = qf.options.map(x => x.trim());
    if (opts.some(x => !x)) return toast("Fill all options.", "w");
    const payload = { group_id: s.curGroup.id, text: qf.text, options: opts, correct: qf.correct, explanation: qf.explanation };
    if (s.editQ) {
      await supabase.from("questions").update(payload).eq("id", s.editQ.id);
      toast("Question updated.");
    } else {
      await supabase.from("questions").insert(payload);
      toast("Question added.");
    }
    setQf({ text: "", options: ["","","",""], correct: 0, explanation: "" });
    set({ editQ: null });
    await loadQuestions(s.curGroup.id);
  };

  const editQuestion = (q) => {
    set({ editQ: q, adminTab: "questions" });
    const options = Array.isArray(q.options) ? q.options : (typeof q.options === "string" ? JSON.parse(q.options) : ["","","",""]);
    setQf({ text: q.text || "", options: options.length ? options : ["","","",""], correct: q.correct ?? 0, explanation: q.explanation || "" });
  };

  const delQuestion = async (qid) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", qid);
    await loadQuestions(s.curGroup.id);
    toast("Question deleted.");
  };

  const bulkImport = async () => {
    if (!s.curGroup) return toast("Pick a group.", "w");
    const raw = bulk.trim();
    if (!raw) return toast("Paste questions first.", "w");

    const blocks = raw.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
    const toIns = [];

    for (const b of blocks) {
      const lines = b.split("\n").map(x => x.trim()).filter(Boolean);
      if (lines.length < 6) continue;
      const q = lines[0];
      const a = lines[1].replace(/^A[\)\.\:\-]\s*/i, "");
      const bb = lines[2].replace(/^B[\)\.\:\-]\s*/i, "");
      const c = lines[3].replace(/^C[\)\.\:\-]\s*/i, "");
      const d = lines[4].replace(/^D[\)\.\:\-]\s*/i, "");
      const cor = (lines[5].match(/Correct\s*[:\-]?\s*([ABCD])/i)?.[1] || "A").toUpperCase();
      const correct = Math.max(0, letters.indexOf(cor));
      const exp = lines.slice(6).join(" ");
      toIns.push({ group_id: s.curGroup.id, text: q, options: [a, bb, c, d], correct, explanation: exp });
    }

    if (!toIns.length) return toast("No valid blocks found.", "e");
    for (let i = 0; i < toIns.length; i += 50) {
      await supabase.from("questions").insert(toIns.slice(i, i + 50));
    }
    await loadQuestions(s.curGroup.id);
    setBulk("");
    toast(`Imported ${toIns.length} questions.`);
  };

  // ─── Quiz ───
  const startQuiz = async (g) => {
    set({ curGroup: g, page: "quiz", qi: 0, ans: {}, flags: {} });
    if (!s.questions[g.id]) await loadQuestions(g.id);
    const qs = s.questions[g.id] || [];
    if (!qs.length) return toast("No questions in this group.", "w");
    const sh = shuffle(qs);
    set({ shuffled: sh, qi: 0, ans: {}, flags: {} });
  };

  const pick = (qid, i) => set({ ans: { ...s.ans, [qid]: i } });

  const toggleFlag = (qid) => set({ flags: { ...s.flags, [qid]: !s.flags[qid] } });

  const next = () => set({ qi: Math.min((s.qi || 0) + 1, (s.shuffled?.length || 1) - 1) });
  const prev = () => set({ qi: Math.max((s.qi || 0) - 1, 0) });

  const finish = async () => {
    const qs = s.shuffled || [];
    const total = qs.length || 0;
    let score = 0;
    const wrong = [];
    qs.forEach((q) => {
      const a = s.ans[q.id];
      if (a === q.correct) score++;
      else wrong.push(q.id);
    });
    const percent = total ? Math.round(score / total * 100) : 0;

    await supabase.from("attempts").insert({
      user_id: s.user.id,
      group_id: s.curGroup?.id,
      score, total,
      percent,
      wrong,
      flags: s.flags,
    });
    await loadHistory(s.user.id);
    toast("Saved attempt.");
    set({ page: "result", result: { score, total, percent } });
  };

  const goAdmin = async () => {
    if (!s.user?.is_admin) return;
    await loadGroups();
    await loadUsers();
    set({ page: "admin", adminTab: "groups" });
  };

  // ─── Excel Import (XLSX) ───
  const [importing, setImporting] = useState(false);
  const [previewRows, setPreviewRows] = useState(null);

  const parseXlsx = async (file) => {
    const buf = await file.arrayBuffer();
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    return rows;
  };

  const normalizeCorrect = (val) => {
    if (val == null) return 0;
    const s = String(val).trim().toUpperCase();
    const idx = ["A","B","C","D"].indexOf(s);
    if (idx >= 0) return idx;
    const n = parseInt(s, 10);
    if (!Number.isNaN(n)) return Math.max(0, Math.min(3, n));
    return 0;
  };

  const handleExcelFile = async (file, gid) => {
    setImporting(true);
    try {
      const rows = await parseXlsx(file);
      if (!rows || rows.length < 2) {
        setImporting(false);
        return toast("Excel seems empty.", "e");
      }

      const header = rows[0].map(x => String(x || "").trim().toLowerCase());
      const getIdx = (name) => header.indexOf(name);
      const iQ = getIdx("question");
      const iA = getIdx("option a");
      const iB = getIdx("option b");
      const iC = getIdx("option c");
      const iD = getIdx("option d");
      const iCor = getIdx("correct");
      const iExp = getIdx("explanation");

      if (iQ < 0 || iA < 0 || iB < 0 || iC < 0 || iD < 0 || iCor < 0) {
        setImporting(false);
        return toast("Missing columns. Need: Question, Option A, Option B, Option C, Option D, Correct.", "e");
      }

      const parsed = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        const q = String(row[iQ] || "").trim();
        if (!q) continue;
        const a = String(row[iA] || "").trim();
        const b = String(row[iB] || "").trim();
        const c = String(row[iC] || "").trim();
        const d = String(row[iD] || "").trim();
        const cor = normalizeCorrect(row[iCor]);
        const exp = iExp >= 0 ? String(row[iExp] || "").trim() : "";
        if (!a || !b || !c || !d) continue;

        parsed.push({
          text: q,
          options: [a, b, c, d],
          correct: cor,
          explanation: exp,
        });
      }

      if (!parsed.length) {
        setImporting(false);
        return toast("No valid rows found.", "e");
      }

      setPreviewRows(parsed);
      set({ modal: { type: "excel-preview", gid } });
      setImporting(false);
    } catch (err) {
      console.error(err);
      setImporting(false);
      toast("Error reading file. Make sure it's a valid .xlsx file.", "e");
    }
  };

  const confirmExcelImport = async (gid) => {
    if (!previewRows || previewRows.length === 0) return;
    const toInsert = previewRows.map(q => ({
      group_id: gid, text: q.text, options: q.options, correct: q.correct, explanation: q.explanation
    }));
    // Supabase has a limit, insert in batches of 50
    for (let i = 0; i < toInsert.length; i += 50) {
      await supabase.from("questions").insert(toInsert.slice(i, i + 50));
    }
    loadGroups();
    toast(`${previewRows.length} questions imported!`);
    setPreviewRows(null);
    set({ modal: null });
  };

  const downloadTemplate = () => {
    // Create a simple CSV template (opens in Excel)
    const headers = "Question,Option A,Option B,Option C,Option D,Correct,Explanation";
    const example1 = "What is the capital of France?,London,Paris,Berlin,Madrid,B,Paris has been the capital since the 10th century";
    const example2 = "Which planet is closest to the Sun?,Venus,Mercury,Earth,Mars,B,Mercury orbits closest to the Sun";
    const csv = [headers, example1, example2].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "quiz_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Question Stats ───
  const getQStats = useCallback(async (gid) => {
    const { data: attempts } = await supabase.from("attempts").select("wrong, total, score").not("group_id", "is", null).eq("group_id", gid);
    return attempts || [];
  }, []);

  // ─── Computed ───
  const pendingN = s.users.filter(u => u.status === "pending").length;

  const getUserAttempts = async (uid) => {
    const { data } = await supabase.from("attempts").select("score, total").eq("user_id", uid);
    return data || [];
  };

  if (s.loading) return <div className="app" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><div className="st" style={{fontSize:24}}>Loading...</div></div>;

  const curQ = s.shuffled?.[s.qi];
  const getOpts = (q) => typeof q?.options === "string" ? JSON.parse(q.options) : (q?.options || []);

  return (
    <div className="app">
      {/* Nav */}
      {s.page !== "login" && s.page !== "pending" && (
        <nav className="nav">
          <div className="logo" onClick={() => set({ page: "home" })}>QuizVault</div>
          <div className="nav-r">
            <button className="b bg bs" onClick={() => set({ page: "home" })}><I.Home /> Home</button>
            <button className="b bg bs" onClick={() => set({ page: "history" })}><I.Chart /> History</button>
            {s.user?.is_admin && <button className="b bg bs" onClick={goAdmin}><I.Gear /> Admin {pendingN ? <span className="badge wrn">{pendingN} pending</span> : null}</button>}
            <button className="b ic" onClick={() => set({ theme: s.theme === "dark" ? "light" : "dark" })}>{s.theme === "dark" ? <I.Sun /> : <I.Moon />}</button>
            <button className="b dng" onClick={logout}>Logout</button>
          </div>
        </nav>
      )}

      <style>{css}</style>

      <div className="pg">
        {/* LOGIN */}
        {s.page === "login" && (
          <div className="grid">
            <div className="card">
              <h1 className="h1">QuizVault</h1>
              <p className="p">Practice quizzes. Track attempts. Admin-managed groups and questions.</p>
              <div className="hr" />
              <div className="col">
                <div className="row">
                  <input className="ip" placeholder="Email or username" value={lf.u} onChange={e => setLf({ ...lf, u: e.target.value })} />
                </div>
                <div className="row">
                  <input className="ip" type="password" placeholder="Password" value={lf.p} onChange={e => setLf({ ...lf, p: e.target.value })} />
                </div>
                {lf.signup && (
                  <div className="row">
                    <input className="ip" type="password" placeholder="Confirm password" value={lf.p2} onChange={e => setLf({ ...lf, p2: e.target.value })} />
                  </div>
                )}
                <div className="row" style={{justifyContent:"space-between"}}>
                  <label className="row" style={{gap:8,color:"var(--mut)",fontSize:13,cursor:"pointer"}}>
                    <input type="checkbox" checked={lf.remember} onChange={e => setLf({ ...lf, remember: e.target.checked })} />
                    Remember me
                  </label>
                  <button className="b" onClick={() => setLf({ ...lf, signup: !lf.signup })}>{lf.signup ? "Have account? Login" : "New? Sign up"}</button>
                </div>
                <button className="b pri" onClick={lf.signup ? signup : login}>{lf.signup ? "Create account" : "Login"}</button>
                <div className="small">Admins must approve new accounts.</div>
              </div>
            </div>

            <div className="card">
              <h2 className="h2">How it works</h2>
              <div className="col">
                <div className="row"><span className="badge ok"><I.CheckC /> Practice</span><span className="mut">Pick a group and start a quiz.</span></div>
                <div className="row"><span className="badge wrn"><I.Flag filled /></span><span className="mut">Flag questions for review.</span></div>
                <div className="row"><span className="badge"><I.Chart /></span><span className="mut">Track your attempt history.</span></div>
                <div className="row"><span className="badge"><I.Gear /></span><span className="mut">Admin manages groups and users.</span></div>
              </div>
            </div>
          </div>
        )}

        {/* PENDING */}
        {s.page === "pending" && (
          <div className="card">
            <h1 className="h1">Awaiting approval</h1>
            <p className="p">Your account is pending admin approval. Try again later.</p>
            <div className="hr" />
            <button className="b dng" onClick={logout}>Logout</button>
          </div>
        )}

        {/* HOME */}
        {s.page === "home" && (
          <div className="grid">
            <div className="card">
              <h1 className="h1">Choose a group</h1>
              <p className="p">Start a quiz. Your attempts will be saved.</p>
              <div className="hr" />
              <div className="gg">
                {s.groups.map(g => (
                  <div key={g.id} className="bx" onClick={() => startQuiz(g)}>
                    <div className="row" style={{gap:10}}>
                      <div className="av" style={{width:46,height:46,borderRadius:16,background:"linear-gradient(135deg, rgba(91,140,255,.75), rgba(159,123,255,.55))"}}>{g.icon || "📝"}</div>
                      <div>
                        <div className="t">{g.name}</div>
                        <div className="d">{g.description || "No description"}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {!s.groups.length && <div className="mut">No groups yet.</div>}
              </div>
            </div>

            <div className="card">
              <h2 className="h2">Quick stats</h2>
              <div className="hr" />
              <div className="col">
                <div className="agi">
                  <div>
                    <div className="ttl">Attempts</div>
                    <div className="mut px">Total attempts saved</div>
                  </div>
                  <div className="ttl">{s.history.length}</div>
                </div>
                <div className="agi">
                  <div>
                    <div className="ttl">Best score</div>
                    <div className="mut px">Highest percent</div>
                  </div>
                  <div className="ttl">{s.history.length ? Math.max(...s.history.map(a => a.percent || 0)) : 0}%</div>
                </div>
                <div className="agi">
                  <div>
                    <div className="ttl">Theme</div>
                    <div className="mut px">Toggle in top bar</div>
                  </div>
                  <div className="badge">{s.theme === "dark" ? "Dark" : "Light"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {s.page === "quiz" && curQ && (
          <div className="card">
            <div className="row" style={{justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
              <div className="col" style={{gap:6}}>
                <div className="badge">{s.curGroup?.icon || "📝"} {s.curGroup?.name}</div>
                <div className="qq">{curQ.text}</div>
                <div className="sub">
                  <div className="kpi"><span className="k c" /> {s.qi + 1} / {s.shuffled.length}</div>
                  <div className="kpi"><span className="k y" /> Flagged {Object.values(s.flags).filter(Boolean).length}</div>
                </div>
              </div>

              <div className="row">
                <button className={`b sm ${s.flags[curQ.id] ? "bg" : ""}`} onClick={() => toggleFlag(curQ.id)}><I.Flag filled={!!s.flags[curQ.id]} /> Flag</button>
                <button className="b sm" onClick={() => set({ page: "home", curGroup: null, shuffled: [], qi: 0, ans: {}, flags: {} })}>Exit</button>
              </div>
            </div>

            <div className="ans">
              {getOpts(curQ).map((opt, i) => {
                const sel = s.ans[curQ.id] === i;
                return (
                  <div key={i} className={`opt ${sel ? "sel" : ""}`} onClick={() => pick(curQ.id, i)}>
                    <div className="row" style={{justifyContent:"space-between"}}>
                      <div style={{fontWeight:800}}>{letters[i]}. {opt}</div>
                      {sel && <span className="badge ok"><I.Check /> Selected</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hr" />

            <div className="row" style={{justifyContent:"space-between",flexWrap:"wrap"}}>
              <button className="b" onClick={prev} disabled={s.qi === 0}><I.Arr d="l" /> Prev</button>
              <div className="row">
                <button className="b" onClick={() => set({ shuffled: shuffle(s.shuffled), qi: 0, ans: {}, flags: {} })}><I.Shuf /> Shuffle</button>
                {s.qi < s.shuffled.length - 1 ? (
                  <button className="b pri" onClick={next}>Next <I.Arr d="r" /></button>
                ) : (
                  <button className="b pri" onClick={finish}>Finish</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {s.page === "result" && s.result && (
          <div className="grid">
            <div className="card ctr" style={{flexDirection:"column",gap:12}}>
              <div className="rs">{s.result.percent}%</div>
              <div className="lg">{s.result.score} / {s.result.total}</div>
              <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                <button className="b pri" onClick={() => set({ page: "home", curGroup: null, shuffled: [], qi: 0, ans: {}, flags: {}, result: null })}><I.Home /> Back home</button>
                <button className="b" onClick={() => startQuiz(s.curGroup)}><I.Shuf /> Retry</button>
                <button className="b" onClick={() => set({ page: "history" })}><I.Chart /> View history</button>
              </div>
            </div>

            <div className="card">
              <h2 className="h2">Tip</h2>
              <p className="p">Use flags during the quiz. Review those questions in your own notes after the attempt.</p>
              <div className="hr" />
              <div className="row">
                <span className="badge wrn"><I.Flag filled /></span>
                <span className="mut">Flag count in this attempt: {Object.values(s.flags).filter(Boolean).length}</span>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {s.page === "history" && (
          <div className="card">
            <div className="row" style={{justifyContent:"space-between",flexWrap:"wrap"}}>
              <h1 className="h1" style={{margin:0}}>History</h1>
              <button className="b" onClick={() => set({ page: "home" })}><I.Home /> Back</button>
            </div>
            <div className="hr" />
            <table className="tbl">
              <tbody>
                {s.history.map(a => (
                  <tr key={a.id} className="tr">
                    <td>
                      <div className="ttl">{a.percent}%</div>
                      <div className="mut px">{new Date(a.created_at).toLocaleString()}</div>
                    </td>
                    <td className="mut">{a.score} / {a.total}</td>
                    <td className="mut">{a.group_id ? `Group: ${a.group_id}` : "No group"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!s.history.length && <div className="mut">No attempts yet.</div>}
          </div>
        )}

        {/* ADMIN */}
        {s.page === "admin" && s.user?.is_admin && (
          <div className="grid">
            <div className="card">
              <div className="row" style={{justifyContent:"space-between",flexWrap:"wrap"}}>
                <h1 className="h1" style={{margin:0}}>Admin</h1>
                <button className="b" onClick={() => set({ page: "home" })}><I.Home /> Back</button>
              </div>
              <div className="hr" />
              <div className="tabs">
                <div className={`tab ${s.adminTab === "groups" ? "on" : ""}`} onClick={() => set({ adminTab: "groups" })}>Groups</div>
                <div className={`tab ${s.adminTab === "questions" ? "on" : ""}`} onClick={() => set({ adminTab: "questions" })}>Questions</div>
                <div className={`tab ${s.adminTab === "users" ? "on" : ""}`} onClick={() => set({ adminTab: "users" })}>Users {pendingN ? <span className="badge wrn">{pendingN}</span> : null}</div>
                <div className={`tab ${s.adminTab === "import" ? "on" : ""}`} onClick={() => set({ adminTab: "import" })}>Import</div>
              </div>

              {/* GROUPS TAB */}
              {s.adminTab === "groups" && (
                <div className="col" style={{marginTop:12}}>
                  <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                    <input className="ip" placeholder="Group name" value={gf.name} onChange={e => setGf({ ...gf, name: e.target.value })} />
                    <input className="ip" placeholder="Icon (emoji)" value={gf.icon} onChange={e => setGf({ ...gf, icon: e.target.value })} style={{maxWidth:160}} />
                  </div>
                  <textarea className="ip ta" placeholder="Description" value={gf.description} onChange={e => setGf({ ...gf, description: e.target.value })} />
                  <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                    <button className="b pri" onClick={saveGroup}>{s.editGroup ? "Update group" : "Create group"}</button>
                    {s.editGroup && <button className="b" onClick={() => { set({ editGroup: null }); setGf({ name: "", description: "", icon: "📝" }); }}>Cancel</button>}
                  </div>
                  <div className="hr" />
                  <div className="col">
                    {s.groups.map(g => (
                      <div key={g.id} className="ur">
                        <div className="ura">
                          <div className="av">{g.icon || "📝"}</div>
                          <div>
                            <div className="nm">{g.name}</div>
                            <div className="em">{g.description || "No description"}</div>
                          </div>
                        </div>
                        <div className="act">
                          <button className="b sm" onClick={() => { set({ curGroup: g, adminTab: "questions" }); loadQuestions(g.id); }}><I.Edit /> Manage</button>
                          <button className="b sm" onClick={() => editGroup(g)}><I.Edit /> Edit</button>
                          <button className="b sm dng" onClick={() => delGroup(g.id)}><I.Trash /> Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTIONS TAB */}
              {s.adminTab === "questions" && (
                <div className="col" style={{marginTop:12}}>
                  <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                    <select className="ip" value={s.curGroup?.id || ""} onChange={async (e) => {
                      const gid = e.target.value;
                      const g = s.groups.find(x => x.id === gid);
                      set({ curGroup: g || null });
                      if (gid) await loadQuestions(gid);
                    }}>
                      <option value="">Select group</option>
                      {s.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button className="b" onClick={() => s.curGroup && loadQuestions(s.curGroup.id)}>Refresh</button>
                  </div>

                  <div className="hr" />

                  {s.curGroup ? (
                    <>
                      <div className="col">
                        <input className="ip" placeholder="Question text" value={qf.text} onChange={e => setQf({ ...qf, text: e.target.value })} />
                        <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                          {qf.options.map((o, i) => (
                            <input key={i} className="ip" placeholder={`Option ${letters[i]}`} value={o} onChange={e => {
                              const opts = [...qf.options];
                              opts[i] = e.target.value;
                              setQf({ ...qf, options: opts });
                            }} />
                          ))}
                        </div>
                        <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                          <select className="ip" style={{maxWidth:220}} value={qf.correct} onChange={e => setQf({ ...qf, correct: parseInt(e.target.value, 10) })}>
                            {letters.map((l, i) => <option key={l} value={i}>Correct: {l}</option>)}
                          </select>
                          <button className="b pri" onClick={saveQuestion}>{s.editQ ? "Update question" : "Add question"}</button>
                          {s.editQ && <button className="b" onClick={() => { set({ editQ: null }); setQf({ text: "", options: ["","","",""], correct: 0, explanation: "" }); }}>Cancel</button>}
                        </div>
                        <textarea className="ip ta" placeholder="Explanation (optional)" value={qf.explanation} onChange={e => setQf({ ...qf, explanation: e.target.value })} />
                      </div>

                      <div className="hr" />

                      <div className="col">
                        {(s.questions[s.curGroup.id] || []).map(q => (
                          <div key={q.id} className="ur">
                            <div className="ura">
                              <div className="av" style={{width:36,height:36,borderRadius:12}}>{letters[q.correct ?? 0]}</div>
                              <div>
                                <div className="nm">{q.text}</div>
                                <div className="em">{(Array.isArray(q.options) ? q.options : getOpts(q)).join(" | ")}</div>
                              </div>
                            </div>
                            <div className="act">
                              <button className="b sm" onClick={() => editQuestion(q)}><I.Edit /> Edit</button>
                              <button className="b sm dng" onClick={() => delQuestion(q.id)}><I.Trash /> Delete</button>
                            </div>
                          </div>
                        ))}
                        {!((s.questions[s.curGroup.id] || []).length) && <div className="mut">No questions in this group.</div>}
                      </div>
                    </>
                  ) : (
                    <div className="mut">Select a group to manage questions.</div>
                  )}
                </div>
              )}

              {/* USERS TAB */}
              {s.adminTab === "users" && (
                <div className="col" style={{marginTop:12}}>
                  <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                    <input className="ip" placeholder="New password for reset (min 6 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} />
                    <button className="b" onClick={loadUsers}>Refresh</button>
                  </div>
                  <div className="hr" />
                  <div className="col">
                    {s.users.map(u => (
                      <UserRow
                        key={u.id}
                        u={u}
                        me={s.user}
                        onStatus={approveUser}
                        onToggleAdmin={toggleAdmin}
                        onDelete={deleteUser}
                        onResetPw={resetUserPw}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* IMPORT TAB */}
              {s.adminTab === "import" && (
                <div className="col" style={{marginTop:12}}>
                  <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                    <select className="ip" value={s.curGroup?.id || ""} onChange={async (e) => {
                      const gid = e.target.value;
                      const g = s.groups.find(x => x.id === gid);
                      set({ curGroup: g || null });
                      if (gid) await loadQuestions(gid);
                    }}>
                      <option value="">Select group</option>
                      {s.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button className="b" onClick={downloadTemplate}>Download template</button>
                  </div>

                  <div className="hr" />

                  <div className="card" style={{background:"rgba(255,255,255,.02)"}}>
                    <h2 className="h2">Import from Excel (.xlsx)</h2>
                    <p className="p">Columns required: Question, Option A, Option B, Option C, Option D, Correct, Explanation.</p>
                    <div className="sep" />
                    <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                      <input
                        className="ip"
                        type="file"
                        accept=".xlsx"
                        disabled={!s.curGroup || importing}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          handleExcelFile(f, s.curGroup.id);
                          e.target.value = "";
                        }}
                      />
                      <button className="b pri" disabled={!s.curGroup || importing} onClick={() => {}}>
                        <I.Upload /> {importing ? "Reading..." : "Select file to preview"}
                      </button>
                    </div>
                    {!s.curGroup && <div className="small">Pick a group first.</div>}
                  </div>

                  <div className="card" style={{background:"rgba(255,255,255,.02)"}}>
                    <h2 className="h2">Bulk paste import</h2>
                    <p className="p">Format blocks separated by blank line. Lines: question, A, B, C, D, Correct: X, optional explanation lines.</p>
                    <div className="sep" />
                    <textarea className="ip ta" placeholder="Paste blocks here..." value={bulk} onChange={e => setBulk(e.target.value)} />
                    <div className="row" style={{gap:10,flexWrap:"wrap"}}>
                      <button className="b pri" onClick={bulkImport} disabled={!s.curGroup}>Import blocks</button>
                      <div className="small">Works best with clean text.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="h2">Admin notes</h2>
              <p className="p">Approve users, manage groups, and add questions. Imports support Excel and bulk paste.</p>
              <div className="hr" />
              <div className="row"><span className="badge wrn"><I.User /></span><span className="mut">Pending users: {pendingN}</span></div>
              <div className="row"><span className="badge"><I.Upload /></span><span className="mut">Excel import inserts in batches of 50.</span></div>
              <div className="row"><span className="badge ok"><I.Shield /></span><span className="mut">Supabase handles auth data storage.</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {s.modal && (
        <div className="modal" onClick={() => set({ modal: null })}>
          <div className="md" onClick={e => e.stopPropagation()}>
            {s.modal.type === "excel-preview" && (
              <>
                <div className="md-h">
                  <h3 className="md-t">Excel import preview</h3>
                  <button className="b ic" onClick={() => { setPreviewRows(null); set({ modal: null }); }}><I.X /></button>
                </div>
                <p className="p">Rows parsed: {previewRows?.length || 0}. Confirm to import into this group.</p>
                <div className="hr" />
                <div style={{maxHeight:360,overflow:"auto",border:"1px solid var(--bd)",borderRadius:14}}>
                  <table className="tbl" style={{borderSpacing:"0 0"}}>
                    <tbody>
                      {(previewRows || []).slice(0, 50).map((q, idx) => (
                        <tr key={idx} className="tr">
                          <td>
                            <div className="ttl">{q.text}</div>
                            <div className="mut px">{q.options?.join(" | ")}</div>
                          </td>
                          <td className="mut">Correct: {letters[q.correct]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(previewRows || []).length > 50 && <div className="small">Showing first 50 rows.</div>}
                <div className="hr" />
                <div className="row" style={{justifyContent:"flex-end",gap:10}}>
                  <button className="b" onClick={() => { setPreviewRows(null); set({ modal: null }); }}>Cancel</button>
                  <button className="b pri" onClick={() => confirmExcelImport(s.modal.gid)}>Confirm import</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {s.toast && <div className={`toast toast-${s.toast.t}`}>{s.toast.m}</div>}
    </div>
  );
}

// ─── User Row Component ───
function UserRow({ u, me, onStatus, onToggleAdmin, onDelete, onResetPw }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("attempts").select("score, total").eq("user_id", u.id);
      if (data && data.length > 0) {
        const scores = data.map(a => Math.round(a.score / a.total * 100));
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        setStats({ n: data.length, avg });
      } else {
        setStats({ n: 0, avg: 0 });
      }
    })();
  }, [u.id]);

  const badgeClass = u.status === "approved" ? "ok" : u.status === "pending" ? "wrn" : "dng";

  return (
    <div className="ur">
      <div className="ura">
        <div className="av">{(u.username || u.email || "U").slice(0, 1).toUpperCase()}</div>
        <div>
          <div className="nm">{u.username || "No username"} {u.id === me.id && <span className="badge">You</span>} {u.is_admin && <span className="badge ok"><I.Shield /> Admin</span>}</div>
          <div className="em">{u.email || "No email"}</div>
          <div className="st">
            <span className={`badge ${badgeClass}`}>{u.status}</span>
            {stats && <span className="badge">Attempts {stats.n} | Avg {stats.avg}%</span>}
          </div>
        </div>
      </div>

      <div className="act">
        {u.status !== "approved" && <button className="b xs ok" onClick={() => onStatus(u.id, "approved")}><I.Check /> Approve</button>}
        {u.status !== "pending" && <button className="b xs" onClick={() => onStatus(u.id, "pending")}><I.User /> Pending</button>}
        {u.status !== "banned" && <button className="b xs dng" onClick={() => onStatus(u.id, "banned")}><I.Ban /> Ban</button>}
        <button className="b xs" onClick={() => onToggleAdmin(u.id, u.is_admin)}><I.Shield /> Toggle admin</button>
        <button className="b xs" onClick={() => onResetPw(u.id)}><I.Edit /> Reset pw</button>
        <button className="b xs dng" onClick={() => onDelete(u.id)}><I.Trash /> Delete</button>
      </div>
    </div>
  );
}
