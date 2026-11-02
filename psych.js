/* TradeMind psychology & discipline engine. Pure functions (no DOM) so they can be tested in Node.
   Everything here judges PROCESS (did you follow your own plan?), never profit alone. */
(function (root) {
  'use strict';
  const C = root.Calc || require('./calc.js');
  const { round, addDays } = C;
  const RISKY = C.RISKY_MOODS, RISKY_AFTER = C.RISKY_AFTER;
  const clean = m => !m || m === 'None';
  const sum = (a, f) => a.reduce((x, r) => x + (f(r) || 0), 0);

  /* ---------- 1. trade process grade (A-F) - independent of win / loss ---------- */
  const letterOf = p => p >= 90 ? 'A' : p >= 75 ? 'B' : p >= 60 ? 'C' : p >= 40 ? 'D' : 'F';
  function gradeTrade(r) {
    if (r.followed !== 'Y' && r.followed !== 'N') return null;                       // grade appears once you answer "Followed my rules?"
    const parts = [
      ['Trade came from a written plan', r.strategy && r.reasonMatch !== 'N' ? 10 : 0, 10],
      ['Checklist said GO', r.goCheck === 'Y' ? 20 : r.goCheck === 'N' ? 0 : 8, 20],
      ['Planned R:R met your minimum', r.rrCheck === 'OK' ? 15 : r.rrCheck === 'LOW' ? 0 : 7, 15],
      ['Followed my rules', r.followed === 'Y' ? 25 : 0, 25],
      ['No mistake tagged', clean(r.mistake) ? 20 : 0, 20],
      ['Clear head before entry', r.mood && !RISKY.includes(r.mood) ? 10 : r.mood && r.cooled ? 5 : 0, 10]
    ].map(([label, got, max]) => ({ label, got, max }));
    let points = parts.reduce((a, p) => a + p.got, 0);
    if (r.overrodeStop) { points = Math.max(0, points - 25); parts.push({ label: 'Traded through a STOP', got: -25, max: 0 }); }
    const worst = parts.filter(p => p.max > 0).sort((a, b) => (b.max - b.got) - (a.max - a.got))[0];
    return { points, letter: letterOf(points), parts, fix: worst && worst.max - worst.got > 0 ? worst.label : '' };
  }
  const gradeKind = g => !g ? '' : g.letter === 'A' || g.letter === 'B' ? 'ok' : g.letter === 'C' ? 'warn' : 'bad';

  /* Process vs result: "lucky" = won with a poor process, "good loss" = lost with a good one. */
  function processVsResult(rows) {
    const g = rows.filter(r => r.outcome).map(r => ({ r, g: gradeTrade(r) })).filter(x => x.g);
    const good = x => x.g.points >= 75, poor = x => x.g.points < 60;
    return { graded: g.length,
      goodWin: g.filter(x => good(x) && x.r.outcome === 'Win').length, goodLoss: g.filter(x => good(x) && x.r.outcome === 'Loss').length,
      luckyWin: g.filter(x => poor(x) && x.r.outcome === 'Win').length, poorLoss: g.filter(x => poor(x) && x.r.outcome === 'Loss').length,
      avgPoints: g.length ? round(sum(g, x => x.g.points) / g.length, 0) : null,
      avgRGood: avgR(g.filter(good).map(x => x.r)), avgRPoor: avgR(g.filter(poor).map(x => x.r)) };
  }
  const avgR = a => a.length ? sum(a, r => r.R) / a.length : null;

  /* ---------- 2. tilt / loss-streak guard ---------- */
  function tiltState(rows, s, date, tiltLog) {
    const day = rows.filter(r => r.date === date), done = day.filter(r => r.outcome), lim = Number(s.tiltLosses) || 2;
    let streak = 0; for (let i = done.length - 1; i >= 0 && done[i].outcome === 'Loss'; i--) streak++;
    const td = C.today(rows, s, date), stop = [], caution = [], last = done[done.length - 1];
    if (td.limit < 0 && td.pnl <= td.limit) stop.push('You hit your daily loss limit.');
    if (day.length >= s.maxTradesPerDay) stop.push(`You have taken your maximum of ${s.maxTradesPerDay} trade(s) today.`);
    if (streak >= lim) stop.push(`${streak} losing trades in a row today.`);
    if (!stop.length) {
      if (streak > 0 && streak === lim - 1) caution.push(`${streak} loss in a row. One more and TradeMind will stop you for today.`);
      if (last && last.outcome === 'Loss' && RISKY_AFTER.includes(last.moodAfter)) caution.push(`You felt ${last.moodAfter.toLowerCase()} after your last loss. That feeling is when most rules get broken.`);
    }
    const ov = (tiltLog || []).find(x => x.date === date && x.action === 'override' && x.tradeCount === day.length);
    const stopped = (tiltLog || []).some(x => x.date === date && x.action === 'stopped');
    return { date, level: stop.length ? 'stop' : caution.length ? 'caution' : 'ok', stop, caution, streak, lim, trades: day.length, pnl: td.pnl, overridden: !!ov, stopped };
  }
  const MOOD_RULES = {                         // pre-trade mindset check
    questions: [
      ['recover', 'Am I trying to win back money I just lost?'],
      ['fomo', 'Am I afraid of missing a move, so I am rushing?'],
      ['plan', 'Is this setup clearly in MY written plan (not a hunch)?', true],     // true = "Yes" is the healthy answer
      ['rested', 'Am I rested and able to focus for the next hour?', true]
    ]
  };
  function mindsetVerdict(a) {
    const why = [];
    if (RISKY.includes(a.mood)) why.push(`You feel ${a.mood === 'FOMO' ? 'FOMO' : String(a.mood).toLowerCase()}.`);
    if (a.recover === 'Y') why.push('You want to win back a loss.');
    if (a.fomo === 'Y') why.push('You are afraid of missing out.');
    if (a.plan === 'N') why.push('The setup is not clearly in your plan.');
    if (a.rested === 'N') why.push('You are not rested.');
    if (Number(a.intensity) >= 4 && !['Calm', 'Confident'].includes(a.mood)) why.push('The feeling is strong (4-5).');
    return { risky: why.length > 0, why };
  }

  /* ---------- 3. discipline score, streaks, badges ---------- */
  const isCleanTrade = r => r.followed !== 'N' && clean(r.mistake) && !r.overrodeStop;
  const mindOk = r => !!r.mood && (!RISKY.includes(r.mood) || !!r.cooled);
  function disciplineDay(date, rows, s, d) {
    const trades = rows.filter(r => r.date === date), dc = d.dc[date], rv = d.rv[date];
    const active = !!(dc || rv || trades.length);
    if (!active) return { date, active: false, score: 0, parts: [], flags: [] };
    const td = C.today(rows, s, date), flags = [], n = trades.length;
    const check = dc ? (dc.ready ? 15 : n ? 0 : 15) : 0;                      // a NOT READY check is a good call if you then stayed out
    if (dc && !dc.ready && n) flags.push('Traded after a NOT READY daily check');
    if (!dc) flags.push('No daily check');
    const limits = n <= s.maxTradesPerDay && !(td.limit < 0 && td.pnl <= td.limit) ? 20 : 0;
    if (!limits) flags.push('Went past a daily limit');
    const rules = n ? round(25 * trades.filter(isCleanTrade).length / n, 1) : 25;
    if (n && rules < 25) flags.push('Broke a rule or tagged a mistake');
    const mind = n ? round(15 * trades.filter(mindOk).length / n, 1) : 15;
    if (n && mind < 15) flags.push('Traded in a risky mood without cooling down');
    const review = rv ? 15 : 0; if (!rv) flags.push('No daily review');
    const calm = (d.med || []).some(x => x.date === date) || (d.pre || []).some(x => x.date === date) ? 10 : 0; if (!calm) flags.push('No meditation or pre-session routine');
    let score = check + limits + rules + mind + review + calm;
    if (d.tilt.some(x => x.date === date && x.action === 'override')) { score = Math.max(0, score - 15); flags.push('Ignored a STOP'); }
    return { date, active, score: Math.round(score), parts: [['Daily check', check, 15], ['Stayed inside limits', limits, 20], ['Followed rules', rules, 25], ['Clear head', mind, 15], ['Daily review', review, 15], ['Meditation / pre-session routine', calm, 10]], flags, trades: n };
  }
  const GOOD_DAY = 75;
  const isWeekend = s => { const [y, m, d] = s.split('-').map(Number); const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return w === 0 || w === 6; };
  function disciplineSummary(rows, s, d, todayS) {
    const dates = new Set([...Object.keys(d.dc), ...Object.keys(d.rv), ...rows.map(r => r.date)].filter(x => x && x <= todayS));
    const days = {}; dates.forEach(x => { days[x] = disciplineDay(x, rows, s, d); });
    const list = Object.values(days).filter(x => x.active).sort((a, b) => b.date.localeCompare(a.date));
    // current streak: consecutive trading days (weekends and a not-yet-started today are skipped) scoring >= GOOD_DAY
    let streak = 0;
    for (let x = todayS, i = 0; i < 400; i++, x = addDays(x, -1)) {
      const dd = days[x]; if (!dd || !dd.active) { if (isWeekend(x) || x === todayS) continue; break; }
      if (dd.score >= GOOD_DAY) streak++; else break;
    }
    let best = 0, run = 0;
    if (list.length) for (let x = list[list.length - 1].date; x <= todayS; x = addDays(x, 1)) {
      const dd = days[x]; if (!dd || !dd.active) { if (isWeekend(x) || x === todayS) continue; run = 0; continue; }
      run = dd.score >= GOOD_DAY ? run + 1 : 0; best = Math.max(best, run);
    }
    const avg = n => { const a = list.filter(x => x.date > addDays(todayS, -n)); return a.length ? Math.round(sum(a, x => x.score) / a.length) : null; };
    const summary = { days: list, today: days[todayS] || null, avg7: avg(7), avg30: avg(30), streak, best };
    summary.badges = badges(rows, s, d, summary);
    return summary;
  }
  function badges(rows, s, d, sm) {
    const closed = rows.filter(r => r.outcome), graded = closed.map(gradeTrade).filter(Boolean);
    let cleanRun = 0, bestClean = 0; closed.forEach(r => { const g = gradeTrade(r); if (g && isCleanTrade(r) && g.points >= 75) { cleanRun++; bestClean = Math.max(bestClean, cleanRun); } else cleanRun = 0; });
    const emo = closed.filter(r => r.mood && r.moodAfter).length;
    const B = (id, name, desc, have, need, icon) => ({ id, name, desc, icon, earned: have >= need, have: Math.min(have, need), need });
    return [
      B('first-check', 'First step', 'Complete your first Daily Check', Object.keys(d.dc).length, 1, '☀'),
      B('streak3', 'Three good days', '3 trading days in a row scoring 75+', Math.max(sm.streak, sm.best), 3, '✦'),
      B('streak7', 'Solid week', '7 good trading days in a row', Math.max(sm.streak, sm.best), 7, '★'),
      B('streak21', 'Habit formed', '21 good trading days in a row', Math.max(sm.streak, sm.best), 21, '♛'),
      B('walked', 'Walked away', 'Respect a STOP screen and finish the day', d.tilt.filter(x => x.action === 'stopped').length, 1, '⛔'),
      B('cooled', 'Patience', 'Finish a cool-down before a risky-mood trade', d.minds.filter(x => x.cooled).length, 1, '⏳'),
      B('skipped', 'Said no', 'Skip a trade after a mindset check', d.minds.filter(x => x.decision === 'skip').length, 1, '✋'),
      B('clean10', 'Clean ten', '10 closed trades in a row graded B or better with no rule broken', bestClean, 10, '◆'),
      B('review5', 'Reviewer', 'Write 5 daily reviews', Object.keys(d.rv).length, 5, '✎'),
      B('honest20', 'Honest journal', '20 closed trades with both emotion checks filled in', emo, 20, '♥'),
      B('calm5', 'Calm mind', 'Meditate on 5 different days', new Set((d.med || []).map(x => x.date)).size, 5, '☾'),
      B('pre5', 'Prepared', 'Complete the pre-session routine 5 times', (d.pre || []).filter(x => x.done).length, 5, '☼'),
      B('agrade', 'A-grade trade', 'Take a trade graded A', graded.filter(g => g.letter === 'A').length, 1, 'A')
    ];
  }

  /* ---------- weekly psychology report ---------- */
  function weeklyReport(rows, s, d, monday, todayS) {
    const end = addDays(monday, 6), inR = x => x.date >= monday && x.date <= end;
    const wr = rows.filter(inR), closed = wr.filter(r => r.outcome);
    const scores = [], prevScores = [];
    for (let i = 0; i < 7; i++) {
      const a = addDays(monday, i), b = addDays(monday, i - 7);
      if (a <= todayS) { const x = disciplineDay(a, rows, s, d); if (x.active) scores.push(x.score); }
      const y = disciplineDay(b, rows, s, d); if (y.active) prevScores.push(y.score);
    }
    const avg = a => a.length ? Math.round(sum(a, x => x) / a.length) : null;
    const moods = {}; wr.forEach(r => { if (r.mood) moods[r.mood] = (moods[r.mood] || 0) + 1; });
    const med = (d.med || []).filter(inR), minds = (d.minds || []).filter(inR), tilt = (d.tilt || []).filter(inR), pre = (d.pre || []).filter(x => inR(x) && x.done);
    const cb = med.filter(x => x.calmBefore && x.calmAfter);
    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 }; closed.forEach(r => { const g = gradeTrade(r); if (g) grades[g.letter]++; });
    const habits = habitCost(wr), riskyTrades = closed.filter(r => RISKY.includes(r.mood)).length;
    const out = { monday, end, trades: wr.length, closed: closed.length, wins: closed.filter(r => r.outcome === 'Win').length, totalR: round(sum(closed, r => r.R), 2), net: round(sum(closed, r => r.net), 2),
      moods, riskyTrades, avgScore: avg(scores), prevAvg: avg(prevScores), activeDays: scores.length,
      stopped: tilt.filter(x => x.action === 'stopped').length, overrides: tilt.filter(x => x.action === 'override').length,
      checks: minds.length, cooled: minds.filter(x => x.cooled).length, skipped: minds.filter(x => x.decision === 'skip').length,
      medMins: sum(med, x => Number(x.mins)), medDays: new Set(med.map(x => x.date)).size, calmGain: cb.length ? round(sum(cb, x => Number(x.calmAfter) - Number(x.calmBefore)) / cb.length, 1) : null,
      preDays: new Set(pre.map(x => x.date)).size, grades, topHabit: habits.top };
    const f = [];
    if (out.overrides) f.push(`You overrode a STOP ${out.overrides} time(s). Next week, when STOP appears, finish the day. Those trades are the ones most likely to break your plan.`);
    if (riskyTrades >= 2) f.push(`${riskyTrades} trades were taken in a risky mood. Next week, use the cool-down every time and skip when the feeling is strong.`);
    if (out.topHabit) f.push(`Your most expensive habit this week was "${out.topHabit.key}" (${out.topHabit.count} trade(s), ${round(out.topHabit.net, 2)} ${s.currency}). Write one rule that prevents it.`);
    if (out.medDays < 3) f.push('Meditate on at least 3 evenings next week. Even 3 minutes counts.');
    if (out.preDays < 3 && out.activeDays) f.push('Do the pre-session routine before you trade on at least 3 days.');
    if (out.avgScore != null && out.prevAvg != null && out.avgScore > out.prevAvg) f.push(`Your discipline score rose from ${out.prevAvg} to ${out.avgScore}. Keep the same routine.`);
    if (!f.length) f.push(out.activeDays ? 'A steady week. Keep logging honestly, and review one winning and one losing trade.' : 'No activity this week. Start with a Daily Check and a short meditation.');
    out.focus = f.slice(0, 4); return out;
  }

  /* ---------- 4. most expensive habit ---------- */
  function habitCost(rows) {
    const c = rows.filter(r => r.outcome), groups = {};
    const add = (k, kind, r) => { (groups[k] = groups[k] || { key: k, kind, rows: [] }).rows.push(r); };
    c.forEach(r => {
      if (!clean(r.mistake)) add(r.mistake, 'mistake', r);
      if (RISKY.includes(r.mood)) add('Trading while ' + r.mood.toLowerCase(), 'mood', r);
      if (r.followed === 'N' && clean(r.mistake)) add('Broke a rule (no mistake tagged)', 'rule', r);
      if (r.reasonMatch === 'N') add('Reason did not match my plan', 'reason', r);
      if (r.rrCheck === 'LOW') add('Planned R:R below minimum', 'rr', r);
      if (r.goCheck === 'N') add('Traded without a GO', 'go', r);
      if (r.overrodeStop) add('Traded through a STOP', 'stop', r);
    });
    const list = Object.values(groups).map(g => ({ key: g.key, kind: g.kind, count: g.rows.length, totalR: round(sum(g.rows, r => r.R), 2), net: round(sum(g.rows, r => r.net), 2), avgR: avgR(g.rows),
      winRate: g.rows.filter(r => r.outcome === 'Win').length / g.rows.length })).sort((a, b) => a.net - b.net);
    const flagged = c.filter(r => !isCleanTrade(r) || RISKY.includes(r.mood) || r.rrCheck === 'LOW' || r.goCheck === 'N'), good = c.filter(r => !flagged.includes(r));
    return { list, top: list.find(x => x.net < 0 && x.count >= 1) || null, flaggedCount: flagged.length, flaggedNet: round(sum(flagged, r => r.net), 2), flaggedAvgR: avgR(flagged),
      cleanCount: good.length, cleanNet: round(sum(good, r => r.net), 2), cleanAvgR: avgR(good), closed: c.length };
  }

  const api = { gradeTrade, gradeKind, letterOf, processVsResult, tiltState, MOOD_RULES, mindsetVerdict, disciplineDay, disciplineSummary, habitCost, weeklyReport, isCleanTrade, GOOD_DAY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Psych = api;
})(typeof self !== 'undefined' ? self : this);
