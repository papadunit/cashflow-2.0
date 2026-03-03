"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
//  CASHFLOW 2.0 — The Ultimate GPT Rewards Platform
// ═══════════════════════════════════════════════════════════════
//  BUSINESS MODEL: 100% funded by offerwall revenue share.
//  You earn 20-40% of every CPA/CPI the advertiser pays.
//  Users get rewarded from that cut. Zero out-of-pocket cost.
//
//  PSYCHOLOGY: Variable-ratio reinforcement, loss aversion,
//  endowed progress, social proof, commitment escalation,
//  near-miss effects, reciprocity, and FOMO triggers.
// ═══════════════════════════════════════════════════════════════

// ─── BRAND TOKENS ───
const B = {
  accent: "#7C3AED", accentL: "#A78BFA", accentD: "#6D28D9",
  ok: "#10B981", okL: "#34D399",
  warn: "#F59E0B", warnL: "#FBBF24",
  hot: "#EF4444", hotL: "#F87171",
  gold: "#F59E0B",
  bg: "#030712", card: "#0F1629", surface: "#1A2035",
  border: "rgba(124,58,237,.18)",
  txt: "#F1F5F9", muted: "#94A3B8", dim: "#475569",
  grad: "linear-gradient(135deg,#7C3AED 0%,#A78BFA 40%,#60A5FA 100%)",
  gradHot: "linear-gradient(135deg,#EF4444 0%,#F59E0B 100%)",
  gradOk: "linear-gradient(135deg,#10B981 0%,#34D399 100%)",
  gradGold: "linear-gradient(135deg,#F59E0B 0%,#FBBF24 50%,#FDE68A 100%)",
  glass: "rgba(15,22,41,.85)",
};

// ─── LEVELS (Commitment Escalation) ───
const LEVELS = [
  { n:"Starter",    min:0,      icon:"🌱", c:"#94A3B8", bonus:0,  next:1000 },
  { n:"Explorer",   min:1000,   icon:"🔍", c:"#60A5FA", bonus:2,  next:5000 },
  { n:"Earner",     min:5000,   icon:"💰", c:"#34D399", bonus:5,  next:15000 },
  { n:"Hustler",    min:15000,  icon:"🔥", c:"#F59E0B", bonus:8,  next:40000 },
  { n:"Pro",        min:40000,  icon:"⚡", c:"#A78BFA", bonus:12, next:100000 },
  { n:"Elite",      min:100000, icon:"💎", c:"#FBBF24", bonus:15, next:300000 },
  { n:"Legend",     min:300000, icon:"👑", c:"#EF4444", bonus:20, next:750000 },
  { n:"Titan",      min:750000, icon:"🏆", c:"#7C3AED", bonus:25, next:null },
];

// ─── OFFERWALL PROVIDERS (Admin-only data — never rendered to users) ───
// Revenue shares are confidential. Only provider names appear on offer cards.
const OFFERWALLS_ADMIN = [
  "AdGate Media","AdGem","OfferToro","Lootably","Ayet Studios",
  "Revenue Universe","CPX Research","BitLabs","TheoremReach",
  "Pollfish","TyrAds","Torox",
];

// ─── EARN CATEGORIES ───
const CATS = [
  { id:"featured", n:"⭐ Featured",    d:"Hand-picked highest value", c:"#F59E0B" },
  { id:"surveys",  n:"📋 Surveys",     d:"Quick opinions, quick cash", c:"#60A5FA" },
  { id:"games",    n:"🎮 Games",       d:"Play games, earn big",       c:"#A78BFA" },
  { id:"apps",     n:"📱 Apps & Signups",d:"Try apps, earn instantly",  c:"#34D399" },
  { id:"videos",   n:"🎬 Watch",       d:"Watch & earn passively",     c:"#FBBF24" },
  { id:"shopping", n:"🛒 Cashback",    d:"Shop and earn back",         c:"#F87171" },
  { id:"tasks",    n:"✅ Micro Tasks",  d:"Tiny tasks, instant pay",   c:"#FB923C" },
  { id:"crypto",   n:"₿ Crypto",       d:"Crypto rewards & staking",  c:"#8B5CF6" },
  { id:"referrals",n:"👥 Referrals",   d:"Earn from your network",    c:"#EC4899" },
  { id:"search",   n:"🔍 Search",      d:"Earn while you browse",     c:"#06B6D4" },
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
  { id:18, t:"Refer a Friend",                     cat:"referrals",coins:10000, time:"1 min",   diff:"Easy",   img:"🤝", wall:"CashFlow",          pop:94, rate:100,hot:true },
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
  { id:"paypal",  n:"PayPal",        ic:"💳", min:1000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"venmo",   n:"Venmo",         ic:"📲", min:1000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"cashapp", n:"Cash App",      ic:"💵", min:1000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"btc",     n:"Bitcoin",       ic:"₿",  min:2000,  fee:"0%", spd:"~5 min",    pop:true },
  { id:"eth",     n:"Ethereum",      ic:"⟠",  min:2000,  fee:"0%", spd:"~3 min",    pop:false },
  { id:"usdt",    n:"USDT",          ic:"💲", min:2000,  fee:"0%", spd:"~3 min",    pop:false },
  { id:"amazon",  n:"Amazon",        ic:"📦", min:1000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"visa",    n:"Visa Prepaid",  ic:"💳", min:5000,  fee:"1%", spd:"1-2 days",  pop:false },
  { id:"steam",   n:"Steam",         ic:"🎮", min:1000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"apple",   n:"Apple",         ic:"🍎", min:1000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"google",  n:"Google Play",   ic:"▶️",  min:1000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"walmart", n:"Walmart",       ic:"🏬", min:1000,  fee:"0%", spd:"Instant",   pop:false },
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,sans-serif;background:${B.bg};color:${B.txt};overflow-x:hidden;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:${B.bg}}
::-webkit-scrollbar-thumb{background:${B.accent};border-radius:3px}
::selection{background:rgba(124,58,237,.3)}

@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,.25)}50%{box-shadow:0 0 40px rgba(124,58,237,.5)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes streak{0%,100%{text-shadow:0 0 8px #EF4444,0 0 16px #F59E0B}50%{text-shadow:0 0 16px #EF4444,0 0 32px #F59E0B,0 0 48px #EF4444}}
@keyframes coin{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-50px) scale(1.8)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes countPulse{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes ripple{0%{transform:scale(0);opacity:.6}100%{transform:scale(4);opacity:0}}
@keyframes spinWheel{0%{transform:rotate(0)}100%{transform:rotate(1800deg)}}
@keyframes bounceIn{0%{transform:scale(0)}50%{transform:scale(1.15)}100%{transform:scale(1)}}

.au{animation:fadeUp .5s ease-out both}
.af{animation:fadeIn .3s ease-out both}
.asr{animation:slideR .4s ease-out both}
.ap{animation:pulse 2s ease-in-out infinite}
.ag{animation:glow 2.5s ease-in-out infinite}
.afl{animation:float 4s ease-in-out infinite}
.astreak{animation:streak 1.5s ease-in-out infinite}
.abounce{animation:bounceIn .4s ease-out both}

.btn-primary{
  background:${B.grad};border:none;color:#fff;padding:14px 32px;border-radius:14px;
  font-weight:700;font-size:16px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(124,58,237,.35)}
.btn-primary:active{transform:translateY(0)}

.btn-ghost{
  background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.25);color:${B.accentL};
  padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;transition:all .2s;
}
.btn-ghost:hover{background:rgba(124,58,237,.15);border-color:rgba(124,58,237,.4)}

.card{
  background:${B.card};border:1px solid ${B.border};border-radius:16px;
  transition:all .25s;position:relative;overflow:hidden;
}
.card:hover{border-color:rgba(124,58,237,.35);box-shadow:0 8px 32px rgba(0,0,0,.3)}

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

input:focus,select:focus{outline:none;border-color:rgba(124,58,237,.5);box-shadow:0 0 0 3px rgba(124,58,237,.15)}
`;

// ═══════════════════════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════════════════════

// ─── LIVE TICKER (Social Proof) ───
const LiveTicker = () => {
  const [i,setI] = useState(0);
  useEffect(()=>{ const t=setInterval(()=>setI(p=>(p+1)%FEED.length),3500); return ()=>clearInterval(t); },[]);
  return (
    <div style={{background:"rgba(16,185,129,.06)",borderBottom:"1px solid rgba(16,185,129,.15)",padding:"7px 20px",fontSize:"13px",color:B.okL,textAlign:"center",overflow:"hidden"}}>
      <span className="af" key={i}>🟢 LIVE — {FEED[i]}</span>
    </div>
  );
};

// ─── NAVBAR ───
const Nav = ({pg,setPg,coins,streak,role}) => {
  const lv = getLevel(coins);
  const items = [
    {id:"home",l:"Home",ic:"🏠"},
    {id:"dash",l:"Dashboard",ic:"📊"},
    {id:"earn",l:"Earn",ic:"💰"},
    {id:"profile",l:"Profile",ic:"👤"},
    {id:"rewards",l:"Rewards",ic:"🎁"},
    {id:"leaderboard",l:"Leaderboard",ic:"🏆"},
    ...(role==="admin"?[{id:"admin",l:"Admin",ic:"🛡️"}]:[]),
  ];
  return (
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 24px",background:B.glass,backdropFilter:"blur(24px)",borderBottom:`1px solid ${B.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setPg("home")}>
        <div style={{width:36,height:36,borderRadius:10,background:B.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#fff"}}>C</div>
        <span style={{fontSize:22,fontFamily:"'Space Grotesk'",fontWeight:800,background:B.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CashFlow</span>
        <span style={{fontSize:9,background:B.gradHot,padding:"2px 8px",borderRadius:8,color:"#fff",fontWeight:800}}>2.0</span>
      </div>
      <div style={{display:"flex",gap:2}}>
        {items.map(x=>(
          <button key={x.id} onClick={()=>setPg(x.id)} style={{
            background:pg===x.id?(x.id==="admin"?"rgba(239,68,68,.12)":"rgba(124,58,237,.12)"):(x.id==="admin"?"rgba(239,68,68,.04)":"transparent"),
            border:pg===x.id?(x.id==="admin"?"1px solid rgba(239,68,68,.3)":"1px solid rgba(124,58,237,.3)"):"1px solid transparent",
            color:pg===x.id?(x.id==="admin"?"#F87171":B.accentL):B.muted,
            padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:x.id==="admin"?700:500,
            transition:"all .15s",display:"flex",alignItems:"center",gap:5,
          }}>{x.ic} {x.l}</button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        {streak>0&&<div className="chip" style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",color:"#F87171"}}>
          <span className="astreak">🔥</span><b>{streak}</b>
        </div>}
        <div className="chip" style={{background:"rgba(124,58,237,.1)",border:`1px solid ${B.border}`,color:B.accentL,cursor:"pointer",fontSize:14}} onClick={()=>setPg("dash")}>
          {lv.icon} <b>{fmt(coins)}</b> 🪙
        </div>
        <div style={{width:34,height:34,borderRadius:"50%",background:B.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,cursor:"pointer",border:`2px solid ${lv.c}`}}>A</div>
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
    <div style={{fontSize:24,fontWeight:800,fontFamily:"'Space Grotesk'"}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:B.muted,marginTop:4}}>{sub}</div>}
  </div>
);

// ─── OFFER CARD ───
const OfferCard = ({o,onEarn,delay=0}) => (
  <div className="card au" style={{padding:18,display:"flex",gap:14,cursor:"pointer",animationDelay:`${delay}s`}}
    onClick={()=>onEarn(o.coins)}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,.4)"}}
    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
  >
    {o.hot&&<div style={{position:"absolute",top:10,right:10,background:B.gradHot,padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:800,color:"#fff"}}>🔥 HOT</div>}
    <div style={{width:56,height:56,borderRadius:14,background:"rgba(124,58,237,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>{o.img}</div>
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
        <div style={{background:B.grad,padding:"5px 12px",borderRadius:8,fontSize:13,fontWeight:700,color:"#fff",marginLeft:12,whiteSpace:"nowrap"}}>
          {o.cashback?o.cashback:`$${toUSD(o.coins)}`}
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  PAGE: HOME / LANDING
// ═══════════════════════════════════════════════════════════════
const Home = ({setPg}) => {
  const [paid,setPaid] = useState(12_438_920);
  const [online,setOnline] = useState(8_412);
  useEffect(()=>{
    const t=setInterval(()=>{
      setPaid(p=>p+Math.floor(Math.random()*80+20));
      setOnline(p=>p+Math.floor(Math.random()*12-5));
    },2500);
    return ()=>clearInterval(t);
  },[]);

  return (
    <div>
      {/* ─── HERO ─── */}
      <section style={{minHeight:"92vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"60px 24px",position:"relative",overflow:"hidden"}}>
        {/* BG effects */}
        <div style={{position:"absolute",top:"-25%",left:"50%",transform:"translateX(-50%)",width:900,height:900,background:"radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className="afl" style={{position:"absolute",top:"8%",right:"8%",width:350,height:350,background:"radial-gradient(circle,rgba(96,165,250,.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className="afl" style={{position:"absolute",bottom:"10%",left:"5%",width:250,height:250,background:"radial-gradient(circle,rgba(16,185,129,.06) 0%,transparent 70%)",pointerEvents:"none",animationDelay:"2s"}}/>

        <div className="au" style={{position:"relative",zIndex:1,maxWidth:850}}>
          {/* Live badge */}
          <div className="chip" style={{background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.25)",color:B.ok,marginBottom:28}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:B.ok,display:"inline-block"}} className="ap"/>
            {online.toLocaleString()} people earning right now
          </div>

          <h1 style={{fontFamily:"'Space Grotesk'",fontSize:"clamp(38px,5.5vw,68px)",fontWeight:900,lineHeight:1.08,marginBottom:24}}>
            <span>Turn Your Time Into </span>
            <span style={{background:B.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Real Money</span>
          </h1>

          <p style={{fontSize:19,color:B.muted,lineHeight:1.65,marginBottom:20,maxWidth:620,margin:"0 auto 20px"}}>
            Complete surveys, play games, try apps, watch videos, and more.
            Cash out instantly to PayPal, Venmo, Cash App, crypto, or gift cards.
            <strong style={{color:B.txt}}> No investment needed. Ever.</strong>
          </p>

          {/* Trust Stats */}
          <div style={{display:"flex",justifyContent:"center",gap:40,marginBottom:36,flexWrap:"wrap"}}>
            {[
              {v:`$${(paid/1e6).toFixed(1)}M+`,l:"Paid to Users",c:B.gradOk},
              {v:"4.8 ★",l:"Trustpilot Rating",c:B.gradGold},
              {v:"380K+",l:"Active Earners",c:B.grad},
              {v:"<60s",l:"Avg Payout Time",c:B.gradHot},
            ].map((s,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:30,fontWeight:900,fontFamily:"'Space Grotesk'",background:s.c,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{s.v}</div>
                <div style={{fontSize:11,color:B.muted,marginTop:2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn-primary ag" onClick={()=>setPg("earn")} style={{fontSize:18,padding:"16px 40px"}}>
              Start Earning Free — Get 500 Bonus Coins 🎁
            </button>
            <button className="btn-ghost" onClick={()=>setPg("leaderboard")} style={{fontSize:16,padding:"16px 28px"}}>
              See Top Earners →
            </button>
          </div>

          {/* Endowed Progress */}
          <p style={{marginTop:20,fontSize:13,color:B.dim}}>
            ⚡ Your 500 bonus coins ($0.50) = <strong style={{color:B.ok}}>50% to first cashout!</strong> Lowest minimum on any GPT site.
          </p>
        </div>
      </section>

      {/* ─── VIDEO PROOF SECTION ─── */}
      <section style={{padding:"80px 24px",maxWidth:1000,margin:"0 auto"}}>
        <h2 style={{fontFamily:"'Space Grotesk'",fontSize:34,fontWeight:800,textAlign:"center",marginBottom:12}}>
          See It In <span style={{color:B.accentL}}>Action</span>
        </h2>
        <p style={{textAlign:"center",color:B.muted,marginBottom:40,fontSize:16}}>Real earnings, real withdrawals — watch the proof</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          {/* TODO: Replace ytId values below with your real YouTube video IDs */}
          {[
            {title:"How CashFlow Works — Full Walkthrough",ytId:"ScMzIvxBSi4",channel:"CashFlow Official"},
            {title:"$500/Month Earnings Breakdown — Real Results",ytId:"ScMzIvxBSi4",channel:"CashFlow Official"},
          ].map((v,i)=>(
            <div key={i} className="card au" style={{animationDelay:`${i*.15}s`,overflow:"hidden"}}>
              <div style={{position:"relative",paddingTop:"56.25%",background:"#000",borderRadius:"16px 16px 0 0",overflow:"hidden"}}>
                <iframe
                  src={`https://www.youtube.com/embed/${v.ytId}?rel=0&modestbranding=1`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}}
                />
              </div>
              <div style={{padding:16}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{v.title}</div>
                <div style={{fontSize:12,color:B.muted}}>{v.channel}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center",color:B.dim,fontSize:12,marginTop:20}}>
          Results vary by location, time invested, and offers available. These videos represent real user experiences.
        </p>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{padding:"80px 24px",background:"linear-gradient(180deg,transparent,rgba(124,58,237,.03),transparent)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Space Grotesk'",fontSize:34,fontWeight:800,textAlign:"center",marginBottom:48}}>
            3 Steps to <span style={{color:B.okL}}>Real Money</span>
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
            {[
              {s:"01",ic:"🎯",t:"Pick a Task",d:"Choose from thousands of offers. Surveys, games, apps, videos, shopping cashback — there's something for every interest and schedule."},
              {s:"02",ic:"✅",t:"Complete It",d:"Follow simple instructions and earn coins. Track progress in real-time. Get bonus multipliers as you level up."},
              {s:"03",ic:"💸",t:"Cash Out Instantly",d:"Withdraw to PayPal, Venmo, Cash App, crypto, or 15+ gift cards. Most payouts arrive in under 60 seconds. $1 minimum."},
            ].map((x,i)=>(
              <div key={i} className="card au" style={{padding:28,textAlign:"center",animationDelay:`${i*.12}s`}}>
                <div style={{position:"absolute",top:-8,right:-8,fontSize:72,fontWeight:900,fontFamily:"'Space Grotesk'",color:"rgba(124,58,237,.05)"}}>{x.s}</div>
                <div style={{fontSize:44,marginBottom:14}}>{x.ic}</div>
                <h3 style={{fontSize:18,fontWeight:700,marginBottom:10}}>{x.t}</h3>
                <p style={{color:B.muted,fontSize:14,lineHeight:1.6}}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY WE PAY MORE ─── */}
      <section style={{padding:"80px 24px",maxWidth:1000,margin:"0 auto"}}>
        <h2 style={{fontFamily:"'Space Grotesk'",fontSize:34,fontWeight:800,textAlign:"center",marginBottom:12}}>
          Why <span style={{color:B.accentL}}>CashFlow</span> Pays More
        </h2>
        <p style={{textAlign:"center",color:B.muted,marginBottom:48,maxWidth:600,margin:"0 auto 48px"}}>
          We partner with more offer providers than anyone else, which means
          more choices and higher payouts for you.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
          {[
            {ic:"🏦",t:"All Offers Available",d:"We source the highest-paying offers from more providers than any other platform. More offers means more opportunities and better payouts for you."},
            {ic:"💰",t:"Highest Payouts Guaranteed",d:"We take a smaller cut than competitors. If you find the same offer paying more elsewhere, we match it + 10% bonus."},
            {ic:"⚡",t:"$1 Minimum, Instant Payout",d:"While others make you wait to $5 or $30, cash out at just $1. Most withdrawals process in under 60 seconds."},
            {ic:"🔥",t:"Up to 25% Level Bonus",d:"The more you earn, the higher your level. Titan-level users get 25% bonus on every single offer. No other GPT site does this."},
            {ic:"🛒",t:"Shopping Cashback",d:"Earn cashback at 7,000+ stores including Amazon, Walmart, Target. Stack with store sales and coupons."},
            {ic:"🔍",t:"Search & Earn",d:"Use our search engine and earn coins for every search. Browse the web like normal, get paid for it."},
          ].map((x,i)=>(
            <div key={i} className="card au" style={{padding:22,display:"flex",gap:16,animationDelay:`${i*.06}s`}}>
              <div style={{fontSize:28,flexShrink:0,marginTop:2}}>{x.ic}</div>
              <div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{x.t}</div>
                <div style={{fontSize:13,color:B.muted,lineHeight:1.6}}>{x.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── REALISTIC EARNINGS SECTION ─── */}
      <section style={{padding:"80px 24px",maxWidth:1000,margin:"0 auto"}}>
        <h2 style={{fontFamily:"'Space Grotesk'",fontSize:34,fontWeight:800,textAlign:"center",marginBottom:12}}>
          What Can You <span style={{color:B.okL}}>Realistically Earn</span>?
        </h2>
        <p style={{textAlign:"center",color:B.muted,marginBottom:40,maxWidth:600,margin:"0 auto 40px"}}>
          We believe in transparency. Here's what our users actually earn based on time invested.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
          {[
            {tier:"Casual",time:"30 min/day",range:"$50 – $150/mo",desc:"Complete a few surveys and easy app offers during downtime. Great for covering a subscription or two.",color:B.ok,ic:"☕"},
            {tier:"Consistent",time:"1–2 hrs/day",range:"$200 – $500/mo",desc:"Focus on high-value game offers and app signups. Many users cover a car payment or groceries at this level.",color:B.warn,ic:"💪"},
            {tier:"Dedicated",time:"3–5 hrs/day",range:"$500 – $1,200+/mo",desc:"Treat it like a part-time job. Stack game offers, surveys, referrals, and cashback. Top earners hit four figures monthly.",color:B.accentL,ic:"🚀"},
          ].map((e,i)=>(
            <div key={i} className="card au" style={{padding:24,textAlign:"center",animationDelay:`${i*.12}s`}}>
              <div style={{fontSize:36,marginBottom:12}}>{e.ic}</div>
              <div style={{fontSize:13,color:e.color,fontWeight:700,marginBottom:4}}>{e.tier}</div>
              <div style={{fontSize:28,fontWeight:900,fontFamily:"'Space Grotesk'",marginBottom:4,color:B.txt}}>{e.range}</div>
              <div style={{fontSize:12,color:B.dim,marginBottom:12}}>{e.time}</div>
              <p style={{fontSize:13,color:B.muted,lineHeight:1.6}}>{e.desc}</p>
            </div>
          ))}
        </div>
        <p style={{textAlign:"center",color:B.dim,fontSize:12,marginTop:24,maxWidth:600,margin:"24px auto 0"}}>
          Earnings vary by location, offer availability, and effort. These ranges are based on aggregated user data. Past performance doesn't guarantee future results.
        </p>
      </section>

      {/* ─── TRENDING OFFERS PREVIEW ─── */}
      <section style={{padding:"80px 24px",background:"linear-gradient(180deg,transparent,rgba(239,68,68,.02),transparent)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Space Grotesk'",fontSize:34,fontWeight:800,textAlign:"center",marginBottom:12}}>
            Trending <span style={{color:"#F87171"}}>Right Now</span> 🔥
          </h2>
          <p style={{textAlign:"center",color:B.muted,marginBottom:40}}>Top-paying offers our users are completing today</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {OFFERS.filter(o=>o.hot).slice(0,6).map((o,i)=>(
              <div key={o.id} className="card au" style={{padding:18,cursor:"pointer",animationDelay:`${i*.08}s`}}
                onClick={()=>setPg("earn")}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)"}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"}}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:10}}>
                  <span style={{fontSize:30}}>{o.img}</span>
                  <span style={{background:B.grad,padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:700,color:"#fff"}}>
                    ${toUSD(o.coins)}
                  </span>
                </div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6,lineHeight:1.3}}>{o.t}</div>
                <div style={{display:"flex",gap:10,fontSize:11,color:B.muted}}>
                  <span>⏱ {o.time}</span>
                  <span style={{color:B.ok}}>🟢 {o.diff}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:36}}>
            <button className="btn-ghost" onClick={()=>setPg("earn")} style={{fontSize:16}}>View All All Offers →</button>
          </div>
        </div>
      </section>

      {/* ─── LIVE CASHOUTS (Social Proof Marquee) ─── */}
      <section style={{padding:"60px 0",overflow:"hidden"}}>
        <h2 style={{fontFamily:"'Space Grotesk'",fontSize:28,fontWeight:800,textAlign:"center",marginBottom:32}}>
          Real People, <span style={{color:B.okL}}>Real Payouts</span> — Live
        </h2>
        <div style={{overflow:"hidden",position:"relative"}}>
          <div className="marquee-track">
            {[...Array(2)].map((_,dup)=>(
              [
                {u:"Jake T.",a:"$52.00",m:"PayPal",t:"Just now"},
                {u:"Maria S.",a:"$18.50",m:"Bitcoin",t:"1 min ago"},
                {u:"Alex K.",a:"$25.00",m:"Cash App",t:"3 min ago"},
                {u:"Sarah L.",a:"$55.00",m:"Venmo",t:"5 min ago"},
                {u:"Tom R.",a:"$12.80",m:"Amazon",t:"7 min ago"},
                {u:"Jenny C.",a:"$38.00",m:"PayPal",t:"9 min ago"},
                {u:"Rob M.",a:"$95.00",m:"Bitcoin",t:"12 min ago"},
                {u:"Lisa P.",a:"$8.50",m:"Steam",t:"15 min ago"},
              ].map((c,i)=>(
                <div key={`${dup}-${i}`} style={{
                  minWidth:220,padding:"14px 20px",margin:"0 8px",background:B.card,borderRadius:14,
                  border:`1px solid rgba(16,185,129,.12)`,textAlign:"center",flexShrink:0,
                }}>
                  <div style={{fontSize:22,fontWeight:800,color:B.ok,fontFamily:"'Space Grotesk'"}}>{c.a}</div>
                  <div style={{fontSize:13,fontWeight:600,marginTop:2}}>{c.u}</div>
                  <div style={{fontSize:11,color:B.muted,marginTop:2}}>{c.m} · {c.t}</div>
                </div>
              ))
            ))}
          </div>
        </div>
      </section>

      {/* ─── PAYOUT METHODS ─── */}
      <section style={{padding:"80px 24px",maxWidth:1000,margin:"0 auto",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Space Grotesk'",fontSize:34,fontWeight:800,marginBottom:12}}>
          Instant Payouts, <span style={{color:B.accentL}}>Your Way</span>
        </h2>
        <p style={{color:B.muted,marginBottom:40}}>12+ cashout methods. $1 minimum. Most process in under 60 seconds.</p>
        <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
          {CASHOUTS.map((c,i)=>(
            <div key={c.id} className="card au" style={{padding:"16px 20px",textAlign:"center",width:100,animationDelay:`${i*.04}s`}}>
              <div style={{fontSize:28,marginBottom:6}}>{c.ic}</div>
              <div style={{fontSize:12,fontWeight:600}}>{c.n}</div>
              <div style={{fontSize:10,color:B.ok,marginTop:2}}>{c.spd}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{padding:"80px 24px",textAlign:"center",background:"linear-gradient(180deg,transparent,rgba(124,58,237,.06))"}}>
        <h2 style={{fontFamily:"'Space Grotesk'",fontSize:40,fontWeight:900,marginBottom:14}}>
          Ready to Start Earning?
        </h2>
        <p style={{color:B.muted,fontSize:18,marginBottom:12}}>
          Join 380,000+ earners. 100% free. Cash out in under 60 seconds.
        </p>
        <p style={{color:B.dim,fontSize:14,marginBottom:32}}>
          Over $12M paid out and counting. Rated 4.8★ on Trustpilot.
        </p>
        <button className="btn-primary ap" onClick={()=>setPg("earn")} style={{fontSize:20,padding:"18px 48px"}}>
          Claim Your 500 Free Coins Now →
        </button>
      </section>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD
// ═══════════════════════════════════════════════════════════════
const Dash = ({coins,streak,today,week,setPg}) => {
  const lv = getLevel(coins);
  const prog = pct(coins);
  const nxt = LEVELS[lv.idx+1];
  const [spinResult,setSpinResult] = useState(null);
  const [spinning,setSpinning] = useState(false);
  const [bonusClaimed,setBonusClaimed] = useState(false);
  const [bonusAmt,setBonusAmt] = useState(0);

  const spin = () => {
    if(spinning) return;
    setSpinning(true);
    setSpinResult(null);
    setTimeout(()=>{
      // Variable ratio reinforcement: unpredictable rewards
      const roll = Math.random();
      const amt = roll<.02?50000:roll<.08?10000:roll<.20?5000:roll<.40?2000:roll<.65?1000:500;
      setSpinResult(amt);
      setSpinning(false);
    },3000);
  };

  const claimStreak = () => {
    const roll = Math.random();
    const mult = roll<.1?10:roll<.25?5:roll<.45?3:roll<.7?2:1;
    setBonusAmt(200*mult);
    setBonusClaimed(true);
  };

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
      <div className="au" style={{marginBottom:28}}>
        <h1 style={{fontFamily:"'Space Grotesk'",fontSize:26,fontWeight:800}}>Welcome back, Andrew 👋</h1>
        <p style={{color:B.muted,fontSize:14}}>Your personalized earning dashboard</p>
      </div>

      {/* Stats Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat label="Total Balance" value={<>{fmt(coins)} 🪙</>} sub={`$${toUSD(coins)}`} grad={B.grad} delay={0}/>
        <Stat label="Today" value={<>+{fmt(today)}</>} sub={`$${toUSD(today)}`} grad={B.gradOk} delay={.05}/>
        <Stat label="This Week" value={<>+{fmt(week)}</>} sub={`$${toUSD(week)}`} grad="linear-gradient(135deg,#60A5FA,#A78BFA)" delay={.1}/>
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
                  <div style={{fontSize:20,fontWeight:800,fontFamily:"'Space Grotesk'",color:lv.c}}>{lv.n}</div>
                </div>
              </div>
              {nxt&&<div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:B.muted}}>Next: {nxt.icon} {nxt.n}</div>
                <div style={{fontSize:12,color:B.accentL,fontWeight:600}}>+{nxt.bonus}% bonus on all offers</div>
              </div>}
            </div>
            <div style={{background:"rgba(124,58,237,.08)",borderRadius:10,height:12,overflow:"hidden",marginBottom:6}}>
              <div className="progress-bar" style={{width:`${prog}%`,background:B.grad}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:B.muted}}>
              <span>{fmt(coins)} coins</span>
              {nxt&&<span>{fmt(nxt.min)} needed</span>}
            </div>
            <div style={{marginTop:14,padding:10,background:"rgba(124,58,237,.04)",borderRadius:10,fontSize:12,color:B.muted}}>
              🎖 Your perks: {lv.bonus}% bonus on offers
              {lv.idx>=3?" · Priority support":""}
              {lv.idx>=4?" · Exclusive high-value offers":""}
              {lv.idx>=5?" · Zero cashout fees · VIP Discord":""}
            </div>
          </div>

          {/* 7-Day Streak */}
          <div className="card au" style={{padding:22,marginBottom:20,animationDelay:".1s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>🔥 7-Day Streak Challenge</h3>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5,6,7].map(d=>{
                const done = d <= (streak%7||(streak>0?7:0));
                const isToday = d === (streak%7||7);
                return (
                  <div key={d} style={{
                    flex:1,textAlign:"center",padding:"10px 4px",borderRadius:10,
                    background:done?"rgba(16,185,129,.08)":"rgba(255,255,255,.02)",
                    border:isToday?"2px solid rgba(16,185,129,.4)":`1px solid rgba(255,255,255,.04)`,
                  }}>
                    <div style={{fontSize:10,color:B.muted,marginBottom:4}}>Day {d}</div>
                    <div style={{fontSize:18}}>{done?"✅":d===7?"🎁":"⬜"}</div>
                    <div style={{fontSize:10,color:done?B.ok:B.dim,fontWeight:600,marginTop:2}}>{d===7?"BONUS!":`+${d*100}`}</div>
                  </div>
                );
              })}
            </div>
            {streak%7===0 && streak>0 && !bonusClaimed && (
              <button className="btn-primary ap" onClick={claimStreak} style={{width:"100%",marginTop:14,padding:13}}>
                🎁 Claim 7-Day Streak Bonus — Up to 2,000 Coins!
              </button>
            )}
            {bonusClaimed&&(
              <div className="abounce" style={{marginTop:14,padding:13,background:"rgba(16,185,129,.08)",borderRadius:12,textAlign:"center",fontWeight:700,color:B.ok}}>
                🎉 You won {fmt(bonusAmt)} bonus coins!{bonusAmt>500?" JACKPOT! 🍀":""}
              </div>
            )}
          </div>

          {/* Earnings Chart Placeholder */}
          <div className="card au" style={{padding:22,animationDelay:".15s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>📈 Earnings This Week</h3>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>{
                const heights = [45,62,38,78,55,90,72];
                const isToday = i===2;
                return (
                  <div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{
                      width:"100%",height:heights[i],borderRadius:6,
                      background:isToday?B.grad:"rgba(124,58,237,.15)",
                      transition:"all .3s",cursor:"pointer",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=".8"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}
                    />
                    <span style={{fontSize:10,color:isToday?B.accentL:B.muted,fontWeight:isToday?700:400}}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* Daily Spin — Variable Ratio Reinforcement */}
          <div className="card au" style={{padding:22,marginBottom:20,textAlign:"center",border:"1px solid rgba(245,158,11,.15)",animationDelay:".08s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>🎰 Daily Spin-to-Win</h3>
            <p style={{fontSize:11,color:B.muted,marginBottom:14}}>Earn 1,000+ coins today to unlock your free spin</p>
            <div style={{
              width:130,height:130,borderRadius:"50%",margin:"0 auto 16px",
              background:`conic-gradient(${B.accent} 0deg,${B.gold} 45deg,${B.ok} 90deg,${B.hot} 135deg,#60A5FA 180deg,${B.accentL} 225deg,#EC4899 270deg,${B.accent} 360deg)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              animation:spinning?"spinWheel 3s cubic-bezier(.2,.8,.3,1) forwards":"none",
              transition:"all .3s",
            }}>
              <div style={{width:90,height:90,borderRadius:"50%",background:B.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:spinResult?"18px":"26px",fontWeight:800}}>
                {spinResult?<span className="abounce" style={{color:B.gold}}>{fmt(spinResult)}🪙</span>:"🎯"}
              </div>
            </div>
            {!spinResult&&<button className="btn-primary" onClick={spin} style={{width:"100%",padding:12,fontSize:14}} disabled={spinning}>
              {spinning?"Spinning...":"Spin Now — Win Up to 50,000!"}
            </button>}
            {spinResult&&<div style={{padding:10,background:"rgba(245,158,11,.08)",borderRadius:10,fontSize:13,fontWeight:600,color:B.gold}}>
              You won {fmt(spinResult)} coins! Come back tomorrow for another spin.
            </div>}
          </div>

          {/* Quick Earn */}
          <div className="card au" style={{padding:22,marginBottom:20,animationDelay:".12s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>⚡ Quick Earn</h3>
            {[
              {ic:"📋",l:"Quick Survey",c:"+$1.50",t:"5 min"},
              {ic:"📺",l:"Watch Videos",c:"+$0.80",t:"6 min"},
              {ic:"📱",l:"Try New App",c:"+$3.00",t:"10 min"},
              {ic:"🧠",l:"Daily Trivia",c:"+$0.60",t:"2 min"},
              {ic:"🤝",l:"Refer Friend",c:"+$10.00",t:"1 min"},
              {ic:"🔍",l:"Search & Earn",c:"+$0.05",t:"Per search"},
            ].map((a,i)=>(
              <div key={i} style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 12px",borderRadius:10,marginBottom:6,cursor:"pointer",
                background:"rgba(255,255,255,.02)",transition:"all .15s",
              }}
                onClick={()=>setPg("earn")}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,.08)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.02)"}
              >
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>{a.ic}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{a.l}</div>
                    <div style={{fontSize:10,color:B.muted}}>{a.t}</div>
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:B.ok}}>{a.c}</span>
              </div>
            ))}
          </div>

          {/* Referral Card */}
          <div className="card au" style={{padding:22,background:"linear-gradient(135deg,rgba(236,72,153,.06),rgba(124,58,237,.06))",border:"1px solid rgba(236,72,153,.15)",animationDelay:".16s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>👥 Referral Program</h3>
            <p style={{fontSize:12,color:B.muted,marginBottom:12}}>Earn <strong style={{color:"#EC4899"}}>$10 per referral</strong> + 5% of their lifetime earnings. Forever.</p>
            <div style={{background:"rgba(0,0,0,.2)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <code style={{fontSize:12,color:B.accentL}}>cashflow.com/ref/andrew</code>
              <button style={{background:B.grad,border:"none",padding:"6px 14px",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Copy</button>
            </div>
            <div style={{fontSize:11,color:B.muted}}>Your referrals: <strong style={{color:B.txt}}>12 users</strong> · Earned: <strong style={{color:B.ok}}>$186.40</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: EARN
// ═══════════════════════════════════════════════════════════════
const Earn = ({onEarn}) => {
  const [cat,setCat] = useState("featured");
  const [sort,setSort] = useState("pop");
  const [search,setSearch] = useState("");

  const filtered = useMemo(()=>{
    return OFFERS
      .filter(o=>cat==="featured"?o.hot:o.cat===cat)
      .filter(o=>!search||o.t.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>sort==="pop"?b.pop-a.pop:sort==="pay"?b.coins-a.coins:b.rate-a.rate);
  },[cat,sort,search]);

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
      <div className="au" style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'Space Grotesk'",fontSize:26,fontWeight:800}}>Earn Coins 💰</h1>
        <p style={{color:B.muted,fontSize:14}}>Browse thousands of ways to earn — new offers added daily</p>
      </div>

      {/* AI Recommendation */}
      <div className="card au" style={{padding:"16px 22px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(124,58,237,.08),rgba(96,165,250,.08))",border:"1px solid rgba(124,58,237,.15)"}}>
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
        {filtered.map((o,i)=><OfferCard key={o.id} o={o} onEarn={onEarn} delay={i*.04}/>)}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:60,color:B.muted}}>No offers match your search. Try a different category.</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: PROFILE
// ═══════════════════════════════════════════════════════════════
const Profile = ({coins,streak,today,week}) => {
  const lv = getLevel(coins);
  const prog = pct(coins);
  const nxt = LEVELS[lv.idx+1];
  const totalEarned = coins + 42300; // simulated lifetime
  const totalWithdrawn = 42300;
  const referrals = 12;
  const referralEarnings = 18640;

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 24px"}}>
      {/* Profile Header */}
      <div className="card au" style={{padding:28,marginBottom:24,display:"flex",gap:24,alignItems:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:B.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:800,border:`3px solid ${lv.c}`,flexShrink:0}}>A</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <h1 style={{fontFamily:"'Space Grotesk'",fontSize:24,fontWeight:800}}>Andrew</h1>
            <div className="chip" style={{background:`${lv.c}15`,border:`1px solid ${lv.c}30`,color:lv.c,fontSize:12}}>{lv.icon} {lv.n}</div>
            {streak>=7&&<div className="chip" style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:"#F87171",fontSize:12}}>🔥 {streak} day streak</div>}
          </div>
          <p style={{fontSize:13,color:B.muted}}>Member since March 2026 · Rank #847</p>
          <div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:B.muted,marginBottom:4}}>
              <span>{lv.icon} {lv.n}</span>
              {nxt&&<span>{nxt.icon} {nxt.n} — {fmt(nxt.min - coins)} coins to go</span>}
            </div>
            <div style={{background:"rgba(124,58,237,.08)",borderRadius:10,height:8,overflow:"hidden"}}>
              <div className="progress-bar" style={{width:`${prog}%`,background:B.grad}}/>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat label="Current Balance" value={<>${toUSD(coins)}</>} sub={`${fmt(coins)} coins`} grad={B.grad} delay={0}/>
        <Stat label="Lifetime Earned" value={<>${toUSD(totalEarned)}</>} sub={`${fmt(totalEarned)} coins`} grad={B.gradOk} delay={.05}/>
        <Stat label="Total Withdrawn" value={<>${toUSD(totalWithdrawn)}</>} sub="14 withdrawals" grad={B.gradGold} delay={.1}/>
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
            {t:"Referred Alex K.",c:"+10,000",time:"3 days ago",ic:"👥",col:B.ok},
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
          <div className="card au" style={{padding:22,marginBottom:16,background:"linear-gradient(135deg,rgba(236,72,153,.04),rgba(124,58,237,.04))",border:"1px solid rgba(236,72,153,.12)",animationDelay:".12s"}}>
            <h3 style={{fontSize:15,fontWeight:700,marginBottom:6}}>👥 Your Referral Link</h3>
            <p style={{fontSize:12,color:B.muted,marginBottom:12}}>Earn <strong style={{color:"#EC4899"}}>$10 per referral</strong> + 5% of everything they earn. Forever.</p>
            <div style={{background:"rgba(0,0,0,.25)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <code style={{fontSize:12,color:B.accentL}}>cashflow.com/ref/andrew</code>
              <button style={{background:B.grad,border:"none",padding:"6px 14px",borderRadius:8,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Copy</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{padding:12,background:"rgba(0,0,0,.15)",borderRadius:10,textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"'Space Grotesk'",color:B.accentL}}>{referrals}</div>
                <div style={{fontSize:11,color:B.muted}}>Referrals</div>
              </div>
              <div style={{padding:12,background:"rgba(0,0,0,.15)",borderRadius:10,textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"'Space Grotesk'",color:B.ok}}>${toUSD(referralEarnings)}</div>
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
const Rewards = ({coins}) => {
  const [sel,setSel] = useState(null);
  const [amt,setAmt] = useState("");
  const [processing,setProcessing] = useState(false);
  const [done,setDone] = useState(false);

  const cashout = () => {
    setProcessing(true);
    setTimeout(()=>{setProcessing(false);setDone(true)},2000);
  };

  return (
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
      <div className="au" style={{marginBottom:24}}>
        <h1 style={{fontFamily:"'Space Grotesk'",fontSize:26,fontWeight:800}}>Cash Out 🎁</h1>
        <p style={{color:B.muted,fontSize:14}}>
          Balance: <strong style={{color:B.accentL}}>{fmt(coins)} coins</strong> (${toUSD(coins)})
        </p>
      </div>

      {/* Speed Badge */}
      <div className="card au" style={{padding:"16px 22px",marginBottom:24,display:"flex",alignItems:"center",gap:14,background:"rgba(16,185,129,.04)",border:"1px solid rgba(16,185,129,.12)"}}>
        <span style={{fontSize:28}}>⚡</span>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:B.ok}}>Instant Payouts — $1 Minimum</div>
          <div style={{fontSize:12,color:B.muted}}>Most cashouts process in under 60 seconds. Zero waiting. Zero holding periods. The lowest minimum of any GPT platform.</div>
        </div>
      </div>

      {/* Cashout Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
        {CASHOUTS.map((c,i)=>{
          const can=coins>=c.min;
          const active=sel===c.id;
          return (
            <div key={c.id} className="card au" onClick={()=>can&&setSel(c.id)} style={{
              padding:20,textAlign:"center",cursor:can?"pointer":"default",opacity:can?1:.45,
              border:active?`2px solid ${B.accent}`:`1px solid ${B.border}`,
              background:active?"rgba(124,58,237,.06)":B.card,
              animationDelay:`${i*.04}s`,position:"relative",
            }}>
              {c.pop&&<div style={{position:"absolute",top:-7,right:-7,background:B.gradHot,padding:"2px 8px",borderRadius:8,fontSize:9,fontWeight:800,color:"#fff"}}>POPULAR</div>}
              <div style={{fontSize:32,marginBottom:8}}>{c.ic}</div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{c.n}</div>
              <div style={{fontSize:11,color:B.muted}}>Min: ${toUSD(c.min)}</div>
              <div style={{fontSize:11,color:B.ok,marginTop:2}}>{c.spd} · {c.fee} fee</div>
            </div>
          );
        })}
      </div>

      {/* Cashout Form */}
      {sel&&!done&&(
        <div className="af" style={{maxWidth:450,margin:"0 auto"}}>
          <div className="card" style={{padding:28}}>
            <h3 style={{fontSize:17,fontWeight:700,textAlign:"center",marginBottom:18}}>
              Withdraw to {CASHOUTS.find(c=>c.id===sel)?.n}
            </h3>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:5}}>Amount (USD)</label>
              <input type="number" placeholder={`Min $${toUSD(CASHOUTS.find(c=>c.id===sel)?.min||1000)}`}
                value={amt} onChange={e=>setAmt(e.target.value)}
                style={{width:"100%",padding:13,background:"rgba(255,255,255,.03)",border:`1px solid ${B.border}`,borderRadius:10,color:B.txt,fontSize:16}}/>
            </div>
            {sel==="paypal"&&<div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:B.muted,display:"block",marginBottom:5}}>PayPal Email</label>
              <input type="email" placeholder="your@email.com"
                style={{width:"100%",padding:13,background:"rgba(255,255,255,.03)",border:`1px solid ${B.border}`,borderRadius:10,color:B.txt,fontSize:14}}/>
            </div>}
            <button className="btn-primary" onClick={cashout} disabled={processing} style={{width:"100%",padding:15,fontSize:16}}>
              {processing?"⏳ Processing...":"Withdraw Now ⚡"}
            </button>
          </div>
        </div>
      )}

      {done&&(
        <div className="abounce" style={{maxWidth:450,margin:"0 auto",textAlign:"center"}}>
          <div className="card" style={{padding:36}}>
            <div style={{fontSize:56,marginBottom:12}}>✅</div>
            <h3 style={{fontSize:20,fontWeight:700,color:B.ok,marginBottom:8}}>Withdrawal Complete!</h3>
            <p style={{color:B.muted,fontSize:14}}>Your payout has been sent. Check your {CASHOUTS.find(c=>c.id===sel)?.n} in moments.</p>
          </div>
        </div>
      )}

      {/* Recent Withdrawals */}
      <div style={{marginTop:40}}>
        <h3 style={{fontSize:17,fontWeight:700,marginBottom:14}}>Recent Withdrawals — Live</h3>
        <div className="card" style={{overflow:"hidden"}}>
          {[
            {u:"CryptoKing_99",a:"$78.00",m:"Bitcoin",t:"Just now",av:"👑"},
            {u:"Maria_NYC",a:"$22.50",m:"PayPal",t:"28 sec ago",av:"💎"},
            {u:"GameBoy22",a:"$55.00",m:"Cash App",t:"1 min ago",av:"🎮"},
            {u:"EarnDaily",a:"$15.20",m:"Venmo",t:"2 min ago",av:"⚡"},
            {u:"Sarah_TX",a:"$95.00",m:"Bitcoin",t:"3 min ago",av:"🌟"},
            {u:"Rob_UK",a:"$10.00",m:"Amazon",t:"5 min ago",av:"🏆"},
            {u:"Jenny_CA",a:"$42.00",m:"PayPal",t:"7 min ago",av:"💰"},
          ].map((w,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 20px",borderBottom:i<6?`1px solid rgba(255,255,255,.03)`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{w.av}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{w.u}</div>
                  <div style={{fontSize:11,color:B.muted}}>{w.t}</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:700,color:B.ok}}>{w.a}</div>
                <div style={{fontSize:11,color:B.muted}}>{w.m}</div>
              </div>
            </div>
          ))}
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
        <h1 style={{fontFamily:"'Space Grotesk'",fontSize:26,fontWeight:800}}>Leaderboard 🏆</h1>
        <p style={{color:B.muted,fontSize:14}}>Top earners win real cash prizes every day, week, and month</p>
      </div>

      {/* Prize Pool */}
      <div className="card au" style={{padding:28,textAlign:"center",marginBottom:28,background:"linear-gradient(135deg,rgba(245,158,11,.06),rgba(239,68,68,.06))",border:"1px solid rgba(245,158,11,.15)"}}>
        <div style={{fontSize:12,color:B.gold,fontWeight:600,marginBottom:6}}>🏆 THIS WEEK'S PRIZE POOL</div>
        <div style={{fontSize:52,fontWeight:900,fontFamily:"'Space Grotesk'",background:B.gradHot,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>$3,500</div>
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
            background:tf===t.id?"rgba(124,58,237,.1)":"transparent",
            border:tf===t.id?`1px solid rgba(124,58,237,.3)`:"1px solid rgba(255,255,255,.04)",
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
              <div style={{width:32,textAlign:"center",fontWeight:800,fontFamily:"'Space Grotesk'",fontSize:15,color:i<3?B.gold:B.muted}}>
                {i<3?["🥇","🥈","🥉"][i]:`#${u.r}`}
              </div>
              <span style={{fontSize:22}}>{u.av}</span>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{u.name}</div>
                <div style={{fontSize:10,color:B.muted}}>{u.lvl} · 🔥 {u.streak}d streak</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:14,fontFamily:"'Space Grotesk'",color:B.accentL}}>{fmt(u.coins)} 🪙</div>
              <div style={{fontSize:10,color:B.muted}}>${toUSD(u.coins)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Your Position */}
      <div className="card au" style={{marginTop:20,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(124,58,237,.06)",border:`1px solid rgba(124,58,237,.25)`}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontWeight:800,fontFamily:"'Space Grotesk'",fontSize:15,color:B.accentL}}>#847</div>
          <div style={{width:34,height:34,borderRadius:"50%",background:B.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>A</div>
          <div>
            <div style={{fontWeight:600,fontSize:13}}>You (Andrew)</div>
            <div style={{fontSize:11,color:B.muted}}>Earn <strong style={{color:B.warnL}}>12,400 more coins</strong> to reach Top 100 and win prizes!</div>
          </div>
        </div>
        <div style={{fontWeight:700,fontFamily:"'Space Grotesk'",color:B.accentL}}>{fmt(coins)} 🪙</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN DASHBOARD (Role-gated — only visible to admin users)
// ═══════════════════════════════════════════════════════════════
const AdminDash = () => {
  const [tab,setTab] = useState("overview");
  const [data,setData] = useState(null);
  const [walls,setWalls] = useState([]);
  const [users,setUsers] = useState([]);
  const [payouts,setPayouts] = useState([]);
  const [fraud,setFraud] = useState({multiAccount:[],highEarners:[]});
  const [analytics,setAnalytics] = useState([]);
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);

  // Simulated admin data (in production, these come from /api/admin/* endpoints)
  useEffect(()=>{
    setLoading(true);
    setTimeout(()=>{
      setData({
        totalUsers:3842,
        newUsersToday:47,
        newUsersWeek:312,
        activeToday:1289,
        revenueToday:48720,
        revenueWeek:312480,
        revenueMonth:1247600,
        revenueTotal:8942300,
        profitToday:19488,
        profitWeek:124992,
        profitMonth:499040,
        profitTotal:3576920,
        payoutsToday:29232,
        payoutsWeek:187488,
        payoutsMonth:748560,
        payoutsTotal:5365380,
        offersToday:892,
        offersWeek:6123,
        offersMonth:24180,
        pendingPayouts:23,
        marginPct:40,
      });
      setWalls([
        {name:"AdGate Media",completions:4821,revenue:218400,payout:130800,margin:40.1},
        {name:"AdGem",completions:6234,revenue:342800,payout:205680,margin:40.0},
        {name:"OfferToro",completions:3892,revenue:178200,payout:110400,margin:38.0},
        {name:"Lootably",completions:2156,revenue:98400,payout:59040,margin:40.0},
        {name:"Ayet Studios",completions:1893,revenue:112600,payout:69600,margin:38.2},
        {name:"Revenue Universe",completions:3421,revenue:186200,payout:111720,margin:40.0},
        {name:"CPX Research",completions:5612,revenue:248900,payout:149340,margin:40.0},
        {name:"BitLabs",completions:2987,revenue:156300,payout:93780,margin:40.0},
        {name:"TheoremReach",completions:4123,revenue:178400,payout:107040,margin:40.0},
        {name:"Pollfish",completions:3567,revenue:142800,payout:87120,margin:39.0},
        {name:"TyrAds",completions:1234,revenue:89400,payout:53640,margin:40.0},
        {name:"Torox",completions:987,revenue:62300,payout:37380,margin:40.0},
      ]);
      setUsers([
        {id:1,username:"CryptoKing_99",email:"crypto@example.com",coins:1247320,role:"member",isBanned:0,created:"2025-08-14",lastLogin:"2026-03-03",ip:"192.168.1.1",country:"US"},
        {id:2,username:"SurveyQueen",email:"queen@example.com",coins:923100,role:"member",isBanned:0,created:"2025-09-22",lastLogin:"2026-03-03",ip:"192.168.1.2",country:"US"},
        {id:3,username:"GameMaster_X",email:"gm@example.com",coins:789400,role:"member",isBanned:0,created:"2025-10-05",lastLogin:"2026-03-02",ip:"192.168.1.3",country:"UK"},
        {id:4,username:"SusAccount42",email:"sus@example.com",coins:456200,role:"member",isBanned:1,created:"2026-01-15",lastLogin:"2026-02-28",ip:"10.0.0.5",country:"VN"},
        {id:5,username:"EarnDaily22",email:"daily@example.com",coins:612800,role:"member",isBanned:0,created:"2025-07-10",lastLogin:"2026-03-03",ip:"172.16.0.1",country:"CA"},
        {id:6,username:"NewUser_123",email:"new@example.com",coins:2300,role:"member",isBanned:0,created:"2026-03-02",lastLogin:"2026-03-03",ip:"192.168.2.1",country:"US"},
        {id:7,username:"CashHunter",email:"hunter@example.com",coins:498200,role:"member",isBanned:0,created:"2025-11-01",lastLogin:"2026-03-03",ip:"192.168.1.4",country:"US"},
        {id:8,username:"OfferPro_Mike",email:"mike@example.com",coins:387600,role:"member",isBanned:0,created:"2025-12-18",lastLogin:"2026-03-01",ip:"192.168.1.5",country:"AU"},
      ]);
      setPayouts([
        {id:101,username:"CryptoKing_99",method:"btc",coins:50000,usd:50.00,destination:"bc1q...x7r2",status:"pending",created:"2026-03-03 08:12"},
        {id:102,username:"SurveyQueen",method:"paypal",coins:25000,usd:25.00,destination:"queen@email.com",status:"pending",created:"2026-03-03 09:45"},
        {id:103,username:"GameMaster_X",method:"cashapp",coins:75000,usd:75.00,destination:"$GameMasterX",status:"pending",created:"2026-03-03 10:22"},
        {id:104,username:"EarnDaily22",method:"amazon",coins:30000,usd:30.00,destination:"daily@email.com",status:"pending",created:"2026-03-02 22:18"},
        {id:105,username:"CashHunter",method:"venmo",coins:20000,usd:20.00,destination:"@CashHunter",status:"pending",created:"2026-03-02 19:05"},
      ]);
      setFraud({
        multiAccount:[
          {ip:"10.0.0.5",count:4,users:["SusAccount42","FakeUser1","FakeUser2","BotAcct3"]},
          {ip:"203.0.113.7",count:3,users:["MultiEarn1","MultiEarn2","MultiEarn3"]},
        ],
        highEarners:[
          {username:"SpeedEarner",coins24h:89000,avgCoins24h:4200,ratio:21.2},
        ],
      });
      setAnalytics([
        {date:"2026-02-24",newUsers:38,revenue:41200,profit:16480,payouts:24720},
        {date:"2026-02-25",newUsers:42,revenue:45800,profit:18320,payouts:27480},
        {date:"2026-02-26",newUsers:35,revenue:38900,profit:15560,payouts:23340},
        {date:"2026-02-27",newUsers:51,revenue:52100,profit:20840,payouts:31260},
        {date:"2026-02-28",newUsers:44,revenue:47300,profit:18920,payouts:28380},
        {date:"2026-03-01",newUsers:53,revenue:56200,profit:22480,payouts:33720},
        {date:"2026-03-02",newUsers:49,revenue:50800,profit:20320,payouts:30480},
        {date:"2026-03-03",newUsers:47,revenue:48720,profit:19488,payouts:29232},
      ]);
      setLoading(false);
    },600);
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
          <h1 style={{fontSize:28,fontWeight:800,fontFamily:"'Space Grotesk'"}}>Admin Dashboard</h1>
          <span style={{fontSize:10,background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",color:"#F87171",padding:"3px 10px",borderRadius:8,fontWeight:700}}>ADMIN ONLY</span>
        </div>
        <p style={{color:B.muted,fontSize:14}}>Revenue, analytics, user management, and fraud detection</p>
      </div>

      {/* Admin Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:28,flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?"rgba(124,58,237,.15)":"rgba(15,22,41,.5)",
            border:tab===t.id?`1px solid rgba(124,58,237,.4)`:`1px solid ${B.border}`,
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
                <tr style={{background:"rgba(124,58,237,.06)"}}>
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
                <tr style={{background:"rgba(124,58,237,.06)"}}>
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
                <tr style={{background:"rgba(124,58,237,.06)"}}>
                  {["ID","User","Method","Amount","Destination","Requested","Status","Actions"].map(h=>(
                    <th key={h} style={{padding:"12px 14px",textAlign:"left",fontWeight:700,color:B.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${B.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map(p=>(
                  <tr key={p.id} style={{borderBottom:`1px solid ${B.border}`}}>
                    <td style={{padding:"10px 14px",color:B.dim}}>#{p.id}</td>
                    <td style={{padding:"10px 14px",fontWeight:600}}>{p.username}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{background:"rgba(124,58,237,.08)",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:600,textTransform:"uppercase"}}>{p.method}</span>
                    </td>
                    <td style={{padding:"10px 14px",color:"#FBBF24",fontWeight:700}}>${p.usd.toFixed(2)}</td>
                    <td style={{padding:"10px 14px",color:B.muted,fontSize:12,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.destination}</td>
                    <td style={{padding:"10px 14px",color:B.dim,fontSize:12}}>{p.created}</td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{
                        background:p.status==="pending"?"rgba(245,158,11,.12)":p.status==="completed"?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)",
                        color:p.status==="pending"?"#FBBF24":p.status==="completed"?"#34D399":"#F87171",
                        padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700,textTransform:"uppercase"
                      }}>{p.status}</span>
                    </td>
                    <td style={{padding:"10px 14px",display:"flex",gap:6}}>
                      {p.status==="pending"&&<>
                        <button onClick={()=>setPayouts(prev=>prev.map(x=>x.id===p.id?{...x,status:"completed"}:x))} style={{
                          background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",color:"#34D399",
                          padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"
                        }}>Approve</button>
                        <button onClick={()=>setPayouts(prev=>prev.map(x=>x.id===p.id?{...x,status:"rejected"}:x))} style={{
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
                      <div style={{width:"60%",height:h,background:"rgba(124,58,237,.25)",borderRadius:"4px 4px 0 0",border:"1px solid rgba(124,58,237,.4)",minWidth:18}}/>
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
  <footer style={{padding:"48px 24px 20px",borderTop:`1px solid ${B.border}`,textAlign:"center",color:B.muted,fontSize:13}}>
    <div style={{display:"flex",justifyContent:"center",gap:20,marginBottom:14,flexWrap:"wrap",fontSize:13}}>
      {["About","How It Works","FAQ","Blog","Advertise","Terms","Privacy","Contact"].map(l=>(
        <span key={l} style={{cursor:"pointer",transition:"color .15s"}}
          onMouseEnter={e=>e.currentTarget.style.color=B.accentL}
          onMouseLeave={e=>e.currentTarget.style.color=B.muted}>{l}</span>
      ))}
    </div>
    <div style={{marginBottom:6}}>
      <span style={{fontFamily:"'Space Grotesk'",fontWeight:800,background:B.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CashFlow</span> — The Smartest Way to Earn
    </div>
    <div style={{fontSize:10,color:B.dim}}>
      © 2026 CashFlow. All earnings come from advertiser-funded offers. CashFlow never charges users.
    </div>
  </footer>
);

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [pg,setPg] = useState("home");
  const [coins,setCoins] = useState(24800);
  const [streak] = useState(5);
  const [today,setToday] = useState(4200);
  const [week,setWeek] = useState(18600);
  const [toasts,setToasts] = useState([]);
  const [role] = useState("admin"); // Toggle to "member" to hide admin dashboard

  const toast = useCallback((msg,type="ok")=>{
    const id=Date.now();
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500);
  },[]);

  const earn = useCallback(c=>{
    if(!c) return;
    setCoins(p=>p+c);
    setToday(p=>p+c);
    setWeek(p=>p+c);
    toast(`+${fmt(c)} coins ($${toUSD(c)}) earned! 🎉`,"coin");
  },[toast]);

  // Scroll to top on page change
  useEffect(()=>window.scrollTo({top:0,behavior:"smooth"}),[pg]);

  return (
    <div style={{minHeight:"100vh",background:B.bg,color:B.txt}}>
      <style>{css}</style>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t=>(
          <div key={t.id} className="toast" style={{
            background:t.type==="coin"?"rgba(124,58,237,.9)":t.type==="ok"?"rgba(16,185,129,.9)":"rgba(239,68,68,.9)",
            color:"#fff",
          }}>{t.msg}</div>
        ))}
      </div>

      <LiveTicker/>
      <Nav pg={pg} setPg={setPg} coins={coins} streak={streak} role={role}/>

      <main style={{minHeight:"80vh"}}>
        {pg==="home"&&<Home setPg={setPg}/>}
        {pg==="dash"&&<Dash coins={coins} streak={streak} today={today} week={week} setPg={setPg}/>}
        {pg==="earn"&&<Earn onEarn={earn}/>}
        {pg==="profile"&&<Profile coins={coins} streak={streak} today={today} week={week}/>}
        {pg==="rewards"&&<Rewards coins={coins}/>}
        {pg==="leaderboard"&&<Leaderboard coins={coins}/>}
        {pg==="admin"&&role==="admin"&&<AdminDash/>}
      </main>

      <Footer/>
    </div>
  );
}
