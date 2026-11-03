/* TradeMind Mentor engine: free, rule-based. Picks your next lesson from your own data and answers common questions
   using your journal numbers. It never predicts the market and never gives buy/sell signals. */
(function (root) {
  'use strict';
  const C = root.Calc || require('./calc.js'), P = root.Psych || require('./psych.js'), Ls = root.Lessons || require('./lessons.js');
  const f2 = v => v == null ? '-' : Number(v).toFixed(2), pct = v => v == null ? '-' : Math.round(v * 100) + '%';

  /* what should I study next? Data first, then the next unfinished lesson in your track */
  function recommend(level, progress, ctx) {
    const done = progress.done || {}, track = Ls.track(level === 'experienced' ? 'experienced' : 'beginner'), why = {};
    const pick = (id, reason) => { if (!done[id] && !why.id) { why.id = id; why.reason = reason; } };
    const { rows, s, habits } = ctx, closed = rows.filter(r => r.outcome);
    if (!s.strategies.length) pick('b6', 'You have not written a trading plan yet.');
    const top = habits && habits.top;
    if (top) {
      if (/revenge/i.test(top.key) || /frustrated|fomo|tired|overconfident/i.test(top.key)) pick('a6', `"${top.key}" is your most expensive habit so far.`);
      else if (/moved stop/i.test(top.key)) pick('a5', 'Moving your stop is costing you the most.');
      else if (/oversized/i.test(top.key)) pick('b4', 'Oversizing is costing you the most.');
      else if (/chased|early entry/i.test(top.key)) pick('a4', `"${top.key}" is costing you the most. Selectivity helps.`);
      else if (/R:R/i.test(top.key)) pick('b5', 'Low planned R:R is costing you the most.');
      else if (/skipped checklist|without a GO|broke a rule/i.test(top.key)) pick('b6', 'Rule-breaking is costing you the most. Tighten your plan.');
    }
    if (!why.id) { const nxt = track.find(l => !done[l.id]); if (nxt) { why.id = nxt.id; why.reason = closed.length < 5 ? 'Next step in your learning path.' : 'Next in your track.'; } }
    if (!why.id) { const any = Ls.LESSONS.find(l => !done[l.id]); if (any) { why.id = any.id; why.reason = 'Another lesson you have not finished.'; } }
    return why.id ? { lesson: Ls.get(why.id), reason: why.reason } : null;
  }

  /* each intent: test, then an answer built from the user's data + a lesson to read */
  const INTENTS = [
    { id: 'tradenow', re: /(should i|can i|ok to|safe to).*(trade|enter|take).*(now|today)|trade now|trade today/i, lesson: 'b4', a: c => {
      const t = c.tilt, td = C.today(c.rows, c.s, c.date);
      if (t.level === 'stop') return `Not right now. ${t.stop.join(' ')} Step away; the plan says you are done for today.`;
      if (!c.dc) return 'Do your Daily Check first. If you cannot answer it honestly, you are not ready to trade.';
      if (!c.dc.ready) return 'Your Daily Check says NOT READY. Fix what failed, or take the day off.';
      return `Your limits allow it (${td.trades}/${c.s.maxTradesPerDay} trades, ${C.round(td.pnl, 2)} P/L today). Only trade if your setup is in your plan and the Checklist says GO. I cannot tell you what price will do.`; } },
    { id: 'mistake', re: /(biggest|worst|main|top).*(mistake|habit|problem|weakness)|what.*(wrong|costing)/i, lesson: 'b10', a: c => c.habits.top
      ? `Your most expensive habit so far is "${c.habits.top.key}": ${c.habits.top.count} trade(s), ${f2(c.habits.top.net)} ${c.s.currency}, ${f2(c.habits.top.totalR)}R in total. Write one rule that stops it and make it a MUST in your plan.`
      : 'No costly habit stands out yet. Tag every mistake honestly and log how you felt; the pattern shows after 15 to 20 trades.' },
    { id: 'losing', re: /why.*(lose|losing|losses|not profitable|failing)|losing streak|keep losing/i, lesson: 'a1', a: c => {
      const st = c.st; if (!st.closed) return 'Log some closed trades first. Then I can show where the money leaks. Early on, a losing streak is often just variance.';
      const parts = [`You have ${st.closed} closed trades, win rate ${pct(st.winRate)}, average ${f2(st.avgR)}R.`];
      if (c.habits.flaggedCount >= 3) parts.push(`${c.habits.flaggedCount} trades broke a rule, used a risky mood, or had weak R:R: they totalled ${f2(c.habits.flaggedNet)} ${c.s.currency}, while clean trades totalled ${f2(c.habits.cleanNet)}.`);
      if (st.closed < 30) parts.push('Under 30 trades is a small sample, so be careful about changing the strategy.');
      return parts.join(' '); } },
    { id: 'revenge', re: /revenge|tilt|angry|frustrat|win it back|recover.*loss|get.*back.*money/i, lesson: 'a6', a: c => {
      const r = c.rows.filter(x => x.outcome), after = []; r.forEach((x, i) => { const n = r[i + 1]; if (x.outcome === 'Loss' && n && n.date === x.date) after.push(n); });
      const avg = after.length ? after.reduce((a, x) => a + (x.R || 0), 0) / after.length : null;
      return `Chasing a loss is the most common account killer. ${avg != null && after.length >= 3 ? `In your data, the trade right after a loss averaged ${f2(avg)}R.` : ''} Use the pause: leave the screen 10 minutes, breathe slowly, write one line about what happened. TradeMind will show a STOP screen after ${c.s.tiltLosses || 2} losses in a row.`.replace('  ', ' '); } },
    { id: 'size', re: /lot size|position size|how (much|many).*lot|size my|calculate.*(lot|size)/i, lesson: 'b3', a: c => `Lot size = money at risk ÷ (stop pips × pip value per lot). You choose your own lot size on every trade. Your risk rule is ${c.s.riskPct}% of ${c.st.balance} ${c.s.currency}, about ${C.round(c.st.balance * c.s.riskPct / 100, 2)}, and the trade form shows a suggested lot and the % you would really risk with the lot you pick.` },
    { id: 'risk', re: /how much.*risk|risk per trade|risk management|1%|2%|risk %/i, lesson: 'b4', a: c => `Most coaches suggest 0.5% to 1% per trade. You are set to ${c.s.riskPct}%. At that rate ten losses in a row cost about ${C.round((1 - Math.pow(1 - c.s.riskPct / 100, 10)) * 100, 1)}% of the account. Pick a risk you can lose repeatedly without changing your behaviour.` },
    { id: 'rr', re: /risk.?reward|r:r|\brr\b|reward|break.?even win|what win rate/i, lesson: 'b5', a: c => `Break-even win rate = 1 ÷ (1 + R:R). At 1:1 you need 50%, at 1:2 about 33%, at 1:3 25%. Your minimum planned R:R is ${c.s.minRR}, so you need about ${pct(1 / (1 + c.s.minRR))} wins just to break even before costs.${c.st.closed >= 5 ? ` Your win rate is ${pct(c.st.winRate)} with average ${f2(c.st.avgR)}R.` : ''}` },
    { id: 'winrate', re: /win ?rate|how often.*win|percent.*win/i, lesson: 'b5', a: c => c.st.closed ? `Your win rate is ${pct(c.st.winRate)} over ${c.st.closed} closed trades, with average ${f2(c.st.avgR)}R per trade. Win rate means little without average win and loss size, so watch expectancy (average R).` : 'Win rate alone is misleading. Log your first trades and I will show it next to your average R.' },
    { id: 'stoploss', re: /stop.?loss|move.*stop|where.*stop|\bsl\b/i, lesson: 'b4', a: c => { const m = c.rows.filter(r => r.mistake === 'Moved stop'); return `Set the stop before you enter, at a level where your trade idea is proven wrong, and never move it further away. Size the position from the stop, not the other way round.${m.length ? ` You tagged "Moved stop" on ${m.length} trade(s), totalling ${f2(m.reduce((a, r) => a + (r.R || 0), 0))}R.` : ''}`; } },
    { id: 'overtrade', re: /overtrad|too many trades|how many trades|trade less/i, lesson: 'b10', a: c => `Your limit is ${c.s.maxTradesPerDay} trade(s) a day. More trades rarely mean more profit; they usually mean more cost and weaker setups. Days with no valid setup count as good days.` },
    { id: 'plan', re: /trading plan|strategy.*(write|build|start)|how.*(start|begin)|beginner|new to trading/i, lesson: 'b6', a: c => c.s.strategies.length ? `You have ${c.s.strategies.length} strategy plan(s). Check that each rule is a clear Yes/No and that your must-have rules cover entry, stop, minimum R:R and when to skip.` : 'Start with one setup and write it as 5 to 8 Yes/No rules on the My Trading Plan page (the sample shows the format). Then use the Checklist before every trade.' },
    { id: 'journal', re: /journal|review|log my|why.*record/i, lesson: 'b8', a: c => `A journal turns trades into lessons. Log the plan, the result in R, whether you followed your rules, and how you felt before and after. ${c.st.closed ? `You have ${c.st.closed} closed trades logged.` : ''} Review daily, check weekly, and fix one habit at a time.` },
    { id: 'emotion', re: /fear|scared|nervous|anxious|confidence|overconfident|fomo|emotion|psycholog|discipline/i, lesson: 'a6', a: c => { const risky = c.rows.filter(r => r.outcome && C.RISKY_MOODS.includes(r.mood)); return `Emotions are information, not enemies. Use the pre-trade mindset check, and cool down before entering when you feel rushed or tense.${risky.length >= 2 ? ` You took ${risky.length} trades in a risky mood, averaging ${f2(risky.reduce((a, r) => a + (r.R || 0), 0) / risky.length)}R.` : ''} Discipline grows by following small rules every day, which is what your Discipline score tracks.`; } },
    { id: 'demo', re: /demo|practice|paper trad|real money|go live/i, lesson: 'b9', a: () => 'Practise the whole process on demo for 30+ journaled trades, then go live with the smallest size possible. Raise size only after a long run of following your plan.' },
    { id: 'news', re: /news|spread|slippage|volatil|session|london|new york|asia/i, lesson: 'a9', a: c => { const b = C.breakdown(c.rows, 'session'); const best = b.filter(x => x.count >= 3).sort((x, y) => y.avgR - x.avgR)[0]; return `Decide your news rule before the session (stand aside or size down). Spreads widen and slippage rises around releases.${best ? ` Your best session so far is "${best.key}" (${f2(best.avgR)}R average over ${best.count} trades).` : ''}`; } },
    { id: 'ob', re: /order ?block|\bob\b|breaker|mitigation/i, lesson: 'g4', a: c => { const z = C.breakdown(c.rows, 'zone').filter(x => x.count >= 3).sort((x, y) => y.avgR - x.avgR)[0]; return `A common bullish order block is the last bearish candle before strong bullish displacement (bearish is the reverse). Pick ONE boundary rule (full range or body) and keep it. An OB touch alone is not an entry; wait for your full sequence.${z ? ` In your journal "${z.key}" zones average ${f2(z.avgR)}R over ${z.count} trades.` : ''}`; } },
    { id: 'fvg', re: /fair value|\bfvg\b|imbalance/i, lesson: 'g4', a: () => 'A three-candle FVG is the non-overlap between candle 1 and candle 3: bullish when candle 1 high is below candle 3 low, bearish when candle 1 low is above candle 3 high. It is a location idea, not a promise that price returns or reverses.' },
    { id: 'structure', re: /\bbos\b|choch|change of character|break of structure|market structure|\bmss\b|displacement/i, lesson: 'g3', a: () => 'BOS is a break of a meaningful swing in the direction of the current move; CHOCH is an early break against prior structure; MSS is a break of a short-term swing suggesting a shift. Definitions vary, so write down which swing counts and whether a wick or a close qualifies.' },
    { id: 'liquidity', re: /liquidity|sweep|\bpdh\b|\bpdl\b|equal (highs|lows)|inducement/i, lesson: 'g4', a: () => 'Liquidity references are places where orders may cluster: prior highs and lows, equal highs/lows, session extremes, PDH/PDL and PWH/PWL. A sweep is price trading beyond the level and then reclaiming it. A wick alone does not prove a reversal, so combine it with your full sequence.' },
    { id: 'ict', re: /\bict\b|\bote\b|optimal trade|premium|discount|smc|smart money|consequent/i, lesson: 'g5', a: () => 'SMC and ICT are frameworks that describe price behaviour (structure, liquidity, OB, FVG, premium/discount, OTE around the 62% to 79% retracement). They do not guarantee reactions. Choose a small, repeatable sequence and test it with realistic costs instead of stacking labels.' },
    { id: 'methodb', re: /method b|h4.*h1.*m15|h1 ob|multi.?timeframe/i, lesson: 'g6', a: () => 'The example forex plan runs H4 location, H1 order block setup, M15 candle CLOSE beyond the OB as confirmation, and the very next M15 candle breaking the confirmation high or low as the trigger, with at least 1:2 planned R:R. It is a framework to test, not a proven system. Read the lesson, then write your own version in My Trading Plan.' },
    { id: 'gold', re: /gold|xauusd|\bm5\b/i, lesson: 'g7', a: () => 'The example gold plan is separate: mark an H4 candle high and low, find an M15 zone with rejection, then enter after an M5 candle closes beyond the last opposing candle. Gold moves sharply on USD news and spreads widen, so size from the stop distance.' },
    { id: 'correlation', re: /correlat|exposure|usd exposure|jpy/i, lesson: 'g8', a: () => 'EURUSD and GBPUSD can share USD exposure, and USDJPY and AUDJPY share JPY exposure. Treat correlated trades as combined risk, not independent bets, and cap total open risk.' },
    { id: 'backtest', re: /backtest|back test|replay|sample size|forward test|out of sample/i, lesson: 'g11', a: c => `Write your rules first, use replay that hides future candles, and include losses, no-trade cases and costs. Fifty documented examples are only an initial screen. Then test the unchanged rules on another period and on demo.${c.st.closed ? ` You have ${c.st.closed} closed trades logged so far.` : ''}` },
    { id: 'profit', re: /get rich|guarantee|sure win|best (strategy|indicator)|signal|predict|will (it|price|gold|eur|btc).*(go|rise|fall)|buy or sell/i, lesson: 'b1', a: () => 'I cannot predict price or give buy/sell signals, and nobody honestly can. What I can do is help you build a plan, manage risk, and measure your own process. A strategy is only "best" if it gives you positive average R over a large sample, after costs.' }
  ];

  function answer(question, ctx) {
    const q = String(question || '').trim(); if (!q) return null;
    const hit = INTENTS.find(i => i.id === 'profit' && i.re.test(q)) || INTENTS.find(i => i.re.test(q));
    if (hit) return { text: hit.a(ctx), lesson: Ls.get(hit.lesson), intent: hit.id };
    return { text: 'I do not have a built-in answer for that. Try asking about: should I trade now, my biggest mistake, why I am losing, lot size, risk per trade, R:R and win rate, stop loss, revenge trading, overtrading, trading plan, journaling, news and sessions. You can also browse the lessons.', lesson: null, intent: 'none' };
  }
  const SUGGESTIONS = ['What is an order block?', 'Should I trade now?', 'What is my biggest mistake?', 'Why am I losing?', 'How much should I risk per trade?', 'How do I stop revenge trading?', 'What win rate do I need?'];

  /* compact summary for the optional real AI (numbers only, no notes, no screenshots) */
  function aiContext(ctx) {
    const st = ctx.st, h = ctx.habits;
    return { level: ctx.level, currency: ctx.s.currency, riskPct: ctx.s.riskPct, minRR: ctx.s.minRR, maxTradesPerDay: ctx.s.maxTradesPerDay, closedTrades: st.closed,
      winRate: st.winRate == null ? null : Math.round(st.winRate * 100), avgR: st.avgR == null ? null : Math.round(st.avgR * 100) / 100, compliancePct: st.compliance == null ? null : Math.round(st.compliance * 100),
      topHabit: h.top ? { name: h.top.key, trades: h.top.count, totalR: h.top.totalR } : null, disciplineAvg7: ctx.disc ? ctx.disc.avg7 : null, tiltLevel: ctx.tilt ? ctx.tilt.level : null };
  }

  const api = { recommend, answer, SUGGESTIONS, aiContext, INTENTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Mentor = api;
})(typeof self !== 'undefined' ? self : this);
