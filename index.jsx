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
  { n:"Starter",    min:0,      icon:"1", c:"#94A3B8", bonus:0,  next:1000 },
  { n:"Explorer",   min:1000,   icon:"2", c:"#3B82F6", bonus:2,  next:5000 },
  { n:"Earner",     min:5000,   icon:"3", c:"#00D26A", bonus:5,  next:15000 },
  { n:"Hustler",    min:15000,  icon:"4", c:"#FF9F1C", bonus:8,  next:40000 },
  { n:"Pro",        min:40000,  icon:"5", c:"#FFB800", bonus:12, next:100000 },
  { n:"Elite",      min:100000, icon:"6", c:"#FF6B35", bonus:15, next:300000 },
  { n:"Legend",     min:300000, icon:"7", c:"#FF2D78", bonus:20, next:750000 },
  { n:"Titan",      min:750000, icon:"8", c:"#A855F7", bonus:25, next:null },
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
  { id:"featured", n:"Featured",    d:"Hand-picked highest value", c:"#FFB800" },
  { id:"surveys",  n:"Surveys",     d:"Quick opinions, quick cash", c:"#3B82F6" },
  { id:"games",    n:"Games",       d:"Play games, earn big",       c:"#A855F7" },
  { id:"apps",     n:"Apps & Signups",d:"Try apps, earn instantly",  c:"#00D26A" },
  { id:"videos",   n:"Watch",       d:"Watch & earn passively",     c:"#FF9F1C" },
  { id:"shopping", n:"Cashback",    d:"Shop and earn back",         c:"#FF3B30" },
  { id:"tasks",    n:"Micro Tasks",  d:"Tiny tasks, instant pay",   c:"#FF6B35" },
  { id:"crypto",   n:"Crypto",       d:"Crypto rewards & staking",  c:"#8B5CF6" },
  { id:"referrals",n:"Referrals",   d:"Earn from your network",    c:"#FF2D78" },
  { id:"search",   n:"Search",      d:"Earn while you browse",     c:"#00E5FF" },
];

// ─── SAMPLE OFFERS ───
const OFFERS = [
  { id:1,  t:"Cash App — Sign Up + $5 Deposit",   cat:"apps",     coins:25000, time:"5 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=cash.app&sz=128", wall:"Revenue Universe", pop:99, rate:94, hot:true },
  { id:2,  t:"Temu — First Purchase Bonus",        cat:"apps",     coins:30000, time:"5 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=temu.com&sz=128", wall:"AdGate Media",     pop:97, rate:91, hot:true },
  { id:3,  t:"Royal Match — Level 300",            cat:"games",    coins:52000, time:"5-7 days", diff:"Medium", img:"https://www.google.com/s2/favicons?domain=royalmatch.com&sz=128", wall:"AdGem",            pop:95, rate:72, hot:true },
  { id:4,  t:"Raid: Shadow Legends — 2 Champions", cat:"games",    coins:78000, time:"10-14d",  diff:"Hard",   img:"https://www.google.com/s2/favicons?domain=plarium.com&sz=128", wall:"OfferToro",         pop:88, rate:45, hot:false },
  { id:5,  t:"Branded Survey — 12 Questions",      cat:"surveys",  coins:3500,  time:"8 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=branded.com&sz=128", wall:"CPX Research",      pop:92, rate:89, hot:false },
  { id:6,  t:"Quick Opinion Poll",                 cat:"surveys",  coins:1200,  time:"3 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=surveymonkey.com&sz=128", wall:"TheoremReach",      pop:90, rate:95, hot:false },
  { id:7,  t:"Coinbase — Verify + Trade $50",      cat:"crypto",   coins:42000, time:"10 min",  diff:"Medium", img:"https://www.google.com/s2/favicons?domain=coinbase.com&sz=128", wall:"AdGem",            pop:86, rate:78, hot:true },
  { id:8,  t:"State of Survival — HQ Level 21",    cat:"games",    coins:95000, time:"18-21d",  diff:"Hard",   img:"https://www.google.com/s2/favicons?domain=stateofsurvival.com&sz=128", wall:"Ayet Studios",     pop:78, rate:38, hot:false },
  { id:9,  t:"Watch 5 Entertainment Videos",       cat:"videos",   coins:900,   time:"6 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=youtube.com&sz=128", wall:"Lootably",          pop:85, rate:97, hot:false },
  { id:10, t:"Fetch Rewards — Scan First Receipt", cat:"apps",     coins:18000, time:"5 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=fetchrewards.com&sz=128", wall:"Revenue Universe",  pop:93, rate:88, hot:true },
  { id:11, t:"Product Review — 100 Words",         cat:"tasks",    coins:2800,  time:"8 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=amazon.com&sz=128", wall:"Direct",            pop:74, rate:90, hot:false },
  { id:12, t:"AFK Arena — Chapter 32",             cat:"games",    coins:65000, time:"8-12d",   diff:"Medium", img:"https://www.google.com/s2/favicons?domain=afkarena.com&sz=128", wall:"OfferToro",         pop:81, rate:55, hot:false },
  { id:13, t:"SoFi — Open Account + $10 Deposit",  cat:"apps",     coins:55000, time:"10 min",  diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=sofi.com&sz=128", wall:"AdGate Media",      pop:91, rate:85, hot:true },
  { id:14, t:"Lifestyle Survey — 15 min",          cat:"surveys",  coins:4200,  time:"15 min",  diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=pollfish.com&sz=128", wall:"Pollfish",          pop:87, rate:82, hot:false },
  { id:15, t:"Robinhood — Sign Up & Deposit",      cat:"crypto",   coins:48000, time:"10 min",  diff:"Medium", img:"https://www.google.com/s2/favicons?domain=robinhood.com&sz=128", wall:"TyrAds",            pop:89, rate:80, hot:true },
  { id:16, t:"Swagbucks Search — 10 Searches",     cat:"search",   coins:500,   time:"5 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=swagbucks.com&sz=128", wall:"Direct",            pop:70, rate:99, hot:false },
  { id:17, t:"Amazon Cashback — Any Purchase",     cat:"shopping", coins:0,     time:"Varies",  diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=amazon.com&sz=128", wall:"Direct",            pop:96, rate:100,hot:false, cashback:"Up to 8%" },
  { id:18, t:"Refer a Friend",                     cat:"referrals",coins:500, time:"1 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=pocketlined.com&sz=128", wall:"PocketLined",          pop:94, rate:100,hot:true },
  { id:19, t:"Daily Trivia — 5 Questions",         cat:"tasks",    coins:600,   time:"2 min",   diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=trivia.com&sz=128", wall:"Direct",            pop:83, rate:96, hot:false },
  { id:20, t:"Norton VPN — Free Trial + Use 3 Days",cat:"apps",    coins:35000, time:"3 days",  diff:"Easy",   img:"https://www.google.com/s2/favicons?domain=norton.com&sz=128", wall:"Lootably",          pop:80, rate:74, hot:false },
];

// ─── LEADERBOARD ───
const LEADERS = [
  { r:1, name:"CryptoKing_99",  lvl:"Titan",  coins:1247320, av:"C", streak:189 },
  { r:2, name:"SurveyQueen",    lvl:"Legend",  coins:923100,  av:"S", streak:134 },
  { r:3, name:"GameMaster_X",   lvl:"Legend",  coins:789400,  av:"G", streak:98  },
  { r:4, name:"EarnDaily22",    lvl:"Elite",   coins:612800,  av:"E", streak:267 },
  { r:5, name:"CashHunter",     lvl:"Elite",   coins:498200,  av:"C", streak:78  },
  { r:6, name:"OfferPro_Mike",  lvl:"Pro",     coins:387600,  av:"O", streak:55  },
  { r:7, name:"RewardSeeker",   lvl:"Pro",     coins:345100,  av:"R", streak:89  },
  { r:8, name:"TaskNinja",      lvl:"Pro",     coins:298300,  av:"T", streak:44  },
  { r:9, name:"LuckyPlayer",    lvl:"Hustler", coins:234500,  av:"L", streak:33  },
  { r:10,name:"MoneyMaven",     lvl:"Hustler", coins:198700,  av:"M", streak:61  },
];

// ─── CASHOUT OPTIONS ───
const CASHOUTS = [
  { id:"paypal",  n:"PayPal",        ic:"PP", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"venmo",   n:"Venmo",         ic:"VM", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"cashapp", n:"Cash App",      ic:"CA", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"btc",     n:"Bitcoin",       ic:"BTC", min:5000,  fee:"0%", spd:"~5 min",    pop:true },
  { id:"eth",     n:"Ethereum",      ic:"ETH", min:5000,  fee:"0%", spd:"~3 min",    pop:false },
  { id:"usdt",    n:"USDT",          ic:"USD", min:5000,  fee:"0%", spd:"~3 min",    pop:false },
  { id:"amazon",  n:"Amazon",        ic:"AM", min:5000,  fee:"0%", spd:"Instant",   pop:true },
  { id:"visa",    n:"Visa Prepaid",  ic:"VIS", min:10000, fee:"1%", spd:"1-2 days",  pop:false },
  { id:"steam",   n:"Steam",         ic:"ST", min:5000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"apple",   n:"Apple",         ic:"AP", min:5000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"google",  n:"Google Play",   ic:"GP", min:5000,  fee:"0%", spd:"Instant",   pop:false },
  { id:"walmart", n:"Walmart",       ic:"WM", min:5000,  fee:"0%", spd:"Instant",   pop:false },
];

// ─── LIVE FEED (Realistic amounts based on actual GPT payouts) ───
const FEED = [
  "Jake from TX completed Royal Match — earned $52.00",
  "Maria cashed out $18.50 via PayPal instantly",
  "Alex finished 3 surveys today — $8.40 earned",
  "Sarah completed a SoFi signup offer — $55.00",
  "New user Chris earned $6.20 in his first session",
  "Tom from UK withdrew $32.00 in Bitcoin",
  "Emily just hit a 30-day streak!",
  "Michael earned $87.50 this week from game offers",
  "Lisa unlocked Earner level — 5% bonus activated!",
  "David referred 2 friends — earned $20.00",
  "Jenny completed 8 surveys today — $24.60",
  "Rob cashed out $15.00 to Cash App instantly",
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

// ─── SVG ICONS (Replace all emojis with clean vector icons) ───
const Icon = {
  earn: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>,
  cashout: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  dashboard: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  leaderboard: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  admin: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  fire: (s=16,c="#FF6B35") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 23c-3.6 0-8-2.4-8-8.1C4 10 8 4 12 1c4 3 8 9 8 13.9 0 5.7-4.4 8.1-8 8.1zm0-18.5C9.3 7.5 6 12 6 14.9 6 19 9.2 21 12 21s6-2 6-6.1c0-2.9-3.3-7.4-6-10.4z"/></svg>,
  star: (s=16,c="#FFB800") => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  check: (s=16,c=B.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock: (s=14,c=B.muted) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  arrowRight: (s=16,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  user: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  search: (s=18,c=B.muted) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  gift: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  chart: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  wallet: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>,
  lightning: (s=16,c=B.accent) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  trophy: (s=20,c="currentColor") => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
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
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:B.muted,fontSize:20,cursor:"pointer"}}>×</button>
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
            {loading ? "Please wait..." : mode==="login" ? "Log In" : "Sign Up — Get 500 Free Coins"}
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
      <span className="af" key={i}>
        <span style={{width:6,height:6,borderRadius:"50%",background:B.accent,display:"inline-block",marginRight:8}}/>
        LIVE — {FEED[i]}
      </span>
    </div>
  );
};

// ─── NAVBAR (Freecash-style) ───
const Nav = ({pg,setPg,coins,streak,role,user,onLogin,onLogout}) => {
  const lv = getLevel(coins);
  return (
    <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:66,background:B.nav,borderBottom:`2px solid ${B.border}`,position:"sticky",top:0,zIndex:100}}>
      {/* Left: Logo + Nav Links */}
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
              {id:"earn",l:"Earn",ic:Icon.earn},
              {id:"rewards",l:"Cashout",ic:Icon.cashout},
              ...(user ? [{id:"dash",l:"Dashboard",ic:Icon.dashboard},{id:"leaderboard",l:"Leaderboard",ic:Icon.leaderboard}] : []),
              ...(role==="admin"&&user?[{id:"admin",l:"Admin",ic:Icon.admin}]:[]),
            ].map(x=>(
              <button key={x.id} onClick={()=>setPg(x.id)} style={{
                background:"none",border:"none",
                color:pg===x.id?B.accent:B.muted,
                padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:pg===x.id?600:500,
                transition:"all .15s",display:"flex",alignItems:"center",gap:8,
                borderBottom:pg===x.id?`2px solid ${B.accent}`:"2px solid transparent",
              }}
              onMouseEnter={e=>{if(pg!==x.id)e.currentTarget.style.color="#fff"}}
              onMouseLeave={e=>{if(pg!==x.id)e.currentTarget.style.color=B.muted}}
              >{x.ic(20,pg===x.id?B.accent:B.muted)} {x.l}</button>
            ))}
          </div>
        )}
      </div>
      {/* Right: Balance + User Profile + Auth */}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {user ? (<>
          {streak>0&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:"rgba(255,107,53,.08)",fontSize:13,color:"#FF6B35",fontWeight:700}}>
            {Icon.fire(16,"#FF6B35")} {streak}
          </div>}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:8,background:"rgba(1,214,118,.06)",border:"1px solid rgba(1,214,118,.12)",cursor:"pointer",fontSize:14,color:B.accent,fontWeight:700}} onClick={()=>setPg("dash")}>
            $ {fmt(coins)}
          </div>
          <div onClick={()=>setPg("profile")} style={{width:34,height:34,borderRadius:"50%",background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,cursor:"pointer",color:"#000"}}>
            {(user.username||"A")[0].toUpperCase()}
          </div>
          <button onClick={onLogout} style={{background:"none",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"6px 12px",color:B.muted,fontSize:12,cursor:"pointer",fontWeight:500,transition:"all .15s",display:"flex",alignItems:"center",gap:6}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(239,68,68,.3)";e.currentTarget.style.color="#F87171"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.1)";e.currentTarget.style.color=B.muted}}
          >{Icon.bell(16,B.muted)}</button>
        </>) : (<>
          <button onClick={onLogin} style={{background:"none",border:"1px solid rgba(255,255,255,.15)",borderRadius:8,padding:"8px 18px",color:"#fff",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.3)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.15)"}
          >Sign In</button>
          <button onClick={onLogin} style={{background:B.accent,border:"none",borderRadius:8,padding:"8px 20px",color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#01FF97"}
            onMouseLeave={e=>e.currentTarget.style.background=B.accent}
          >Sign Up</button>
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

// ─── OFFER CARD (Large visual design matching Freecash) ───
const OfferCard = ({o,onEarn,onStart,delay=0}) => {
  const colors = ["#FF6B35", "#01D676", "#3B82F6", "#A855F7", "#FFB800"];
  const colorIdx = o.id % colors.length;
  const bgColor = colors[colorIdx];

  return (
    <div className="card au" style={{overflow:"hidden",cursor:"pointer",animationDelay:`${delay}s`,display:"flex",flexDirection:"column"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor="rgba(1,214,118,.3)";e.currentTarget.style.boxShadow="0 12px 24px rgba(0,0,0,.4)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=B.border;e.currentTarget.style.boxShadow="none"}}
    >
      {/* Hero Image Area */}
      <div style={{width:"100%",height:200,background:`linear-gradient(135deg, ${bgColor}22 0%, ${bgColor}44 100%)`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:12,left:12,background:"rgba(0,0,0,.5)",backdropFilter:"blur(8px)",padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:4,zIndex:2}}>
          {Icon.star(14,"#FFB800")} {(4.5 + Math.random() * 0.5).toFixed(1)}
        </div>
        {o.img && o.img.startsWith("http") ? (
          <img src={o.img} alt={o.t} style={{width:100,height:100,borderRadius:20,objectFit:"cover",boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}
            onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex"}}
          />
        ) : null}
        <div style={{display:o.img&&o.img.startsWith("http")?"none":"flex",width:100,height:100,borderRadius:20,background:bgColor,alignItems:"center",justifyContent:"center",fontSize:36,fontWeight:800,color:"#fff",boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}>
          {(o.t[0]||"?").toUpperCase()}
        </div>
        {o.hot && <div style={{position:"absolute",top:12,right:12,background:B.accent,padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:700,color:"#000",display:"flex",alignItems:"center",gap:4,zIndex:2}}>
          {Icon.fire(14,"#000")} HOT
        </div>}
      </div>

      {/* Info Section */}
      <div style={{padding:18,flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:15,fontWeight:700,color:B.txt,marginBottom:8,lineHeight:1.3}}>{o.t}</div>

        <div style={{display:"flex",gap:12,fontSize:12,color:B.muted,marginBottom:12,flexWrap:"wrap"}}>
          <span style={{display:"flex",alignItems:"center",gap:4}}>
            {Icon.clock(13,B.muted)} {o.time}
          </span>
          <span style={{display:"flex",alignItems:"center",gap:4,color:o.diff==="Easy"?B.ok:o.diff==="Medium"?B.warn:B.hot}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/>
            {o.diff}
          </span>
        </div>

        {/* Success Rate */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flex:1}}>
          <div style={{flex:1,height:3,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden"}}>
            <div className="progress-bar" style={{width:`${o.rate}%`,background:o.rate>80?B.ok:o.rate>50?B.warn:B.hot}}/>
          </div>
          <span style={{fontSize:11,color:B.muted,whiteSpace:"nowrap"}}>{o.rate}%</span>
        </div>

        {/* CTA Button */}
        <button onClick={()=>onStart?onStart(o):onEarn(o.coins)} style={{
          width:"100%",padding:"12px 0",background:B.accent,color:"#000",border:"none",borderRadius:6,
          fontSize:14,fontWeight:700,cursor:"pointer",transition:"all .2s",
        }}
        onMouseEnter={e=>e.currentTarget.style.background=B.accentL}
        onMouseLeave={e=>e.currentTarget.style.background=B.accent}
        >
          Start Offer — ${toUSD(o.coins)}
        </button>
      </div>
    </div>
  );
};

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
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 32px",display:"grid",gridTemplateColumns:"1fr 420px",gap:60,alignItems:"center",position:"relative",zIndex:1}}>
          {/* Left: Headline + CTA */}
          <div className="au">
            <h1 style={{fontSize:52,fontWeight:800,lineHeight:1.15,marginBottom:24,color:B.txt}}>
              Earn Cash by Completing Simple Tasks
            </h1>
            <p style={{fontSize:18,color:B.light,lineHeight:1.6,marginBottom:32}}>
              Join {fmt(signupCount)} people earning real money from their phone. No investment required.
            </p>
            <div style={{display:"flex",gap:14,marginBottom:48}}>
              <button onClick={onLogin} style={{background:B.accent,border:"none",color:"#000",padding:"14px 32px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=B.accentL}
                onMouseLeave={e=>e.currentTarget.style.background=B.accent}
              >Get Started — Free</button>
              <button onClick={()=>setPg("earn")} style={{background:"transparent",border:`2px solid ${B.border}`,color:B.txt,padding:"12px 28px",borderRadius:8,fontSize:15,fontWeight:600,cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=B.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}
              >Browse Offers</button>
            </div>

            {/* Stats Row */}
            <div style={{display:"flex",gap:40,fontSize:14,color:B.muted}}>
              <div><div style={{fontSize:24,fontWeight:800,color:B.accent,marginBottom:4}}>{fmt(signupCount)}</div>Active Users</div>
              <div><div style={{fontSize:24,fontWeight:800,color:B.accent,marginBottom:4}}>{fmt(offerCount)}</div>Live Offers</div>
              <div><div style={{fontSize:24,fontWeight:800,color:B.accent,marginBottom:4}}>$0 Upfront</div>No Fees</div>
            </div>
          </div>

          {/* Right: Featured Offers Preview */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {OFFERS.slice(0,3).map(o=>(
              <div key={o.id} className="card au" style={{padding:12,cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start"}}
                onClick={()=>setPg("earn")}
              >
                <div style={{width:48,height:48,borderRadius:8,background:["#FF6B35","#01D676","#3B82F6","#A855F7","#FFB800"][o.id%5],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                  {o.img&&o.img.startsWith("http") ? <img src={o.img} alt="" style={{width:48,height:48,objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/> : <span style={{fontSize:20,fontWeight:700,color:"#fff"}}>{o.img}</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:4,color:B.txt}}>{o.t.split(" — ")[0]}</div>
                  <div style={{fontSize:12,color:B.accent,fontWeight:700}}>$ {toUSD(o.coins)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EMAIL SIGNUP ─── */}
      <section style={{padding:"40px 32px",background:"rgba(1,214,118,.04)",borderTop:`2px solid ${B.border}`,borderBottom:`2px solid ${B.border}`,textAlign:"center"}}>
        <h2 style={{fontSize:28,fontWeight:700,marginBottom:12,color:B.txt}}>Get Daily Earn Alerts</h2>
        <p style={{fontSize:14,color:B.muted,marginBottom:20}}>Be notified of new high-paying offers instantly</p>
        <div style={{display:"flex",gap:8,maxWidth:400,margin:"0 auto"}}>
          <input type="email" value={signupEmail} onChange={e=>setSignupEmail(e.target.value)}
            placeholder="your@email.com"
            style={{flex:1,padding:"10px 14px",borderRadius:6,border:`1px solid ${B.border}`,background:B.card,color:B.txt,fontSize:14}}
          />
          <button onClick={()=>setSignupEmail("")} style={{background:B.accent,border:"none",color:"#000",padding:"10px 24px",borderRadius:6,fontWeight:700,cursor:"pointer",transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.background=B.accentL}
            onMouseLeave={e=>e.currentTarget.style.background=B.accent}
          >Subscribe</button>
        </div>
      </section>

      {/* ─── SOCIAL AUTH ─── */}
      <section style={{padding:"40px 32px",textAlign:"center"}}>
        <h2 style={{fontSize:24,fontWeight:700,marginBottom:20,color:B.txt}}>Join With Your Account</h2>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          {[{n:"Apple",c:"#000"},{n:"Google",c:"#ea4335"},{n:"Facebook",c:"#1877F2"}].map(x=>(
            <button key={x.n} onClick={onLogin} style={{background:x.c,border:"none",color:"#fff",padding:"10px 32px",borderRadius:6,fontWeight:600,cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>e.currentTarget.style.opacity=.8}
              onMouseLeave={e=>e.currentTarget.style.opacity=1}
            >{x.n}</button>
          ))}
        </div>
      </section>

      {/* ─── RECOMMENDED OFFERS ─── */}
      <section style={{padding:"60px 32px",background:B.card}}>
        <h2 style={{fontSize:28,fontWeight:700,marginBottom:12,color:B.txt,textAlign:"center"}}>Popular Right Now</h2>
        <p style={{fontSize:14,color:B.muted,marginBottom:40,textAlign:"center"}}>These offers are trending today based on earnings</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:20,maxWidth:1200,margin:"0 auto"}}>
          {OFFERS.slice(0,6).map((o,i)=><OfferCard key={o.id} o={o} onStart={()=>setPg("earn")} delay={i*0.05}/>)}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{padding:"60px 32px"}}>
        <h2 style={{fontSize:28,fontWeight:700,marginBottom:40,color:B.txt,textAlign:"center"}}>How It Works</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:24,maxWidth:1000,margin:"0 auto"}}>
          {[
            {n:"1",t:"Pick an Offer",d:"Browse from thousands of available tasks"},
            {n:"2",t:"Complete Task",d:"Follow simple instructions"},
            {n:"3",t:"Earn Rewards",d:"Get paid instantly to your account"},
            {n:"4",t:"Cash Out",d:"Withdraw to PayPal, gift cards, or crypto"},
          ].map((s,i)=>(
            <div key={i} className="card au" style={{padding:28,textAlign:"center",animationDelay:`${i*0.05}s`}}>
              <div style={{width:48,height:48,background:B.accent,color:"#000",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,margin:"0 auto 16px"}}>
                {s.n}
              </div>
              <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,color:B.txt}}>{s.t}</h3>
              <p style={{fontSize:13,color:B.muted}}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PAYOUT METHODS ─── */}
      <section style={{padding:"60px 32px",background:"rgba(1,214,118,.02)"}}>
        <h2 style={{fontSize:28,fontWeight:700,marginBottom:12,color:B.txt,textAlign:"center"}}>Get Paid Your Way</h2>
        <p style={{fontSize:14,color:B.muted,marginBottom:40,textAlign:"center"}}>Withdraw to 12+ payment methods</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:16,maxWidth:800,margin:"0 auto"}}>
          {CASHOUTS.map(c=>(
            <div key={c.id} className="card au" style={{padding:16,textAlign:"center",cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=B.accent;e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=B.border;e.currentTarget.style.transform="translateY(0)"}}
            >
              <div style={{width:40,height:40,background:B.accent,color:"#000",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,margin:"0 auto 8px"}}>
                {c.ic}
              </div>
              <div style={{fontSize:12,fontWeight:600,color:B.txt}}>{c.n}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{padding:"60px 32px",textAlign:"center",background:B.card}}>
        <h2 style={{fontSize:32,fontWeight:800,marginBottom:16,color:B.txt}}>Start Earning Today</h2>
        <p style={{fontSize:16,color:B.light,marginBottom:32}}>Join thousands making real money from home</p>
        <button onClick={onLogin} style={{background:B.accent,border:"none",color:"#000",padding:"14px 48px",borderRadius:8,fontSize:16,fontWeight:700,cursor:"pointer",transition:"all .2s"}}
          onMouseEnter={e=>e.currentTarget.style.background=B.accentL}
          onMouseLeave={e=>e.currentTarget.style.background=B.accent}
        >Get Started Now</button>
      </section>
    </div>
  );
};

const OFFERWALLS = [
  {
    id: "adgate",  name: "AdGate Media", color: "#3B82F6",
    desc: "Premium offers, surveys & app installs",
    key: process.env.NEXT_PUBLIC_ADGATE_WALL_CODE || "",
    iframeUrl: (uid, k) => `https://wall.adgatemedia.com/${k}/${uid}`,
  },
  {
    id: "adgem",  name: "AdGem", color: "#8B5CF6",
    desc: "High-converting games & app offers",
    key: process.env.NEXT_PUBLIC_ADGEM_APP_ID || "",
    iframeUrl: (uid, k) => `https://api.adgem.com/v1/wall?appid=${k}&playerid=${uid}`,
  },
  {
    id: "offertoro", name: "OfferToro", color: "#FF6B35",
    desc: "Global offers with high payouts",
    key: process.env.NEXT_PUBLIC_OFFERTORO_PUB_ID || "",
    key2: process.env.NEXT_PUBLIC_OFFERTORO_APP_ID || "",
    iframeUrl: (uid, k, k2) => `https://www.offertoro.com/ifr/show/${k}/${k2||"1"}/${uid}/0`,
  },
  {
    id: "lootably", name: "Lootably", color: "#00D26A",
    desc: "Rewarded surveys & video offers",
    key: process.env.NEXT_PUBLIC_LOOTABLY_PLACEMENT || "",
    iframeUrl: (uid, k) => `https://wall.lootably.com/?placementID=${k}&sid=${uid}`,
  },
  {
    id: "ayet", name: "Ayet Studios", color: "#A855F7",
    desc: "Top mobile game offers",
    key: process.env.NEXT_PUBLIC_AYET_APP_KEY || "",
    iframeUrl: (uid, k) => `https://www.ayetstudios.com/offers/web_offerwall/${k}?external_identifier=${uid}`,
  },
  {
    id: "cpxresearch", name: "CPX Research", color: "#FF9F1C",
    desc: "Paid surveys from top researchers",
    key: process.env.NEXT_PUBLIC_CPX_APP_ID || "",
    iframeUrl: (uid, k) => `https://offers.cpx-research.com/index.php?app_id=${k}&ext_user_id=${uid}`,
  },
  {
    id: "bitlabs", name: "BitLabs", color: "#00E5FF",
    desc: "Surveys & offers with instant credit",
    key: process.env.NEXT_PUBLIC_BITLABS_TOKEN || "",
    iframeUrl: (uid, k) => `https://web.bitlabs.ai/?uid=${uid}&token=${k}`,
  },
  {
    id: "theoremreach", name: "TheoremReach", color: "#FF2D78",
    desc: "Quick surveys, paid instantly",
    key: process.env.NEXT_PUBLIC_THEOREMREACH_KEY || "",
    iframeUrl: (uid, k) => `https://theoremreach.com/respondent_entry/direct?api_key=${k}&user_id=${uid}`,
  },
  {
    id: "revenueuniverse", name: "Revenue Universe", color: "#FFB800",
    desc: "Diverse offers from top advertisers",
    key: process.env.NEXT_PUBLIC_RU_APP_HASH || "",
    iframeUrl: (uid, k) => `https://wall.revenueuniverse.com/wall/${k}?uid=${uid}`,
  },
  {
    id: "pollfish", name: "Pollfish", color: "#4ADE80",
    desc: "Market research surveys",
    key: process.env.NEXT_PUBLIC_POLLFISH_KEY || "",
    iframeUrl: (uid, k) => `https://wss.pollfish.com/v2/device/register/true?api_key=${k}&request_uuid=${uid}`,
  },
  {
    id: "torox", name: "Torox", color: "#FF3B30",
    desc: "Performance-based CPI offers",
    key: process.env.NEXT_PUBLIC_TOROX_PUB_ID || "",
    iframeUrl: (uid, k) => `https://torfrnt.com/offerwall?pubid=${k}&sid=${uid}`,
  },
  {
    id: "tyrads", name: "TyrAds", color: "#6366F1",
    desc: "Premium mobile CPI campaigns",
    key: process.env.NEXT_PUBLIC_TYRADS_KEY || "",
    iframeUrl: (uid, k) => `https://www.tyrads.com/api/v1/offerwall?apiKey=${k}&userId=${uid}`,
  },
];

// ═══════════════════════════════════════════════════════════════
//  PAGE: EARN (Browse Offers)
// ═══════════════════════════════════════════════════════════════
const Earn = ({onEarn, user, setPg, onLogin}) => {
  const [activeWall, setActiveWall] = useState(null);
  const [comingSoonWall, setComingSoonWall] = useState(null);
  const [cat, setCat] = useState("featured");
  const [sort, setSort] = useState("pop");
  const [search, setSearch] = useState("");
  const uid = user?.id || "demo";

  const filtered = useMemo(() => {
    return OFFERS
      .filter(o => cat === "featured" ? o.hot : cat === "all" ? true : o.cat === cat)
      .filter(o => !search || o.t.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sort === "pop" ? b.pop - a.pop : sort === "pay" ? b.coins - a.coins : b.rate - a.rate);
  }, [cat, sort, search]);

  const isConfigured = (wall) => {
    const k = wall.key;
    return k && k.length > 3 && !k.startsWith("your-");
  };

  const findWall = (wallName) => OFFERWALLS.find(w =>
    w.name.toLowerCase() === wallName.toLowerCase() ||
    w.name.toLowerCase().includes(wallName.toLowerCase()) ||
    wallName.toLowerCase().includes(w.name.toLowerCase())
  );

  const handleOfferStart = (offer) => {
    if (!user) { if(onLogin) onLogin(); return; }
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
    <div style={{maxWidth:1200, margin:"0 auto", padding:"40px 32px"}}>
      {comingSoonWall && (
        <div className="au" style={{position:"fixed",top:80,right:20,zIndex:9999,padding:"14px 24px",borderRadius:12,background:"rgba(255,159,28,.15)",border:"1px solid rgba(255,159,28,.3)",backdropFilter:"blur(20px)",color:B.warn,fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
          {Icon.clock(16,B.warn)} {comingSoonWall} is coming soon!
        </div>
      )}

      {activeWall ? (
        <div>
          <button onClick={() => setActiveWall(null)} style={{
            display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:B.accentL,
            fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:16,padding:0,
          }}>{Icon.arrowRight(16,B.accentL)} Back to offers</button>
          <div className="card" style={{overflow:"hidden",border:`2px solid ${activeWall.color}30`}}>
            <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${B.border}`,background:`linear-gradient(135deg,${activeWall.color}08,transparent)`}}>
              <div style={{width:32,height:32,borderRadius:6,background:activeWall.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {Icon.earn(18,"#fff")}
              </div>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{activeWall.name}</div>
                <div style={{fontSize:11,color:B.muted}}>Coins credited automatically on completion</div>
              </div>
            </div>
            <div style={{position:"relative",width:"100%",height:"70vh",overflow:"hidden",borderRadius:"0 0 12px 12px"}}>
              <iframe
                src={activeWall.iframeUrl(uid, activeWall.key, activeWall.key2)}
                style={{width:"100%",height:"100%",border:"none",background:"#1a1a2e",filter:"invert(.88) hue-rotate(180deg)",colorScheme:"dark"}}
                title={`${activeWall.name} Offerwall`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                allow="clipboard-write"
              />
            </div>
          </div>
        </div>
      ) : (
      <>
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:32,fontWeight:800,marginBottom:24,color:B.txt}}>Earn</h1>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200,position:"relative"}}>
              <input placeholder="Search offers..." value={search} onChange={e => setSearch(e.target.value)}
                style={{width:"100%",padding:"12px 14px 12px 40px",borderRadius:8,border:`1px solid ${B.border}`,background:B.card,color:B.txt,fontSize:14}}/>
              <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>
                {Icon.search(18,B.muted)}
              </div>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{padding:"12px 16px",background:B.card,border:`1px solid ${B.border}`,borderRadius:8,color:B.txt,fontSize:13,cursor:"pointer"}}>
              <option value="pop">Most Popular</option>
              <option value="pay">Highest Paying</option>
              <option value="easy">Easiest First</option>
            </select>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
            {[{id:"all",n:"All",c:B.accent},...CATS].map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                padding:"8px 16px",borderRadius:20,whiteSpace:"nowrap",fontSize:13,fontWeight:cat===c.id?600:500,cursor:"pointer",transition:"all .15s",
                background:cat===c.id?`${c.c||B.accent}20`:"transparent",
                border:`2px solid ${cat===c.id?(c.c||B.accent):B.border}`,
                color:cat===c.id?(c.c||B.accent):B.muted,
              }}>{c.n}</button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:20}}>
          {filtered.map((o,i) => <OfferCard key={o.id} o={o} onEarn={onEarn} onStart={handleOfferStart} delay={i*0.02}/>)}
        </div>
        {filtered.length===0 && <div style={{textAlign:"center",padding:"60px 20px",color:B.muted}}>
          <p style={{fontSize:16}}>No offers match your search</p>
        </div>}
      </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD (Personal Stats)
// ═══════════════════════════════════════════════════════════════
const Dashboard = ({user, coins, streak}) => {
  const lv = getLevel(coins);
  const [tabs, setTabs] = useState("overview");

  return (
    <div style={{padding:"40px 32px",maxWidth:1200,margin:"0 auto"}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8,color:B.txt}}>Welcome back, {user?.username}</h1>
      <p style={{fontSize:14,color:B.muted,marginBottom:32}}>Here's your earning snapshot</p>

      {/* Quick Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:40}}>
        <Stat label="Total Earned" value={`\$${toUSD(coins)}`} grad={B.gradOk} delay={0} />
        <Stat label="Current Level" value={lv.n} sub={`${lv.bonus}% bonus`} grad={B.gradGold} delay={0.1} />
        <Stat label="Active Streak" value={`${streak} days`} grad={B.gradHot} delay={0.2} />
        <Stat label="Available Balance" value={`\$${toUSD(coins)}`} grad={B.gradFomo} delay={0.3} />
      </div>

      {/* Streak Tracker */}
      <div className="card au" style={{padding:24,marginBottom:32}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          {Icon.fire(20,"#FF6B35")}
          <h2 style={{fontSize:18,fontWeight:700,color:B.txt}}>Your {streak}-Day Streak</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(28px, 1fr))",gap:6,maxWidth:400}}>
          {Array.from({length:30}).map((_,i)=>(
            <div key={i} style={{width:"100%",paddingBottom:"100%",position:"relative"}}>
              <div style={{position:"absolute",inset:0,borderRadius:4,background:i<streak?B.accent:"rgba(255,255,255,.06)",border:`1px solid ${i<streak?"transparent":B.border}`}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Activity / Earnings Chart Placeholder */}
      <div className="card au" style={{padding:24}}>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,color:B.txt}}>This Week's Earnings</h2>
        <div style={{height:200,background:"rgba(1,214,118,.04)",borderRadius:8,display:"flex",alignItems:"flex-end",gap:12,padding:"20px",justifyContent:"space-around"}}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>{
            const h = 30 + Math.random() * 150;
            return <div key={day} style={{flex:1,background:B.accent,height:`${h}px`,borderRadius:4,opacity:0.7+Math.random()*0.3}}title={day}/>;
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: LEADERBOARD
// ═══════════════════════════════════════════════════════════════
const Leaderboard = () => {
  const medals = ["1st", "2nd", "3rd"];
  return (
    <div style={{padding:"40px 32px",maxWidth:800,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
        {Icon.trophy(24,B.accent)}
        <h1 style={{fontSize:28,fontWeight:800,color:B.txt}}>Top Earners</h1>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {LEADERS.map((l,i)=>(
          <div key={l.r} className="card au" style={{padding:16,display:"flex",alignItems:"center",gap:16,animationDelay:`${i*0.03}s`}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:[B.gold,"#c0c0c0","#cd7f32"][i]||B.muted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#000"}}>
              {medals[i]||l.r}
            </div>
            <div style={{width:36,height:36,borderRadius:"50%",background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#000"}}>
              {l.av}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:B.txt}}>{l.name}</div>
              <div style={{fontSize:12,color:B.muted}}>{l.lvl} Level</div>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:700,color:B.accent}}>${toUSD(l.coins)}</div>
                <div style={{fontSize:11,color:B.muted}}>{l.streak}d streak</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: REWARDS / CASHOUT
// ═══════════════════════════════════════════════════════════════
const Rewards = ({user, coins, onCashout}) => {
  const [selectedMethod, setSelectedMethod] = useState(CASHOUTS[0]);
  const [amount, setAmount] = useState(coins);
  const [err, setErr] = useState("");

  const handleCashout = async () => {
    if(amount<selectedMethod.min) {
      setErr(`Minimum \$${toUSD(selectedMethod.min)}`);
      return;
    }
    try {
      await onCashout(selectedMethod.id, amount);
      setAmount(coins);
    } catch(e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{padding:"40px 32px",maxWidth:600,margin:"0 auto"}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:8,color:B.txt}}>Cash Out</h1>
      <p style={{fontSize:14,color:B.muted,marginBottom:32}}>Your available balance: ${toUSD(coins)}</p>

      {err&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",marginBottom:20,color:"#F87171",fontSize:13}}>{err}</div>}

      {/* Amount Input */}
      <div style={{marginBottom:24}}>
        <label style={{display:"block",fontSize:12,color:B.muted,marginBottom:8,fontWeight:600}}>Amount to Withdraw</label>
        <div style={{display:"flex",gap:8}}>
          <input type="number" value={amount} onChange={e=>setAmount(Math.max(0,Number(e.target.value)))}
            style={{flex:1,padding:"12px 14px",borderRadius:8,border:`1px solid ${B.border}`,background:B.card,color:B.txt,fontSize:14}}
          />
          <button onClick={()=>setAmount(coins)} style={{padding:"12px 16px",borderRadius:8,border:`1px solid ${B.border}`,background:"transparent",color:B.accent,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Max</button>
        </div>
      </div>

      {/* Method Selection */}
      <label style={{display:"block",fontSize:12,color:B.muted,marginBottom:12,fontWeight:600}}>Payment Method</label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))",gap:12,marginBottom:24}}>
        {CASHOUTS.filter(c=>c.pop).map(c=>(
          <button key={c.id} onClick={()=>setSelectedMethod(c)} style={{
            padding:16,borderRadius:8,border:`2px solid ${selectedMethod.id===c.id?B.accent:B.border}`,
            background:selectedMethod.id===c.id?`${B.accent}15`:"transparent",
            cursor:"pointer",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:8
          }}>
            <div style={{width:36,height:36,borderRadius:6,background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#000"}}>
              {c.ic}
            </div>
            <span style={{fontSize:12,fontWeight:600,color:selectedMethod.id===c.id?B.accent:B.muted}}>{c.n}</span>
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{background:"rgba(1,214,118,.06)",border:`1px solid rgba(1,214,118,.2)`,borderRadius:8,padding:14,marginBottom:24,fontSize:13,color:B.light}}>
        <div>Fee: <strong>{selectedMethod.fee}</strong></div>
        <div>Speed: <strong>{selectedMethod.spd}</strong></div>
        <div style={{marginTop:8,color:B.muted}}>You'll receive ${toUSD(amount*(1-parseFloat(selectedMethod.fee)/100))}</div>
      </div>

      <button onClick={handleCashout} style={{
        width:"100%",padding:"14px 0",background:B.accent,border:"none",color:"#000",borderRadius:8,
        fontSize:15,fontWeight:700,cursor:"pointer",transition:"all .2s"
      }}
      onMouseEnter={e=>e.currentTarget.style.background=B.accentL}
      onMouseLeave={e=>e.currentTarget.style.background=B.accent}
      >Withdraw ${toUSD(amount)}</button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  PAGE: ADMIN DASHBOARD
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
    {id:"overview",l:"Overview",ic:""},
    {id:"offerwalls",l:"Offerwalls",ic:""},
    {id:"users",l:"Users",ic:""},
    {id:"payouts",l:"Payouts",ic:""},
    {id:"analytics",l:"Analytics",ic:""},
    {id:"fraud",l:"Fraud",ic:""},
  ];

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if(loading) return (
    <div style={{padding:"80px 24px",textAlign:"center"}}>
      <div style={{marginBottom:16}} className="ap">{Icon.chart(48,B.accent)}</div>
      <div style={{fontSize:18,fontWeight:600,color:B.accentL}}>Loading Admin Dashboard...</div>
    </div>
  );

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px"}}>
      {/* Header */}
      <div style={{marginBottom:28}} className="au">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          {Icon.admin(28,B.accent)}
          <h1 style={{fontSize:28,fontWeight:800,fontFamily:"'Poppins'"}}>Admin Dashboard</h1>
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
              {l:"Revenue Today",v:fmtUSD(data.revenueToday),c:"#60A5FA",ic:""},
              {l:"Revenue This Week",v:fmtUSD(data.revenueWeek),c:"#A78BFA",ic:""},
              {l:"Revenue This Month",v:fmtUSD(data.revenueMonth),c:"#34D399",ic:""},
              {l:"Revenue All Time",v:fmtUSD(data.revenueTotal),c:"#FBBF24",ic:""},
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
              {l:"Profit Today",v:fmtUSD(data.profitToday),c:"#10B981",ic:""},
              {l:"Profit This Week",v:fmtUSD(data.profitWeek),c:"#34D399",ic:""},
              {l:"Profit This Month",v:fmtUSD(data.profitMonth),c:"#10B981",ic:""},
              {l:"Profit All Time",v:fmtUSD(data.profitTotal),c:"#10B981",ic:""},
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
                    <td style={{padding:"10px 14px",color:B.dim}}>#{(p.id||'').toString().slice(0,8)}</td>
                    <td style={{padding:"10px 14px",fontWeight:600}}>{p.user?.username||p.username||'—'}<br/><span style={{fontSize:10,color:B.dim}}>{p.user?.email||p.email||''}</span></td>
                    <td style={{padding:"10px 14px"}}>
                      <span style={{background:"rgba(124,58,237,.08)",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:600,textTransform:"uppercase"}}>{p.method}</span>
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
              {Icon.admin(18,"#F87171")} Multi-Account Detection (Same IP)
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
              {Icon.fire(18,"#F59E0B")} Unusually High Earners (24h)
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

// ═══════════════════════════════════════════════════════════════
//  PAGE: PROFILE
// ═══════════════════════════════════════════════════════════════
const Profile = ({user, coins, streak}) => {
  const lv = getLevel(coins);

  return (
    <div style={{padding:"40px 32px",maxWidth:600,margin:"0 auto"}}>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:32,color:B.txt}}>Your Profile</h1>

      {/* User Card */}
      <div className="card au" style={{padding:24,marginBottom:24,textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:700,color:"#000",margin:"0 auto 16px"}}>
          {(user?.username||"A")[0].toUpperCase()}
        </div>
        <h2 style={{fontSize:20,fontWeight:700,color:B.txt,marginBottom:8}}>{user?.username}</h2>
        <p style={{color:B.muted,fontSize:13,marginBottom:16}}>{user?.email}</p>
        <div style={{display:"flex",justifyContent:"center",gap:20,paddingTop:16,borderTop:`1px solid ${B.border}`}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:B.accent}}>Level {lv.idx+1}</div>
            <div style={{fontSize:12,color:B.muted}}>{lv.n}</div>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:B.accent}}>{streak}</div>
            <div style={{fontSize:12,color:B.muted}}>Day Streak</div>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:B.accent}}>${toUSD(coins)}</div>
            <div style={{fontSize:12,color:B.muted}}>Total Earned</div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card au" style={{padding:20,marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:12,color:B.muted,fontWeight:600}}>Progress to next level</span>
          <span style={{fontSize:12,color:B.accent,fontWeight:700}}>{Math.round(pct(coins))}%</span>
        </div>
        <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
          <div className="progress-bar" style={{width:`${pct(coins)}%`,background:B.accent}}/>
        </div>
        {lv.next&&<div style={{fontSize:11,color:B.muted,marginTop:8}}>
          ${toUSD(lv.next-coins)} to next level
        </div>}
      </div>

      {/* Achievements */}
      <div className="card au" style={{padding:20}}>
        <h2 style={{fontSize:14,fontWeight:700,marginBottom:16,color:B.txt}}>Achievements</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(60px, 1fr))",gap:12}}>
          {["Early Bird","Streak Master","High Earner","Speed Racer","Completion King"].map((a,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:i<3?B.accent:"rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                {i<3?Icon.check(20,B.bg):Icon.star(16,B.muted)}
              </div>
              <span style={{fontSize:11,color:B.muted,textAlign:"center"}}>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ─── FOOTER ───
const Footer = () => (
  <footer style={{background:B.nav,borderTop:`2px solid ${B.border}`,padding:"40px 32px"}}>
    <div style={{maxWidth:1200,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{width:28,height:28,borderRadius:6,background:B.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#000",fontWeight:900}}>$</div>
          <span style={{fontSize:16,fontWeight:800,color:"#fff"}}><span style={{color:B.accent}}>POCKET</span>LINED</span>
        </div>
        <p style={{fontSize:12,color:B.muted}}>Earn real money completing simple tasks</p>
      </div>
      <div style={{display:"flex",gap:24}}>
        {["Terms","Privacy","Support","Blog"].map(l=>(
          <a key={l} href="#" style={{fontSize:12,color:B.muted,textDecoration:"none",transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color=B.accent}
            onMouseLeave={e=>e.currentTarget.style.color=B.muted}
          >{l}</a>
        ))}
      </div>
      <p style={{fontSize:11,color:B.dim,width:"100%",textAlign:"center",marginTop:12}}>
        PocketLined.com {new Date().getFullYear()}. All rights reserved.
      </p>
    </div>
  </footer>
);

// ═══════════════════════════════════════════════════════════════
//  MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [pg, setPg] = useState("home");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [coins, setCoins] = useState(5000);
  const [streak, setStreak] = useState(12);
  const [role, setRole] = useState("user");
  const [showAuth, setShowAuth] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('cf_token');
    if(t) {
      setToken(t);
      setUser({username:"User",email:"user@example.com"});
    }
  }, []);

  const showToast = (msg, type="success") => {
    const id = Date.now();
    setToasts(p => [...p, {id, msg, type}]);
    setTimeout(() => setToasts(p => p.filter(x => x.id!==id)), 3000);
  };

  const handleAuth = (u, tk) => {
    setUser(u);
    setToken(tk);
    setShowAuth(false);
    showToast("Welcome!");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cf_token');
    setPg("home");
    showToast("Logged out");
  };

  const handleEarn = (o) => {
    if(!user) { setShowAuth(true); return; }
    if(!o.wall || o.wall==="Direct") {
      showToast(`Offer wall not configured: ${o.wall}`);
      return;
    }
    const wall = process.env[`NEXT_PUBLIC_${o.wall.toUpperCase().replace(/ /g,"_")}_URL`];
    if(wall) window.open(wall, "_blank");
    else showToast("Offerwall URL not found");
  };

  const handleCashout = async (methodId, amt) => {
    if(!user) { setShowAuth(true); return; }
    try {
      await apiFetch('/api/payouts', { method:'POST', body:JSON.stringify({method:methodId, coins:amt, destination:methodId}) });
      setCoins(c => c-amt);
      showToast("Cashout initiated! Check your email.");
    } catch(e) {
      showToast(e.message, "error");
      throw e;
    }
  };

  return (
    <>
      <style>{css}</style>
      <LiveTicker/>
      <Nav pg={pg} setPg={setPg} coins={coins} streak={streak} role={role} user={user} onLogin={()=>setShowAuth(true)} onLogout={handleLogout}/>

      <main style={{background:B.bg,minHeight:"calc(100vh - 66px)"}}>
        {pg==="home" && <Home setPg={setPg} user={user} onLogin={()=>setShowAuth(true)}/>}
        {pg==="earn" && <Earn setPg={setPg} user={user} onLogin={()=>setShowAuth(true)} onEarn={handleEarn}/>}
        {pg==="dash" && user && <Dashboard user={user} coins={coins} streak={streak}/>}
        {pg==="leaderboard" && <Leaderboard/>}
        {pg==="rewards" && user && <Rewards user={user} coins={coins} onCashout={handleCashout}/>}
        {pg==="admin"&&role==="admin"&&user&&<AdminDash token={token}/>}
        {pg==="profile" && user && <Profile user={user} coins={coins} streak={streak}/>}
      </main>
      <Footer/>

      {showAuth && <AuthModal onAuth={handleAuth} onClose={()=>setShowAuth(false)}/>}

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{background:t.type==="error"?"rgba(239,68,68,.2)":"rgba(1,214,118,.2)",color:t.type==="error"?"#F87171":B.accent}}>
            {t.type==="success" && Icon.check(16)}
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}
