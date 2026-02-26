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
  Key: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Img: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

// ─── Styles ───
const mkStyles = (t) => `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&display=swap');
:root{
--bg0:${t==="dark"?"#0a0a0f":"#f5f5f8"};--bg1:${t==="dark"?"#12121a":"#fff"};--bg2:${t==="dark"?"#1a1a26":"#eeeef2"};
--bg3:${t==="dark"?"#222233":"#e4e4ec"};--bd:${t==="dark"?"#2a2a3d":"#d8d8e4"};--bd2:${t==="dark"?"#3a3a55":"#c0c0d0"};
--t1:${t==="dark"?"#e8e6f0":"#1a1a2e"};--t2:${t==="dark"?"#9896a8":"#5a5870"};--t3:${t==="dark"?"#6a6880":"#8888a0"};
--ac:#7c6ef0;--ac2:#9488f5;--acs:${t==="dark"?"rgba(124,110,240,0.08)":"rgba(124,110,240,0.06)"};
--ok:#34d399;--oks:${t==="dark"?"rgba(52,211,153,0.1)":"rgba(52,211,153,0.08)"};
--err:#f87171;--errs:${t==="dark"?"rgba(248,113,113,0.1)":"rgba(248,113,113,0.08)"};
--wrn:#fbbf24;--wrns:${t==="dark"?"rgba(251,191,36,0.1)":"rgba(251,191,36,0.08)"};
--r:12px;--rs:8px;--rl:16px;
--sh:${t==="dark"?"0 4px 24px rgba(0,0,0,0.3)":"0 4px 24px rgba(0,0,0,0.06)"};
--fd:'Fraunces',serif;--fb:'DM Sans',sans-serif;--tr:0.2s cubic-bezier(0.4,0,0.2,1);
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--fb);background:var(--bg0);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px}
.app{min-height:100vh;display:flex;flex-direction:column}
.nav{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid var(--bd);background:${t==="dark"?"rgba(10,10,15,0.8)":"rgba(245,245,248,0.85)"};backdrop-filter:blur(20px);position:sticky;top:0;z-index:100}
.logo{font-family:var(--fd);font-size:22px;font-weight:700;background:linear-gradient(135deg,var(--ac),#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer;letter-spacing:-0.5px}
.nav-r{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.b{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:var(--rs);border:1px solid var(--bd);background:var(--bg2);color:var(--t1);font-family:var(--fb);font-size:14px;font-weight:500;cursor:pointer;transition:all var(--tr);white-space:nowrap}
.b:hover{background:var(--bg3);border-color:var(--bd2)}.bp{background:var(--ac);border-color:var(--ac);color:#fff}.bp:hover{background:var(--ac2);border-color:var(--ac2)}
.bg{background:transparent;border-color:transparent}.bg:hover{background:var(--bg2)}.bd{color:var(--err)}.bd:hover{background:var(--errs);border-color:var(--err)}
.bk{color:var(--ok)}.bk:hover{background:var(--oks);border-color:var(--ok)}.bs{padding:6px 14px;font-size:13px}.bi{padding:8px;width:36px;height:36px;justify-content:center}
.inp,.ta{width:100%;padding:10px 14px;border-radius:var(--rs);border:1px solid var(--bd);background:var(--bg0);color:var(--t1);font-family:var(--fb);font-size:14px;transition:border-color var(--tr);outline:none}
.inp:focus,.ta:focus{border-color:var(--ac)}.ta{resize:vertical;min-height:80px}
.lbl{display:block;font-size:12px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px}.ig{margin-bottom:16px}
.c{background:var(--bg1);border:1px solid var(--bd);border-radius:var(--rl);padding:28px;transition:all var(--tr)}
.ch:hover{border-color:var(--ac);box-shadow:0 0 0 1px var(--ac),var(--sh);transform:translateY(-2px)}
.pg{max-width:960px;margin:0 auto;padding:40px 24px;width:100%;position:relative;z-index:1;animation:fi .3s ease}.pw{max-width:1100px}
@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes su{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes si{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
.st{font-family:var(--fd);font-size:32px;font-weight:700;letter-spacing:-0.5px;margin-bottom:8px}
.ss{color:var(--t2);font-size:15px;margin-bottom:32px;line-height:1.5}
.gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.gc{cursor:pointer;position:relative;overflow:hidden}
.gc::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--acs),transparent);opacity:0;transition:opacity var(--tr);border-radius:var(--rl);pointer-events:none}
.gc:hover::after{opacity:1}
.gi{font-size:36px;margin-bottom:16px;display:block}.gn{font-family:var(--fd);font-size:20px;font-weight:600;margin-bottom:6px}
.gd{color:var(--t2);font-size:13px;line-height:1.5;margin-bottom:16px}
.gm{display:flex;gap:16px;font-size:12px;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;font-weight:500}
.qpb{width:100%;height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;margin-bottom:32px}
.qpf{height:100%;background:linear-gradient(90deg,var(--ac),#a78bfa);border-radius:2px;transition:width .4s cubic-bezier(.4,0,.2,1)}
.qc{font-size:13px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:1px}
.qq{font-family:var(--fd);font-size:26px;font-weight:600;line-height:1.4;margin-bottom:32px;letter-spacing:-.3px}
.ob{display:flex;align-items:center;gap:16px;width:100%;padding:18px 22px;border-radius:var(--r);border:1px solid var(--bd);background:var(--bg1);color:var(--t1);font-family:var(--fb);font-size:15px;cursor:pointer;transition:all var(--tr);text-align:left;margin-bottom:12px}
.ob:hover:not(.od){border-color:var(--ac);background:var(--acs)}
.ol{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;background:var(--bg2);border:1px solid var(--bd);flex-shrink:0;transition:all var(--tr)}
.oc{border-color:var(--ok)!important;background:var(--oks)!important}.oc .ol{background:var(--ok);border-color:var(--ok);color:#fff}
.ow{border-color:var(--err)!important;background:var(--errs)!important}.ow .ol{background:var(--err);border-color:var(--err);color:#fff}
.od{cursor:default}
.eb{margin-top:20px;padding:16px 20px;border-radius:var(--r);background:var(--acs);border:1px solid rgba(124,110,240,.2);font-size:14px;line-height:1.6;color:var(--t2);animation:su .3s ease}
.eb strong{color:var(--ac);display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase;letter-spacing:.8px}
.qa{display:flex;justify-content:space-between;align-items:center;margin-top:32px;gap:12px}
.fb{color:var(--t3);transition:color var(--tr)}.fb.ff{color:var(--wrn)}
.rh{text-align:center;padding:48px 24px;margin-bottom:32px}
.rs{font-family:var(--fd);font-size:72px;font-weight:800;background:linear-gradient(135deg,var(--ac),var(--ok));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:8px}
.rl{font-size:16px;color:var(--t2);margin-bottom:32px}
.rst{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:32px}
.sc{padding:10px 20px;border-radius:var(--r);background:var(--bg2);border:1px solid var(--bd);font-size:14px;font-weight:500}
.sc b{font-weight:700;margin-right:4px}
.wi{padding:20px;border-radius:var(--r);background:var(--bg1);border:1px solid var(--bd);margin-bottom:12px;animation:su .3s ease}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;padding:24px;animation:fi .2s ease}
.md{background:var(--bg1);border:1px solid var(--bd);border-radius:var(--rl);padding:32px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;animation:si .2s ease;box-shadow:${t==="dark"?"0 8px 40px rgba(0,0,0,.4)":"0 8px 40px rgba(0,0,0,.1)"}}
.mt{font-family:var(--fd);font-size:22px;font-weight:700;margin-bottom:24px}.ma{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}
.lp{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.lc{max-width:400px;width:100%;text-align:center}
.hi{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--bg1);border:1px solid var(--bd);border-radius:var(--r);margin-bottom:8px}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.bgs{background:var(--oks);color:var(--ok)}.bge{background:var(--errs);color:var(--err)}.bgw{background:var(--wrns);color:var(--wrn)}.bga{background:var(--acs);color:var(--ac)}
.tabs{display:flex;gap:4px;background:var(--bg2);padding:4px;border-radius:var(--r);margin-bottom:24px}
.tab{flex:1;padding:10px 16px;border-radius:var(--rs);border:none;background:transparent;color:var(--t2);font-family:var(--fb);font-size:14px;font-weight:500;cursor:pointer;transition:all var(--tr)}
.tab.act{background:var(--bg1);color:var(--t1);box-shadow:0 1px 4px rgba(0,0,0,.2)}
.toast{position:fixed;bottom:24px;right:24px;padding:14px 22px;background:var(--bg2);border:1px solid var(--bd);border-radius:var(--r);font-size:14px;z-index:300;animation:su .3s ease;box-shadow:var(--sh)}
.toast-s{border-color:var(--ok)}.toast-e{border-color:var(--err)}
.dots{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:24px;justify-content:center}
.dot{width:28px;height:28px;border-radius:50%;border:2px solid var(--bd);background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;transition:all var(--tr);color:var(--t3)}
.dot.cur{border-color:var(--ac);color:var(--ac);background:var(--acs)}
.dot.dok{border-color:var(--ok);background:var(--oks);color:var(--ok)}
.dot.dng{border-color:var(--err);background:var(--errs);color:var(--err)}
.dot.dfl{box-shadow:0 0 0 2px var(--wrn)}
.ur{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--bg1);border:1px solid var(--bd);border-radius:var(--r);margin-bottom:8px;gap:12px;flex-wrap:wrap}
.ui{display:flex;align-items:center;gap:12px;flex:1;min-width:200px}
.ua{width:40px;height:40px;border-radius:50%;background:var(--acs);display:flex;align-items:center;justify-content:center;color:var(--ac);font-weight:700;font-size:16px;flex-shrink:0}
.us{display:flex;gap:16px;font-size:12px;color:var(--t3);flex-wrap:wrap}
.pp{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center}
.pc{max-width:440px;width:100%}
.pi{font-size:64px;margin-bottom:24px;display:block;animation:pulse 2s infinite}
.nd{width:8px;height:8px;border-radius:50%;background:var(--err);position:absolute;top:-2px;right:-2px}
.aqi{padding:14px 18px;border-radius:var(--rs);background:var(--bg2);border:1px solid var(--bd);margin-bottom:6px;font-size:14px;display:flex;justify-content:space-between;align-items:center;gap:12px}
.aqt{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.agi{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-radius:var(--r);background:var(--bg1);border:1px solid var(--bd);margin-bottom:8px;gap:12px}
.pct-bar{height:6px;border-radius:3px;background:var(--bg2);overflow:hidden;margin-top:4px}.pct-fill{height:100%;border-radius:3px;transition:width .3s}
.icon-up{width:80px;height:80px;border-radius:var(--r);border:2px dashed var(--bd);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all var(--tr);overflow:hidden;background:var(--bg2);flex-shrink:0}
.icon-up:hover{border-color:var(--ac);background:var(--acs)}
.icon-up img{width:100%;height:100%;object-fit:cover}
.prog-wrap{margin-top:auto;padding-top:16px}
.prog-bar{height:6px;border-radius:3px;background:var(--bg3);overflow:hidden}.prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--ac),#a78bfa);transition:width .4s}
.prog-txt{display:flex;justify-content:space-between;font-size:11px;color:var(--t3);margin-top:6px;font-weight:500}
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
  const [qf, setQf] = useState({ text: "", options: ["","","",""], correct: 0 });
  const [bulk, setBulk] = useState("");
  const [newPw, setNewPw] = useState("");
  const letters = ["A","B","C","D"];

  // ─── Init: check session ───
  useEffect(() => {
    (async () => {
      const theme = localStorage.getItem("qv-theme") || "dark";
      const token = localStorage.getItem("qv-token");
      if (token) {
        const { data: sess } = await supabase.from("sessions").select("user_id, expires_at").eq("token", token).single();
        if (sess && new Date(sess.expires_at) > new Date()) {
          const { data: user } = await supabase.from("users").select("*").eq("id", sess.user_id).single();
          if (user) {
            set({ user, theme, page: user.status === "pending" ? "pending" : "home", loading: false });
            loadGroups();
            loadHistory(user.id);
            if (user.is_admin) loadUsers();
            return;
          }
        }
        localStorage.removeItem("qv-token");
      }
      set({ theme, loading: false });
    })();
  }, []);

  // ─── Styles ───
  useEffect(() => {
    const el = document.getElementById("qv-css") || document.createElement("style");
    el.id = "qv-css"; el.textContent = mkStyles(s.theme);
    if (!el.parentNode) document.head.appendChild(el);
  }, [s.theme]);

  const toggleTheme = () => {
    const t = s.theme === "dark" ? "light" : "dark";
    set({ theme: t }); localStorage.setItem("qv-theme", t);
  };

  // ─── Data Loading ───
  const loadGroups = async () => {
    const { data: groups } = await supabase.from("groups").select("*").order("sort_order");
    const { data: allQ } = await supabase.from("questions").select("*");
    const qMap = {};
    (allQ || []).forEach(q => {
      if (!qMap[q.group_id]) qMap[q.group_id] = [];
      qMap[q.group_id].push(q);
    });
    set({ groups: groups || [], questions: qMap });
  };

  const loadHistory = async (userId) => {
    const { data } = await supabase.from("attempts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    set({ history: data || [] });
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at");
    set({ users: data || [] });
  };

  // ─── Auth ───
  const handleAuth = async () => {
    const { u, p, p2, signup, remember } = lf;
    if (!u.trim() || !p.trim()) return toast("Fill in all fields", "e");
    const ph = await hashPw(p);

    if (signup) {
      if (p !== p2) return toast("Passwords don't match", "e");
      if (p.length < 4) return toast("Password must be at least 4 characters", "e");
      const { data: exists } = await supabase.from("users").select("id").eq("username", u.trim()).single();
      if (exists) return toast("Username already taken", "e");
      const { data: count } = await supabase.from("users").select("id", { count: "exact", head: true });
      const { data: allUsers } = await supabase.from("users").select("id");
      const isFirst = !allUsers || allUsers.length === 0;
      const { data: user, error } = await supabase.from("users").insert({
        username: u.trim(), password_hash: ph, is_admin: isFirst, status: isFirst ? "approved" : "pending"
      }).select().single();
      if (error) return toast("Error creating account", "e");
      if (remember || isFirst) {
        const token = genToken();
        await supabase.from("sessions").insert({ user_id: user.id, token });
        localStorage.setItem("qv-token", token);
      }
      set({ user, page: isFirst ? "home" : "pending" });
      if (isFirst) { toast("Welcome! You are the admin."); loadGroups(); }
      else toast("Account created! Waiting for approval.");
    } else {
      const { data: user } = await supabase.from("users").select("*").eq("username", u.trim()).single();
      if (!user || user.password_hash !== ph) return toast("Invalid credentials", "e");
      if (user.status === "banned") return toast("Account suspended", "e");
      if (remember) {
        const token = genToken();
        await supabase.from("sessions").insert({ user_id: user.id, token });
        localStorage.setItem("qv-token", token);
      }
      set({ user, page: user.status === "pending" ? "pending" : "home" });
      if (user.status === "approved") toast(`Welcome back, ${user.username}!`);
      loadGroups(); loadHistory(user.id);
      if (user.is_admin) loadUsers();
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("qv-token");
    if (token) await supabase.from("sessions").delete().eq("token", token);
    localStorage.removeItem("qv-token");
    set({ user: null, page: "login", history: [], users: [] });
    setLf({ u: "", p: "", p2: "", signup: false, remember: false });
  };

  // ─── User Management ───
  const setUserStatus = async (id, status) => {
    await supabase.from("users").update({ status }).eq("id", id);
    loadUsers(); toast(`User ${status}`);
  };
  const deleteUser = async (id) => {
    await supabase.from("attempts").delete().eq("user_id", id);
    await supabase.from("sessions").delete().eq("user_id", id);
    await supabase.from("users").delete().eq("id", id);
    loadUsers(); toast("User deleted"); set({ modal: null });
  };
  const toggleAdmin = async (id, cur) => {
    await supabase.from("users").update({ is_admin: !cur }).eq("id", id);
    loadUsers(); toast(cur ? "Admin removed" : "Admin granted");
  };
  const resetUserPw = async (id) => {
    if (!newPw || newPw.length < 4) return toast("Min 4 characters", "e");
    const h = await hashPw(newPw);
    await supabase.from("users").update({ password_hash: h }).eq("id", id);
    await supabase.from("sessions").delete().eq("user_id", id);
    setNewPw(""); toast("Password reset"); set({ modal: null });
  };

  // ─── Profile / Change Password ───
  const [cpf, setCpf] = useState({ old: "", new1: "", new2: "" });
  const changePw = async () => {
    if (!cpf.old || !cpf.new1) return toast("Fill all fields", "e");
    if (cpf.new1 !== cpf.new2) return toast("New passwords don't match", "e");
    if (cpf.new1.length < 4) return toast("Min 4 characters", "e");
    const oldH = await hashPw(cpf.old);
    if (oldH !== s.user.password_hash) return toast("Current password is wrong", "e");
    const newH = await hashPw(cpf.new1);
    await supabase.from("users").update({ password_hash: newH }).eq("id", s.user.id);
    set({ user: { ...s.user, password_hash: newH } });
    setCpf({ old: "", new1: "", new2: "" });
    toast("Password changed!");
  };

  // ─── Quiz ───
  const startQuiz = (group) => {
    const qs = s.questions[group.id] || [];
    if (qs.length === 0) return toast("No questions yet", "e");
    set({ curGroup: group, shuffled: shuffle(qs), qi: 0, ans: {}, flags: {}, page: "quiz" });
  };

  const pickAns = (qId, idx) => { if (s.ans[qId] !== undefined) return; set({ ans: { ...s.ans, [qId]: idx } }); };
  const toggleFlag = (qId) => { const f = { ...s.flags }; f[qId] ? delete f[qId] : f[qId] = true; set({ flags: f }); };

  const finishQuiz = async () => {
    const qs = s.shuffled;
    let score = 0; const wrong = [];
    qs.forEach(q => {
      const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      if (s.ans[q.id] === q.correct) score++;
      else wrong.push({ text: q.text, yours: opts[s.ans[q.id]] || "Skipped", correct: opts[q.correct] });
    });
    const { data: attempt } = await supabase.from("attempts").insert({
      user_id: s.user.id, group_id: s.curGroup.id, group_name: s.curGroup.name,
      score, total: qs.length, wrong
    }).select().single();
    loadHistory(s.user.id);
    set({ page: "results", lastRes: { score, total: qs.length, wrong, group_name: s.curGroup.name } });
  };

  // ─── Admin: Groups ───
  const iconInputRef = useRef(null);
  const [iconUploading, setIconUploading] = useState(false);

  const uploadIcon = async (file, callback) => {
    if (!file) return;
    setIconUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const name = `group-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from("icons").upload(name, file, { upsert: true });
      if (error) { toast("Upload failed: " + error.message, "e"); setIconUploading(false); return; }
      const { data: urlData } = supabase.storage.from("icons").getPublicUrl(name);
      callback(urlData.publicUrl);
    } catch (err) { toast("Upload failed", "e"); }
    setIconUploading(false);
  };

  const addGroup = async () => {
    if (!gf.name.trim()) return toast("Name required", "e");
    await supabase.from("groups").insert({ name: gf.name, description: gf.description, icon: gf.icon });
    setGf({ name: "", description: "", icon: "📝" }); loadGroups(); toast("Group created!"); set({ adminTab: "groups" });
  };
  const delGroup = async (id) => {
    await supabase.from("groups").delete().eq("id", id);
    loadGroups(); toast("Group deleted"); set({ modal: null });
  };
  const updGroup = async (id, u) => {
    await supabase.from("groups").update(u).eq("id", id);
    loadGroups();
  };

  // ─── Admin: Questions ───
  const addQ = async (gid) => {
    if (!qf.text.trim() || qf.options.some(o => !o.trim())) return toast("Fill all fields", "e");
    await supabase.from("questions").insert({ group_id: gid, text: qf.text, options: qf.options, correct: qf.correct });
    setQf({ text: "", options: ["","","",""], correct: 0 }); loadGroups(); toast("Question added!");
  };
  const updQ = async (id, u) => {
    await supabase.from("questions").update(u).eq("id", id);
    loadGroups(); toast("Updated");
  };
  const delQ = async (id) => {
    await supabase.from("questions").delete().eq("id", id);
    loadGroups(); toast("Deleted");
  };
  const importBulk = async (gid) => {
    try {
      const lines = bulk.trim().split("\n").filter(l => l.trim());
      const qs = []; let i = 0;
      while (i < lines.length) {
        const text = lines[i]?.trim();
        const opts = [];
        for (let j = 1; j <= 4; j++) if (i+j < lines.length) opts.push(lines[i+j]?.replace(/^[A-D][\.\)]\s*/, "").trim());
        const cl = lines[i+5]?.trim();
        const ci = cl ? "ABCD".indexOf(cl.toUpperCase().replace("ANSWER:","").replace("CORRECT:","").trim()) : 0;
        if (text && opts.length === 4) qs.push({ group_id: gid, text, options: opts, correct: Math.max(0,Math.min(ci,3)) });
        i += 6;
      }
      if (qs.length === 0) return toast("No valid questions", "e");
      await supabase.from("questions").insert(qs);
      setBulk(""); loadGroups(); toast(`${qs.length} questions imported!`);
    } catch (err) { toast("Import failed", "e"); }
  };

  // ─── Excel Import ───
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [previewRows, setPreviewRows] = useState(null);
  const [importGroupId, setImportGroupId] = useState(null);

  const handleExcelUpload = async (e, gid) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    setImportGroupId(gid);

    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (rows.length === 0) { setImporting(false); return toast("Empty file", "e"); }

      // Normalize headers (case-insensitive, trimmed)
      const normalize = (row) => {
        const n = {};
        Object.keys(row).forEach(k => { n[k.trim().toLowerCase()] = String(row[k]).trim(); });
        return n;
      };

      const parsed = [];
      for (const raw of rows) {
        const r = normalize(raw);
        // Try to find question text
        const text = r["question"] || r["q"] || r["text"] || Object.values(r)[0];
        if (!text || !text.trim()) continue;

        // Try to find options
        const optA = r["option a"] || r["a"] || r["optiona"] || r["option_a"] || Object.values(r)[1] || "";
        const optB = r["option b"] || r["b"] || r["optionb"] || r["option_b"] || Object.values(r)[2] || "";
        const optC = r["option c"] || r["c"] || r["optionc"] || r["option_c"] || Object.values(r)[3] || "";
        const optD = r["option d"] || r["d"] || r["optiond"] || r["option_d"] || Object.values(r)[4] || "";

        if (!optA && !optB && !optC && !optD) continue;

        // Try to find correct answer
        const correctRaw = (r["correct"] || r["answer"] || r["correct answer"] || r["correct_answer"] || r["ans"] || "A").toUpperCase().trim();
        let correct = 0;
        if (correctRaw === "A" || correctRaw === "1") correct = 0;
        else if (correctRaw === "B" || correctRaw === "2") correct = 1;
        else if (correctRaw === "C" || correctRaw === "3") correct = 2;
        else if (correctRaw === "D" || correctRaw === "4") correct = 3;
        else {
          // Check if the value matches one of the options
          if (correctRaw === optB.toUpperCase()) correct = 1;
          else if (correctRaw === optC.toUpperCase()) correct = 2;
          else if (correctRaw === optD.toUpperCase()) correct = 3;
        }

        parsed.push({
          text: text.trim(),
          options: [optA, optB, optC, optD],
          correct,
        });
      }

      if (parsed.length === 0) { setImporting(false); return toast("No valid questions found. Check column headers.", "e"); }

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
      group_id: gid, text: q.text, options: q.options, correct: q.correct
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
    const headers = "Question,Option A,Option B,Option C,Option D,Correct";
    const example1 = "What is the capital of France?,London,Paris,Berlin,Madrid,B";
    const example2 = "Which planet is closest to the Sun?,Venus,Mercury,Earth,Mars,B";
    const csv = [headers, example1, example2].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "quiz_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };
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
          <div className="logo" onClick={() => set({ page: "home" })}>MohVault</div>
          <div className="nav-r">
            <button className="b bg bs" onClick={() => set({ page: "home" })}><I.Home /> Home</button>
            <button className="b bg bs" onClick={() => set({ page: "history" })}><I.Chart /> History</button>
            <button className="b bg bs" onClick={() => set({ page: "profile" })}><I.User /> Profile</button>
            {s.user?.is_admin && (
              <button className="b bg bs" onClick={() => { set({ page: "admin", adminTab: "groups" }); loadUsers(); loadGroups(); }} style={{position:"relative"}}>
                <I.Gear /> Admin {pendingN > 0 && <span className="nd"/>}
              </button>
            )}
            <button className="b bg bi bs" onClick={toggleTheme}>{s.theme==="dark"?<I.Sun/>:<I.Moon/>}</button>
            <button className="b bs" onClick={logout}>Logout</button>
          </div>
        </nav>
      )}

      {/* Login */}
      {s.page === "login" && (
        <div className="lp">
          <div className="lc c" style={{animation:"si .4s ease",position:"relative"}}>
            <span style={{fontSize:48,display:"block",marginBottom:24}}>🧠</span>
            <div className="st">Mohammed Vault</div>
            <p style={{color:"var(--t2)",marginBottom:28,fontSize:14}}>Test your knowledge across multiple topics</p>
            <div style={{position:"absolute",top:16,right:16}}>
              <button className="b bg bi bs" onClick={toggleTheme}>{s.theme==="dark"?<I.Sun/>:<I.Moon/>}</button>
            </div>
            <div className="tabs" style={{marginBottom:24}}>
              <button className={`tab ${!lf.signup?"act":""}`} onClick={() => setLf(f=>({...f,signup:false}))}>Sign In</button>
              <button className={`tab ${lf.signup?"act":""}`} onClick={() => setLf(f=>({...f,signup:true}))}>Sign Up</button>
            </div>
            <div className="ig"><label className="lbl">Username</label>
              <input className="inp" placeholder="Enter username" value={lf.u} onChange={e=>setLf(f=>({...f,u:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
            </div>
            <div className="ig"><label className="lbl">Password</label>
              <input className="inp" type="password" placeholder="Enter password" value={lf.p} onChange={e=>setLf(f=>({...f,p:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
            </div>
            {lf.signup && (
              <div className="ig"><label className="lbl">Confirm Password</label>
                <input className="inp" type="password" placeholder="Confirm password" value={lf.p2} onChange={e=>setLf(f=>({...f,p2:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
              </div>
            )}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <input type="checkbox" id="rem" checked={lf.remember} onChange={e=>setLf(f=>({...f,remember:e.target.checked}))} style={{accentColor:"var(--ac)"}}/>
              <label htmlFor="rem" style={{fontSize:13,color:"var(--t2)",cursor:"pointer"}}>Remember me</label>
            </div>
            <button className="b bp" style={{width:"100%"}} onClick={handleAuth}>{lf.signup?"Create Account":"Sign In"}</button>
            <p style={{color:"var(--t3)",fontSize:12,marginTop:16}}>
              {lf.signup?"Your account will need admin approval":"Don't have an account? Sign up above"}
            </p>
          </div>
        </div>
      )}

      {/* Pending */}
      {s.page === "pending" && (
        <div className="pp">
          <div className="pc c">
            <span className="pi">⏳</span>
            <div className="st" style={{marginBottom:12}}>Awaiting Approval</div>
            <p style={{color:"var(--t2)",fontSize:15,lineHeight:1.6,marginBottom:28}}>
              Your account has been created. Please wait for an administrator to approve your access.
            </p>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button className="b" onClick={async()=>{
                const{data:u}=await supabase.from("users").select("*").eq("id",s.user.id).single();
                if(u?.status==="approved"){set({user:u,page:"home"});loadGroups();loadHistory(u.id);toast("Approved! Welcome!");}
                else toast("Still pending","e");
              }}>Check Status</button>
              <button className="b bg" onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Home */}
      {s.page === "home" && (
        <div className="pg">
          <div className="st">Choose a Quiz</div>
          <p className="ss">Welcome, {s.user?.username}. Select a topic to get started.</p>
          <div className="gg">
            {s.groups.map(g => {
              const qs = s.questions[g.id] || [];
              const best = s.history.filter(h=>h.group_id===g.id);
              const bestPct = best.length > 0 ? Math.max(...best.map(h=>Math.round(h.score/h.total*100))) : null;
              const uniqueQs = new Set();
              best.forEach(h => { if(h.wrong) { const total = h.total; const right = h.score; } });
              const attempted = best.length;
              const progressPct = qs.length > 0 ? Math.min(100, Math.round((attempted / Math.max(1, Math.ceil(qs.length / qs.length))) * 100)) : 0;
              const isUrl = g.icon && (g.icon.startsWith("http") || g.icon.startsWith("data:"));
              return (
                <div key={g.id} className="c ch gc" onClick={()=>startQuiz(g)} style={{display:"flex",flexDirection:"column"}}>
                  {isUrl ? <img src={g.icon} alt="" style={{width:48,height:48,borderRadius:"var(--rs)",objectFit:"cover",marginBottom:16}}/> : <span className="gi">{g.icon || "📝"}</span>}
                  <div className="gn">{g.name}</div>
                  <div className="gd">{g.description}</div>
                  <div className="gm">
                    <span>{qs.length} questions</span>
                    <span style={{display:"flex",alignItems:"center",gap:4}}><I.Shuf/> Shuffled</span>
                    {bestPct !== null && <span style={{color:"var(--ok)"}}>Best: {bestPct}%</span>}
                  </div>
                  {qs.length > 0 && (
                    <div className="prog-wrap">
                      <div className="prog-bar"><div className="prog-fill" style={{width:`${attempted > 0 ? Math.min(100, Math.round(bestPct || 0)) : 0}%`}}/></div>
                      <div className="prog-txt">
                        <span>{attempted} attempt{attempted!==1?"s":""}</span>
                        <span>{bestPct !== null ? `${bestPct}% best` : "Not started"}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {s.groups.length === 0 && <div style={{textAlign:"center",padding:60,color:"var(--t3)"}}>No quiz groups yet.</div>}
        </div>
      )}

      {/* Quiz */}
      {s.page === "quiz" && curQ && (() => {
        const opts = getOpts(curQ);
        return (
          <div className="pg">
            <div className="qpb"><div className="qpf" style={{width:`${((s.qi+1)/s.shuffled.length)*100}%`}}/></div>
            <div className="dots">
              {s.shuffled.map((q,i) => {
                let cl = "dot";
                if(i===s.qi) cl+=" cur";
                else if(s.ans[q.id]!==undefined) cl+=s.ans[q.id]===q.correct?" dok":" dng";
                if(s.flags[q.id]) cl+=" dfl";
                return <button key={q.id} className={cl} onClick={()=>set({qi:i})}>{i+1}</button>;
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32,flexWrap:"wrap",gap:16}}>
              <div className="qc">Question {s.qi+1} of {s.shuffled.length}</div>
              <button className={`b bg bs fb ${s.flags[curQ.id]?"ff":""}`} onClick={()=>toggleFlag(curQ.id)}>
                <I.Flag filled={!!s.flags[curQ.id]}/>{s.flags[curQ.id]?"Flagged":"Flag"}
              </button>
            </div>
            <div className="qq">{curQ.text}</div>
            {opts.map((opt,idx) => {
              const answered = s.ans[curQ.id]!==undefined;
              const isSel = s.ans[curQ.id]===idx;
              const isCor = idx===curQ.correct;
              let cl = "ob";
              if(answered){cl+=" od";if(isCor)cl+=" oc";else if(isSel&&!isCor)cl+=" ow";}
              return (
                <button key={idx} className={cl} onClick={()=>pickAns(curQ.id,idx)}>
                  <span className="ol">{answered&&isCor?<I.Check/>:answered&&isSel&&!isCor?<I.X/>:letters[idx]}</span>
                  <span>{opt}</span>
                </button>
              );
            })}
            <div className="qa">
              <button className="b bs" disabled={s.qi===0} onClick={()=>set({qi:s.qi-1})} style={{opacity:s.qi===0?.4:1}}>
                <I.Arr d="l"/> Previous
              </button>
              <div style={{display:"flex",gap:8}}>
                {Object.keys(s.flags).length>0 && <button className="b bs" style={{color:"var(--wrn)"}} onClick={()=>set({page:"flagged"})}><I.Flag filled/>Review ({Object.keys(s.flags).length})</button>}
              </div>
              {s.qi<s.shuffled.length-1 ? (
                <button className="b bp bs" onClick={()=>set({qi:s.qi+1})}>Next <I.Arr d="r"/></button>
              ) : (
                <button className="b bp bs" onClick={finishQuiz}>Finish <I.Arr d="r"/></button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Flagged */}
      {s.page === "flagged" && (
        <div className="pg">
          <div className="st">Flagged Questions</div>
          <p className="ss">Review your flagged questions.</p>
          {s.shuffled.filter(q=>s.flags[q.id]).map(q => {
            const opts = getOpts(q);
            return (
              <div key={q.id} className="c" style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <span className="badge bgw">Flagged</span>
                  <button className="b bg bs" onClick={()=>set({page:"quiz",qi:s.shuffled.findIndex(x=>x.id===q.id)})}>Go to question</button>
                </div>
                <div style={{fontSize:16,fontWeight:600,marginBottom:12}}>{q.text}</div>
                {s.ans[q.id]!==undefined ? (
                  <div style={{fontSize:13,color:"var(--t2)"}}>
                    Your answer: <span style={{color:s.ans[q.id]===q.correct?"var(--ok)":"var(--err)",fontWeight:600}}>{opts[s.ans[q.id]]}</span>
                    {s.ans[q.id]!==q.correct && <> — Correct: <span style={{color:"var(--ok)",fontWeight:600}}>{opts[q.correct]}</span></>}
                  </div>
                ) : <span className="badge bga">Not answered</span>}
              </div>
            );
          })}
          <button className="b bp" style={{marginTop:16}} onClick={()=>set({page:"quiz"})}><I.Arr d="l"/> Back to Quiz</button>
        </div>
      )}

      {/* Results */}
      {s.page === "results" && s.lastRes && (
        <div className="pg">
          <div className="rh">
            <div className="rs">{Math.round(s.lastRes.score/s.lastRes.total*100)}%</div>
            <div className="rl">
              {s.lastRes.score===s.lastRes.total?"Perfect! 🎉":s.lastRes.score/s.lastRes.total>=.8?"Great job! 🌟":s.lastRes.score/s.lastRes.total>=.5?"Not bad! 💪":"Keep practicing! 📚"}
            </div>
            <div className="rst">
              <div className="sc"><b style={{color:"var(--ok)"}}>{s.lastRes.score}</b>Correct</div>
              <div className="sc"><b style={{color:"var(--err)"}}>{s.lastRes.total-s.lastRes.score}</b>Wrong</div>
              <div className="sc"><b>{s.lastRes.total}</b>Total</div>
            </div>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button className="b bp" onClick={()=>startQuiz(s.curGroup)}>Retry</button>
              <button className="b" onClick={()=>set({page:"home"})}>Choose Another</button>
            </div>
          </div>
          {s.lastRes.wrong.length > 0 && (
            <div>
              <div style={{fontSize:18,fontFamily:"var(--fd)",fontWeight:600,marginBottom:16}}>Questions You Missed</div>
              {s.lastRes.wrong.map((w,i) => (
                <div key={i} className="wi">
                  <div style={{fontWeight:600,marginBottom:8,fontSize:15}}>{w.text}</div>
                  <div style={{fontSize:13,color:"var(--t2)"}}>
                    Your answer: <span style={{color:"var(--err)",fontWeight:600}}>{w.yours}</span>{" · "}Correct: <span style={{color:"var(--ok)",fontWeight:600}}>{w.correct}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {s.page === "history" && (
        <div className="pg">
          <div className="st">Quiz History</div>
          <p className="ss">Your past attempts and scores.</p>
          {s.history.length===0 ? <div style={{textAlign:"center",color:"var(--t3)",padding:40}}>No history yet. Take a quiz!</div> :
           s.history.map((h,i) => (
            <div key={i} className="hi">
              <div>
                <div style={{fontWeight:600,marginBottom:4}}>{h.group_name}</div>
                <div style={{fontSize:12,color:"var(--t3)"}}>{new Date(h.created_at).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
              </div>
              <span className={`badge ${h.score/h.total>=.8?"bgs":h.score/h.total>=.5?"bgw":"bge"}`}>
                {h.score}/{h.total} ({Math.round(h.score/h.total*100)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Profile */}
      {s.page === "profile" && (
        <div className="pg" style={{maxWidth:500}}>
          <div className="st">Profile</div>
          <p className="ss">Manage your account settings.</p>
          <div className="c" style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
              <div className="ua" style={{width:56,height:56,fontSize:22}}>{s.user?.username?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{fontWeight:600,fontSize:18}}>{s.user?.username}</div>
                <div style={{fontSize:13,color:"var(--t3)"}}>
                  {s.user?.is_admin && <span className="badge bga" style={{marginRight:8}}>Admin</span>}
                  Joined {new Date(s.user?.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div style={{fontSize:14,color:"var(--t2)"}}>
              Quizzes taken: <strong>{s.history.length}</strong>
              {s.history.length > 0 && <> · Average: <strong>{Math.round(s.history.reduce((a,h)=>a+h.score/h.total*100,0)/s.history.length)}%</strong></>}
            </div>
          </div>
          <div className="c">
            <div style={{fontSize:16,fontWeight:600,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><I.Key/> Change Password</div>
            <div className="ig"><label className="lbl">Current Password</label>
              <input className="inp" type="password" value={cpf.old} onChange={e=>setCpf(f=>({...f,old:e.target.value}))} placeholder="Enter current password"/>
            </div>
            <div className="ig"><label className="lbl">New Password</label>
              <input className="inp" type="password" value={cpf.new1} onChange={e=>setCpf(f=>({...f,new1:e.target.value}))} placeholder="Enter new password"/>
            </div>
            <div className="ig"><label className="lbl">Confirm New Password</label>
              <input className="inp" type="password" value={cpf.new2} onChange={e=>setCpf(f=>({...f,new2:e.target.value}))} placeholder="Confirm new password"/>
            </div>
            <button className="b bp" onClick={changePw}>Update Password</button>
          </div>
        </div>
      )}

      {/* Admin */}
      {s.page === "admin" && s.user?.is_admin && (
        <div className="pg pw">
          <div className="st">Admin Panel</div>
          <p className="ss">Manage groups, questions, and users.</p>
          <div className="tabs" style={{maxWidth:600}}>
            <button className={`tab ${s.adminTab==="groups"?"act":""}`} onClick={()=>set({adminTab:"groups"})}>Groups</button>
            <button className={`tab ${s.adminTab==="add"?"act":""}`} onClick={()=>{setGf({name:"",description:"",icon:"📝"});set({adminTab:"add"});}}>New Group</button>
            <button className={`tab ${s.adminTab==="users"?"act":""}`} onClick={()=>{loadUsers();set({adminTab:"users"});}}>
              Users {pendingN>0&&<span style={{background:"var(--err)",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,marginLeft:6}}>{pendingN}</span>}
            </button>
          </div>

          {/* Users */}
          {s.adminTab === "users" && (
            <div>
              {s.users.filter(u=>u.status==="pending").length > 0 && (
                <div style={{marginBottom:32}}>
                  <div style={{fontSize:16,fontWeight:600,marginBottom:12,color:"var(--wrn)"}}>Pending Approval</div>
                  {s.users.filter(u=>u.status==="pending").map(u => (
                    <div key={u.id} className="ur" style={{borderColor:"var(--wrn)",borderStyle:"dashed"}}>
                      <div className="ui">
                        <div className="ua">{u.username[0].toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight:600}}>{u.username}</div>
                          <div style={{fontSize:12,color:"var(--t3)"}}>Signed up {new Date(u.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <button className="b bs bk" onClick={()=>setUserStatus(u.id,"approved")}><I.CheckC/> Approve</button>
                        <button className="b bs bd" onClick={()=>setUserStatus(u.id,"banned")}><I.Ban/> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{fontSize:16,fontWeight:600,marginBottom:12}}>All Users ({s.users.length})</div>
              {s.users.map(u => (
                <UserRow key={u.id} u={u} me={s.user} onStatus={setUserStatus} onToggleAdmin={toggleAdmin}
                  onDelete={(id,name)=>set({modal:{type:"del-user",id,name}})}
                  onResetPw={(id,name)=>{setNewPw("");set({modal:{type:"reset-pw",id,name}});}} />
              ))}
            </div>
          )}

          {/* Groups */}
          {s.adminTab === "groups" && (
            <div>
              {s.groups.map(g => (
                <div key={g.id} className="agi">
                  <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                    {g.icon && (g.icon.startsWith("http")||g.icon.startsWith("data:")) ? <img src={g.icon} alt="" style={{width:32,height:32,borderRadius:6,objectFit:"cover"}}/> : <span style={{fontSize:24}}>{g.icon||"📝"}</span>}
                    <div><div style={{fontWeight:600}}>{g.name}</div><div style={{fontSize:12,color:"var(--t3)"}}>{(s.questions[g.id]||[]).length} questions</div></div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button className="b bg bi bs" onClick={()=>set({editGroup:g.id,adminTab:"edit"})}><I.Edit/></button>
                    <button className="b bg bi bs bd" onClick={()=>set({modal:{type:"del-group",id:g.id,name:g.name}})}><I.Trash/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Group */}
          {s.adminTab === "add" && (
            <div className="c">
              <div style={{fontSize:18,fontFamily:"var(--fd)",fontWeight:600,marginBottom:20}}>Create New Group</div>
              <div className="ig">
                <label className="lbl">Icon</label>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                  <div className="icon-up" onClick={()=>iconInputRef.current?.click()}>
                    {gf.icon && (gf.icon.startsWith("http")||gf.icon.startsWith("data:")) ? <img src={gf.icon} alt=""/> : iconUploading ? <span style={{fontSize:12,color:"var(--t3)"}}>...</span> : <I.Img/>}
                  </div>
                  <input type="file" ref={iconInputRef} accept="image/*" style={{display:"none"}} onChange={(e)=>{
                    const file = e.target.files?.[0]; e.target.value="";
                    if(file) uploadIcon(file, (url)=>setGf(f=>({...f,icon:url})));
                  }}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:"var(--t2)",marginBottom:8}}>Upload an image, or type an emoji below:</div>
                    <input className="inp" value={gf.icon && !gf.icon.startsWith("http") ? gf.icon : ""} placeholder="📝" onChange={e=>setGf(f=>({...f,icon:e.target.value}))} style={{width:120}}/>
                  </div>
                </div>
              </div>
              <div className="ig"><label className="lbl">Name</label><input className="inp" placeholder="e.g., Mathematics" value={gf.name} onChange={e=>setGf(f=>({...f,name:e.target.value}))}/></div>
              <div className="ig"><label className="lbl">Description</label><textarea className="ta" placeholder="Brief description..." value={gf.description} onChange={e=>setGf(f=>({...f,description:e.target.value}))}/></div>
              <button className="b bp" onClick={addGroup}><I.Plus/> Create Group</button>
            </div>
          )}

          {/* Edit Group */}
          {s.adminTab === "edit" && s.editGroup && (() => {
            const g = s.groups.find(x=>x.id===s.editGroup);
            if(!g) return null;
            const qs = s.questions[g.id] || [];
            return (
              <div>
                <button className="b bg bs" onClick={()=>set({adminTab:"groups",editGroup:null})} style={{marginBottom:16}}><I.Arr d="l"/> Back</button>
                <div className="c" style={{marginBottom:24}}>
                  <div style={{fontSize:18,fontFamily:"var(--fd)",fontWeight:600,marginBottom:20}}>Edit: {g.name}</div>
                  <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap",alignItems:"flex-start"}}>
                    <div>
                      <label className="lbl">Icon</label>
                      <div className="icon-up" onClick={()=>iconInputRef.current?.click()}>
                        {g.icon && (g.icon.startsWith("http")||g.icon.startsWith("data:")) ? <img src={g.icon} alt=""/> : iconUploading ? <span style={{fontSize:12,color:"var(--t3)"}}>...</span> : <span style={{fontSize:28}}>{g.icon||"📝"}</span>}
                      </div>
                      <input type="file" ref={iconInputRef} accept="image/*" style={{display:"none"}} onChange={(e)=>{
                        const file = e.target.files?.[0]; e.target.value="";
                        if(file) uploadIcon(file, (url)=>updGroup(g.id,{icon:url}));
                      }}/>
                      <input className="inp" value={g.icon && !g.icon.startsWith("http") ? g.icon : ""} placeholder="📝" onChange={e=>updGroup(g.id,{icon:e.target.value})} style={{width:80,marginTop:8,textAlign:"center"}}/>
                    </div>
                    <div style={{flex:1,minWidth:200}}><label className="lbl">Name</label><input className="inp" value={g.name} onChange={e=>updGroup(g.id,{name:e.target.value})}/></div>
                  </div>
                  <div className="ig"><label className="lbl">Description</label><textarea className="ta" value={g.description} onChange={e=>updGroup(g.id,{description:e.target.value})}/></div>
                </div>
                <div className="c" style={{marginBottom:24}}>
                  <div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Questions ({qs.length})</div>
                  {qs.map((q,qi) => (
                    <div key={q.id} className="aqi">
                      <span className="aqt">{qi+1}. {q.text}</span>
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
                        <button className="b bg bi bs" onClick={()=>{
                          const o = getOpts(q);
                          setQf({text:q.text,options:[...o],correct:q.correct});
                          set({editQ:q.id,modal:{type:"edit-q",gid:g.id}});
                        }}><I.Edit/></button>
                        <button className="b bg bi bs bd" onClick={()=>delQ(q.id)}><I.Trash/></button>
                      </div>
                    </div>
                  ))}
                  {qs.length===0 && <div style={{color:"var(--t3)",fontSize:14}}>No questions yet.</div>}
                </div>
                <div className="c" style={{marginBottom:24}}>
                  <div style={{fontSize:16,fontWeight:600,marginBottom:16}}>Add Question</div>
                  <div className="ig"><label className="lbl">Question</label><textarea className="ta" placeholder="Enter question..." value={qf.text} onChange={e=>setQf(f=>({...f,text:e.target.value}))}/></div>
                  {qf.options.map((opt,i) => (
                    <div className="ig" key={i}>
                      <label className="lbl">Option {letters[i]} {qf.correct===i&&<span style={{color:"var(--ok)",marginLeft:8}}>✓ Correct</span>}</label>
                      <div style={{display:"flex",gap:8}}>
                        <input className="inp" placeholder={`Option ${letters[i]}`} value={opt} onChange={e=>{const o=[...qf.options];o[i]=e.target.value;setQf(f=>({...f,options:o}));}}/>
                        <button className={`b bs ${qf.correct===i?"bp":""}`} onClick={()=>setQf(f=>({...f,correct:i}))}>{qf.correct===i?"✓":"Set"}</button>
                      </div>
                    </div>
                  ))}
                  <button className="b bp" onClick={()=>addQ(g.id)}><I.Plus/> Add Question</button>
                </div>
                <div className="c" style={{marginBottom:24}}>
                  <div style={{fontSize:16,fontWeight:600,marginBottom:8,display:"flex",alignItems:"center",gap:8}}><I.File/> Import from Excel</div>
                  <p style={{fontSize:13,color:"var(--t2)",marginBottom:20,lineHeight:1.6}}>
                    Upload an Excel (.xlsx) or CSV file with your questions. The file should have these columns:
                    <strong style={{color:"var(--t1)",display:"block",marginTop:8}}>Question | Option A | Option B | Option C | Option D | Correct</strong>
                  </p>
                  <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:16}}>
                    <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" style={{display:"none"}}
                      onChange={(e)=>handleExcelUpload(e, g.id)} />
                    <button className="b bp" onClick={()=>fileInputRef.current?.click()} disabled={importing}>
                      {importing ? "Reading file..." : <><I.Upload/> Upload Excel / CSV</>}
                    </button>
                    <button className="b bs" onClick={downloadTemplate}><I.Download/> Download Template</button>
                  </div>
                  <div style={{padding:16,borderRadius:"var(--rs)",background:"var(--bg2)",border:"1px solid var(--bd)",fontSize:13,color:"var(--t3)",lineHeight:1.6}}>
                    <strong style={{color:"var(--t2)",display:"block",marginBottom:4}}>Tips:</strong>
                    The "Correct" column should be A, B, C, or D.
                    Column headers are flexible — "Question", "Q", or "Text" all work. Same for options: "Option A", "A", etc.
                  </div>
                </div>
                <div className="c">
                  <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Text Import</div>
                  <p style={{fontSize:13,color:"var(--t2)",marginBottom:16,lineHeight:1.5}}>
                    Or paste questions as text (6 lines each): Question → A. Option → B. Option → C. Option → D. Option → Answer letter
                  </p>
                  <textarea className="ta" style={{minHeight:140}} value={bulk} onChange={e=>setBulk(e.target.value)}
                    placeholder={"What is 2+2?\nA. 3\nB. 4\nC. 5\nD. 6\nB"}/>
                  <button className="b bp" style={{marginTop:12}} onClick={()=>importBulk(g.id)}><I.Upload/> Import Text</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modals */}
      {s.modal?.type === "del-group" && (
        <div className="mo" onClick={()=>set({modal:null})}><div className="md" onClick={e=>e.stopPropagation()}>
          <div className="mt">Delete "{s.modal.name}"?</div>
          <p style={{color:"var(--t2)",fontSize:14}}>This permanently deletes this group and all questions.</p>
          <div className="ma"><button className="b" onClick={()=>set({modal:null})}>Cancel</button><button className="b bd" onClick={()=>delGroup(s.modal.id)}>Delete</button></div>
        </div></div>
      )}
      {s.modal?.type === "del-user" && (
        <div className="mo" onClick={()=>set({modal:null})}><div className="md" onClick={e=>e.stopPropagation()}>
          <div className="mt">Delete "{s.modal.name}"?</div>
          <p style={{color:"var(--t2)",fontSize:14}}>This permanently deletes this user and all their history.</p>
          <div className="ma"><button className="b" onClick={()=>set({modal:null})}>Cancel</button><button className="b bd" onClick={()=>deleteUser(s.modal.id)}>Delete</button></div>
        </div></div>
      )}
      {s.modal?.type === "reset-pw" && (
        <div className="mo" onClick={()=>set({modal:null})}><div className="md" onClick={e=>e.stopPropagation()}>
          <div className="mt">Reset password for "{s.modal.name}"</div>
          <div className="ig"><label className="lbl">New Password</label>
            <input className="inp" type="text" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Enter new password"/>
          </div>
          <p style={{fontSize:12,color:"var(--t3)"}}> This will log the user out of all sessions.</p>
          <div className="ma"><button className="b" onClick={()=>set({modal:null})}>Cancel</button><button className="b bp" onClick={()=>resetUserPw(s.modal.id)}>Reset</button></div>
        </div></div>
      )}
      {s.modal?.type === "edit-q" && (
        <div className="mo" onClick={()=>{set({modal:null,editQ:null});setQf({text:"",options:["","","",""],correct:0});}}><div className="md" onClick={e=>e.stopPropagation()}>
          <div className="mt">Edit Question</div>
          <div className="ig"><label className="lbl">Question</label><textarea className="ta" value={qf.text} onChange={e=>setQf(f=>({...f,text:e.target.value}))}/></div>
          {qf.options.map((opt,i) => (
            <div className="ig" key={i}><label className="lbl">Option {letters[i]} {qf.correct===i&&<span style={{color:"var(--ok)",marginLeft:8}}>✓</span>}</label>
              <div style={{display:"flex",gap:8}}>
                <input className="inp" value={opt} onChange={e=>{const o=[...qf.options];o[i]=e.target.value;setQf(f=>({...f,options:o}));}}/>
                <button className={`b bs ${qf.correct===i?"bp":""}`} onClick={()=>setQf(f=>({...f,correct:i}))}>{qf.correct===i?"✓":"Set"}</button>
              </div>
            </div>
          ))}
          <div className="ma">
            <button className="b" onClick={()=>{set({modal:null,editQ:null});setQf({text:"",options:["","","",""],correct:0});}}>Cancel</button>
            <button className="b bp" onClick={()=>{updQ(s.editQ,{text:qf.text,options:qf.options,correct:qf.correct});set({modal:null,editQ:null});setQf({text:"",options:["","","",""],correct:0});}}>Save</button>
          </div>
        </div></div>
      )}

      {s.modal?.type === "excel-preview" && previewRows && (
        <div className="mo" onClick={()=>{setPreviewRows(null);set({modal:null});}}><div className="md" onClick={e=>e.stopPropagation()} style={{maxWidth:700}}>
          <div className="mt">Import Preview — {previewRows.length} Questions Found</div>
          <div style={{maxHeight:400,overflowY:"auto",marginBottom:16}}>
            {previewRows.map((q,i) => (
              <div key={i} style={{padding:12,borderRadius:"var(--rs)",background:"var(--bg2)",border:"1px solid var(--bd)",marginBottom:8,fontSize:13}}>
                <div style={{fontWeight:600,marginBottom:6}}>Q{i+1}: {q.text}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                  {q.options.map((o,oi) => (
                    <div key={oi} style={{padding:"4px 8px",borderRadius:4,background:oi===q.correct?"var(--oks)":"transparent",
                      color:oi===q.correct?"var(--ok)":"var(--t2)",fontWeight:oi===q.correct?600:400}}>
                      {letters[oi]}. {o}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{fontSize:13,color:"var(--t2)",marginBottom:8}}>
            Please review the questions above. Correct answers are highlighted in green.
          </p>
          <div className="ma">
            <button className="b" onClick={()=>{setPreviewRows(null);set({modal:null});}}>Cancel</button>
            <button className="b bp" onClick={()=>confirmExcelImport(s.modal.gid)}>Import {previewRows.length} Questions</button>
          </div>
        </div></div>
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
        setStats({ n: data.length, avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length), best: Math.max(...scores) });
      } else setStats({ n: 0, avg: 0, best: 0 });
    })();
  }, [u.id]);

  return (
    <div className="ur">
      <div className="ui">
        <div className="ua" style={u.is_admin?{background:"var(--acs)",color:"var(--ac)"}:{}}>{u.username[0].toUpperCase()}</div>
        <div>
          <div style={{fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
            {u.username}
            {u.is_admin && <span className="badge bga">Admin</span>}
            {u.status==="pending" && <span className="badge bgw">Pending</span>}
            {u.status==="banned" && <span className="badge bge">Banned</span>}
          </div>
          <div style={{fontSize:12,color:"var(--t3)"}}>Joined {new Date(u.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      <div className="us">
        {stats && <>
          <span><strong>{stats.n}</strong> quizzes</span>
          <span>Avg: <strong>{stats.avg}%</strong></span>
          <span>Best: <strong>{stats.best}%</strong></span>
        </>}
      </div>
      <div style={{display:"flex",gap:4}}>
        {u.id !== me.id ? (
          <>
            {u.status==="pending" && <button className="b bs bk" onClick={()=>onStatus(u.id,"approved")}><I.CheckC/></button>}
            {u.status!=="banned" ? <button className="b bg bi bs" onClick={()=>onStatus(u.id,"banned")} title="Ban"><I.Ban/></button>
             : <button className="b bg bi bs bk" onClick={()=>onStatus(u.id,"approved")} title="Unban"><I.CheckC/></button>}
            <button className="b bg bi bs" onClick={()=>onToggleAdmin(u.id,u.is_admin)} title={u.is_admin?"Remove admin":"Make admin"}><I.Shield/></button>
            <button className="b bg bi bs" onClick={()=>onResetPw(u.id,u.username)} title="Reset password"><I.Key/></button>
            <button className="b bg bi bs bd" onClick={()=>onDelete(u.id,u.username)} title="Delete"><I.Trash/></button>
          </>
        ) : <span style={{fontSize:12,color:"var(--t3)",fontStyle:"italic"}}>You</span>}
      </div>
    </div>
  );
}
