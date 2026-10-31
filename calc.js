/* TradeMind calculation engine. Mirrors the formulas in the Excel "Trading Journal" workbook.
   Pure functions only (no DOM) so they can be unit-tested in Node. */
(function (root) {
  'use strict';

  const num = v => { if (v === '' || v == null) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
  // Excel-style ROUND (half away from zero)
  const round = (n, d = 2) => { const f = Math.pow(10, d); return Math.sign(n) * Math.round(Math.abs(n) * f * (1 + 1e-12)) / f || 0; };

  /* ---------- dates (all 'YYYY-MM-DD' strings, no timezone surprises) ---------- */
  const pad = n => String(n).padStart(2, '0');
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); };
  const mondayOf = s => { const [y, m, d] = s.split('-').map(Number); const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return addDays(s, -((dow + 6) % 7)); };

  /* ---------- stable ids for "one record per date" items so two devices never create duplicates ---------- */
  function detId(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x7f4a7c15;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
      h3 = Math.imul(h3 ^ c, 2246822519); h4 = Math.imul(h4 ^ c, 3266489917);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
    h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
    h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = [h1, h2, h3, h4].map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-4' + hex.slice(13, 16) + '-8' + hex.slice(17, 20) + '-' + hex.slice(20, 32);
  }

  /* ---------- defaults ---------- */
  const DEFAULT_INSTRUMENTS = [
    { name: 'EURUSD', pipSize: 0.0001, pipValue: 10 },
    { name: 'GBPUSD', pipSize: 0.0001, pipValue: 10 },
    { name: 'USDJPY', pipSize: 0.01, pipValue: 6.5 },
    { name: 'AUDJPY', pipSize: 0.01, pipValue: 6.5 },
    { name: 'GBPJPY', pipSize: 0.01, pipValue: 6.5 },
    { name: 'AUDUSD', pipSize: 0.0001, pipValue: 10 },
    { name: 'XAUUSD', pipSize: 0.1, pipValue: 10 },
    { name: 'US30', pipSize: 1, pipValue: 1 },
    { name: 'NAS100', pipSize: 1, pipValue: 1 },
    { name: 'BTCUSD', pipSize: 1, pipValue: 1 }
  ];
  const DEFAULT_QUESTIONS = [
    'Slept enough / feel well?',
    'Calm - no revenge or FOMO urge?',
    'High-impact news checked?',
    'Higher-timeframe levels marked and bias set?',
    'Trading only in my chosen session?',
    'Spread normal?',
    'Risk % set; max trades and daily loss limit accepted?',
    "Yesterday's journal and review done?"
  ];
  const DEFAULT_SETTINGS = () => ({
    balance: 1000, currency: 'USD', riskPct: 1, minRR: 1.5, maxDailyLossPct: 3, maxTradesPerDay: 3, maxCloudMB: 50, driveClientId: '',
    instruments: DEFAULT_INSTRUMENTS.map(i => ({ ...i })),
    strategies: [],
    dailyQuestions: DEFAULT_QUESTIONS.slice()
  });

  const OPTIONS = {
    timeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'],
    sessions: ['Asia', 'London', 'New York', 'London/NY overlap', 'Other'],
    orderTypes: ['Market', 'Buy limit', 'Sell limit', 'Buy stop', 'Sell stop'],
    pendingResults: ['n/a (market)', 'Filled', 'Cancelled', 'Expired'],
    mistakes: ['None', 'Early entry', 'Moved stop', 'Broke a rule', 'Oversized', 'Chased', 'Skipped checklist', 'Revenge trade', 'Other'],
    moods: ['Calm', 'Confident', 'Bored', 'Anxious', 'FOMO', 'Frustrated', 'Revenge', 'Overconfident', 'Tired'],
    zones: ['OB', 'Breaker', 'FVG', 'IFVG', 'S/R', 'Supply/Demand', 'Trendline', 'Other'],
    rejections: ['Pin bar', 'Engulfing', 'Long wick', 'Other'],
    moodsAfter: ['Calm', 'Satisfied', 'Relieved', 'Excited', 'Disappointed', 'Frustrated', 'Regretful', 'Angry', 'Anxious', 'Tired'],
    checkinContexts: ['Before trading', 'During trading', 'After trading', 'End of day', 'Other'],
    checkinEmotions: ['Calm', 'Confident', 'Satisfied', 'Relieved', 'Excited', 'Bored', 'Anxious', 'Fearful', 'Impatient', 'FOMO', 'Frustrated', 'Disappointed', 'Regretful', 'Angry', 'Revenge', 'Overconfident', 'Tired'],
    lifeMoods: ['Great', 'Good', 'Okay', 'Low', 'Stressed', 'Anxious', 'Tired', 'Angry'],
    intensities: ['1', '2', '3', '4', '5']
  };
  const RISKY_MOODS = ['FOMO', 'Frustrated', 'Revenge', 'Overconfident', 'Tired'];   // Weekly Check column J
  const RISKY_AFTER = ['Frustrated', 'Disappointed', 'Regretful', 'Angry'];            // how you feel AFTER a trade that can lead to tilt
  const REVIEW_MOODS = ['Revenge', 'FOMO', 'Tired'];                                 // Daily Review flag

  /* ---------- Trade Log: every calculated column of the Excel sheet ---------- */
  function sortTrades(list) {
    return list.filter(t => !t.deleted)
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || ''));
  }

  function enrich(trades, s) {
    let cumNet = 0, peak = s.balance;
    return sortTrades(trades).map((t, i) => {
      const inst = (s.instruments || []).find(x => x.name === t.instrument);
      const pip = inst ? num(inst.pipSize) : null, pv = inst ? num(inst.pipValue) : null;
      const unfilled = t.pendingResult === 'Cancelled' || t.pendingResult === 'Expired';   // never filled = not counted
      const entry = num(t.entry), sl = num(t.sl), tp = num(t.tp), exit = unfilled ? null : num(t.exit), costs = num(t.costs) || 0;
      const dirSign = t.direction === 'Buy' ? 1 : t.direction === 'Sell' ? -1 : 0;

      const riskPips = entry != null && sl != null && pip > 0 ? Math.abs(entry - sl) / pip : null;
      const rewardPips = entry != null && tp != null && pip > 0 ? Math.abs(tp - entry) / pip : null;
      const plannedRR = riskPips > 0 && rewardPips != null ? round(rewardPips / riskPips, 2) : null;
      const rrCheck = plannedRR == null ? '' : plannedRR >= s.minRR ? 'OK' : 'LOW';
      const riskUsd = t.date && entry != null && sl != null ? round((s.balance + cumNet) * s.riskPct / 100, 2) : null;
      const lot = riskUsd != null && riskPips > 0 && pv > 0 ? round(riskUsd / (riskPips * pv), 2) : null;
      const R = exit != null && entry != null && sl != null && dirSign && entry !== sl
        ? round((exit - entry) * dirSign / Math.abs(entry - sl), 2) : null;
      const net = R != null && riskUsd != null ? round(R * riskUsd - costs, 2) : null;
      const outcome = net == null ? '' : R > 0.05 ? 'Win' : R < -0.05 ? 'Loss' : 'BE';
      let balanceAfter = null, drawdown = null;
      if (net != null) {
        cumNet = round(cumNet + net, 2);
        balanceAfter = round(s.balance + cumNet, 2);
        peak = Math.max(peak, balanceAfter);
        drawdown = round(peak - balanceAfter, 2);
      }
      const spread = num(t.spread);
      const spreadPct = spread != null && riskPips > 0 ? round(spread / riskPips, 3) : null;
      const ot = t.orderType;
      const orderCheck = !t.direction || !ot ? '' :
        ((t.direction === 'Buy' && (ot === 'Sell limit' || ot === 'Sell stop')) ||
         (t.direction === 'Sell' && (ot === 'Buy limit' || ot === 'Buy stop'))) ? 'CHECK' : 'OK';
      const moodShift = t.mood && t.moodAfter ? t.mood + ' → ' + t.moodAfter : '';
      return { ...t, n: i + 1, moodShift, riskPips, rewardPips, plannedRR, rrCheck, riskUsd, lot, R, net, outcome, balanceAfter, drawdown, spreadPct, orderCheck };
    });
  }

  /* ---------- Dashboard ---------- */
  const closed = rows => rows.filter(r => r.outcome);
  const sum = (a, f) => a.reduce((x, r) => x + (f(r) || 0), 0);

  function stats(rows, s) {
    const c = closed(rows), n = c.length, wins = c.filter(r => r.outcome === 'Win'), losses = c.filter(r => r.outcome === 'Loss');
    const gp = sum(c.filter(r => r.net > 0), r => r.net), gl = -sum(c.filter(r => r.net < 0), r => r.net);
    const net = round(sum(c, r => r.net), 2);
    const maxDD = n ? Math.max(...c.map(r => r.drawdown || 0)) : 0;
    const followed = c.filter(r => r.followed === 'Y').length;
    return {
      closed: n, wins: wins.length, losses: losses.length,
      winRate: n ? wins.length / n : null,
      avgR: n ? sum(c, r => r.R) / n : null,
      totalR: round(sum(c, r => r.R), 2),
      profitFactor: gl > 0 ? gp / gl : null,
      avgWinR: wins.length ? sum(wins, r => r.R) / wins.length : null,
      avgLossR: losses.length ? sum(losses, r => r.R) / losses.length : null,
      net, balance: round(s.balance + net, 2),
      returnPct: s.balance ? net / s.balance : null,
      maxDD, maxDDPct: s.balance ? maxDD / s.balance : null,
      compliance: n ? followed / n : null,
      lowRR: rows.filter(r => r.rrCheck === 'LOW').length
    };
  }

  function breakdown(rows, key) {
    const g = {};
    closed(rows).forEach(r => { const k = r[key]; if (k) (g[k] = g[k] || []).push(r); });
    return Object.entries(g).map(([k, a]) => ({
      key: k, count: a.length,
      winRate: a.filter(r => r.outcome === 'Win').length / a.length,
      avgR: sum(a, r => r.R) / a.length, totalR: round(sum(a, r => r.R), 2), net: round(sum(a, r => r.net), 2)
    })).sort((x, y) => y.count - x.count);
  }

  function today(rows, s, dateStr) {
    const st = stats(rows, s);
    const day = rows.filter(r => r.date === dateStr);
    const pnl = round(sum(day, r => r.net), 2);
    const limit = -round(st.balance * s.maxDailyLossPct / 100, 2);
    const status = limit < 0 && pnl <= limit ? 'STOP - daily loss limit hit'
      : day.length >= s.maxTradesPerDay ? 'STOP - max trades reached' : 'OK to trade';
    return { date: dateStr, trades: day.length, pnl, limit, status, stop: status !== 'OK to trade' };
  }

  /* ---------- Weekly Check (auto columns B-J) ---------- */
  function week(rows, monday) {
    const end = addDays(monday, 6);
    const inW = rows.filter(r => r.date >= monday && r.date <= end);
    const c = closed(inW), n = c.length, wins = c.filter(r => r.outcome === 'Win').length;
    return {
      monday, end, closed: n, wins, losses: c.filter(r => r.outcome === 'Loss').length,
      winRate: n ? wins / n : null,
      totalR: round(sum(inW, r => r.R), 2), net: round(sum(inW, r => r.net), 2),
      compliance: n ? c.filter(r => r.followed === 'Y').length / n : null,
      lowRR: inW.filter(r => r.rrCheck === 'LOW').length,
      riskyMood: inW.filter(r => RISKY_MOODS.includes(r.mood)).length,
      riskyAfter: inW.filter(r => RISKY_AFTER.includes(r.moodAfter)).length,
      missingChecks: c.filter(r => !r.mood || !r.moodAfter).length
    };
  }
  const weekVerdict = (auto, answers) =>
    answers.filter(a => a === 'Y').length === 5 && (auto.closed === 0 || auto.compliance >= 0.9) && auto.lowRR === 0 ? 'GOOD WEEK' : 'REVIEW';

  /* ---------- Daily Review (auto columns) ---------- */
  function dayAuto(rows, s, date) {
    const day = rows.filter(r => r.date === date);
    return { trades: day.length, pnl: round(sum(day, r => r.net), 2) };
  }
  const reviewFlag = (rev, auto, s) =>
    rev.followed === 'N' || REVIEW_MOODS.includes(rev.mood) || auto.pnl <= -(s.balance * s.maxDailyLossPct / 100) && auto.pnl < 0 ? 'REVIEW' : 'ok';

  /* ---------- Checklist ---------- */
  function checklistDecision(rules, answers) {
    if (!rules.length) return 'Add rules';
    const bad = rules.some((r, i) => r.must && answers[i] !== 'Y');
    return bad ? 'NO TRADE' : 'GO';
  }

  /* ---------- Emotions before / after each trade ---------- */
  const modeOf = list => { const m = {}; list.forEach(x => { if (x) m[x] = (m[x] || 0) + 1; }); const e = Object.entries(m).sort((a, b) => b[1] - a[1]); return e.length ? e[0][0] : null; };
  function emotionCoach(c, out, f2, avg) {
    const aft = c.filter(r => r.moodAfter);
    const w = aft.filter(r => r.outcome === 'Win'), l = aft.filter(r => r.outcome === 'Loss');
    if (w.length >= 3 && l.length >= 3) out.findings.push(`After wins you most often felt "${modeOf(w.map(r => r.moodAfter))}"; after losses you most often felt "${modeOf(l.map(r => r.moodAfter))}".`);
    const calmStart = aft.filter(r => ['Calm', 'Confident'].includes(r.mood) && RISKY_AFTER.includes(r.moodAfter));
    if (calmStart.length >= 2) out.findings.push(`${calmStart.length} trade(s) started calm or confident but left you feeling ${[...new Set(calmStart.map(r => r.moodAfter))].join(' / ').toLowerCase()}, ${calmStart.filter(r => r.outcome === 'Win').length} of them wins. Check whether the exit plan or your expectations were the problem.`);
    // carry-over: the next trade the same day after a loss that left you in a bad mood
    const after = [], base = [];
    c.forEach((r, i) => { const nx = c[i + 1]; if (r.outcome === 'Loss' && nx && nx.date === r.date) { (RISKY_AFTER.includes(r.moodAfter) ? after : base).push(nx); } });
    if (after.length >= 3) out.findings.push(`After ${after.length} losses that left you frustrated, disappointed, regretful or angry, your next trade the same day averaged ${f2(avg(after))}R${base.length >= 3 ? ` (versus ${f2(avg(base))}R after other losses)` : ''}.`);
    if (after.length >= 3 && avg(after) < 0) out.actions.push('After a loss that leaves you frustrated or angry, take a 15-minute break (or stop for the day) before the next trade.');
    const hi = c.filter(r => Number(r.intensityBefore) >= 4), lo = c.filter(r => Number(r.intensityBefore) > 0 && Number(r.intensityBefore) <= 2);
    if (hi.length >= 3 && lo.length >= 3) out.findings.push(`When your feeling before entry was strong (4-5) you averaged ${f2(avg(hi))}R; when it was faint (1-2), ${f2(avg(lo))}R.`);
    const missing = c.filter(r => !r.mood || !r.moodAfter).length;
    if (missing) out.actions.push(`${missing} closed trade(s) are missing a before or after emotional check. Fill both in for every trade - the coach gets sharper with each one.`);
  }

  /* ---------- Life journal vs trading results ---------- */
  function lifeLink(rows, life) {
    const out = [], by = {}; closed(rows).forEach(r => { (by[r.date] = by[r.date] || []).push(r); });
    const pairs = (life || []).filter(l => by[l.date]).map(l => ({ l, t: by[l.date] }));
    const grp = test => pairs.filter(p => test(p.l)).flatMap(p => p.t);
    const avgR = ts => sum(ts, r => r.R) / ts.length, f2 = v => v.toFixed(2);
    const cmp = (a, b, an, bn) => { const x = grp(a), y = grp(b); if (x.length >= 3 && y.length >= 3) out.push(`${an}: ${f2(avgR(x))}R average over ${x.length} trades. ${bn}: ${f2(avgR(y))}R over ${y.length} trades.`); };
    const sl = l => num(l.sleep), st = l => num(l.stress);
    cmp(l => sl(l) != null && sl(l) < 6, l => sl(l) != null && sl(l) >= 6, 'On days you slept under 6 hours', 'On days you slept 6+ hours');
    cmp(l => st(l) != null && st(l) >= 4, l => st(l) != null && st(l) < 4, 'On high-stress days (4-5)', 'On calmer days');
    cmp(l => ['Low', 'Stressed', 'Anxious', 'Tired', 'Angry'].includes(l.mood), l => ['Great', 'Good', 'Okay'].includes(l.mood), 'On days that felt low or stressed', 'On days that felt good');
    return out;
  }

  /* ---------- Free rule-based coach ---------- */
  function coach(rows, s, life) {
    const c = closed(rows), out = { findings: [], actions: [] };
    if (c.length < 1) {
      out.findings.push('No closed trades yet. Log trades with an exit price and TradeMind will start finding patterns in your own data.');
      out.actions.push('Do the Daily Check before you trade and run the Checklist before every entry.');
      return out;
    }
    const st = stats(rows, s), avg = a => a.length ? sum(a, r => r.R) / a.length : null, f2 = v => v.toFixed(2);
    out.findings.push(`${c.length} closed trades: win rate ${(st.winRate * 100).toFixed(0)}%, average ${f2(st.avgR)}R per trade, total ${f2(st.totalR)}R. ${c.length < 30 ? 'Under 30 trades is a small sample - treat these as early signals, not conclusions.' : ''}`.trim());
    const fy = c.filter(r => r.followed === 'Y'), fn = c.filter(r => r.followed === 'N');
    if (fy.length >= 3 && fn.length >= 3) out.findings.push(`When you followed your rules you averaged ${f2(avg(fy))}R; when you did not, ${f2(avg(fn))}R.`);
    const risky = c.filter(r => RISKY_MOODS.includes(r.mood)), calm = c.filter(r => r.mood && !RISKY_MOODS.includes(r.mood));
    if (risky.length >= 3) out.findings.push(`${risky.length} trades were taken in a risky mood (${[...new Set(risky.map(r => r.mood))].join(', ')}), averaging ${f2(avg(risky))}R${calm.length >= 3 ? ` versus ${f2(avg(calm))}R in other moods` : ''}.`);
    emotionCoach(c, out, f2, avg);
    lifeLink(rows, life).forEach(x => out.findings.push(x));
    const mistakes = breakdown(rows, 'mistake').filter(m => m.key !== 'None');
    if (mistakes.length) { const w = mistakes.slice().sort((a, b) => a.totalR - b.totalR)[0]; out.findings.push(`Most costly mistake: "${w.key}" - ${w.count} trade(s), ${f2(w.totalR)}R in total.`); out.actions.push(`Write one rule that prevents "${w.key}" and add it to your plan as a MUST item.`); }
    if (st.lowRR) { out.findings.push(`${st.lowRR} trade(s) were planned below your minimum R:R of ${s.minRR}.`); out.actions.push('Skip any setup whose planned R:R is below your minimum - the Trade Log shows LOW before you enter.'); }
    const noGo = c.filter(r => r.goCheck === 'N'); if (noGo.length) { out.findings.push(`${noGo.length} trade(s) were taken without a GO from the checklist, averaging ${f2(avg(noGo))}R.`); out.actions.push('No GO from the Checklist = no trade.'); }
    if (!out.actions.length) out.actions.push('Keep logging every trade with screenshots and review one win and one loss each week.');
    return out;
  }

  const api = { num, round, todayStr, addDays, mondayOf, detId, DEFAULT_SETTINGS, DEFAULT_INSTRUMENTS, DEFAULT_QUESTIONS, OPTIONS, RISKY_MOODS, RISKY_AFTER,
    enrich, stats, breakdown, today, week, weekVerdict, dayAuto, reviewFlag, checklistDecision, coach, lifeLink };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Calc = api;
})(typeof self !== 'undefined' ? self : this);
