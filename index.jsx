"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
//  POCKETLINED — The Ultimate GPT Rewards Platform
// ═══════════════════════════════════════════════════════════════
//  BUSINESS MODEL: 100% funded by offerwall revenue share.
//  You earn 20-40% of every CPA/CPI the advertiser pays.
//  Users get rewarded from that cut. Zero out-of-pocket cost.
//
//  PSYCHOLOGY: Variable-ratio reinforcement, loss aversion,
//  endowed progress, social proof, commitment escalation,
//  near-miss effects, reciprocity, and FOMO triggers.
// ═══════════════════════════════════════════════════════════════

// ─── BRAND TOKENS (Psychology-Driven Palette) ───
// Green = money/go/success · Orange-Red = urgency/action · Gold = reward/achievement
// Purple = brand/premium · Hot Pink = scarcity/FOMO · Cyan = novelty/fresh
// Dark bg with high-contrast accents maximizes visual dopamine response
const B = {
  accent: "#01D676", accentL: "#01FF97", accentD: "#009653",
  ok: "#01D676", okL: "#4ADE80",
  warn: "#EB7C02", warnL: "#FFB84D",
  hot: "#FF3B30", hotL: "#FF6B5B",
  gold: "#FFB800",
  fomo: "#FF2D78",
  cyan: "#00E5FF",
  money: "#01D676",
  bg: "#141523", card: "#1C1D30", surface: "#222339",
  border: "#252539",
  txt: "#FFFFFF", muted: "#7D7D9E", dim: "#525266",
  light: "#A9A9CA", secondary: "#CCCCDD",
  gradCTA: "linear-gradient(135deg,#01D676 0%,#01FF97 100%)",
  grad: "linear-gradient(135deg,#01D676 0%,#01FF97 100%)",
  gradOk: "linear-gradient(135deg,#01D676 0%,#01FF97 100%)",
  gradHot: "linear-gradient(135deg,#FF3B30 0%,#EB7C02 100%)",
  gradGold: "linear-gradient(135deg,#FFB800 0%,#FFCB47 100%)",
  gradFomo: "linear-gradient(135deg,#FF2D78 0%,#A855F7 100%)",
  gradStreak: "linear-gradient(135deg,#FF3B30 0%,#FF6B35 40%,#FFB800 100%)",
  glass: "rgba(20,21,35,.95)",
  nav: "#1D1E30",
};

// ─── LEVELS (Commitment Escalation) ───
// Colors escalate warmth: cool gray → blue → green → amber → gold → red → purple
// Warm colors at higher levels create aspiration pull (people want "warmer" status)
const LEVELS = [
  { n:"Starter",    min:0,      icon:"🌱", c:"#94A3B8", bonus:0,  next:1000 },
  { n:"Explorer",   min:1000,   icon:"🧭", c:"#3B82F6", bonus:2,  next:5000 },
  { n:"Earner",     min:5000,   icon:"💸", c:"#00D26A", bonus:5,  next:15000 },
  { n:"Hustler",    min:15000,  icon:"🔥", c:"#FF9F1C", bonus:8,  next:40000 },
  { n:"Pro",        min:40000,  icon:"⚡", c:"#FFB800", bonus:12, next:100000 },
  { n:"Elite",      min:100000, icon:"💎", c:"#FF6B35", bonus:15, next:300000 },
  { n:"Legend",     min:300000, icon:"👑", c:"#FF2D78", bonus:20, next:750000 },
  { n:"Titan",      min:750000, icon:"🏆", c:"#A855F7", bonus:25, next:null },
];

// ─── OFFERWALL PROVIDERS (Admin-only data — never rendered to users) ───
// Revenue shares are confidential. Only provider names appear on offer cards.
const OFFERWALLS_ADMIN = [
  "AdGate Media","AdGem","OfferToro","Lootably","Ayet Studios",
  "Revenue Universe","CPX Research","BitLabs","TheoremReach",
  "Pollfish","TyrAds","Torox",
];

// ─── EARN CATEGORIES ───
// Colors chosen for psychological association:
// Gold = premium/featured, Blue = trust/surveys, Purple = fun/games
// Green = money/apps, Orange = energy/videos, Red = excitement/shopping
const CATS = [
  { id:"featured", n:"🔥 Featured",    d:"Hand-picked highest value", c:"#FFB800" },
  { id:"surveys",  n:"📊 Surveys",     d:"Quick opinions, quick cash", c:"#3B82F6" },
  { id:"games",    n:"🎮 Games",       d:"Play games, earn big",       c:"#A855F7" },
  { id:"apps",     n:"📲 Apps & Signups",d:"Try apps, earn instantly",  c:"#00D26A" },
  { id:"videos",   n:"▶️ Watch",       d:"Watch & earn passively",     c:"#FF9F1C" },
  { id:"shopping", n:"🛍️ Cashback",    d:"Shop and earn back",         c:"#FF3B30" },
  { id:"tasks",    n:"⚡ Micro Tasks",  d:"Tiny tasks, instant pay",   c:"#FF6B35" },
  { id:"crypto",   n:"₿ Crypto",       d:"Crypto rewards & staking",  c:"#8B5CF6" },
  { id:"referrals",n:"🤝 Referrals",   d:"Earn from your network",    c:"#FF2D78" },
  { id:"search",   n:"🔍 Search",      d:"Earn while you browse",     c:"#00E5FF" },
];

// ─── SAMPLE OFFERS ───
const OFFERS = [
  { id:1,  t:"Cash App — Sign Up + $5 Deposit",   cat:"apps",     coins:25000, time:"5 min",   diff:"Easy",   img:"💸", wall:"Revenue Universe", pop:99, rate:94, hot:true },
  { id:2,  t:"Temu — First Purchase Bonus",        cat:"apps",     coins:30000, time:"5 min",   diff:"Easy",   img:"🛍️", wall:"AdGate Media",     pop:97, rate:91, hot:true },
  { id:3,  t:"Royal Match — Level 300",            cat:"games",    coins:52000, time:"5-7 days", diff:"Medium", img:"🏰", wall:"AdGem",            pop:95, rate:72, hot:true },
  { id:4,  t:"Raid: Shadow Legends — 2 Champions", cat:"games",    coins:78000, time:"10-14d",  diff:"Hard",   img:"⚔️", wall:"OfferToro",         pop:88, rate:45, hot:false },
  { id:5,  t:"Branded Survey — 12 Questions",      cat:"surveys",  coins:3500,  time:"8 min",   diff:"Easy",   img:"📊", wall:"CPX Research",      pop:92, rate:89, hot:false },
  { id:6,  t:"Quick Opinion Poll",                 cat:"surveys",  coins:1200,  time:"3 min",   diff:"Easy",   img:"📝", wall:"TheoremReach",      pop:90, rate:95, hot:false },
  { id:7,  t:"Coinbase — Verify + Trade $50",      cat:"crypto",   coins:42000, time:"10 min",  diff:"Medium", img:"₿",  wall:"AdGem",            pop:86, rate:78, hot:true },
  { id:8,  t:"State of Survival — HQ Level 21",    cat:"games",    coins:95000, time:"18-21d",  diff:"Hard",   img:"🧟", wall:"Ayet Studios",     pop:78, rate:38, hot:false },
  { id:9,  t:"Watch 5 Entertainment Videos",       cat:"videos",   coins:900,   time:"6 min",   diff:"Easy",   img:"📺", wall:"Lootably",          pop:85, rate:97, hot:false },
  { id:10, t:"Fetch Rewards — Scan First Receipt", cat:"apps",     coins:18000, time:"5 min",   diff:"Easy",   img:"🧾", wall:"Revenue Universe",  pop:93, rate:88, hot:true },
  { id:11, t:"Product Review — 100 Words",         cat:"tasks",    coins:2800,  time:"8 min",   diff:"Easy",   img:"✍️", wall:"Direct",            pop:74, rate:90, hot:false },
  { id:12, t:"AFK Arena — Chapter 32",             cat:"games",    coins:65000, time:"8-12d",   diff:"Medium", img:"🗡️", wall:"OfferToro",         pop:81, rate:55, hot:false },
  { id:13, t:"SoFi — Open Account + $10 Deposit",  cat:"apps",     coins:55000, time:"10 min",  diff:"Easy",   img:"🏦", wall:"AdGate Media",      pop:91, rate:85, hot:true },
  { id:14, t:"Lifestyle Survey — 15 min",          cat:"surveys",  coins:4200,  time:"15 min",  diff:"Easy",   img:"🏠", wall:"Pollfish",          pop:87, rate:82, hot:false },
  { id:15, t:"Robinhood — Sign Up & Deposit",      cat:"crypto",   coins:48000, time:"10 min",  diff:"Medium", img:"📈", wall:"TyrAds",            pop:89, rate:80, hot:true },
  { id:16, t:"Swagbucks Search — 10 Searches",     cat:"search",   coins:500,   time:"5 min",   diff:"Easy",   img:"🔍", wall:"Direct",            pop:70, rate:99, hot:false },
  { id:17, t:"Amazon Cashback — Any Purchase",     cat:"shopping", coins:0,     time:"Varies",  diff:"Easy",   img:"🛒", wall:"Direct",            pop:96, rate:100,hot:false, cashback:"Up to 8%" },
  { id:18, t:"Refer a Friend",                     cat:"referrals",coins:500, time:"1 min",   diff:"Easy",   img:"🤝", wall:"PocketLined",          pop:94, rate:100,hot:true },
  { id:19, t:"Daily Trivia — 5 Questions",         cat:"tasks",    coins:600,   time:"2 min",   diff:"Easy",   img:"🧠", wall:"Direct",            pop:83, rate:96, hot:false },
  { id:20, t:"Norton VPN — Free Trial + Use 3 Days",cat:"apps",    coins:35000, time:"3 days",  diff:"Easy",   img:"🔒", wall:"Lootably",          pop:80, rate:74, hot:false },
];

// ─── LEADERBOARD ───
const LEADERS = [
  { r:1, name:"CryptoKing_99",  lvl:"Titan",  coins:1247320, av:"👑", streak:189 },
  { r:2, name:"SurveyQueen",    lvl:"Legend",  coins:923100,  av:"💎", streak:134 },
  { r:3, name:"GameMaster_X",   lvl:"Legend",  coins:789400,  av:"🎮", streak:98  },
  { r:4, name:"EarnDaily22",    lvl:"Elite",   coins:612800,  av:"⚡", streak:267 },
  { r:5, name:"CashHunter",     lvl:"Elite",   coins:498200,  av:"🔥", streak:78  },
  { r:6, name:"OfferPro_Mike",  lvl:"Pro",     coins:387600,  av:"🏆", streak:55  },
  { r:7, name:"RewardSeeker",   lvl:"Pro",     coins:345100,  av:"💰", streak:89  },
  { r:8, name:"TaskNinja",      lvl:"Pro",     coins:298300,  av:"🥷", streak:44  },
  { r:9, name:"LuckyPlayer",    lvl:"Hustler", coins:234500,  av:"🍀", streak:33  },
  { r:10,name:"MoneyMaven",     lvl:"Hustler", coins:198700,  av:"✨", streak:61  },
];

// ─── CASHOUT OPTIONS ───
const CASHOUTS = [
  { id:"paypal",  n:"PayPal",        ic:"💳", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"venmo",   n:"Venmo",         ic:"📲", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"cashapp", n:"Cash App",      ic:"💵", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"btc",     n:"Bitcoin",       ic:"₿",  min:5000,  fee:"0%", spd:"~5 min",    pop:true },
  { id:"eth",     n:"Ethereum",      ic:"⟠",  min:5000,  fee:"0%", spd:"~3 min",    pop:false },
  { id:"usdt",    n:"USDT",          ic:"💲", min:5000,  fee:"0%", spd:"~3 min",    pop:false },
  { id:"amazon",  n:"Amazon",        ic:"📦", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"visa",    n:"Visa Prepaid",  ic:"💳", min:10000, fee:"1%", spd:"1-2 days",  pop:false },
  { id:"steam",   n:"Steam",         ic:"🎮", min:5000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"apple",   n:"Apple",         ic:"🍎", min:5000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"google",  n:"Google Play",   ic:"▶️",  min:5000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"walmart", n:"Walmart",       ic:"🏬", min:5000,  fee:"0%", spd:"Instant",   pop:false },
];

// ─── LIVE FEED (Realistic amounts based on actual GPT payouts) ───
const FEED = [
  "Jake from TX completed Royal Match — earned $52.00 🎮",
  "Maria cashed out $18.50 via PayPal instantly 💳",
  "Alex finished 3 surveys today — $8.40 earned 📋",
  "Sarah completed a SoFi signup offer — $55.00 ⚡",
  "New user Chris earned $6.20 in his first session 🔥",
  "Tom from UK withdrew $32.00 in Bitcoin ₿",
  "Emily just hit a 30-day streak! 🔥",
  "Michael earned $87.50 this week from game offers 💰",
  "Lisa unlocked Earner level — 5% bonus activated! 💎",
  "David referred 2 friends — earned $20.00 👥",
  "Jenny completed 8 surveys today — $24.60 📋",
  "Rob cashed out $15.00 to Cash App instantly 💵",
];

// ─── UTILS ───
const fmt = n => n.toLocaleString();
const toUSD = n => (n/1000).toFixed(2);
const getLevel = coins => {
  for(let i=LEVELS.length-1;i>=0;i--) if(coins>=LEVELS[i].min) return {...LEVELS[i],idx:i};
  return {...LEVELS[0],idx:0};
};
const pct = coins => {
  const l=getLevel(coins);
  if(!l.next) return 100;
  return Math.min(((coins-l.min)/(l.next-l.min))*100,100);
};

// ─── CSS ───
const css = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Poppins',-apple-system,sans-serif;background:${B.bg};color:${B.txt};overflow-x:hidden;-webkit-font-smoothing:antialiased;font-size:15px}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:${B.bg}}
::-webkit-scrollbar-thumb{background:${B.accent};border-radius:3px}
::selection{background:rgba(1,214,118,.2)}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(1,214,118,.2)}50%{box-shadow:0 0 40px rgba(1,214,118,.3)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes streak{0%,100%{text-shadow:0 0 8px #FF3B30,0 0 16px #FF6B35}50%{text-shadow:0 0 16px #FF3B30,0 0 32px #FFB800,0 0 48px #FF6B35}}
@keyframes coin{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-50px) scale(1.8)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes countPulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes ripple{0%{transform:scale(0);opacity:.6}100%{transform:scale(4);opacity:0}}
@keyframes spinWheel{0%{transform:rotate(0)}100%{transform:rotate(1800deg)}}
@keyframes bounceIn{0%{transform:scale(0)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes confetti{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(-120px) rotate(720deg)}}
@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes rainbowBorder{0%{border-color:#FF6B35}25%{border-color:#FF2D78}50%{border-color:#A855F7}75%{border-color:#00D26A}100%{border-color:#FFB800}}
@keyframes coinRain{0%{opacity:1;transform:translateY(0) scale(1)}50%{opacity:.8}100%{opacity:0;transform:translateY(-80px) scale(1.5)}}
@keyframes tickTock{0%,100%{transform:scale(1)}50%{transform:scale(1.08);color:#FF3B30}}
.ashake{animation:shakeX .5s ease-in-out}
.arainbow{animation:rainbowBorder 2s linear infinite}

.au{animation:fadeUp .5s ease-out both}
.af{animation:fadeIn .3s ease-out both}
.asr{animation:slideR .4s ease-out both}
.ap{animation:pulse 2s ease-in-out infinite}
.ag{animation:glow 2.5s ease-in-out infinite}
.afl{animation:float 4s ease-in-out infinite}
.astreak{animation:streak 1.5s ease-in-out infinite}
.abounce{animation:bounceIn .4s ease-out both}

.btn-primary{
  background:${B.accent};border:none;color:#000;padding:12px 28px;border-radius:12px;
  font-weight:600;font-size:15px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;
  font-family:'Poppins',sans-serif;
}
.btn-primary:hover{transform:translateY(-1px);background:${B.accentL}}
.btn-primary:active{transform:translateY(0)}

.btn-secondary{
  background:${B.accent};border:none;color:#000;padding:10px 22px;border-radius:12px;
  font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;font-family:'Poppins',sans-serif;
}
.btn-secondary:hover{transform:translateY(-1px);background:${B.accentL}}

.btn-ghost{
  background:rgba(1,214,118,.08);border:2px solid rgba(1,214,118,.2);color:${B.accent};
  padding:10px 22px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;
  font-family:'Poppins',sans-serif;
}
.btn-ghost:hover{background:rgba(1,214,118,.15);border-color:rgba(1,214,118,.35)}

.card{
  background:${B.card};border:2px solid ${B.border};border-radius:12px;
  transition:all .25s;position:relative;overflow:hidden;
}
.card:hover{border-color:rgba(1,214,118,.2)}

.chip{
  display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;
  font-size:12px;font-weight:600;white-space:nowrap;
}

.toast-container{position:fixed;top:80px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.toast{
  padding:14px 24px;border-radius:12px;font-weight:600;font-size:14px;
  backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);
  animation:fadeUp .3s ease-out;
  display:flex;align-items:center;gap:8px;
}

.video-embed{border-radius:16px;overflow:hidden;position:relative;padding-top:56.25%;background:#000}
.video-embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none}

.marquee-track{display:flex;animation:marquee 30s linear infinite;width:max-content}
.marquee-track:hover{animation-play-state:paused}

.progress-bar{height:100%;border-radius:99px;transition:width .8s cubic-bezier(.4,0,.2,1)}

input:focus,select:focus{outline:none;border-color:rgba(1,214,118,.5);box-shadow:0 0 0 3px rgba(1,214,118,.1)}
input,select{font-family:'Poppins',sans-serif}
`;

// ─── API HELPER ───
const API = typeof window !== 'undefined' ? window.location.origin : '';

const apiFetch = async (path, opts = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ─── AUTH MODAL ───
const AuthModal = ({ onAuth, onClose }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('cf_token', data.token);
        onAuth(data.user, data.token);
      } else {
        const body = { username, email, password };
        if (referralCode.trim()) body.referralCode = referralCode.trim();
        const data = await apiFetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        localStorage.setItem('cf_token', data.token);
        onAuth(data.user, data.token);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:B.card,border:`2px solid ${B.border}`,borderRadius:16,padding:32,width:420,maxWidth:"90vw",position:"relative"}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:B.muted,fontSize:20,cursor:"pointer"}}>✕</button>
        <h2 style={{fontFamily:"'Poppins'",fontSize:22,fontWeight:600,marginBottom:6,color:B.txt}}>
          {mode==="login"?"Welcome Back":"Create Account"}
        </h2>
        <p style={{color:B.muted,fontSize:13,marginBottom:20}}>
          {mode==="login"?"Log in to access your earnings":"Sign up and get 250 bonus coins ($0.25) free"}
        </p>

        {err && <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",marginBottom:14,color:"#F87171",fontSize:13}}>{err}</div>}

        <form onSubmit={handleSubmit}>
          {mode==="signup" && (
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:4}}>Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} required
                style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${B.border}`,background:B.surface,color:B.txt,fontSize:14}} placeholder="Pick a username"/>
            </div>
          )}
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:4}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${B.border}`,background:B.surface,color:B.txt,fontSize:14}} placeholder="you@example.com"/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:4}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6}
              style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${B.border}`,background:B.surface,color:B.txt,fontSize:14}} placeholder="Min 6 characters"/>
          </div>
          {mode==="signup" && (
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:4}}>Referral Code (optional)</label>
              <input value={referralCode} onChange={e=>setReferralCode(e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1px solid ${B.border}`,background:B.surface,color:B.txt,fontSize:14}} placeholder="Enter referral code"/>
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width:"100%",padding:"12px 0",borderRadius:12,border:"none",
            background:B.accent,color:"#000",
            fontSize:15,fontWeight:600,cursor:loading?"wait":"pointer",opacity:loading?.7:1,transition:"opacity .2s",
            fontFamily:"'Poppins',sans-serif",
          }}>
            {loading ? "Please wait..." : mode==="login" ? "Log In" : "Sign Up — Get 500 Free Coins 🎁"}
          </button>
        </form>

        <p style={{textAlign:"center",marginTop:16,fontSize:13,color:B.muted}}>
          {mode==="login" ? (
            <>Don't have an account? <span style={{color:B.accentL,cursor:"pointer",fontWeight:600}} onClick={()=>{setMode("signup");setErr("")}}>Sign Up Free</span></>
          ) : (
            <>Already have an account? <span style={{color:B.accentL,cursor:"pointer",fontWeight:600}} onClick={()=>{setMode("login");setErr("")}}>Log In</span></>
          )}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── LIVE TICKER (Social Proof) ───
const LiveTicker = () => {
  const [i,setI] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setI(p=>(p+1)%FEED.length),3500); return ()=>clearInterval(t); },[]);
  return (
    <div style={{background:B.nav,borderBottom:`2px solid ${B.border}`,padding:"7px 20px",fontSize:"13px",color:B.accent,textAlign:"center",overflow:"hidden"}}>
      <span className="af" key={i}>🟢 LIVE — {FEED[i]}</span>
    </div>
  );
};

// ─── NAVBAR (Freecash-style) ───
const Nav = ({pg,setPg,coins,streak,role,user,onLogin,onLogout}) => {
  const lv = getLevel(coins);
  return (
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:66,background:B.nav,borderBottom:`2px solid ${B.border}`,position:"sticky",top:0,zIndex:100}}>
      {/* Left: Logo + Cashout link */}
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setPg("home")}>
          <div style={{width:32,height:32,borderRadius:8,background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#000",fontWeight:900}}>$</div>
          <span style={{fontSize:20,fontFamily:"'Poppins'",fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>
            <span style={{color:B.accent}}>POCKET</span>LINED
          </span>
        </div>
        {user && (
          <div style={{display:"flex",gap:2,marginLeft:8}}>
            {[
              {id:"earn",l:"Earn",ic:"💰"},
              {id:"rewards",l:"Cashout",ic:"💳"},
              ...(user ? [{id:"dash",l:"Dashboard",ic:"📊"},{id:"leaderboard",l:"Leaderboard",ic:"🏆"}] : []),
              ...(role==="admin"&&user?[{id:"admin",l:"Admin",ic:"🛡️"}]:[]),
            ].map(x=>(
              <button key={x.id} onClick={()=>setPg(x.id)} style={{
                background:pg===x.id?"rgba(1,214,118,.08)":"transparent",
                border:"none",
                color:pg===x.id?B.accent:B.muted,
                padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:pg===x.id?700:500,
                transition:"all .15s",display:"flex",alignItems:"center",gap:5,
              }}
              onMouseEnter={e=>{if(pg!==x.id)e.currentTarget.style.color="#fff"}}
              onMouseLeave={e=>{if(pg!==x.id)e.currentTarget.style.color=B.muted}}
              >{x.ic} {x.l}</button>
            ))}
          </div>
        )}
      </div>
      {/* Right: Auth / User */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {user ? (<>
          {streak>0&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:8,background:"rgba(255,107,53,.08)",fontSize:13,color:"#FF6B35",fontWeight:700}}>
            <span className="astreak">🔥</span>{streak}
          </div>}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,background:"rgba(1,214,118,.06)",border:"1px solid rgba(1,214,118,.12)",cursor:"pointer",fontSize:14,color:B.accent,fontWeight:700}} onClick={()=>setPg("dash")}>
            {lv.icon} {fmt(coins)} 🪙
          </div>
          <div onClick={()=>setPg("profile")} style={{width:34,height:34,borderRadius:"50%",background:"rgba(1,214,118,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,cursor:"pointer",border:`2px solid ${B.accent}`,color:B.accent}}>
            {(user.username||"A")[0].toUpperCase()}
          </div>
          <button onClick={onLogout} style={{background:"none",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"6px 12px",color:B.muted,fontSize:12,cursor:"pointer",fontWeight:500,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(239,68,68,.3)";e.currentTarget.style.color="#F87171"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.1)";e.currentTarget.style.color=B.muted}}
          >Sign Out</button>
        </>) : (<>
          <button onClick={onLogin} style={{background:"none",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.3)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.15)"}
          >Sign In</button>
          <button onClick={onLogin} style={{background:B.accent,border:"none",borderRadius:8,padding:"8px 20px",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:6}}
            onMouseEnter={e=>e.currentTarget.style.background="#01FF97"}
            onMouseLeave={e=>e.currentTarget.style.background=B.accent}
          >✏️ Sign Up</button>
        </>)}
      </div>
    </nav>
  );
};

// ─── COUNTER (Animated) ───
const Counter = ({end,prefix="",suffix="",duration=2000,style:s={}}) => {
  const [val,setVal] = useState(0);
  const ref = useRef(null);
  useEffect(()=>{
    let start=0;const step=end/Math.ceil(duration/16);
    const tick=()=>{start=Math.min(start+step,end);setVal(Math.floor(start));if(start<end)ref.current=requestAnimationFrame(tick)};
    ref.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(ref.current);
  },[end,duration]);
  return <span style={s}>{prefix}{val.toLocaleString()}{suffix}</span>;
};

// ─── STAT CARD ───
const Stat = ({label,value,sub,grad,delay=0}) => (
  <div className="card au" style={{padding:22,animationDelay:`${delay}s`}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:grad,borderRadius:"16px 16px 0 0"}}/>
    <div style={{fontSize:12,color:B.muted,fontWeight:500,marginBottom:6}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,fontFamily:"'Poppins'"}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:B.muted,marginTop:4}}>{sub}</div>}
  </div>
);

// ─── OFFER CARD ───
const OfferCard = ({o,onEarn,onStart,delay=0}) => (
  <div className="card au" style={{padding:18,display:"flex",gap:14,cursor:"pointer",animationDelay:`${delay}s`}}
    onClick={()=>onStart?onStart(o):onEarn(o.coins)}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="rgba(1,214,118,.3)"}}
    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=B.border}}
  >
    {o.hot&&<div style={{position:"absolute",top:10,right:10,background:"#EB7C02",padding:"3px 10px",borderRadius:8,fontSize:10,fontWeight:600,color:"#fff"}}>🔥 HOT</div>}
    <div style={{width:56,height:56,borderRadius:14,background:o.hot?"rgba(255,107,53,.08)":"rgba(1,214,118,.06)",border:o.hot?"1px solid rgba(255,107,53,.15)":"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{o.img}</div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:14,fontWeight:600,marginBottom:6,lineHeight:1.3,paddingRight:o.hot?50:0}}>{o.t}</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:B.muted,marginBottom:8,flexWrap:"wrap"}}>
        <span>⏱ {o.time}</span>
        <span style={{color:o.diff==="Easy"?B.ok:o.diff==="Medium"?B.warn:B.hot}}>{o.diff==="Easy"?"🟢":"🟡"} {o.diff}</span>
        <span>via {o.wall}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <div style={{flex:1,height:4,background:"rgba(255,255,255,.04)",borderRadius:2,overflow:"hidden"}}>
            <div className="progress-bar" style={{width:`${o.rate}%`,background:o.rate>80?B.ok:o.rate>50?B.warn:B.hot}}/>
          </div>
          <span style={{fontSize:11,color:B.muted,whiteSpace:"nowrap"}}>{o.rate}% success</span>
        </div>
        <div style={{background:B.accent,padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:600,color:"#000",marginLeft:12,whiteSpace:"nowrap"}}>
          {o.cashback?o.cashback:`$${toUSD(o.coins)}`}
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  PAGE: HOME / LANDING (Freecash-inspired)
// ═══════════════════════════════════════════════════════════════
const Home = ({setPg, user, onLogin}) => {
  const [signupCount] = useState(()=>94000+Math.floor(Math.random()*8000));
  const [offerCount] = useState(()=>8000+Math.floor(Math.random()*1500));
  const [signupEmail,setSignupEmail] = useState("");

  return (
    <div>
      {/* ─── HERO — Freecash-style two-column ─── */}
      <section style={{position:"relative",overflow:"hidden",padding:"60px 0 40px"}}>
        {/* Background app logos collage */}
        <div style={{position:"absolute",inset:0,opacity:.06,background:"url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"800\" height=\"400\"><text x=\"50\" y=\"80\" font-size=\"60\">📱</text><text x=\"200\" y=\"120\" font-size=\"50\">🎮</text><text x=\"350\" y=\"70\" font-size=\"55\">📊</text><text x=\"500\" y=\"110\" font-size=\"45\">🛍️</text><text x=\"650\" y=\"80\" font-size=\"50\">💰</text><text x=\"100\" y=\"200\" font-size=\"55\">🎯</text><text x=\"300\" y=\"250\" font-size=\"50\">📺</text><text x=\"450\" y=\"200\" font-size=\"60\">🏰</text><text x=\"600\" y=\"240\" font-size=\"45\">₿</text><text x=\"750\" y=\"200\" font-size=\"50\">🔍</text></svg>') center/cover",pointerEvents:"none"}}/>

        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px",display:"grid",gridTemplateColumns:"1fr 420px",gap:60,alignItems:"center",position:"relative",zIndex:1}}>
          {/* LEFT: Headline + Offer Cards */}
          <div>
            <h1 className="au" style={{fontFamily:"'Poppins'",fontSize:"clamp(32px,4vw,48px)",fontWeight:700,lineHeight:1.15,marginBottom:20}}>
              <span style={{color:B.accent}}>Get paid</span> for testing apps, games & surveys
            </h1>
            <p className="au" style={{fontSize:17,color:B.muted,marginBottom:32,animationDelay:".05s"}}>
              Earn up to <strong style={{color:"#fff"}}>$3,000</strong> per offer{" "}
              <span style={{display:"inline-flex",alignItems:"center",gap:6,marginLeft:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:B.accent,display:"inline-block"}}/>
                <strong style={{color:"#fff"}}>{offerCount.toLocaleString()}</strong> Offers available now
              </span>
            </p>

            {/* 3 Featured Offer Preview Cards */}
            <div className="au" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28,animationDelay:".1s"}}>
              {[
                {img:"💸",name:"Cash App",desc:"Sign Up + $5 Deposit",price:"$25.00",rating:"5.0"},
                {img:"🏰",name:"Royal Match",desc:"Reach level 300",price:"$52.00",rating:"5.0"},
                {img:"🎯",name:"TikTok",desc:"Sign up",price:"$2.00",rating:"5.0"},
              ].map((o,i)=>(
                <div key={i} style={{
                  background:i===1?"rgba(1,214,118,.04)":B.card,
                  border:i===1?`1px solid rgba(1,214,118,.15)`:`1px solid ${B.border}`,
                  borderRadius:14,padding:16,cursor:"pointer",transition:"all .2s",
                }}
                onClick={()=>user?setPg("earn"):onLogin()}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor="rgba(1,214,118,.25)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=i===1?"rgba(1,214,118,.15)":B.border}}
                >
                  <div style={{width:56,height:56,borderRadius:12,background:"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,marginBottom:10}}>{o.img}</div>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>{o.name}</div>
                  <div style={{fontSize:11,color:B.muted,marginBottom:8}}>{o.desc}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:800,fontSize:15}}>{o.price}</span>
                    <span style={{fontSize:11,color:B.gold}}>★ {o.rating}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Trustpilot-style badge */}
            <div className="au" style={{animationDelay:".15s"}}>
              <div style={{fontSize:13,color:B.muted,marginBottom:6}}>See our reviews on</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:15}}>★</span>
                <span style={{fontWeight:700,fontSize:15}}>Trustpilot</span>
                <div style={{display:"flex",gap:2}}>
                  {[1,2,3,4,5].map(i=>(
                    <div key={i} style={{width:24,height:24,background:i<=4?"#00B67A":"#DCDCE6",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff"}}>★</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Signup Form */}
          <div className="au" style={{animationDelay:".1s"}}>
            <div style={{background:B.card,border:`2px solid ${B.border}`,borderRadius:12,padding:28}}>
              <h2 style={{fontFamily:"'Poppins'",fontSize:20,fontWeight:600,textAlign:"center",marginBottom:20}}>Sign Up for Free</h2>

              <div style={{position:"relative",marginBottom:14}}>
                <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:B.muted}}>✉️</span>
                <input type="email" placeholder="Email address" value={signupEmail} onChange={e=>setSignupEmail(e.target.value)}
                  style={{width:"100%",padding:"14px 16px 14px 42px",background:B.surface,border:`1px solid ${B.border}`,borderRadius:10,color:B.txt,fontSize:15}}/>
              </div>

              <button onClick={onLogin} style={{
                width:"100%",padding:"14px 0",borderRadius:10,border:"none",
                background:B.accent,color:"#000",fontSize:16,fontWeight:800,cursor:"pointer",
                transition:"all .2s",marginBottom:16,
              }}
              onMouseEnter={e=>e.currentTarget.style.background="#01FF97"}
              onMouseLeave={e=>e.currentTarget.style.background=B.accent}
              >Start earning now</button>

              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{flex:1,height:1,background:"rgba(255,255,255,.08)"}}/>
                <span style={{fontSize:12,color:B.muted,fontWeight:500}}>OR</span>
                <div style={{flex:1,height:1,background:"rgba(255,255,255,.08)"}}/>
              </div>

              {/* Social Auth Buttons */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={onLogin} style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"#000",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                >🍎 Sign Up with Apple</button>

                <button onClick={onLogin} style={{width:"100%",padding:"12px 0",borderRadius:10,border:`1px solid rgba(255,255,255,.12)`,background:"transparent",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                >G Sign Up with Google</button>

                <button onClick={onLogin} style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"#1877F2",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity .2s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                >f Sign Up with Facebook</button>
              </div>

              <p style={{textAlign:"center",marginTop:16,fontSize:13,color:B.muted}}>
                <strong style={{color:"#fff"}}>{signupCount.toLocaleString()}+</strong> sign ups in the past 24 hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR — 3 big metrics ─── */}
      <section style={{padding:"40px 0",background:"transparent"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px"}}>
          <div style={{background:B.card,border:`2px solid ${B.border}`,borderRadius:12,padding:"36px 48px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
            {[
              {icon:"🚀",val:"17m 12s",label:"Average time until user earns their first reward"},
              {icon:"🔥",val:"$28",label:"Average money earned by users yesterday"},
              {icon:"",val:"$50,000,000+",label:"Total amount earned on PocketLined"},
            ].map((s,i)=>(
              <div key={i} style={{textAlign:"center",borderRight:i<2?`1px solid ${B.border}`:"none",padding:"0 24px"}}>
                <div style={{fontSize:28,fontWeight:700,fontFamily:"'Poppins'",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {s.icon&&<span>{s.icon}</span>}
                  <span>{s.val}</span>
                </div>
                <div style={{fontSize:14,color:B.muted,lineHeight:1.4}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RECOMMENDED BY ─── */}
      <section style={{padding:"48px 0",textAlign:"center"}}>
        <h3 style={{fontSize:18,fontWeight:600,marginBottom:28,color:B.muted}}>Recommended by</h3>
        <div style={{display:"flex",justifyContent:"center",gap:48,alignItems:"center",opacity:.5}}>
          {["PaidFromSurveys","BENZINGA","SurveyPolice","TechCrunch","Forbes"].map(name=>(
            <span key={name} style={{fontSize:18,fontWeight:800,fontFamily:"'Poppins'",letterSpacing:"0.5px",textTransform:"uppercase"}}>{name}</span>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{padding:"60px 0 80px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px",display:"grid",gridTemplateColumns:"1fr 1.3fr",gap:60,alignItems:"start"}}>
          {/* Left */}
          <div>
            <h2 style={{fontFamily:"'Poppins'",fontSize:32,fontWeight:700,lineHeight:1.2,marginBottom:24}}>
              Want to earn free cash within minutes?<br/>
              <span style={{color:B.accent}}>Here's how</span>
            </h2>
            <button className="btn-primary" onClick={()=>user?setPg("earn"):onLogin()} style={{fontSize:16,padding:"14px 36px",marginBottom:24}}>Start earning now</button>
            <div>
              <div style={{fontSize:13,color:B.muted,marginBottom:6}}>See our reviews on</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:15}}>★</span>
                <span style={{fontWeight:700,fontSize:15}}>Trustpilot</span>
                <div style={{display:"flex",gap:2}}>
                  {[1,2,3,4,5].map(i=>(
                    <div key={i} style={{width:22,height:22,background:i<=4?"#00B67A":"#DCDCE6",borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>★</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Right — Steps */}
          <div style={{display:"flex",flexDirection:"column",gap:28}}>
            {[
              {n:"1",t:"Choose an offer",d:"Take your pick from the tasks on the earn page. We list the best offers from companies who want to advertise their apps, surveys, and products."},
              {n:"2",t:"Complete the task",d:"Follow the instructions for the offer you selected. This could be downloading an app, taking a survey, or reaching a game level."},
              {n:"3",t:"Get paid instantly",d:"Once you complete the offer, coins are added to your balance automatically. Cash out to PayPal, Venmo, crypto, or gift cards — most arrive in minutes."},
            ].map((step,i)=>(
              <div key={i} style={{display:"flex",gap:20,alignItems:"flex-start"}}>
                <div style={{width:48,height:48,borderRadius:12,background:"rgba(1,214,118,.06)",border:"1px solid rgba(1,214,118,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:14,fontWeight:800,color:B.accent}}>{step.n}</span>
                </div>
                <div>
                  <h4 style={{fontSize:17,fontWeight:700,marginBottom:6}}>{step.n}. {step.t}</h4>
                  <p style={{fontSize:14,color:B.muted,lineHeight:1.6}}>{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POPULAR OFFERS ─── */}
      <section style={{padding:"60px 0",background:"linear-gradient(180deg,transparent,rgba(1,214,118,.01),transparent)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px"}}>
          <h2 style={{fontFamily:"'Poppins'",fontSize:28,fontWeight:600,textAlign:"center",marginBottom:12}}>
            Popular Offers <span style={{color:B.accent}}>Right Now</span>
          </h2>
          <p style={{textAlign:"center",color:B.muted,marginBottom:36}}>Here's what people are completing today</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {OFFERS.filter(o=>o.hot).slice(0,6).map((o,i)=>(
              <div key={o.id} className="card au" style={{padding:18,cursor:"pointer",animationDelay:`${i*.06}s`}}
                onClick={()=>user ? setPg("earn") : onLogin()}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor="rgba(1,214,118,.2)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=B.border}}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
                  <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{o.img}</div>
                  <span style={{background:B.accent,padding:"5px 12px",borderRadius:8,fontSize:14,fontWeight:800,color:"#000"}}>${toUSD(o.coins)}</span>
                </div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{o.t}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:B.muted}}>
                  <span>⏱ {o.time} · {o.diff}</span>
                  <span style={{color:B.gold}}>★ 5.0</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:32}}>
            <button className="btn-primary" onClick={()=>user ? setPg("earn") : onLogin()} style={{fontSize:16,padding:"14px 36px"}}>Browse All Offers →</button>
          </div>
        </div>
      </section>

      {/* ─── LIVE CASHOUTS MARQUEE ─── */}
      <section style={{padding:"50px 0",overflow:"hidden"}}>
        <h2 style={{fontFamily:"'Poppins'",fontSize:24,fontWeight:600,textAlign:"center",marginBottom:28}}>
          Recent <span style={{color:B.accent}}>Cashouts</span>
        </h2>
        <div style={{overflow:"hidden",position:"relative"}}>
          <div className="marquee-track">
            {[...Array(2)].map((_,dup)=>(
              [
                {u:"Jessica M.",a:"$14.50",m:"PayPal",t:"Just now"},
                {u:"Marcus D.",a:"$8.00",m:"Cash App",t:"2 min ago"},
                {u:"Tyler K.",a:"$22.00",m:"Venmo",t:"5 min ago"},
                {u:"Sarah L.",a:"$11.20",m:"PayPal",t:"8 min ago"},
                {u:"David R.",a:"$5.00",m:"Amazon",t:"12 min ago"},
                {u:"Jenny C.",a:"$18.50",m:"PayPal",t:"15 min ago"},
                {u:"Chris T.",a:"$32.00",m:"Bitcoin",t:"20 min ago"},
                {u:"Amanda P.",a:"$5.00",m:"Cash App",t:"25 min ago"},
              ].map((c,i)=>(
                <div key={`${dup}-${i}`} style={{
                  minWidth:200,padding:"14px 20px",margin:"0 8px",background:B.card,borderRadius:12,
                  border:`1px solid ${B.border}`,textAlign:"center",flexShrink:0,
                }}>
                  <div style={{fontSize:20,fontWeight:800,color:B.accent,fontFamily:"'Poppins'"}}>{c.a}</div>
                  <div style={{fontSize:13,fontWeight:600,marginTop:2}}>{c.u}</div>
                  <div style={{fontSize:11,color:B.muted,marginTop:2}}>{c.m} · {c.t}</div>
                </div>
              ))
            ))}
          </div>
        </div>
      </section>

      {/* ─── PAYOUT METHODS ─── */}
      <section style={{padding:"60px 24px",maxWidth:1200,margin:"0 auto",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Poppins'",fontSize:26,fontWeight:600,marginBottom:12}}>
          Your Money, <span style={{color:B.accent}}>Your Way</span>
        </h2>
        <p style={{color:B.muted,marginBottom:36}}>12+ payout options. $5 minimum. Most arrive within minutes.</p>
        <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
          {CASHOUTS.map((c,i)=>(
            <div key={c.id} className="card au" style={{padding:"16px 18px",textAlign:"center",width:100,animationDelay:`${i*.03}s`}}>
              <div style={{fontSize:28,marginBottom:6}}>{c.ic}</div>
              <div style={{fontSize:12,fontWeight:600}}>{c.n}</div>
              <div style={{fontSize:10,color:B.accent,marginTop:2,fontWeight:600}}>{c.spd}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{padding:"80px 24px",textAlign:"center",background:"linear-gradient(180deg,transparent,rgba(1,214,118,.02))"}}>
        <h2 style={{fontFamily:"'Poppins'",fontSize:32,fontWeight:700,marginBottom:14}}>
          Ready to <span style={{color:B.accent}}>start earning</span>?
        </h2>
        <p style={{color:B.muted,fontSize:18,marginBottom:32}}>
          It's free, takes 30 seconds, and you get $0.25 just for signing up.
        </p>
        <button className="btn-primary" onClick={()=>user ? setPg("earn") : onLogin()} style={{fontSize:18,padding:"16px 44px"}}>
          {user ? "Browse Offers →" : "Create Free Account →"}
        </button>
        <p style={{marginTop:14,fontSize:12,color:B.dim}}>No credit card required</p>
      </section>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD
// ═══════════════════════════════════════════════════════════════
const Dash = ({coins,streak,today,week,setPg,onEarn,user}) => {
  const lv = getLevel(coins);
  const prog = pct(coins);
  const nxt = LEVELS[lv.idx+1];
  const displayName = user ? (user.username || 'Earner') : 'Earner';

  // ─── DAILY SPIN — localStorage-gated, once per day ───
  const spinKey = 'cf_spin_' + new Date().toISOString().slice(0,10);
  const [spinUsed, setSpinUsed] = useState(()=> localStorage.getItem(spinKey)==='1');
  const [spinResult,setSpinResult] = useState(null);
  const [spinning,setSpinning] = useState(false);
  const [spinPhase,setSpinPhase] = useState('idle'); // idle → spinning → nearMiss → result → celebrated
  const [nearMissAmt,setNearMissAmt] = useState(0);
  const [confettiParts,setConfettiParts] = useState([]);

  // ─── STREAK BONUS — localStorage-gated, once per streak cycle ───
  const streakKey = 'cf_streak_claimed_' + Math.floor(streak/7);
  const [bonusClaimed,setBonusClaimed] = useState(()=> localStorage.getItem(streakKey)==='1');
  const [bonusAmt,setBonusAmt] = useState(0);
  const [bonusPhase,setBonusPhase] = useState('idle'); // idle → opening → revealed

  // ─── DAILY BONUS CHEST — timed reward, resets daily ───
  const chestKey = 'cf_chest_' + new Date().toISOString().slice(0,10);
  const [chestOpened,setChestOpened] = useState(()=> localStorage.getItem(chestKey)==='1');
  const [chestReward,setChestReward] = useState(0);
  const [chestPhase,setChestPhase] = useState('idle');
  const [chestCountdown,setChestCountdown] = useState('');

  // Countdown timer to next chest (midnight reset — creates urgency like Candy Crush lives)
  useEffect(()=>{
    if(chestOpened){
      const tick=()=>{
        const now=new Date(), tmrw=new Date(now);
        tmrw.setHours(24,0,0,0);
        const diff=tmrw-now;
        const h=Math.floor(diff/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000);
        setChestCountdown(`${h}h ${m}m ${s}s`);
      };
      tick();
      const t=setInterval(tick,1000);
      return ()=>clearInterval(t);
    }
  },[chestOpened]);

  // Confetti burst helper
  const burstConfetti = () => {
    const colors = [B.gold,B.money,B.hot,B.accent,B.fomo,'#FFE066','#60A5FA'];
    const parts = Array.from({length:24},(_,i)=>({
      id:i, color:colors[i%colors.length],
      left:35+Math.random()*30, delay:Math.random()*.3,
      size:6+Math.random()*8, dur:0.8+Math.random()*0.6,
    }));
    setConfettiParts(parts);
    setTimeout(()=>setConfettiParts([]),2000);
  };

  // ─── SPIN LOGIC — Candy Crush style near-miss + celebration ───
  // Calls POST /api/spin server-side so coins actually persist
  const spin = () => {
    if(spinning || spinUsed) return;
    setSpinning(true);
    setSpinPhase('spinning');
    setSpinResult(null);

    // Fire the server request immediately (runs in parallel with animation)
    const spinPromise = apiFetch('/api/spin', { method: 'POST' }).then(r=>r.json()).catch(()=>null);

    // Near-miss preview (we don't know the real result yet, use a teaser)
    const teaserNearMiss = [50000,10000,5000,2000][Math.floor(Math.random()*4)];
    setNearMissAmt(teaserNearMiss);

    setTimeout(()=>{
      setSpinPhase('nearMiss');
      setTimeout(async ()=>{
        // Wait for server result
        const data = await spinPromise;
        const amt = data?.coins || 500; // fallback
        setSpinResult(amt);
        setSpinPhase('result');
        setSpinning(false);
        localStorage.setItem(spinKey,'1');
        setSpinUsed(true);
        burstConfetti();
        if(onEarn) onEarn(amt);
        setTimeout(()=>setSpinPhase('celebrated'),3000);
      },800);
    },3000);
  };

  // ─── STREAK CLAIM — server-persisted, dramatic reveal ───
  const claimStreak = () => {
    if(bonusClaimed) return;
    setBonusPhase('opening');
    apiFetch('/api/rewards/daily?type=streak', { method: 'POST' })
      .then(r=>r.json())
      .then(data=>{
        const amt = data?.coins || 200;
        setBonusAmt(amt);
        setBonusPhase('revealed');
        setBonusClaimed(true);
        localStorage.setItem(streakKey,'1');
        burstConfetti();
        if(onEarn) onEarn(amt);
      })
      .catch(()=>{
        setBonusPhase('idle');
      });
  };

  // ─── DAILY CHEST — server-persisted, login reward that escalates with streak ───
  const openChest = () => {
    if(chestOpened) return;
    setChestPhase('opening');
    apiFetch('/api/rewards/daily?type=chest', { method: 'POST' })
      .then(r=>r.json())
      .then(data=>{
        const amt = data?.coins || 100;
        setChestReward(amt);
        setChestPhase('revealed');
        setChestOpened(true);
        localStorage.setItem(chestKey,'1');
        burstConfetti();
        if(onEarn) onEarn(amt);
      })
      .catch(()=>{
        setChestPhase('idle');
      });
  };

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
      <div className="au" style={{marginBottom:28}}>
        <h1 style={{fontFamily:"'Poppins'",fontSize:26,fontWeight:800}}>Welcome back, {displayName} 👋</h1>
        <p style={{color:B.muted,fontSize:14}}>Your personalized earning dashboard</p>
      </div>

      {/* ─── DAILY CHEST — First thing users see, creates daily login habit ─── */}
      {!chestOpened && (
        <div className="card au" style={{padding:20,marginBottom:20,textAlign:"center",border:`2px solid rgba(255,184,0,.3)`,background:"linear-gradient(135deg,rgba(255,184,0,.06),rgba(255,107,53,.04))",cursor:"pointer",position:"relative",overflow:"hidden"}}
          onClick={openChest}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.01)";e.currentTarget.style.borderColor="rgba(255,184,0,.5)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="rgba(255,184,0,.3)"}}
        >
          {chestPhase==='opening' ? (
            <div className="ashake">
              <div style={{fontSize:52,marginBottom:6}}>🎁</div>
              <div style={{fontSize:14,fontWeight:700,color:B.gold}}>Opening...</div>
            </div>
          ) : (
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14}}>
                <span style={{fontSize:42}} className="ap">🎁</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:16,fontWeight:800,color:B.gold}}>Daily Login Reward</div>
                  <div style={{fontSize:12,color:B.muted}}>Tap to claim your free coins!{streak>1?` (${streak}-day streak bonus active)`:""}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {chestPhase==='revealed' && (
        <div className="card abounce" style={{padding:20,marginBottom:20,textAlign:"center",border:"2px solid rgba(1,214,118,.3)",background:"rgba(1,214,118,.04)",position:"relative",overflow:"hidden"}}>
          {confettiParts.map(p=>(
            <div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:"50%",width:p.size,height:p.size,borderRadius:p.size>9?"50%":"2px",background:p.color,animation:`confetti ${p.dur}s ease-out ${p.delay}s both`,pointerEvents:"none"}}/>
          ))}
          <div style={{fontSize:36,marginBottom:4}}>🎉</div>
          <div style={{fontSize:22,fontWeight:900,fontFamily:"'Poppins'",color:B.money}}>{fmt(chestReward)} coins claimed!</div>
          <div style={{fontSize:12,color:B.muted,marginTop:4}}>Next chest in <span style={{color:B.gold,fontWeight:700}}>{chestCountdown}</span></div>
        </div>
      )}
      {chestOpened && chestPhase!=='revealed' && (
        <div className="card au" style={{padding:14,marginBottom:20,textAlign:"center",border:"1px solid rgba(255,184,0,.1)",opacity:.6}}>
          <div style={{fontSize:13,color:B.muted}}>🎁 Daily reward claimed — next chest in <span style={{color:B.gold,fontWeight:700,animation:"tickTock 2s ease-in-out infinite"}}>{chestCountdown}</span></div>
        </div>
      )}

      {/* Stats Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat label="Total Balance" value={<>{fmt(coins)} 🪙</>} sub={`$${toUSD(coins)}`} grad={B.grad} delay={0}/>
        <Stat label="Today" value={<>+{fmt(today)}</>} sub={`$${toUSD(today)}`} grad={B.gradOk} delay={.05}/>
        <Stat label="This Week" value={<>+{fmt(week)}</>} sub={`$${toUSD(week)}`} grad={B.grad} delay={.1}/>
        <Stat label="Streak" value={<>{streak} Days 🔥</>} sub={streak>=7?`Bonus unlocked!`:`${7-(streak%7)} days to bonus`} grad={B.gradHot} delay={.15}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"5fr 3fr",gap:20}}>
        {/* LEFT */}
        <div>
          {/* Level Card */}
          <div className="card au" style={{padding:22,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:30}}>{lv.icon}</span>
                <div>
                  <div style={{fontSize:12,color:B.muted}}>Current Level</div>
                  <div style={{fontSize:20,fontWeight:800,fontFamily:"'Poppins'",color:lv.c}}>{lv.n}</div>
                </div>
              </div>
              {nxt&&<div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:B.muted}}>Next: {nxt.icon} {nxt.n}</div>
                <div style={{fontSize:12,color:B.accentL,fontWeight:600}}>+{nxt.bonus}% bonus on all offers</div>
              </div>}
            </div>
            <div style={{background:"rgba(1,214,118,.08)",borderRadius:10,height:12,overflow:"hidden",marginBottom:6}}>
              <div className="progress-bar" style={{width:`${prog}%`,background:B.gradGold}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:B.muted}}>
              <span>{fmt(coins)} coins</span>
              {nxt&&<span>{fmt(nxt.min)} needed</span>}
            </div>
            <div style={{marginTop:14,padding:10,background:"rgba(255,184,0,.04)",borderRadius:10,border:"1px solid rgba(255,184,0,.08)",fontSize:12,color:B.muted}}>
              🎖 Your perks: <span style={{color:"#FFB800",fontWeight:600}}>{lv.bonus}% bonus on offers</span>
              {lv.idx>=3?" · Priority support":""}
              {lv.idx>=4?" · Exclusive high-value offers":""}
              {lv.idx>=5?" · Zero cashout fees · VIP Discord":""}
            </div>
          </div>

          {/* 7-Day Streak — Candy Crush-style escalating daily rewards */}
          <div className="card au" style={{padding:22,marginBottom:20,animationDelay:".1s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{fontSize:15,fontWeight:700}}>🔥 7-Day Streak Challenge</h3>
              {streak>=7&&!bonusClaimed&&<span className="ap" style={{fontSize:11,color:B.gold,fontWeight:700}}>BONUS READY!</span>}
            </div>
            <div style={{display:"flex",gap:6}}>
              {[1,2,3,4,5,6,7].map(d=>{
                const streakDay = streak%7||(streak>0?7:0);
                const done = d <= streakDay;
                const isToday = d === streakDay;
                const isNext = d === streakDay+1;
                // Escalating rewards — each day is worth more (commitment escalation like Candy Crush daily rewards)
                const dayReward = d===7?'JACKPOT':`+${[50,100,150,200,300,400,0][d-1]}`;
                return (
                  <div key={d} style={{
                    flex:1,textAlign:"center",padding:"10px 2px",borderRadius:10,transition:"all .2s",
                    background:done?"rgba(1,214,118,.08)":isNext?"rgba(255,184,0,.04)":"rgba(255,255,255,.02)",
                    border:isToday?`2px solid ${B.money}`:isNext?`2px dashed rgba(255,184,0,.3)`:`1px solid rgba(255,255,255,.04)`,
                    transform:isToday?"scale(1.05)":"scale(1)",
                  }}>
                    <div style={{fontSize:9,color:B.muted,marginBottom:3}}>Day {d}</div>
                    <div style={{fontSize:d===7?22:18,transition:"all .2s"}}>{done?"✅":d===7?"🎁":isNext?"⭐":"⬜"}</div>
                    <div style={{fontSize:9,color:done?B.ok:d===7?B.gold:B.dim,fontWeight:700,marginTop:2}}>{dayReward}</div>
                  </div>
                );
              })}
            </div>
            {/* Streak bonus claim — dramatic reveal */}
            {streak%7===0 && streak>0 && !bonusClaimed && bonusPhase==='idle' && (
              <button className="btn-primary ap" onClick={claimStreak} style={{width:"100%",marginTop:14,padding:13}}>
                🎁 Claim 7-Day Streak Bonus — Up to 2,000 Coins!
              </button>
            )}
            {bonusPhase==='opening' && (
              <div className="ashake" style={{marginTop:14,padding:16,background:"rgba(255,184,0,.06)",border:"2px solid rgba(255,184,0,.3)",borderRadius:12,textAlign:"center"}}>
                <div style={{fontSize:32}}>🎁</div>
                <div style={{fontSize:13,color:B.gold,fontWeight:700}}>Opening bonus...</div>
              </div>
            )}
            {bonusPhase==='revealed' && (
              <div className="abounce" style={{marginTop:14,padding:16,background:"rgba(1,214,118,.06)",border:"2px solid rgba(1,214,118,.25)",borderRadius:12,textAlign:"center",position:"relative",overflow:"hidden"}}>
                {confettiParts.map(p=>(
                  <div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:"50%",width:p.size,height:p.size,borderRadius:"50%",background:p.color,animation:`confetti ${p.dur}s ease-out ${p.delay}s both`,pointerEvents:"none"}}/>
                ))}
                <div style={{fontSize:28,fontWeight:900,fontFamily:"'Poppins'",color:B.money}}>{fmt(bonusAmt)} coins!</div>
                <div style={{fontSize:12,color:B.muted,marginTop:2}}>{bonusAmt>=1000?"🔥 JACKPOT!":"Nice!"} Keep your streak alive for bigger rewards.</div>
              </div>
            )}
            {bonusClaimed && bonusPhase==='idle' && (
              <div style={{marginTop:10,padding:8,textAlign:"center",fontSize:11,color:B.muted}}>
                ✅ Streak bonus claimed this cycle — keep logging in daily!
              </div>
            )}
          </div>

          {/* Earnings Chart */}
          <div className="card au" style={{padding:22,animationDelay:".15s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>📈 Earnings This Week</h3>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>{
                const heights = [45,62,38,78,55,90,72];
                const isToday = i===new Date().getDay()-1;
                return (
                  <div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{
                      width:"100%",height:heights[i],borderRadius:6,
                      background:isToday?B.gradOk:i<=new Date().getDay()-1?"rgba(1,214,118,.15)":"rgba(1,214,118,.08)",
                      transition:"all .3s",cursor:"pointer",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".8"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                    />
                    <span style={{fontSize:10,color:isToday?B.ok:B.muted,fontWeight:isToday?700:400}}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* ─── DAILY SPIN — Near-miss psychology + confetti celebration ─── */}
          <div className="card au" style={{
            padding:22,marginBottom:20,textAlign:"center",position:"relative",overflow:"hidden",
            border:!spinUsed?"2px solid rgba(255,184,0,.3)":"1px solid rgba(245,158,11,.1)",
            background:!spinUsed?"linear-gradient(135deg,rgba(255,184,0,.06),rgba(255,45,120,.03))":"transparent",
            animationDelay:".08s",
          }}>
            {/* Confetti layer */}
            {confettiParts.map(p=>(
              <div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:"50%",width:p.size,height:p.size,borderRadius:p.size>9?"50%":"2px",background:p.color,animation:`confetti ${p.dur}s ease-out ${p.delay}s both`,pointerEvents:"none",zIndex:10}}/>
            ))}

            <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>🎰 Daily Spin</h3>
            <p style={{fontSize:11,color:B.dim,marginBottom:12}}>Complete offers for 1,000+ coins to unlock your daily spin</p>

            {/* Spin wheel */}
            <div style={{
              width:140,height:140,borderRadius:"50%",margin:"12px auto 16px",
              background:`conic-gradient(
                ${B.gold} 0deg, ${B.gold} 30deg,
                ${B.ok} 30deg, ${B.ok} 75deg,
                #60A5FA 75deg, #60A5FA 120deg,
                ${B.accent} 120deg, ${B.accent} 165deg,
                ${B.hot} 165deg, ${B.hot} 210deg,
                #EC4899 210deg, #EC4899 255deg,
                ${B.ok} 255deg, ${B.ok} 300deg,
                ${B.gold} 300deg, ${B.gold} 360deg
              )`,
              display:"flex",alignItems:"center",justifyContent:"center",
              animation:spinning?"spinWheel 3s cubic-bezier(.2,.8,.3,1) forwards":"none",
              transition:"all .3s",
              boxShadow:!spinUsed?"0 0 30px rgba(255,184,0,.15)":"none",
            }}>
              <div style={{width:94,height:94,borderRadius:"50%",background:B.card,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",fontWeight:800,border:"3px solid rgba(255,255,255,.08)"}}>
                {spinPhase==='nearMiss' ? (
                  <div style={{color:B.gold,fontSize:14,animation:"shakeX .3s ease-in-out"}}>
                    <div style={{fontSize:10,color:B.muted}}>So close!</div>
                    {fmt(nearMissAmt)}🪙
                  </div>
                ) : spinResult ? (
                  <span className="abounce" style={{color:B.gold,fontSize:16}}>{fmt(spinResult)}🪙</span>
                ) : (
                  <span style={{fontSize:28}}>{spinning?"⏳":"🎯"}</span>
                )}
              </div>
            </div>

            {/* Spin states */}
            {!spinUsed && !spinning && spinPhase==='idle' && (
              <button className="btn-primary ap" onClick={spin} style={{width:"100%",padding:12,fontSize:14}}>
                Spin to Win!
              </button>
            )}
            {spinning && spinPhase==='spinning' && (
              <div style={{padding:10,fontSize:13,color:B.gold,fontWeight:600}}>Spinning...</div>
            )}
            {spinPhase==='result' && (
              <div className="abounce" style={{padding:12,background:"rgba(1,214,118,.06)",borderRadius:10,border:"1px solid rgba(1,214,118,.15)"}}>
                <div style={{fontSize:18,fontWeight:900,color:B.money,fontFamily:"'Poppins'"}}>{fmt(spinResult)} coins won!</div>
                <div style={{fontSize:11,color:B.muted,marginTop:2}}>Added to your balance</div>
              </div>
            )}
            {(spinPhase==='celebrated' || (spinUsed && spinPhase==='idle')) && (
              <div style={{padding:10,fontSize:12,color:B.muted}}>
                Come back tomorrow for another spin!
              </div>
            )}
          </div>

          {/* Quick Earn — sorted by reward amount to emphasize value */}
          <div className="card au" style={{padding:22,marginBottom:20,animationDelay:".12s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>⚡ Quick Earn</h3>
            {[
              {ic:"🤝",l:"Refer a Friend",c:"+$0.50 + 5% forever",t:"1 min",hot:true},
              {ic:"📱",l:"Try New App",c:"+$3.00",t:"10 min",hot:false},
              {ic:"📋",l:"Quick Survey",c:"+$1.50",t:"5 min",hot:false},
              {ic:"📺",l:"Watch Videos",c:"+$0.80",t:"6 min",hot:false},
              {ic:"🧠",l:"Daily Trivia",c:"+$0.60",t:"2 min",hot:false},
              {ic:"🔍",l:"Search & Earn",c:"+$0.05",t:"Per search",hot:false},
            ].map((a,i)=>(
              <div key={i} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 12px",borderRadius:10,marginBottom:6,cursor:"pointer",
                background:a.hot?"rgba(255,107,53,.04)":"rgba(255,255,255,.02)",transition:"all .15s",
                border:a.hot?"1px solid rgba(255,107,53,.12)":"1px solid transparent",
              }}
                onClick={()=>setPg("earn")}
                onMouseEnter={e=>{e.currentTarget.style.background=a.hot?"rgba(255,107,53,.08)":"rgba(1,214,118,.08)";e.currentTarget.style.transform="translateX(4px)"}}
                onMouseLeave={e=>{e.currentTarget.style.background=a.hot?"rgba(255,107,53,.04)":"rgba(255,255,255,.02)";e.currentTarget.style.transform="translateX(0)"}}
              >
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>{a.ic}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{a.l} {a.hot&&<span style={{fontSize:10,color:B.hot,fontWeight:800}}>HOT</span>}</div>
                    <div style={{fontSize:10,color:B.muted}}>{a.t}</div>
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:a.hot?B.hot:B.ok}}>{a.c}</span>
              </div>
            ))}
          </div>

          {/* Referral Nudge — full card lives on Profile */}
          <div className="card au" style={{padding:16,background:"linear-gradient(135deg,rgba(236,72,153,.04),rgba(1,214,118,.04))",border:"1px solid rgba(236,72,153,.1)",animationDelay:".16s",textAlign:"center"}}>
            <p style={{fontSize:12,color:B.muted,margin:0}}>💡 Earn <strong style={{color:"#EC4899"}}>$0.50 + 5% of their earnings</strong> per friend you refer — grab your link on your <strong onClick={()=>setPg("profile")} style={{color:B.accentL,cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted"}}>Profile page</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: EARN — Real Offerwall Integration
// ═══════════════════════════════════════════════════════════════
// Each offerwall loads via iframe with the user's ID passed as a param.
// Offerwalls fire server-to-server postbacks to /api/postback when
// users complete offers. Coins are credited automatically.
//
// SETUP: For each wall, create an account and plug your API key / secret
// into Vercel env vars. Set the postback URL in each wall's dashboard to:
//   https://YOUR-DOMAIN.com/api/postback?wall=WALL_NAME&user_id={user_id}&amount={points}&txn_id={transaction_id}&offer_id={offer_id}&offer_name={offer_name}&revenue={payout}&secret=YOUR_SECRET
//
// Walls that are not configured yet show a placeholder card instead of iframe.

// Offerwall config — reads NEXT_PUBLIC_* env vars at build time.
// When you plug in a real key, the wall auto-activates (no code changes needed).
// Next.js requires direct process.env.NEXT_PUBLIC_* references for build-time inlining
// (dynamic lookup via process.env[key] does NOT work in client components)
const OFFERWALLS = [
  {
    id: "adgate",  name: "AdGate Media", icon: "🛡️", color: "#3B82F6",
    desc: "Premium offers, surveys & app installs",
    key: process.env.NEXT_PUBLIC_ADGATE_WALL_CODE || "",
    iframeUrl: (uid, k) => `https://wall.adgatemedia.com/${k}/${uid}`,
  },
  {
    id: "adgem",  name: "AdGem", icon: "💎", color: "#8B5CF6",
    desc: "High-converting games & app offers",
    key: process.env.NEXT_PUBLIC_ADGEM_APP_ID || "",
    iframeUrl: (uid, k) => `https://api.adgem.com/v1/wall?appid=${k}&playerid=${uid}`,
  },
  {
    id: "offertoro", name: "OfferToro", icon: "🐂", color: "#FF6B35",
    desc: "Global offers with high payouts",
    key: process.env.NEXT_PUBLIC_OFFERTORO_PUB_ID || "",
    key2: process.env.NEXT_PUBLIC_OFFERTORO_APP_ID || "",
    iframeUrl: (uid, k, k2) => `https://www.offertoro.com/ifr/show/${k}/${k2||"1"}/${uid}/0`,
  },
  {
    id: "lootably", name: "Lootably", icon: "🎁", color: "#00D26A",
    desc: "Rewarded surveys & video offers",
    key: process.env.NEXT_PUBLIC_LOOTABLY_PLACEMENT || "",
    iframeUrl: (uid, k) => `https://wall.lootably.com/?placementID=${k}&sid=${uid}`,
  },
  {
    id: "ayet", name: "Ayet Studios", icon: "🎮", color: "#A855F7",
    desc: "Top mobile game offers",
    key: process.env.NEXT_PUBLIC_AYET_APP_KEY || "",
    iframeUrl: (uid, k) => `https://www.ayetstudios.com/offers/web_offerwall/${k}?external_identifier=${uid}`,
  },
  {
    id: "cpxresearch", name: "CPX Research", icon: "📊", color: "#FF9F1C",
    desc: "Paid surveys from top researchers",
    key: process.env.NEXT_PUBLIC_CPX_APP_ID || "",
    iframeUrl: (uid, k) => `https://offers.cpx-research.com/index.php?app_id=${k}&ext_user_id=${uid}`,
  },
  {
    id: "bitlabs", name: "BitLabs", icon: "🧪", color: "#00E5FF",
    desc: "Surveys & offers with instant credit",
    key: process.env.NEXT_PUBLIC_BITLABS_TOKEN || "",
    iframeUrl: (uid, k) => `https://web.bitlabs.ai/?uid=${uid}&token=${k}`,
  },
  {
    id: "theoremreach", name: "TheoremReach", icon: "📋", color: "#FF2D78",
    desc: "Quick surveys, paid instantly",
    key: process.env.NEXT_PUBLIC_THEOREMREACH_KEY || "",
    iframeUrl: (uid, k) => `https://theoremreach.com/respondent_entry/direct?api_key=${k}&user_id=${uid}`,
  },
  {
    id: "revenueuniverse", name: "Revenue Universe", icon: "🌐", color: "#FFB800",
    desc: "Diverse offers from top advertisers",
    key: process.env.NEXT_PUBLIC_RU_APP_HASH || "",
    iframeUrl: (uid, k) => `https://wall.revenueuniverse.com/wall/${k}?uid=${uid}`,
  },
  {
    id: "pollfish", name: "Pollfish", icon: "📝", color: "#4ADE80",
    desc: "Market research surveys",
    key: process.env.NEXT_PUBLIC_POLLFISH_KEY || "",
    iframeUrl: (uid, k) => `https://wss.pollfish.com/v2/device/register/true?api_key=${k}&request_uuid=${uid}`,
  },
  {
    id: "torox", name: "Torox", icon: "⚡", color: "#FF3B30",
    desc: "Performance-based CPI offers",
    key: process.env.NEXT_PUBLIC_TOROX_PUB_ID || "",
    iframeUrl: (uid, k) => `https://torfrnt.com/offerwall?pubid=${k}&sid=${uid}`,
  },
  {
    id: "tyrads", name: "TyrAds", icon: "🏹", color: "#6366F1",
    desc: "Premium mobile CPI campaigns",
    key: process.env.NEXT_PUBLIC_TYRADS_KEY || "",
    iframeUrl: (uid, k) => `https://www.tyrads.com/api/v1/offerwall?apiKey=${k}&userId=${uid}`,
  },
];

const Earn = ({onEarn, user}) => {
  const [activeWall, setActiveWall] = useState(null);
  const [comingSoonWall, setComingSoonWall] = useState(null);
  const [tab, setTab] = useState("featured"); // "featured" (offerwalls hidden until configured)
  const [cat,setCat] = useState("featured");
  const [sort,setSort] = useState("pop");
  const [search,setSearch] = useState("");
  const uid = user?.id || "demo";

  const filtered = useMemo(()=>{
    return OFFERS
      .filter(o=>cat==="featured"?o.hot:o.cat===cat)
      .filter(o=>!search||o.t.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>sort==="pop"?b.pop-a.pop:sort==="pay"?b.coins-a.coins:b.rate-a.rate);
  },[cat,sort,search]);

  // Wall is configured if its env var key is set to something real (not placeholder)
  const isConfigured = (wall) => {
    const k = wall.key;
    return k && k.length > 3 && !k.startsWith("your-");
  };

  // Find the matching offerwall for an offer's "wall" field
  const findWall = (wallName) => OFFERWALLS.find(w =>
    w.name.toLowerCase() === wallName.toLowerCase() ||
    w.name.toLowerCase().includes(wallName.toLowerCase()) ||
    wallName.toLowerCase().includes(w.name.toLowerCase())
  );

  // When user clicks an offer, open the corresponding offerwall
  const handleOfferStart = (offer) => {
    if (offer.wall === "PocketLined" || offer.wall === "Direct") {
      onEarn(offer.coins);
      return;
    }
    const wall = findWall(offer.wall);
    if (wall && isConfigured(wall)) {
      setActiveWall(wall);
    } else {
      setComingSoonWall(offer.wall);
      setTimeout(() => setComingSoonWall(null), 3000);
    }
  };

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
      {/* Coming Soon Toast */}
      {comingSoonWall && (
        <div className="au" style={{position:"fixed",top:80,right:20,zIndex:9999,padding:"14px 24px",borderRadius:12,background:"rgba(255,159,28,.15)",border:"1px solid rgba(255,159,28,.3)",backdropFilter:"blur(20px)",color:B.warn,fontWeight:600,fontSize:14}}>
          ⏳ {comingSoonWall} is coming soon! Try other offers.
        </div>
      )}
      <div className="au" style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'Poppins'",fontSize:26,fontWeight:800}}>Earn Coins 💰</h1>
        <p style={{color:B.muted,fontSize:14}}>Complete offers, surveys, and app installs to earn real coins</p>
      </div>

      {/* ─── ACTIVE OFFERWALL IFRAME ─── */}
      {activeWall ? (
        <div>
          <button onClick={()=>setActiveWall(null)} style={{
            display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:B.accentL,
            fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:16,padding:0,
          }}>← Back to offers</button>

          <div className="card" style={{overflow:"hidden",border:`1px solid ${activeWall.color}30`}}>
            <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${B.border}`,background:`linear-gradient(135deg,${activeWall.color}08,transparent)`}}>
              <span style={{fontSize:22}}>{activeWall.icon}</span>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{activeWall.name}</div>
                <div style={{fontSize:11,color:B.muted}}>Coins are credited automatically when you complete offers</div>
              </div>
            </div>
            <iframe
              src={activeWall.iframeUrl(uid, activeWall.key, activeWall.key2)}
              style={{width:"100%",height:"70vh",border:"none",background:B.bg}}
              title={`${activeWall.name} Offerwall`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
              allow="clipboard-write"
            />
          </div>
        </div>
      ) : (
      <>
        {/* AI Recommendation */}
          <div className="card au" style={{padding:"16px 22px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(1,214,118,.08),rgba(96,165,250,.08))",border:"1px solid rgba(1,214,118,.15)"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,marginBottom:2}}>🤖 Smart Pick for You</div>
              <div style={{fontSize:12,color:B.muted}}>Based on your profile: <strong style={{color:B.txt}}>Cash App signup ($25.00)</strong> — 5 min, 94% success rate</div>
            </div>
            <button className="btn-primary" style={{padding:"10px 20px",fontSize:13,whiteSpace:"nowrap"}}>Start Now →</button>
          </div>

          {/* Search + Sort */}
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200,position:"relative"}}>
              <input placeholder="Search thousands of offers..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:"100%",padding:"11px 16px 11px 38px",background:B.card,border:`1px solid ${B.border}`,borderRadius:12,color:B.txt,fontSize:14}}/>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15}}>🔍</span>
            </div>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              style={{padding:"11px 16px",background:B.card,border:`1px solid ${B.border}`,borderRadius:12,color:B.txt,fontSize:14,cursor:"pointer"}}>
              <option value="pop">🔥 Most Popular</option>
              <option value="pay">💰 Highest Paying</option>
              <option value="easy">✅ Easiest First</option>
            </select>
          </div>

          {/* Categories */}
          <div style={{display:"flex",gap:6,marginBottom:22,overflowX:"auto",paddingBottom:6}}>
            {CATS.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{
                padding:"9px 16px",borderRadius:10,whiteSpace:"nowrap",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",
                background:cat===c.id?`${c.c}12`:"rgba(255,255,255,.02)",
                border:cat===c.id?`1px solid ${c.c}40`:"1px solid rgba(255,255,255,.04)",
                color:cat===c.id?c.c:B.muted,
              }}>{c.n}</button>
            ))}
          </div>

          {/* Offers Grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
            {filtered.map((o,i)=><OfferCard key={o.id} o={o} onEarn={onEarn} onStart={handleOfferStart} delay={i*.04}/>)}
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:60,color:B.muted}}>No offers match your search. Try a different category.</div>}
      </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: PROFILE
// ═══════════════════════════════════════════════════════════════
const Profile = ({coins,streak,today,week,user}) => {
  const lv = getLevel(coins);
  const prog = pct(coins);
  const nxt = LEVELS[lv.idx+1];
  const totalEarned = user ? (user.lifetime_earned || coins) : (coins + 42300);
  const totalWithdrawn = totalEarned - coins;
  const withdrawCount = user ? (user.withdrawCount || 0) : 0;
  const referrals = user ? (user.referralCount || 0) : 12;
  const referralEarnings = user ? (user.referralEarnings || 0) : 18640;
  const displayName = user ? (user.username || 'User') : 'Andrew';
  const memberSince = user && user.created_at ? (() => {
    try { return new Date(user.created_at).toLocaleDateString('en-US', {month:'long', year:'numeric'}); }
    catch(e) { return 'March 2026'; }
  })() : 'March 2026';

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px"}}>
      {/* Profile Header */}
      <div className="card au" style={{padding:28,marginBottom:24,display:"flex",gap:24,alignItems:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:B.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:800,border:`3px solid ${lv.c}`,flexShrink:0}}>{displayName[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <h1 style={{fontFamily:"'Poppins'",fontSize:24,fontWeight:800}}>{displayName}</h1>
            <div className="chip" style={{background:`${lv.c}15`,border:`1px solid ${lv.c}30`,color:lv.c,fontSize:12}}>{lv.icon} {lv.n}</div>
            {streak>=7&&<div className="chip" style={{background:"rgba(255,107,53,.08)",border:"1px solid rgba(255,107,53,.2)",color:"#FF6B35",fontSize:12}}>🔥 {streak} day streak</div>}
          </div>
          <p style={{fontSize:13,color:B.muted}}>Member since {memberSince}</p>
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:B.muted,marginBottom:4}}>
              <span>{lv.icon} {lv.n}</span>
              {nxt&&<span>{nxt.icon} {nxt.n} — {fmt(nxt.min - coins)} coins to go</span>}
            </div>
            <div style={{background:"rgba(1,214,118,.08)",borderRadius:10,height:8,overflow:"hidden"}}>
              <div className="progress-bar" style={{width:`${prog}%`,background:B.grad}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat label="Current Balance" value={<>${toUSD(coins)}</>} sub={`${fmt(coins)} coins`} grad={B.grad} delay={0}/>
        <Stat label="Lifetime Earned" value={<>${toUSD(totalEarned)}</>} sub={`${fmt(totalEarned)} coins`} grad={B.gradOk} delay={.05}/>
        <Stat label="Total Withdrawn" value={<>${toUSD(totalWithdrawn)}</>} sub={`${withdrawCount || 0} withdrawals`} grad={B.gradGold} delay={.1}/>
        <Stat label="Referral Earnings" value={<>${toUSD(referralEarnings)}</>} sub={`${referrals} referrals`} grad={B.gradHot} delay={.15}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* Activity History */}
        <div className="card au" style={{padding:22,animationDelay:".1s"}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>📋 Recent Activity</h3>
          {[
            {t:"Completed Cash App offer",c:"+25,000",time:"2 hours ago",ic:"💸",col:B.ok},
            {t:"Quick Survey — 12 questions",c:"+3,500",time:"3 hours ago",ic:"📊",col:B.ok},
            {t:"Withdrew $42.30 via PayPal",c:"-42,300",time:"Yesterday",ic:"💳",col:B.hot},
            {t:"7-day streak bonus",c:"+1,200",time:"Yesterday",ic:"🔥",col:B.ok},
            {t:"Daily spin reward",c:"+2,000",time:"Yesterday",ic:"🎰",col:B.ok},
            {t:"Watched 5 videos",c:"+900",time:"2 days ago",ic:"📺",col:B.ok},
            {t:"Referred Alex K.",c:"+500",time:"3 days ago",ic:"👥",col:B.ok},
          ].map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<6?`1px solid rgba(255,255,255,.03)`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>{a.ic}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{a.t}</div>
                  <div style={{fontSize:11,color:B.muted}}>{a.time}</div>
                </div>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:a.col}}>{a.c}</span>
            </div>
          ))}
        </div>

        {/* Right: Referrals + Settings */}
        <div>
          {/* Referral Program */}
          <div className="card au" style={{padding:22,marginBottom:16,background:"linear-gradient(135deg,rgba(236,72,153,.04),rgba(1,214,118,.04))",border:"1px solid rgba(236,72,153,.12)",animationDelay:".12s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>👥 Your Referral Link</h3>
            <p style={{fontSize:12,color:B.muted,marginBottom:12}}>Earn <strong style={{color:"#EC4899"}}>$0.50 per referral</strong> + 5% of their offerwall earnings. Forever.</p>
            <div style={{background:"rgba(0,0,0,.25)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <code style={{fontSize:12,color:B.accentL}}>pocketlined.com/ref/andrew</code>
              <button style={{background:B.grad,border:"none",padding:"6px 14px",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Copy</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{padding:12,background:"rgba(0,0,0,.15)",borderRadius:10,textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"'Poppins'",color:B.accentL}}>{referrals}</div>
                <div style={{fontSize:11,color:B.muted}}>Referrals</div>
              </div>
              <div style={{padding:12,background:"rgba(0,0,0,.15)",borderRadius:10,textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"'Poppins'",color:B.ok}}>${toUSD(referralEarnings)}</div>
                <div style={{fontSize:11,color:B.muted}}>Earned</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="card au" style={{padding:22,marginBottom:16,animationDelay:".16s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>🏅 Achievements</h3>
            {[
              {ic:"🌟",t:"First Cashout",d:"Withdrew for the first time",done:true},
              {ic:"🔥",t:"Week Warrior",d:"7-day streak achieved",done:true},
              {ic:"💰",t:"$100 Club",d:"Earned $100+ lifetime",done:false},
              {ic:"👥",t:"Team Builder",d:"Referred 10+ friends",done:true},
              {ic:"🏆",t:"Top 100",d:"Reach the leaderboard Top 100",done:false},
            ].map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",opacity:a.done?1:.45,borderBottom:i<4?`1px solid rgba(255,255,255,.03)`:"none"}}>
                <span style={{fontSize:20}}>{a.ic}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{a.t}</div>
                  <div style={{fontSize:11,color:B.muted}}>{a.d}</div>
                </div>
                {a.done&&<span style={{fontSize:14,color:B.ok}}>✅</span>}
              </div>
            ))}
          </div>

          {/* Account Settings */}
          <div className="card au" style={{padding:22,animationDelay:".2s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>⚙️ Account</h3>
            {[
              {l:"Email",v:"andrew@email.com"},
              {l:"PayPal",v:"Connected ✅"},
              {l:"2FA",v:"Enabled ✅"},
              {l:"Notifications",v:"On"},
            ].map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<3?`1px solid rgba(255,255,255,.03)`:"none"}}>
                <span style={{fontSize:13,color:B.muted}}>{s.l}</span>
                <span style={{fontSize:13,fontWeight:500}}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: REWARDS / CASHOUT
// ═══════════════════════════════════════════════════════════════
const Rewards = ({coins, onCashout, user}) => {
  const [sel,setSel] = useState(null);
  const [amt,setAmt] = useState("");
  const [dest,setDest] = useState("");
  const [processing,setProcessing] = useState(false);
  const [done,setDone] = useState(false);
  const [error,setError] = useState("");
  const [myPayouts,setMyPayouts] = useState([]);
  const [loadingPayouts,setLoadingPayouts] = useState(true);

  // Fetch user's payout history on mount
  useEffect(()=>{
    apiFetch('/api/payouts').then(data=>{
      setMyPayouts(Array.isArray(data)?data:[]);
      setLoadingPayouts(false);
    }).catch(()=>setLoadingPayouts(false));
  },[]);

  // Destination field labels per method
  const destLabels = {
    paypal:"PayPal Email",venmo:"Venmo Username or Phone",cashapp:"Cash App $Cashtag",
    btc:"Bitcoin Wallet Address",eth:"Ethereum Wallet Address",usdt:"USDT Wallet Address (TRC-20)",
    amazon:"Email for Amazon Gift Card",visa:"Email for Visa Delivery",
    steam:"Steam Profile URL",apple:"Apple ID Email",google:"Google Play Email",walmart:"Email for Walmart Gift Card",
  };
  const destPlaceholders = {
    paypal:"you@email.com",venmo:"@username or (555) 123-4567",cashapp:"$YourCashtag",
    btc:"bc1q...",eth:"0x...",usdt:"T...",
    amazon:"you@email.com",visa:"you@email.com",
    steam:"https://steamcommunity.com/id/...",apple:"you@icloud.com",google:"you@gmail.com",walmart:"you@email.com",
  };

  const selectedMethod = CASHOUTS.find(c=>c.id===sel);
  const minCoins = selectedMethod?.min || 1000;
  const amtNum = parseFloat(amt) || 0;
  const coinCost = Math.round(amtNum * 1000);
  const canAfford = coinCost >= minCoins && coinCost <= coins;

  const cashout = async () => {
    if(!sel || !amtNum || !dest.trim()){
      setError("Please fill in all fields");
      return;
    }
    if(coinCost < minCoins){
      setError(`Minimum withdrawal is $${toUSD(minCoins)}`);
      return;
    }
    if(coinCost > coins){
      setError("Insufficient balance");
      return;
    }
    setError("");
    setProcessing(true);
    try {
      const res = await apiFetch('/api/payouts',{
        method:'POST',
        body: JSON.stringify({ method:sel, coins:coinCost, destination:dest.trim() }),
      });
      if(res.error){
        setError(res.error);
        setProcessing(false);
        return;
      }
      setDone(true);
      setProcessing(false);
      // Refresh payouts list
      apiFetch('/api/payouts').then(data=>setMyPayouts(Array.isArray(data)?data:[])).catch(()=>{});
      // Notify parent to refresh user data (coin balance)
      if(onCashout) onCashout(coinCost);
    } catch(e) {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSel(null);setAmt("");setDest("");setDone(false);setError("");
  };

  const statusColors = {pending:B.warn,completed:B.ok,rejected:B.hot};
  const statusLabels = {pending:"⏳ Pending",completed:"✅ Paid",rejected:"❌ Rejected"};

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
      <div className="au" style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'Poppins'",fontSize:26,fontWeight:800}}>Cash Out 🎁</h1>
        <p style={{color:B.muted,fontSize:14}}>
          Balance: <strong style={{color:B.accentL}}>{fmt(coins)} coins</strong> (${toUSD(coins)})
        </p>
      </div>

      {/* Speed Badge */}
      <div className="card au" style={{padding:"16px 22px",marginBottom:24,display:"flex",alignItems:"center",gap:14,background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.12)"}}>
        <span style={{fontSize:28}}>⚡</span>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:B.ok}}>Fast Payouts — $5 Minimum</div>
          <div style={{fontSize:12,color:B.muted}}>PayPal, Venmo, Cash App, crypto, and gift cards. $5 minimum cashout — competitive with top GPT platforms.</div>
        </div>
      </div>

      {/* Cashout Grid */}
      {!done && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
          {CASHOUTS.map((c,i)=>{
            const can=coins>=c.min;
            const active=sel===c.id;
            return (
              <div key={c.id} className="card au" onClick={()=>{if(can){setSel(c.id);setDone(false);setError("");}}} style={{
                padding:20,textAlign:"center",cursor:can?"pointer":"default",opacity:can?1:.45,
                border:active?`2px solid ${B.accent}`:`1px solid ${B.border}`,
                background:active?"rgba(1,214,118,.06)":B.card,
                animationDelay:`${i*.04}s`,position:"relative",transition:"all .15s",
              }}
                onMouseEnter={e=>{if(can)e.currentTarget.style.transform="translateY(-3px)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"}}
              >
                {c.pop&&<div style={{position:"absolute",top:-7,right:-7,background:B.gradHot,padding:"2px 8px",borderRadius:8,fontSize:9,fontWeight:800,color:"#fff"}}>POPULAR</div>}
                <div style={{fontSize:32,marginBottom:8}}>{c.ic}</div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{c.n}</div>
                <div style={{fontSize:11,color:B.muted}}>Min: ${toUSD(c.min)}</div>
                <div style={{fontSize:11,color:B.ok,marginTop:2}}>{c.spd} · {c.fee} fee</div>
                {!can&&<div style={{fontSize:10,color:B.hot,marginTop:4}}>Need {fmt(c.min - coins)} more coins</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Cashout Form */}
      {sel&&!done&&(
        <div className="af" style={{maxWidth:500,margin:"0 auto"}}>
          <div className="card" style={{padding:28}}>
            <h3 style={{fontSize:17,fontWeight:700,textAlign:"center",marginBottom:4}}>
              Withdraw to {selectedMethod?.n} {selectedMethod?.ic}
            </h3>
            <p style={{textAlign:"center",fontSize:12,color:B.muted,marginBottom:20}}>
              Available: {fmt(coins)} coins (${toUSD(coins)})
            </p>

            {/* Amount Input */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:5}}>Amount (USD)</label>
              <input type="number" step="0.01" min={toUSD(minCoins)} max={toUSD(coins)}
                placeholder={`Min $${toUSD(minCoins)}`}
                value={amt} onChange={e=>setAmt(e.target.value)}
                style={{width:"100%",padding:13,background:"rgba(255,255,255,.03)",border:`1px solid ${B.border}`,borderRadius:10,color:B.txt,fontSize:16}}/>
              {/* Quick amount buttons */}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                {[1,5,10,25].filter(v=>v*1000<=coins).map(v=>(
                  <button key={v} onClick={()=>setAmt(v.toString())} style={{
                    flex:1,padding:"6px 0",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                    background:parseFloat(amt)===v?"rgba(1,214,118,.15)":"rgba(255,255,255,.03)",
                    border:parseFloat(amt)===v?`1px solid ${B.accent}`:`1px solid ${B.border}`,
                    color:parseFloat(amt)===v?B.accentL:B.muted,
                  }}>${v}</button>
                ))}
                <button onClick={()=>setAmt(toUSD(coins))} style={{
                  flex:1,padding:"6px 0",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:"rgba(1,214,118,.06)",border:`1px solid rgba(1,214,118,.15)`,color:B.ok,
                }}>MAX</button>
              </div>
            </div>

            {/* Destination Input */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:5}}>{destLabels[sel]||"Destination"}</label>
              <input type="text" placeholder={destPlaceholders[sel]||"Enter destination"}
                value={dest} onChange={e=>setDest(e.target.value)}
                style={{width:"100%",padding:13,background:"rgba(255,255,255,.03)",border:`1px solid ${B.border}`,borderRadius:10,color:B.txt,fontSize:14}}/>
            </div>

            {/* Summary */}
            {amtNum>0&&(
              <div style={{padding:12,background:"rgba(0,0,0,.15)",borderRadius:10,marginBottom:14,fontSize:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:B.muted}}>You send:</span>
                  <span style={{fontWeight:700}}>{fmt(coinCost)} coins</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:B.muted}}>Fee:</span>
                  <span style={{fontWeight:600,color:B.ok}}>{selectedMethod?.fee||"0%"}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:6}}>
                  <span style={{color:B.muted}}>You receive:</span>
                  <span style={{fontWeight:800,color:B.money,fontSize:16}}>${amtNum.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error&&(
              <div style={{padding:10,background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,marginBottom:14,fontSize:13,color:B.hot,textAlign:"center"}}>
                {error}
              </div>
            )}

            <button className="btn-primary" onClick={cashout}
              disabled={processing||!amtNum||!dest.trim()||!canAfford}
              style={{width:"100%",padding:15,fontSize:16,opacity:(processing||!amtNum||!dest.trim()||!canAfford)?.5:1}}>
              {processing?"⏳ Processing Withdrawal...":"Withdraw $"+(amtNum||0).toFixed(2)+" ⚡"}
            </button>

            <button onClick={resetForm} style={{
              display:"block",margin:"12px auto 0",background:"none",border:"none",
              color:B.muted,fontSize:12,cursor:"pointer",textDecoration:"underline",
            }}>← Choose a different method</button>
          </div>
        </div>
      )}

      {/* Success State */}
      {done&&(
        <div className="abounce" style={{maxWidth:500,margin:"0 auto",textAlign:"center"}}>
          <div className="card" style={{padding:36}}>
            <div style={{fontSize:56,marginBottom:12}}>✅</div>
            <h3 style={{fontSize:20,fontWeight:700,color:B.ok,marginBottom:8}}>Withdrawal Submitted!</h3>
            <p style={{color:B.muted,fontSize:14,marginBottom:4}}>
              <strong style={{color:B.txt}}>${amtNum.toFixed(2)}</strong> → {selectedMethod?.n}
            </p>
            <p style={{color:B.dim,fontSize:12,marginBottom:20}}>
              Your withdrawal is being processed. Most payouts arrive within minutes.
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button className="btn-primary" onClick={resetForm} style={{padding:"12px 28px",fontSize:14}}>
                Withdraw More
              </button>
            </div>
          </div>
        </div>
      )}

      {/* My Withdrawal History */}
      <div style={{marginTop:40}}>
        <h3 style={{fontSize:17,fontWeight:700,marginBottom:14}}>Your Withdrawal History</h3>
        <div className="card" style={{overflow:"hidden"}}>
          {loadingPayouts ? (
            <div style={{padding:40,textAlign:"center",color:B.muted}}>Loading...</div>
          ) : myPayouts.length===0 ? (
            <div style={{padding:40,textAlign:"center",color:B.muted}}>
              <div style={{fontSize:32,marginBottom:8}}>📭</div>
              No withdrawals yet. Make your first cashout above!
            </div>
          ) : (
            myPayouts.map((p,i)=>(
              <div key={p.id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 20px",borderBottom:i<myPayouts.length-1?`1px solid rgba(255,255,255,.03)`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:20}}>{CASHOUTS.find(c=>c.id===p.method)?.ic||"💸"}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{CASHOUTS.find(c=>c.id===p.method)?.n||p.method}</div>
                    <div style={{fontSize:11,color:B.muted}}>{p.destination}</div>
                    <div style={{fontSize:10,color:B.dim}}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:700,color:B.ok}}>${p.usd_amount||toUSD(p.coins)}</div>
                  <div style={{fontSize:11,color:statusColors[p.status]||B.muted,fontWeight:600}}>{statusLabels[p.status]||p.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: LEADERBOARD
// ═══════════════════════════════════════════════════════════════
const Leaderboard = ({coins}) => {
  const [tf,setTf] = useState("weekly");
  return (
    <div style={{maxWidth:950,margin:"0 auto",padding:"28px 24px"}}>
      <div className="au" style={{textAlign:"center",marginBottom:28}}>
        <h1 style={{fontFamily:"'Poppins'",fontSize:26,fontWeight:800}}>Leaderboard 🏆</h1>
        <p style={{color:B.muted,fontSize:14}}>Top earners win real cash prizes every day, week, and month</p>
      </div>

      {/* Prize Pool */}
      <div className="card au" style={{padding:28,textAlign:"center",marginBottom:28,background:"linear-gradient(135deg,rgba(245,158,11,.06),rgba(239,68,68,.06))",border:"1px solid rgba(245,158,11,.15)"}}>
        <div style={{fontSize:12,color:B.gold,fontWeight:600,marginBottom:6}}>🏆 THIS WEEK'S PRIZE POOL</div>
        <div style={{fontSize:48,fontWeight:700,fontFamily:"'Poppins'",color:B.accent}}>$3,500</div>
        <div style={{fontSize:13,color:B.muted,marginTop:6}}>Top 100 earners share the pool · Resets in 4d 11h 23m</div>
        <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:16}}>
          <div><span style={{fontWeight:700,color:B.gold}}>🥇 $1,200</span></div>
          <div><span style={{fontWeight:700,color:"#94A3B8"}}>🥈 $700</span></div>
          <div><span style={{fontWeight:700,color:"#CD7F32"}}>🥉 $400</span></div>
        </div>
      </div>

      {/* Timeframe */}
      <div style={{display:"flex",gap:8,marginBottom:24,justifyContent:"center"}}>
        {[{id:"daily",l:"Daily ($500)"},{id:"weekly",l:"Weekly ($3,500)"},{id:"monthly",l:"Monthly ($10,000)"},{id:"alltime",l:"All Time"}].map(t=>(
          <button key={t.id} onClick={()=>setTf(t.id)} style={{
            padding:"9px 18px",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",
            background:tf===t.id?"rgba(1,214,118,.1)":"transparent",
            border:tf===t.id?`1px solid rgba(1,214,118,.3)`:"1px solid rgba(255,255,255,.04)",
            color:tf===t.id?B.accentL:B.muted,
          }}>{t.l}</button>
        ))}
      </div>

      {/* Podium */}
      <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:32,alignItems:"flex-end"}}>
        {[LEADERS[1],LEADERS[0],LEADERS[2]].map((u,i)=>{
          const h=[195,240,170];
          const m=["🥈","🥇","🥉"];
          const p=["$700","$1,200","$400"];
          return (
            <div key={u.r} className="card au" style={{
              width:175,height:h[i],textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:18,
              animationDelay:`${i*.12}s`,
              background:i===1?"linear-gradient(180deg,rgba(245,158,11,.08),rgba(245,158,11,.02))":B.card,
              border:i===1?"1px solid rgba(245,158,11,.2)":`1px solid ${B.border}`,
              borderRadius:"16px 16px 0 0",borderBottom:"none",
            }}>
              <div style={{fontSize:34,marginBottom:6}}>{m[i]}</div>
              <div style={{fontSize:22,marginBottom:2}}>{u.av}</div>
              <div style={{fontWeight:700,fontSize:13}}>{u.name}</div>
              <div style={{fontSize:11,color:B.muted}}>{fmt(u.coins)} 🪙</div>
              <div style={{background:B.gradHot,padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700,color:"#fff",marginTop:6}}>{p[i]}</div>
            </div>
          );
        })}
      </div>

      {/* Full List */}
      <div className="card" style={{overflow:"hidden"}}>
        {LEADERS.map((u,i)=>(
          <div key={u.r} className="au" style={{
            animationDelay:`${i*.03}s`,display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"14px 22px",borderBottom:i<9?`1px solid rgba(255,255,255,.03)`:"none",
            background:i<3?"rgba(245,158,11,.02)":"transparent",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:32,textAlign:"center",fontWeight:800,fontFamily:"'Poppins'",fontSize:15,color:i<3?B.gold:B.muted}}>
                {i<3?["🥇","🥈","🥉"][i]:`#${u.r}`}
              </div>
              <span style={{fontSize:22}}>{u.av}</span>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{u.name}</div>
                <div style={{fontSize:10,color:B.muted}}>{u.lvl} · 🔥 {u.streak}d streak</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:14,fontFamily:"'Poppins'",color:B.accentL}}>{fmt(u.coins)} 🪙</div>
              <div style={{fontSize:10,color:B.muted}}>${toUSD(u.coins)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Your Position */}
      <div className="card au" style={{marginTop:20,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(1,214,118,.06)",border:`1px solid rgba(1,214,118,.25)`}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontWeight:800,fontFamily:"'Poppins'",fontSize:15,color:B.accentL}}>#847</div>
          <div style={{width:34,height:34,borderRadius:"50%",background:B.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>A</div>
          <div>
            <div style={{fontWeight:600,fontSize:13}}>You (Andrew)</div>
            <div style={{fontSize:11,color:B.muted}}>Earn <strong style={{color:B.warnL}}>12,400 more coins</strong> to reach Top 100 and win prizes!</div>
          </div>
        </div>
        <div style={{fontWeight:700,fontFamily:"'Poppins'",color:B.accentL}}>{fmt(coins)} 🪙</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD (Role-gated — only visible to admin users)
// ═══════════════════════════════════════════════════════════════
const AdminDash = ({token}) => {
  const [tab,setTab] = useState("overview");
  const [data,setData] = useState(null);
  const [walls,setWalls] = useState([]);
  const [users,setUsers] = useState([]);
  const [payouts,setPayouts] = useState([]);
  const [fraud,setFraud] = useState({multiAccount:[],highEarners:[]});
  const [analytics,setAnalytics] = useState([]);
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);

  // Fetch real admin data from API endpoints
  useEffect(()=>{
    setLoading(true);
    const fetchAll = async () => {
      try {
        const [dashRes, wallsRes, usersRes, payoutsRes, analyticsRes, fraudRes] = await Promise.allSettled([
          apiFetch('/api/admin/dashboard'),
          apiFetch('/api/admin/offerwalls'),
          apiFetch('/api/admin/users'),
          apiFetch('/api/admin/payouts'),
          apiFetch('/api/admin/analytics'),
          apiFetch('/api/admin/fraud'),
        ]);
        if (dashRes.status === 'fulfilled') setData(dashRes.value);
        if (wallsRes.status === 'fulfilled') setWalls(wallsRes.value.walls || wallsRes.value || []);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || usersRes.value || []);
        if (payoutsRes.status === 'fulfilled') setPayouts(payoutsRes.value.payouts || payoutsRes.value || []);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.analytics || analyticsRes.value || []);
        if (fraudRes.status === 'fulfilled') setFraud(fraudRes.value || {multiAccount:[],highEarners:[]});
      } catch(e) {
        console.error('Admin fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  },[]);

  const fmtUSD = c => `$${(c/100).toLocaleString(undefined,{minimumFractionDigits:2})}`;
  const tabs = [
    {id:"overview",l:"Overview",ic:"📊"},
    {id:"offerwalls",l:"Offerwalls",ic:"🔗"},
    {id:"users",l:"Users",ic:"👥"},
    {id:"payouts",l:"Payouts",ic:"💳"},
    {id:"analytics",l:"Analytics",ic:"📈"},
    {id:"fraud",l:"Fraud",ic:"🛡️"},
  ];

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if(loading) return (
    <div style={{padding:"80px 24px",textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}} className="ap">📊</div>
      <div style={{fontSize:18,fontWeight:600,color:B.accentL}}>Loading Admin Dashboard...</div>
    </div>
  );

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px"}}>
      {/* Header */}
      <div style={{marginBottom:28}} className="au">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <span style={{fontSize:28}}>🛡️</span>
          <h1 style={{fontSize:28,fontWeight:800,fontFamily:"'Poppins'"}}>Admin Dashboard</h1>
          <span style={{fontSize:10,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",color:"#F87171",padding:"3px 10px",borderRadius:8,fontWeight:700}}>ADMIN ONLY</span>
        </div>
        <p style={{color:B.muted,fontSize:14}}>Revenue, analytics, user management, and fraud detection</p>
      </div>

      {/* Admin Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:28,flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?"rgba(1,214,118,.15)":"rgba(15,22,41,.5)",
            border:tab===t.id?`1px solid rgba(1,214,118,.4)`:`1px solid ${B.border}`,
            color:tab===t.id?B.accentL:B.muted,
            padding:"10px 18px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,
            transition:"all .15s",display:"flex",alignItems:"center",gap:6,
          }}>{t.ic} {t.l}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab==="overview"&&data&&(
        <div className="au">
          {/* Revenue Row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {l:"Revenue Today",v:fmtUSD(data.revenueToday),c:"#60A5FA",ic:"💰"},
              {l:"Revenue This Week",v:fmtUSD(data.revenueWeek),c:"#A78BFA",ic:"📊"},
              {l:"Revenue This Month",v:fmtUSD(data.revenueMonth),c:"#34D399",ic:"📈"},
              {l:"Revenue All Time",v:fmtUSD(data.revenueTotal),c:"#FBBF24",ic:"🏆"},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,color:B.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{s.l}</span>
                  <span style={{fontSize:20}}>{s.ic}</span>
                </div>
                <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Profit Row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {l:"Profit Today",v:fmtUSD(data.profitToday),c:"#10B981",ic:"✅"},
              {l:"Profit This Week",v:fmtUSD(data.profitWeek),c:"#34D399",ic:"💎"},
              {l:"Profit This Month",v:fmtUSD(data.profitMonth),c:"#10B981",ic:"📊"},
              {l:"Profit All Time",v:fmtUSD(data.profitTotal),c:"#10B981",ic:"🏅"},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,color:B.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{s.l}</span>
                  <span style={{fontSize:20}}>{s.ic}</span>
                </div>
                <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Platform Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {l:"Total Users",v:fmt(data.totalUsers),c:B.accentL,sub:`+${data.newUsersToday} today`},
              {l:"Active Today",v:fmt(data.activeToday),c:"#60A5FA",sub:`${((data.activeToday/data.totalUsers)*100).toFixed(1)}% of total`},
              {l:"Offers Completed",v:fmt(data.offersToday),c:"#FBBF24",sub:`${fmt(data.offersMonth)} this month`},
              {l:"Pending Payouts",v:data.pendingPayouts,c:"#F59E0B",sub:"Awaiting review"},
            ].map((s,i)=>(
              <div key={i} className="card" style={{padding:20}}>
                <span style={{fontSize:12,color:B.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8}}>{s.l}</span>
                <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:11,color:B.dim,marginTop:4}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Margin Indicator */}
          <div className="card" style={{padding:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:14,fontWeight:700}}>Profit Margin</span>
              <span style={{fontSize:22,fontWeight:800,color:"#10B981"}}>{data.marginPct}%</span>
            </div>
            <div style={{height:12,background:"rgba(255,255,255,.05)",borderRadius:99,overflow:"hidden"}}>
              <div className="progress-bar" style={{width:`${data.marginPct}%`,background:B.gradOk}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:B.dim}}>
              <span>Payouts: {fmtUSD(data.payoutsTotal)}</span>
              <span>Revenue: {fmtUSD(data.revenueTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ OFFERWALLS TAB ═══ */}
      {tab==="offerwalls"&&(
        <div className="au">
          <div className="card" style={{overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"rgba(1,214,118,.06)"}}>
                  {["Offerwall","Completions","Revenue","User Payouts","Profit","Margin"].map(h=>(
                    <th key={h} style={{padding:"14px 16px",textAlign:"left",fontWeight:700,color:B.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${B.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {walls.map((w,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${B.border}`}}>
                    <td style={{padding:"12px 16px",fontWeight:600,color:B.txt}}>{w.name}</td>
                    <td style={{padding:"12px 16px",color:B.muted}}>{fmt(w.completions)}</td>
                    <td style={{padding:"12px 16px",color:"#60A5FA",fontWeight:600}}>{fmtUSD(w.revenue)}</td>
                    <td style={{padding:"12px 16px",color:"#F59E0B"}}>{fmtUSD(w.payout)}</td>
                    <td style={{padding:"12px 16px",color:"#10B981",fontWeight:600}}>{fmtUSD(w.revenue-w.payout)}</td>
                    <td style={{padding:"12px 16px"}}>
                      <span style={{background:"rgba(16,185,129,.12)",color:"#34D399",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700}}>{w.margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:"rgba(16,185,129,.04)"}}>
                  <td style={{padding:"14px 16px",fontWeight:800,color:B.txt}}>TOTAL</td>
                  <td style={{padding:"14px 16px",fontWeight:700,color:B.txt}}>{fmt(walls.reduce((a,w)=>a+w.completions,0))}</td>
                  <td style={{padding:"14px 16px",fontWeight:800,color:"#60A5FA"}}>{fmtUSD(walls.reduce((a,w)=>a+w.revenue,0))}</td>
                  <td style={{padding:"14px 16px",fontWeight:700,color:"#F59E0B"}}>{fmtUSD(walls.reduce((a,w)=>a+w.payout,0))}</td>
                  <td style={{padding:"14px 16px",fontWeight:800,color:"#10B981"}}>{fmtUSD(walls.reduce((a,w)=>a+(w.revenue-w.payout),0))}</td>
                  <td style={{padding:"14px 16px"}}>
                    <span style={{background:"rgba(16,185,129,.2)",color:"#10B981",padding:"4px 12px",borderRadius:8,fontSize:13,fontWeight:800}}>
                      {(walls.reduce((a,w)=>a+(w.revenue-w.payout),0)/walls.reduce((a,w)=>a+w.revenue,0)*100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {tab==="users"&&(
        <div className="au">
          <div style={{marginBottom:16}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              style={{width:"100%",maxWidth:400,padding:"12px 18px",background:B.card,border:`1px solid ${B.border}`,borderRadius:12,color:B.txt,fontSize:14}}
            />
          </div>
          <div className="card" style={{overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"rgba(1,214,118,.06)"}}>
                  {["ID","Username","Email","Coins","Country","Joined","Last Login","Status","Actions"].map(h=>(
                    <th key={h} style={{padding:"12px 14px",textAlign:"left",fontWeight:700,color:B.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${B.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u=>(
                  <tr key={u.id} style={{borderBottom:`1px solid ${B.border}`,background:u.isBanned?"rgba(239,68,68,.04)":"transparent"}}>
                    <td style={{padding:"10px 14px",color:B.dim}}>#{u.id}</td>
                    <td style={{padding:"10px 14px",fontWeight:600}}>{u.username}</td>
                    <td style={{padding:"10px 14px",color:B.muted}}>{u.email}</td>
                    <td style={{padding:"10px 14px",color:"#FBBF24",fontWeight:600}}>{fmt(u.coins)}</td>
                    <td style={{padding:"10px 14px"}}>{u.country}</td>
                    <td style={{padding:"10px 14px",color:B.dim,fontSize:12}}>{u.created}</td>
                    <td style={{padding:"10px 14px",color:B.dim,fontSize:12}}>{u.lastLogin}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{
                        background:u.isBanned?"rgba(239,68,68,.12)":"rgba(16,185,129,.12)",
                        color:u.isBanned?"#F87171":"#34D399",
                        padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700
                      }}>{u.isBanned?"BANNED":"Active"}</span>
                    </td>
                    <td style={{padding:"10px 14px"}}>
                      <button onClick={()=>{
                        setUsers(prev=>prev.map(x=>x.id===u.id?{...x,isBanned:x.isBanned?0:1}:x));
                      }} style={{
                        background:u.isBanned?"rgba(16,185,129,.1)":"rgba(239,68,68,.1)",
                        border:`1px solid ${u.isBanned?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`,
                        color:u.isBanned?"#34D399":"#F87171",
                        padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s"
                      }}>{u.isBanned?"Unban":"Ban"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ PAYOUTS TAB ═══ */}
      {tab==="payouts"&&(
        <div className="au">
          <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:14,fontWeight:700}}>Pending Payouts</span>
            <span style={{background:"rgba(245,158,11,.12)",color:"#FBBF24",padding:"3px 12px",borderRadius:8,fontSize:12,fontWeight:700}}>{payouts.filter(p=>p.status==="pending").length} awaiting</span>
          </div>
          <div className="card" style={{overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"rgba(1,214,118,.06)"}}>
                  {["ID","User","Method","Amount","Destination","Requested","Status","Actions"].map(h=>(
                    <th key={h} style={{padding:"12px 14px",textAlign:"left",fontWeight:700,color:B.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${B.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map(p=>(
                  <tr key={p.id} style={{borderBottom:`1px solid ${B.border}`}}>
                    <td style={{padding:"10px 14px",color:B.dim}}>#{(p.id||'').toString().slice(0,8)}</td>
                    <td style={{padding:"10px 14px",fontWeight:600}}>{p.user?.username||p.username||'—'}<br/><span style={{fontSize:10,color:B.dim}}>{p.user?.email||p.email||''}</span></td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{background:"rgba(1,214,118,.08)",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:600,textTransform:"uppercase"}}>{p.method}</span>
                    </td>
                    <td style={{padding:"10px 14px",color:"#FBBF24",fontWeight:700}}>${p.usd_amount||p.usd||(p.coins/1000).toFixed(2)}</td>
                    <td style={{padding:"10px 14px",color:B.muted,fontSize:12,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.destination||'—'}</td>
                    <td style={{padding:"10px 14px",color:B.dim,fontSize:12}}>{p.created_at?new Date(p.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):p.created||'—'}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{
                        background:p.status==="pending"?"rgba(245,158,11,.12)":p.status==="completed"?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)",
                        color:p.status==="pending"?"#FBBF24":p.status==="completed"?"#34D399":"#F87171",
                        padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700,textTransform:"uppercase"
                      }}>{p.status}</span>
                    </td>
                    <td style={{padding:"10px 14px",display:"flex",gap:6}}>
                      {p.status==="pending"&&<>
                        <button onClick={async()=>{
                          try{
                            await apiFetch('/api/admin/payouts',{method:'PATCH',body:JSON.stringify({payoutId:p.id,action:'approve'})});
                            setPayouts(prev=>prev.map(x=>x.id===p.id?{...x,status:"completed"}:x));
                          }catch(e){alert('Failed to approve');}
                        }} style={{
                          background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",color:"#34D399",
                          padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"
                        }}>Approve</button>
                        <button onClick={async()=>{
                          try{
                            await apiFetch('/api/admin/payouts',{method:'PATCH',body:JSON.stringify({payoutId:p.id,action:'reject',note:'Rejected by admin'})});
                            setPayouts(prev=>prev.map(x=>x.id===p.id?{...x,status:"rejected"}:x));
                          }catch(e){alert('Failed to reject');}
                        }} style={{
                          background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",color:"#F87171",
                          padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"
                        }}>Reject</button>
                      </>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {tab==="analytics"&&(
        <div className="au">
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:20}}>
            {/* Revenue Chart (Bar-style visualization) */}
            <div className="card" style={{padding:24}}>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:20}}>Daily Revenue & Profit (Last 8 Days)</h3>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:200,padding:"0 8px"}}>
                {analytics.map((d,i)=>{
                  const maxRev = Math.max(...analytics.map(x=>x.revenue));
                  const revH = (d.revenue/maxRev)*180;
                  const profH = (d.profit/maxRev)*180;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontSize:10,color:"#10B981",fontWeight:700}}>{fmtUSD(d.profit)}</div>
                      <div style={{display:"flex",gap:3,alignItems:"flex-end",height:180}}>
                        <div style={{width:"45%",height:revH,background:"rgba(96,165,250,.25)",borderRadius:"4px 4px 0 0",border:"1px solid rgba(96,165,250,.4)",minWidth:14}} title={`Revenue: ${fmtUSD(d.revenue)}`}/>
                        <div style={{width:"45%",height:profH,background:"rgba(16,185,129,.3)",borderRadius:"4px 4px 0 0",border:"1px solid rgba(16,185,129,.5)",minWidth:14}} title={`Profit: ${fmtUSD(d.profit)}`}/>
                      </div>
                      <div style={{fontSize:10,color:B.dim,marginTop:4}}>{d.date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:20,justifyContent:"center",marginTop:16,fontSize:12}}>
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:12,height:12,borderRadius:3,background:"rgba(96,165,250,.4)"}}/>
                  <span style={{color:B.muted}}>Revenue</span>
                </span>
                <span style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:12,height:12,borderRadius:3,background:"rgba(16,185,129,.5)"}}/>
                  <span style={{color:B.muted}}>Profit</span>
                </span>
              </div>
            </div>

            {/* Signups Chart */}
            <div className="card" style={{padding:24}}>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:20}}>Daily New Signups</h3>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,padding:"0 8px"}}>
                {analytics.map((d,i)=>{
                  const maxU = Math.max(...analytics.map(x=>x.newUsers));
                  const h = (d.newUsers/maxU)*120;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{fontSize:11,color:B.accentL,fontWeight:700}}>{d.newUsers}</div>
                      <div style={{width:"60%",height:h,background:"rgba(1,214,118,.25)",borderRadius:"4px 4px 0 0",border:"1px solid rgba(1,214,118,.4)",minWidth:18}}/>
                      <div style={{fontSize:10,color:B.dim,marginTop:4}}>{d.date.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FRAUD TAB ═══ */}
      {tab==="fraud"&&(
        <div className="au">
          {/* Multi-Account Detection */}
          <div style={{marginBottom:24}}>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>🚨</span> Multi-Account Detection (Same IP)
            </h3>
            {fraud.multiAccount.length===0?(
              <div className="card" style={{padding:24,textAlign:"center",color:B.dim}}>No suspicious multi-account activity detected</div>
            ):(
              <div style={{display:"grid",gap:12}}>
                {fraud.multiAccount.map((f,i)=>(
                  <div key={i} className="card" style={{padding:16,borderColor:"rgba(239,68,68,.25)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontWeight:700,color:"#F87171"}}>IP: {f.ip}</span>
                      <span style={{background:"rgba(239,68,68,.12)",color:"#F87171",padding:"3px 12px",borderRadius:8,fontSize:12,fontWeight:700}}>{f.count} accounts</span>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {f.users.map(u=>(
                        <span key={u} style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.15)",padding:"4px 12px",borderRadius:8,fontSize:12,fontWeight:600,color:B.muted}}>{u}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High Earner Alerts */}
          <div>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>⚠️</span> Unusually High Earners (24h)
            </h3>
            {fraud.highEarners.length===0?(
              <div className="card" style={{padding:24,textAlign:"center",color:B.dim}}>No unusually high earners detected</div>
            ):(
              <div style={{display:"grid",gap:12}}>
                {fraud.highEarners.map((h,i)=>(
                  <div key={i} className="card" style={{padding:16,borderColor:"rgba(245,158,11,.25)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <span style={{fontWeight:700,fontSize:15}}>{h.username}</span>
                        <div style={{fontSize:12,color:B.dim,marginTop:2}}>Earned {fmt(h.coins24h)} coins in 24h (avg: {fmt(h.avgCoins24h)})</div>
                      </div>
                      <span style={{background:"rgba(245,158,11,.12)",color:"#FBBF24",padding:"5px 14px",borderRadius:8,fontSize:13,fontWeight:700}}>{h.ratio}x above average</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FOOTER ───
const Footer = () => (
  <footer style={{padding:"48px 32px 24px",borderTop:`2px solid ${B.border}`,maxWidth:1200,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:6,background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#000",fontWeight:900}}>$</div>
        <span style={{fontSize:18,fontFamily:"'Poppins'",fontWeight:800}}><span style={{color:B.accent}}>POCKET</span>LINED</span>
      </div>
      <div style={{display:"flex",gap:20,fontSize:13,color:B.muted}}>
        {["About","FAQ","Blog","Terms","Privacy","Contact"].map(l=>(
          <span key={l} style={{cursor:"pointer",transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color="#fff"}
            onMouseLeave={e=>e.currentTarget.style.color=B.muted}>{l}</span>
        ))}
      </div>
    </div>
    <div style={{borderTop:`1px solid ${B.border}`,paddingTop:16,fontSize:12,color:B.dim,textAlign:"center"}}>
      © 2026 PocketLined. All earnings come from advertiser-funded offers. PocketLined never charges users.
    </div>
  </footer>
);

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [pg,setPg] = useState("home");
  const [toasts,setToasts] = useState([]);
  const [showAuth,setShowAuth] = useState(false);

  // ─── Auth State ───
  const [user,setUser] = useState(null);
  const [token,setToken] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);

  // ─── User stats (real from API when logged in, demo when not) ───
  const coins = user ? (user.coins || 0) : 24800;
  const streak = user ? (user.streak || 0) : 5;
  const role = user ? (user.role || 'member') : 'member';
  const today = user ? (user.todayEarned || 0) : 4200;
  const week = user ? (user.weekEarned || 0) : 18600;

  // ─── Load persisted auth on mount ───
  useEffect(() => {
    const savedToken = localStorage.getItem('cf_token');
    if (savedToken) {
      setToken(savedToken);
      apiFetch('/api/me').then(data => {
        setUser(data.user || data);
        setAuthLoading(false);
      }).catch(() => {
        localStorage.removeItem('cf_token');
        setToken(null);
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ─── Refresh user data from API ───
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch('/api/me');
      setUser(data.user || data);
    } catch(e) { /* silent */ }
  }, []);

  const toast = useCallback((msg,type="ok")=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  },[]);

  const earn = useCallback(c=>{
    if(!c) return;
    // Optimistic local update, then refresh from server
    setUser(prev => prev ? {...prev, coins: (prev.coins||0) + c} : prev);
    toast(`+${fmt(c)} coins ($${toUSD(c)}) earned! 🎉`,"coin");
    refreshUser();
  },[toast, refreshUser]);

  const handleCashout = useCallback(coinCost=>{
    // Optimistic debit, then refresh from server
    setUser(prev => prev ? {...prev, coins: Math.max(0,(prev.coins||0) - coinCost)} : prev);
    toast(`Withdrawal submitted! -${fmt(coinCost)} coins`,"ok");
    refreshUser();
  },[toast, refreshUser]);

  const handleAuth = useCallback((userData, tkn) => {
    setUser(userData);
    setToken(tkn);
    setShowAuth(false);
    setPg("dash");
    toast(`Welcome${userData.username ? ', ' + userData.username : ''}! 🎉`);
    // Fetch full profile to get all fields
    apiFetch('/api/me').then(data => setUser(data.user || data)).catch(() => {});
  }, [toast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('cf_token');
    setUser(null);
    setToken(null);
    setPg("home");
    toast("Logged out successfully");
  }, [toast]);

  // Scroll to top on page change
  useEffect(()=>window.scrollTo({top:0,behavior:"smooth"}),[pg]);

  // Redirect protected pages to auth
  const requireAuth = (page) => {
    if (!user) { setShowAuth(true); return false; }
    return true;
  };

  const navTo = useCallback((page) => {
    const protectedPages = ["dash","profile","rewards","admin"];
    if (protectedPages.includes(page) && !user) {
      setShowAuth(true);
      return;
    }
    setPg(page);
  }, [user]);

  return (
    <div style={{minHeight:"100vh",background:B.bg,color:B.txt}}>
      <style>{css}</style>

      {/* Auth Modal */}
      {showAuth && <AuthModal onAuth={handleAuth} onClose={()=>setShowAuth(false)} />}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t=>(
          <div key={t.id} className="toast" style={{
            background:t.type==="coin"?"rgba(1,214,118,.9)":t.type==="ok"?"rgba(1,214,118,.9)":"rgba(239,68,68,.9)",
            color:"#fff",
          }}>{t.msg}</div>
        ))}
      </div>

      <LiveTicker/>
      <Nav pg={pg} setPg={navTo} coins={coins} streak={streak} role={role} user={user} onLogin={()=>setShowAuth(true)} onLogout={handleLogout}/>

      <main style={{minHeight:"80vh"}}>
        {pg==="home"&&<Home setPg={navTo} user={user} onLogin={()=>setShowAuth(true)}/>}
        {pg==="dash"&&user&&<Dash coins={coins} streak={streak} today={today} week={week} setPg={navTo} onEarn={earn} user={user}/>}
        {pg==="earn"&&<Earn onEarn={earn} user={user}/>}
        {pg==="profile"&&user&&<Profile coins={coins} streak={streak} today={today} week={week} user={user}/>}
        {pg==="rewards"&&user&&<Rewards coins={coins} onCashout={handleCashout} user={user}/>}
        {pg==="leaderboard"&&<Leaderboard coins={coins}/>}
        {pg==="admin"&&role==="admin"&&user&&<AdminDash token={token}/>}
      </main>

      <Footer/>
    </div>
  );
}
