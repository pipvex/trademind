/* TradeMind Mentor - steps 1-2: a guided one-lesson-at-a-time course plus an AI chat (via the mentor-chat Edge Function) for beginners and experienced traders.
   - Works offline, no server needed. Progress is saved as a normal journal record (kind 'mentor') and syncs with the account.
   - Lessons are tied to the trader's own journal data where possible ("Your numbers").
   - Educational only - not financial advice.                                                              */
(function (root) {
  'use strict';
  const C = Calc;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f2 = v => (v == null || Number.isNaN(v) ? '-' : Number(v).toFixed(2));
  const pc = v => (v == null ? '-' : (v * 100).toFixed(0) + '%');
  const mentorId = () => C.detId(Store.uid + '|mentor');

  /* ---------------------------------------------------------------- lessons ---------------------------------------------------------------- */
  const LESSONS = [
    /* ===== BEGINNER ===== */
    {
      id: 'b1', track: 'beginner', title: 'What you are actually doing when you trade', minutes: 6,
      goal: 'Understand pips, lots, leverage and why trading is a game of managing risk, not predicting the market.',
      body: `<p>Every trade is a bet with three numbers: <b>how much you can lose</b> (your stop loss), <b>how much you can win</b> (your target) and <b>how often you win</b> (probability). Nobody controls the third number. You control the first two.</p>
        <ul><li><b>Pip</b>: the standard small price step (0.0001 on EURUSD, 0.01 on JPY pairs). It lets you measure distance in a common unit.</li>
        <li><b>Lot</b>: the size of your position. Bigger lot = each pip is worth more money, for you and against you.</li>
        <li><b>Leverage</b>: borrowed buying power. It lets you take a big position with a small deposit, which also lets you lose money faster. It does not change how good your trade idea is.</li></ul>
        <p>The professional mindset: <i>"I do not know if this trade will win. I know exactly what I lose if I am wrong, and I only take it if the win is worth that risk."</i></p>`,
      task: 'Open Settings and check your instruments: is the pip size and pip value right for each pair you trade? A wrong pip value gives a wrong lot size.',
      quiz: [
        { q: 'Which of these do you fully control before entering a trade?', opts: ['Whether it wins', 'How much you risk if you are wrong', 'Where the market goes next'], a: 1, why: 'You cannot control the outcome, only your risk and your decision to enter.' },
        { q: 'What does leverage change?', opts: ['The quality of your analysis', 'How big a position a small deposit can control', 'The probability the trade wins'], a: 1, why: 'Leverage magnifies position size, so gains and losses both get bigger.' },
        { q: 'A bigger lot size means...', opts: ['Each pip moves more money, up or down', 'A higher chance of winning', 'A smaller stop loss is needed'], a: 0, why: 'Lot size scales the money value of every pip.' }
      ]
    },
    {
      id: 'b2', track: 'beginner', title: 'Risk first: the 1% rule and position sizing', minutes: 7,
      goal: 'Learn to size every trade so that one loss, or even ten in a row, cannot hurt you badly.',
      body: `<p>Beginners ask "where will price go?" Survivors ask "how much do I lose if I am wrong?" Decide the money you are willing to lose <b>first</b>, then work out the lot size.</p>
        <p><b>Lot size = money at risk / (stop distance in pips x value of 1 pip per lot).</b> TradeMind does this for you on the trade form, but you must understand it.</p>
        <p>Why 1%? Because losing streaks are normal. At 1% risk, ten losses in a row costs about 10% and you are still in the game. At 10% risk, ten losses in a row wipes out about 65% of the account, and you need a +186% gain just to get back.</p>
        <p><b>Rule:</b> your stop loss goes where your idea is proven wrong, and your lot size shrinks to fit that stop, never the other way round. Never widen a stop or add lots to "make it work".</p>`,
      live: ctx => { const s = ctx.s, risk = s.balance * s.riskPct / 100; return `You risk <b>${s.riskPct}%</b> of ${s.balance} ${esc(s.currency)} = <b>${risk.toFixed(2)} ${esc(s.currency)}</b> per trade. Ten losses in a row would cost about <b>${(100 - 100 * Math.pow(1 - s.riskPct / 100, 10)).toFixed(1)}%</b> of the account.`; },
      task: 'Decide your risk per trade (beginners: 0.5% to 1%) and save it in Settings. Then log your next trade and compare the lot size TradeMind gives with what you would have guessed.',
      quiz: [
        { q: 'What should you decide first?', opts: ['The lot size', 'The money you will risk and the stop loss', 'The profit target in dollars'], a: 1, why: 'Risk and stop come first; the lot size is calculated from them.' },
        { q: 'You want a wider stop loss because price keeps hitting yours. What should happen to your lot size?', opts: ['Stay the same', 'Get bigger', 'Get smaller so the money at risk is unchanged'], a: 2, why: 'A wider stop needs a smaller lot to keep risk the same.' },
        { q: 'Why is risking 10% per trade dangerous?', opts: ['Brokers forbid it', 'A normal losing streak can destroy the account', 'It lowers your win rate'], a: 1, why: 'Losing streaks are a normal part of any strategy; big risk turns them into account killers.' }
      ]
    },
    {
      id: 'b3', track: 'beginner', title: 'R multiples and why win rate is not enough', minutes: 7,
      goal: 'Measure trades in R (your risk unit) and understand the break-even win rate for any reward-to-risk ratio.',
      body: `<p><b>1R = the amount you risk on a trade.</b> A trade that makes twice your risk is +2R. A stop-out is -1R. Measuring in R lets you compare trades regardless of lot size or account size.</p>
        <p>The break-even win rate depends on your reward-to-risk (R:R):</p>
        <table class="dt plain" style="max-width:420px"><thead><tr><th>Planned R:R</th><th class="num">Win rate needed to break even</th></tr></thead><tbody>
          <tr><td>1 : 1</td><td class="num">50%</td></tr><tr><td>1 : 1.5</td><td class="num">40%</td></tr><tr><td>1 : 2</td><td class="num">33%</td></tr><tr><td>1 : 3</td><td class="num">25%</td></tr></tbody></table>
        <p style="margin-top:10px"><b>Expectancy</b> = average R per trade. Positive over 30+ trades means you have an edge on paper. A 70% win rate with tiny wins and big losses can still lose money; a 40% win rate at 1:2 can make money. Chase a positive expectancy, not a high win rate.</p>`,
      live: ctx => {
        const st = ctx.st; if (!st.closed) return 'Close a few trades with an exit price and your own win rate, average win and average loss will appear here.';
        const aw = st.avgWinR, al = st.avgLossR, be = aw != null && al != null ? Math.abs(al) / (aw + Math.abs(al)) : null;
        return `Your win rate is <b>${pc(st.winRate)}</b> over ${st.closed} closed trade(s), average <b>${f2(st.avgR)}R</b> per trade${be != null ? `. With your average win (${f2(aw)}R) and average loss (${f2(al)}R), you need about <b>${pc(be)}</b> to break even` : ''}.`;
      },
      task: 'Look at your Dashboard: is your average R positive? If you have fewer than 30 closed trades, treat it as an early signal only.',
      quiz: [
        { q: 'You risk $20 and make $60. What is the result in R?', opts: ['+1R', '+3R', '+60R'], a: 1, why: 'R = profit / amount risked = 60 / 20 = +3R.' },
        { q: 'At a 1:2 reward-to-risk, roughly what win rate breaks even?', opts: ['33%', '50%', '75%'], a: 0, why: '1 win (+2R) pays for 2 losses (-1R each), so you need about 1 win in 3.' },
        { q: 'Which is better?', opts: ['70% win rate, average +0.9R wins and -2R losses', '40% win rate, average +2R wins and -1R losses', 'They are the same'], a: 1, why: 'The first loses on average (0.7x0.9 - 0.3x2 = +0.03R barely, with huge tail risk); the second earns +0.6R per trade.' }
      ]
    },
    {
      id: 'b4', track: 'beginner', title: 'Reading price: trend, levels and timeframes', minutes: 8,
      goal: 'Learn the three simple questions that give you a trade idea: what is the trend, where are the levels, and what does the lower timeframe confirm.',
      body: `<ol><li><b>Trend (higher timeframe, e.g. H4 or D1).</b> Uptrend = higher highs and higher lows. Downtrend = lower highs and lower lows. Sideways = no clear direction, and the best decision is often to do nothing.</li>
        <li><b>Levels.</b> Mark places where price turned several times before (support below, resistance above). Price tends to react around them. Mark them in advance, not after price arrives.</li>
        <li><b>Entry timing (lower timeframe, e.g. M15).</b> Wait for a closed candle that confirms your idea at the level, for example a strong rejection candle. A confirmation that has not closed yet is not a confirmation.</li></ol>
        <p>Trade <b>with</b> the higher-timeframe trend while you are learning. Selling every "overbought" bounce in a strong uptrend is the classic beginner trap.</p>
        <p>Before entering, check there is room: if a major level sits right in front of your target, your real reward-to-risk is worse than it looks.</p>`,
      task: 'Open one chart on H4. Mark the trend direction and two key levels. Then write one sentence: "I only buy/sell if ..." That sentence becomes a rule in your plan.',
      quiz: [
        { q: 'Which timeframe do you use to decide the overall direction?', opts: ['The lowest one (M1)', 'A higher one (H4 / D1)', 'Whichever shows a win'], a: 1, why: 'The higher timeframe gives the dominant direction; lower ones time the entry.' },
        { q: 'When is a confirmation candle valid?', opts: ['As soon as it looks good', 'After it has closed', 'Only on M1'], a: 1, why: 'An unfinished candle can reverse completely before it closes.' },
        { q: 'A major resistance sits just above your entry and your target is beyond it. This means...', opts: ['Reward is probably overestimated', 'The trade is safer', 'Nothing important'], a: 0, why: 'Price may reject at the level before reaching your target, so true R:R is lower.' }
      ]
    },
    {
      id: 'b5', track: 'beginner', title: 'Write your plan and run the checklist', minutes: 6,
      goal: 'Turn your ideas into simple Yes / No rules so every entry is a decision made in advance, not on impulse.',
      body: `<p>A plan removes in-the-moment decisions, and in-the-moment decisions are where emotions do their damage. Your plan needs only:</p>
        <ul><li><b>Setup rules</b>: the exact conditions that must be true (trend, level, confirmation).</li>
        <li><b>Risk rules</b>: risk per trade, minimum R:R, max trades per day, daily loss limit.</li>
        <li><b>Session rules</b>: when you trade and when you do not (news, tired, distracted).</li></ul>
        <p>Make each rule a clear <b>Yes / No</b> question. "Is the trend clear?" is vague; "Are the last two swing lows higher than the previous two on H4?" is a rule. The Checklist then says GO or NO TRADE. <b>No GO = no trade</b>, even if the chart looks tempting.</p>`,
      live: ctx => { const n = ctx.s.strategies.length; return n ? `You already have <b>${n}</b> strategy(ies) in My Trading Plan with ${ctx.s.strategies.reduce((a, x) => a + x.rules.length, 0)} rule(s) in total.` : 'You have not written a plan yet. Your plan is the most valuable thing you can add today.'; },
      task: 'Open My Trading Plan, copy the sample, and rewrite 5 to 8 rules in your own words. Mark the non-negotiable ones as MUST.',
      quiz: [
        { q: 'A good rule is...', opts: ['Flexible so you can adapt', 'A clear Yes / No condition', 'Based on how you feel'], a: 1, why: 'Yes / No rules are testable and leave no room for rationalising.' },
        { q: 'The checklist says NO TRADE but the setup looks great. You should...', opts: ['Take it with a smaller lot', 'Skip it', 'Move the stop to make it pass'], a: 1, why: 'The checklist exists for exactly this moment. Rules you override are not rules.' },
        { q: 'Why decide the rules in advance?', opts: ['It looks professional', 'Emotions distort decisions made in the heat of the moment', 'Brokers require it'], a: 1, why: 'Pre-made decisions protect you from fear, greed and impatience.' }
      ]
    },
    {
      id: 'b6', track: 'beginner', title: 'Your mind: fear, FOMO, revenge and tilt', minutes: 8,
      goal: 'Recognise the four emotional traps that cost most traders money and learn what to do in the moment.',
      body: `<p>Most losing traders know what to do. They lose because of what they do <i>after</i> a loss, a win or a missed move.</p>
        <ul><li><b>FOMO</b> (fear of missing out): chasing a move that already happened. Fix: a missed trade is not a loss. Another setup always comes.</li>
        <li><b>Revenge trading</b>: trading to win the money back. It breaks the plan and usually raises the size. Fix: after a loss that stings, step away for at least 15 minutes.</li>
        <li><b>Tilt</b>: a chain of emotional trades after a bad result. Fix: a hard daily loss limit and a rule to stop for the day when you hit it.</li>
        <li><b>Overconfidence</b>: after a winning streak you size up or skip the checklist. Fix: same size, same rules, every time.</li></ul>
        <p>The skill is not "never feeling it". It is <b>noticing it before you click</b>. That is why TradeMind asks how you feel before and after each trade: a feeling you name loses much of its grip.</p>
        <p><b>The 3-step reset:</b> 1) breathe out slowly 5 times, 2) say the feeling out loud ("I feel the urge to revenge trade"), 3) re-read your checklist. If it still says GO and you are calm, trade. If not, close the platform.</p>`,
      live: ctx => {
        const c = ctx.rows.filter(r => r.outcome && r.mood), risky = c.filter(r => C.RISKY_MOODS.includes(r.mood)), calm = c.filter(r => !C.RISKY_MOODS.includes(r.mood));
        if (!risky.length || !calm.length) return 'Keep filling in how you feel before each trade. Once you have trades in both a calm and a risky mood, the comparison appears here.';
        const avg = a => a.reduce((x, r) => x + (r.R || 0), 0) / a.length;
        return `In a risky mood (FOMO, frustrated, revenge, overconfident, tired) you averaged <b>${f2(avg(risky))}R</b> over ${risky.length} trade(s); in other moods <b>${f2(avg(calm))}R</b> over ${calm.length}.`;
      },
      task: 'Write down your personal "stop signal": the one feeling or situation after which you will not trade for the rest of the day. Put it into the Daily Check questions in Settings.',
      quiz: [
        { q: 'You just lost and feel the urge to win it back immediately. What is the best move?', opts: ['Double the lot size', 'Step away, then re-read your plan before any new trade', 'Switch to a smaller timeframe'], a: 1, why: 'The urge to recover losses is the signal to pause, not to trade.' },
        { q: 'A missed move is best treated as...', opts: ['A loss to recover', 'A non-event, since another setup will come', 'A reason to enter late'], a: 1, why: 'You did not lose money; chasing is what creates a loss.' },
        { q: 'After five wins in a row, you should...', opts: ['Increase your risk', 'Keep the same size and rules', 'Skip the checklist to save time'], a: 1, why: 'Overconfidence after wins is as dangerous as revenge after losses.' }
      ]
    },

    /* ===== EXPERIENCED ===== */
    {
      id: 'e1', track: 'experienced', title: 'Audit your edge: where does your money actually come from?', minutes: 8,
      goal: 'Stop trusting your memory. Use your own journal to find the setups, pairs and sessions that carry your results, and cut the rest.',
      body: `<p>Most experienced traders have a profitable core and a leaking tail. The leak is usually one of: an instrument you do not understand, a session you trade out of boredom, or a setup you take without the full checklist.</p>
        <p>Run a four-cut audit on at least 30 closed trades: by <b>strategy</b>, <b>instrument</b>, <b>session</b> and <b>mood before the trade</b> (all on your Dashboard). For each cut ask: which bucket has the best average R, which has the worst, and is the sample large enough (10+ trades) to trust?</p>
        <p>Then act on one thing: <b>stop trading the worst bucket</b>, or <b>trade the best one with the same size but more patience</b>. Do not change five things at once, or you will not know what worked.</p>`,
      live: ctx => {
        const out = []; ['strategy', 'instrument', 'session'].forEach(k => { const b = C.breakdown(ctx.rows, k).filter(x => x.count >= 3).sort((a, z) => z.avgR - a.avgR); if (b.length >= 2) out.push(`By ${k}: best <b>${esc(b[0].key)}</b> (${f2(b[0].avgR)}R avg, ${b[0].count} trades), worst <b>${esc(b[b.length - 1].key)}</b> (${f2(b[b.length - 1].avgR)}R avg, ${b[b.length - 1].count} trades).`); });
        return out.length ? out.join('<br>') : 'You need at least 3 closed trades in two or more groups per cut before comparisons appear here.';
      },
      task: 'Pick the single worst bucket above. Write a rule: "I do not trade ___ for the next 20 trades." Add it to your plan as a MUST item.',
      quiz: [
        { q: 'How many trades do you want in a bucket before trusting its average?', opts: ['1 or 2', 'About 10 or more', 'Exactly 100'], a: 1, why: 'Very small samples are mostly noise; around 10+ is a minimum, 30+ is better.' },
        { q: 'After the audit, what is the best number of changes to make at once?', opts: ['As many as possible', 'One', 'None'], a: 1, why: 'One change lets you attribute any improvement or decline to that change.' },
        { q: 'A pair has -2.0R over 12 trades. Most likely best action?', opts: ['Increase size to recover', 'Pause trading it and review those trades', 'Ignore it'], a: 1, why: 'A repeated leak deserves a pause and a review, not more risk.' }
      ]
    },
    {
      id: 'e2', track: 'experienced', title: 'Variance and sample size: telling skill from luck', minutes: 7,
      goal: 'Understand how long losing streaks can be even with a real edge, so you do not abandon a good system or trust a lucky one.',
      body: `<p>A strategy that wins 50% of the time will, over 100 trades, regularly produce a streak of 6 or 7 losses in a row. That is not a broken system; it is arithmetic. A 40% system produces longer ones.</p>
        <p>Practical consequences:</p>
        <ul><li>Do not judge a system on 10 or 20 trades. Judge it on <b>30 to 100</b>, with costs included.</li>
        <li>Pre-commit to a <b>review point</b> (e.g. "I review after 50 trades or a 8R drawdown") so you are not changing the strategy in the middle of a normal streak.</li>
        <li>A great month can be luck. A positive average R over 100 trades that holds across several pairs is more convincing.</li>
        <li>Size so that a streak of 8 to 10 losses is survivable and does not cause you to abandon the plan.</li></ul>`,
      live: ctx => {
        const c = ctx.rows.filter(r => r.outcome); let best = 0, cur = 0; c.forEach(r => { if (r.outcome === 'Loss') { cur++; best = Math.max(best, cur); } else cur = 0; });
        return c.length ? `Across your <b>${c.length}</b> closed trade(s), your longest losing streak so far is <b>${best}</b>. ${c.length < 30 ? 'The sample is still small, so expect longer streaks ahead.' : ''}` : 'Your longest losing streak will appear here once you have closed trades.';
      },
      task: 'Set your review rule now: write down the number of trades or the drawdown in R at which you will review the strategy. Do not change anything before that point.',
      quiz: [
        { q: 'A system with a real 50% win rate...', opts: ['Never loses more than 3 in a row', 'Will sometimes lose 6 or more in a row', 'Cannot have drawdowns'], a: 1, why: 'Streaks are a normal consequence of randomness.' },
        { q: 'When should you evaluate a strategy?', opts: ['After 5 trades', 'After a meaningful sample (30 to 100 trades)', 'Every day'], a: 1, why: 'Small samples are dominated by luck.' },
        { q: 'Why pre-commit to a review point?', opts: ['It looks disciplined', 'It stops you changing the system in the middle of a normal streak', 'Brokers require it'], a: 1, why: 'Without it, fear drives the changes.' }
      ]
    },
    {
      id: 'e3', track: 'experienced', title: 'Execution quality: what rule-breaking really costs you', minutes: 7,
      goal: 'Separate a bad strategy from bad execution, and put a price on every rule you break.',
      body: `<p>A losing month can come from (1) a strategy without an edge, (2) normal variance, or (3) <b>not following your own strategy</b>. Only the third is fully in your control, and it is usually the most expensive.</p>
        <p>Use the "Followed my rules?" and "Mistake" fields on every trade. Then answer: what is my average R when I follow the plan, and when I do not? That gap is the monthly price of your discipline problem.</p>
        <p>Common execution leaks: <b>early entry</b> (before the candle closes), <b>moved stop</b>, <b>cutting winners early</b> (fear) and <b>holding losers</b> (hope), <b>skipping the checklist</b>, <b>oversizing</b>. Fix <b>one</b> at a time with a single concrete rule, e.g. "Stops are set when I enter and never touched except to lock profit."</p>`,
      live: ctx => {
        const c = ctx.rows.filter(r => r.outcome), y = c.filter(r => r.followed === 'Y'), n = c.filter(r => r.followed === 'N'); const avg = a => a.reduce((x, r) => x + (r.R || 0), 0) / a.length;
        if (y.length >= 2 && n.length >= 2) return `Followed rules: <b>${f2(avg(y))}R</b> average over ${y.length} trades. Broke rules: <b>${f2(avg(n))}R</b> over ${n.length} trades. Gap per trade: <b>${f2(avg(y) - avg(n))}R</b>.`;
        return 'Mark "Followed my rules?" on every closed trade. After a few Yes and a few No, the cost of breaking your rules appears here.';
      },
      task: 'Look at your three most recent losses in the Trade Log. For each, mark: strategy problem, variance, or execution problem. Pick the execution leak that happened most and write one rule against it.',
      quiz: [
        { q: 'Which part of a losing month is fully in your control?', opts: ['Market direction', 'Your execution of your own rules', 'Spread and news'], a: 1, why: 'You cannot control the market, but you can control whether you follow your plan.' },
        { q: 'A trade that followed the plan and lost is...', opts: ['A mistake', 'Normal variance if the plan has an edge', 'Proof the plan is broken'], a: 1, why: 'A well-executed loss is part of the cost of a probabilistic edge.' },
        { q: 'Best way to fix several execution problems?', opts: ['Fix all at once', 'Fix one with a single concrete rule', 'Ignore them'], a: 1, why: 'Focused change sticks; broad resolutions do not.' }
      ]
    },
    {
      id: 'e4', track: 'experienced', title: 'Performance psychology: process goals, loss aversion and routines', minutes: 9,
      goal: 'Build a repeatable pre-session, in-session and post-session routine so your best state is the default.',
      body: `<p>At your level, technique is rarely the limit; <b>state</b> is. Three ideas help:</p>
        <ul><li><b>Process goals over profit goals.</b> "Follow the checklist on every trade this week" is controllable; "make 5%" is not. Profit goals push you to force trades; process goals protect you from yourself.</li>
        <li><b>Loss aversion.</b> Losses hurt about twice as much as equal gains feel good. That is why traders cut winners early and let losers run. Counter it by deciding the exit in advance and not touching the stop.</li>
        <li><b>Decision fatigue.</b> The more decisions you make, the worse they get. Fewer trades, a shorter session and the same routine every day keep decisions sharp.</li></ul>
        <p><b>A simple routine:</b> <i>Before</i>: Daily Check, mark levels, set the daily loss limit. <i>During</i>: checklist on every entry, one feeling check before each trade. <i>After</i>: Daily Review within 30 minutes, tag one thing done well and one to fix, then switch off.</p>`,
      live: ctx => {
        const life = Store.list('life'); const lc = C.lifeLink(ctx.rows, life);
        return lc.length ? lc.map(esc).join('<br>') : 'Write your sleep, stress and mood in the Life Journal alongside your trades. TradeMind will compare them and show how your state affects your results.';
      },
      task: 'Write your 3-line routine (before / during / after) and use it for the next five sessions. Track just one metric: did I follow it? (Yes / No).',
      quiz: [
        { q: 'Which is a process goal?', opts: ['Make 5% this month', 'Run the checklist before every entry this week', 'Never lose two trades in a row'], a: 1, why: 'It is fully within your control.' },
        { q: 'Loss aversion tends to make traders...', opts: ['Hold winners longer', 'Cut winners early and hold losers', 'Trade less'], a: 1, why: 'Avoiding the pain of a loss makes people hold losers and rush to lock in wins.' },
        { q: 'Why keep a fixed routine?', opts: ['It reduces decisions and keeps your state consistent', 'It guarantees profits', 'It is required for funded accounts'], a: 0, why: 'Consistency protects decision quality and removes avoidable variance.' }
      ]
    },
    {
      id: 'e5', track: 'experienced', title: 'Drawdown management and scaling risk', minutes: 8,
      goal: 'Know in advance how you will behave when you are in a drawdown and how to grow risk only when it is earned.',
      body: `<p>Drawdowns decide whether you stay in the business. Recovery math is brutal: a 10% loss needs +11% to recover, 20% needs +25%, 30% needs +43%, 50% needs +100%.</p>
        <p>Use a written <b>drawdown ladder</b>, decided while calm:</p>
        <ul><li>Down 5% from peak: review the last 10 trades. Nothing else changes.</li>
        <li>Down 8%: cut risk per trade by half until you make a new high of +3R.</li>
        <li>Down 12%: stop trading live for a week, review your edge, test on a demo or minimum size.</li></ul>
        <p><b>Scaling up</b> the other way: increase risk only after a long track record (e.g. 100 trades with positive expectancy), and by small steps (0.25% at a time). Never raise size to recover a loss.</p>`,
      live: ctx => { const st = ctx.st; return st.closed ? `Your max drawdown so far is <b>${(ctx.st.maxDDPct * 100).toFixed(1)}%</b> of your starting balance. Risk per trade is <b>${ctx.s.riskPct}%</b>.` : 'Your drawdown figure will appear here after you close trades.'; },
      task: 'Write your own drawdown ladder with three levels and the action at each. Save it as a rule in your plan so the checklist can remind you.',
      quiz: [
        { q: 'What gain is needed to recover a 20% loss?', opts: ['20%', '25%', '40%'], a: 1, why: 'From 80 back to 100 is +25%.' },
        { q: 'When should you increase risk per trade?', opts: ['Right after a loss to recover', 'After a long, proven track record and in small steps', 'After any winning day'], a: 1, why: 'Risk is earned by evidence, never by emotion.' },
        { q: 'Why write the drawdown ladder in advance?', opts: ['Decisions made inside a drawdown are emotional', 'It is a legal requirement', 'It increases your win rate'], a: 0, why: 'You will not be at your most rational during the drawdown itself.' }
      ]
    }
  ];

  const lessonById = id => LESSONS.find(l => l.id === id);
  const track = lv => LESSONS.filter(l => l.track === lv);

  /* ---------------------------------------------------------------- state ---------------------------------------------------------------- */
  const Q = { lesson: null, ans: [], checked: false };
  const load = () => Store.get(mentorId()) || { level: '', done: {} };
  const persist = async m => { await Store.save('mentor', { ...m, id: mentorId() }); };
  const context = () => { const s = Store.settings, rows = C.enrich(Store.list('trade'), s); return { s, rows, st: C.stats(rows, s) }; };

  /* Today's focus: the single most useful thing to do right now, from the trader's own day. */
  function focus() {
    const { s, rows } = context(), td = C.todayStr(), today = C.today(rows, s, td), dc = Store.get(C.detId(Store.uid + '|dailycheck|' + td));
    const day = rows.filter(r => r.date === td && r.outcome), last = day[day.length - 1];
    if (today.stop) return { t: 'Stop for today', x: `${today.status}. The best trade now is no trade. Close the platform and write your Daily Review.`, href: '#/review' };
    if (last && last.outcome === 'Loss' && C.RISKY_AFTER.includes(last.moodAfter)) return { t: 'Cool down first', x: 'Your last trade was a loss that left you upset. Take 15 minutes away from the screen before any new trade, and log how you feel.', href: '#/checkins' };
    if (!dc) return { t: "Do today's Daily Check", x: 'It takes one minute and tells you whether you are READY to trade today.', href: '#/daily' };
    if (!dc.ready) return { t: 'Today you marked NOT READY', x: 'Fix what you answered No to, or skip trading today. Skipping is a valid, profitable decision.', href: '#/daily' };
    const miss = rows.filter(r => r.outcome && (!r.mood || !r.moodAfter)).length;
    if (miss) return { t: 'Complete your emotional checks', x: `${miss} closed trade(s) are missing a before or after feeling. They are what makes the Coach accurate.`, href: '#/log' };
    const a = C.coach(rows, s, Store.list('life')).actions[0];
    return { t: 'Your focus today', x: a, href: '#/coach' };
  }
  const focusCard = () => { const f = focus(); return `<article class="panel mentor-focus"><div class="tiny muted" style="letter-spacing:1.2px">TODAY'S FOCUS</div><h3 style="margin:4px 0">${esc(f.t)}</h3><p class="muted">${esc(f.x)}</p><div class="button-row"><a class="secondary" href="${f.href}">Go there</a></div></article>`; };

  /* Pick the most useful next lesson: prefer one that addresses a visible weakness in the trader's own data. */
  function suggest(m, ctx) {
    const list = track(m.level), todo = list.filter(l => !m.done[l.id]); if (!todo.length) return null;
    const has = id => todo.find(l => l.id === id), c = ctx.rows.filter(r => r.outcome), avg = a => a.reduce((x, r) => x + (r.R || 0), 0) / a.length;
    const risky = c.filter(r => C.RISKY_MOODS.includes(r.mood)), calm = c.filter(r => r.mood && !C.RISKY_MOODS.includes(r.mood));
    if (risky.length >= 3 && calm.length >= 3 && avg(risky) < avg(calm)) { const l = has('b6') || has('e4'); if (l) return { l, why: `You average ${f2(avg(risky))}R in a risky mood versus ${f2(avg(calm))}R otherwise.` }; }
    const fn = c.filter(r => r.followed === 'N'), fy = c.filter(r => r.followed === 'Y');
    if (fn.length >= 3 && fy.length >= 3 && avg(fn) < avg(fy)) { const l = has('e3') || has('b5'); if (l) return { l, why: `Trades where you broke your rules average ${f2(avg(fn))}R, versus ${f2(avg(fy))}R when you followed them.` }; }
    if (ctx.st.lowRR >= 3) { const l = has('b3'); if (l) return { l, why: `${ctx.st.lowRR} trades were planned below your minimum R:R.` }; }
    if (ctx.st.closed >= 30) { const l = has('e1'); if (l) return { l, why: 'You have 30+ closed trades, enough for a proper edge audit.' }; }
    return { l: todo[0], why: 'The next step in your path.' };
  }

  /* ---------------------------------------------------------------- views ---------------------------------------------------------------- */
  function chooser() {
    return `<div class="section-intro"><div><h2>Welcome to your Mentor</h2><p class="muted">One short lesson at a time. Each one ends with a small task and a 3-question check. Where possible it uses your own journal numbers. Which describes you best?</p></div></div>
      <div class="two-col">
        <article class="panel mentor-card"><h3>I am new to trading</h3><p class="muted">Start from the basics: pips and lots, risk, R multiples, reading price, a simple plan, and controlling your emotions. 6 lessons, about 40 minutes in total.</p><div class="button-row"><button class="primary" data-mentor="level" data-v="beginner">Start the beginner path</button></div></article>
        <article class="panel mentor-card"><h3>I already trade</h3><p class="muted">Skip the basics. Audit your edge, understand variance, price your rule-breaking, build a performance routine and a drawdown plan. 5 lessons, about 40 minutes.</p><div class="button-row"><button class="primary" data-mentor="level" data-v="experienced">Start the experienced path</button></div></article></div>
      <p class="tiny muted">Not sure? Choose beginner; you can switch any time and your progress is kept. The Mentor teaches general trading education and is not financial advice.</p>`;
  }

  function overview(m) {
    const ctx = context(), list = track(m.level), doneN = list.filter(l => m.done[l.id]).length, pctDone = Math.round(100 * doneN / list.length), sug = suggest(m, ctx);
    const lbl = m.level === 'beginner' ? 'Beginner path' : 'Experienced path', other = m.level === 'beginner' ? 'experienced' : 'beginner';
    return `<div class="section-intro"><div><h2>${lbl}</h2><p class="muted">${doneN} of ${list.length} lessons complete. Learn one thing, do the task, then trade with it.</p></div>
        <button class="text-btn" data-mentor="level" data-v="${other}">Switch to the ${other} path</button></div>
      <div class="mentor-progress" aria-label="Progress"><span style="width:${pctDone}%"></span></div>
      ${focusCard()}
      ${sug ? `<article class="panel mentor-next"><div class="panel-head"><h3 style="margin:0">Up next: ${esc(sug.l.title)}</h3><span class="chip">${sug.l.minutes} min</span></div><p class="muted">${esc(sug.l.goal)}</p><p class="tiny muted" style="margin-top:6px"><b>Why now:</b> ${esc(sug.why)}</p><div class="button-row"><a class="primary" href="#/mentor/${sug.l.id}">${m.done[sug.l.id] ? 'Review lesson' : 'Start lesson'}</a></div></article>` : `<div class="notice good">You finished the ${lbl.toLowerCase()}. Revisit any lesson below, or switch paths. Ask the Mentor below anything you are still unsure about.</div>`}
      <div class="panel"><h3>All lessons</h3>${list.map((l, i) => `<a class="mentor-row ${m.done[l.id] ? 'done' : ''}" href="#/mentor/${l.id}"><b>${m.done[l.id] ? '✓' : i + 1}</b><span><strong>${esc(l.title)}</strong><small>${l.minutes} min${m.done[l.id] ? ' · completed' : ''}</small></span></a>`).join('')}</div>
      <div class="notice">Education only, not financial advice. Practise on a demo account or tiny size until your numbers prove an edge.</div>${chatPanel(m)}`;
  }

  function lessonView(m, id) {
    const l = lessonById(id); if (!l) return overview(m);
    if (Q.lesson !== id) { Q.lesson = id; Q.ans = []; Q.checked = false; }
    const list = track(l.track), i = list.indexOf(l), prev = list[i - 1], next = list[i + 1], ctx = context(), done = m.done[id];
    const score = Q.checked ? l.quiz.filter((q, k) => Q.ans[k] === q.a).length : 0, pass = Q.checked && score >= 2, all = Q.ans.filter(a => a !== undefined).length === l.quiz.length;
    const quiz = l.quiz.map((q, k) => `<div class="mentor-q"><p><b>${k + 1}. ${esc(q.q)}</b></p>${q.opts.map((o, j) => {
      const sel = Q.ans[k] === j, st = Q.checked ? (j === q.a ? 'right' : sel ? 'wrong' : '') : (sel ? 'sel' : '');
      return `<button type="button" class="mentor-opt ${st}" data-mentor="pick" data-q="${k}" data-v="${j}" ${Q.checked ? 'disabled' : ''}>${esc(o)}</button>`; }).join('')}
      ${Q.checked ? `<p class="tiny ${Q.ans[k] === q.a ? 'positive' : 'negative'}">${Q.ans[k] === q.a ? 'Correct. ' : 'Not quite. '}${esc(q.why)}</p>` : ''}</div>`).join('');
    return `<div class="section-intro"><div><div class="tiny muted"><a href="#/mentor">&larr; All lessons</a> · Lesson ${i + 1} of ${list.length} · ${l.minutes} min</div><h2 style="margin-top:6px">${esc(l.title)}</h2></div>${done ? '<span class="chip ok">Completed</span>' : ''}</div>
      <article class="panel form-panel mentor-lesson"><p class="mentor-goal"><b>Goal:</b> ${esc(l.goal)}</p>${l.body}
        ${l.live ? `<div class="notice mentor-live"><b>Your numbers</b><br>${l.live(ctx)}</div>` : ''}
        <div class="mentor-task"><b>Your task</b><p>${esc(l.task)}</p></div></article>
      <article class="panel form-panel"><h3>Quick check (get 2 of 3 right)</h3>${quiz}
        ${Q.checked ? `<div class="verdict ${pass ? 'go' : 'stop'}">${score} / ${l.quiz.length} · ${pass ? 'Lesson complete' : 'Read the explanations and try again'}</div>` : ''}
        <div class="form-actions">${Q.checked && !pass ? '<button class="secondary" data-mentor="retry">Try again</button>' : ''}${!Q.checked ? `<button class="primary" data-mentor="check" ${all ? '' : 'disabled'}>Check answers</button>` : ''}
          ${pass ? (next ? `<a class="primary" href="#/mentor/${next.id}">Next lesson &rarr;</a>` : '<a class="primary" href="#/mentor">Finish path &rarr;</a>') : ''}</div></article>
      <div class="button-row">${prev ? `<a class="secondary" href="#/mentor/${prev.id}">&larr; ${esc(prev.title)}</a>` : ''}${next && done ? `<a class="secondary" href="#/mentor/${next.id}">${esc(next.title)} &rarr;</a>` : ''}</div>${chatPanel(m)}`;
  }

  function view(param) {
    const m = load();
    if (!m.level) return chooser();
    return param ? lessonView(m, param) : overview(m);
  }


  /* ---------------------------------------------------------------- AI chat (step 2) ---------------------------------------------------------------- */
  const Chat = { msgs: [], busy: false };
  const PROMPTS = {
    beginner: ['Explain position sizing with an example', 'What should I do after a losing trade?', 'How do I know if my strategy works?'],
    experienced: ['Review my numbers: what is my biggest leak?', 'How do I stop moving my stop loss?', 'How should I scale risk after a good month?']
  };
  const fmt = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  function summary() {
    const { s, rows, st } = context(), c = rows.filter(r => r.outcome), avg = a => a.length ? a.reduce((x, r) => x + (r.R || 0), 0) / a.length : null;
    const risky = c.filter(r => C.RISKY_MOODS.includes(r.mood)), calm = c.filter(r => r.mood && !C.RISKY_MOODS.includes(r.mood)), fy = c.filter(r => r.followed === 'Y'), fn = c.filter(r => r.followed === 'N');
    const L = [`Closed trades: ${st.closed}`, `Risk per trade: ${s.riskPct}%, minimum R:R: ${s.minRR}`];
    if (st.closed) L.push(`Win rate: ${pc(st.winRate)}, average R: ${f2(st.avgR)}, total R: ${f2(st.totalR)}, max drawdown: ${(st.maxDDPct * 100).toFixed(1)}% of start`, `Rule compliance: ${pc(st.compliance)}, trades below min R:R: ${st.lowRR}`);
    if (risky.length && calm.length) L.push(`Avg R in risky moods: ${f2(avg(risky))} (${risky.length} trades) vs other moods: ${f2(avg(calm))} (${calm.length} trades)`);
    if (fy.length && fn.length) L.push(`Avg R when rules followed: ${f2(avg(fy))} (${fy.length}) vs broken: ${f2(avg(fn))} (${fn.length})`);
    const k = C.streaks(rows, Store.list('dailycheck'), Store.list('dailyreview'), C.todayStr());
    L.push(`Process streaks: clean trading days ${k.cleanDays.cur} (best ${k.cleanDays.best}), Daily Check days ${k.dailyCheck.cur}, Daily Review days ${k.review.cur}`);
    return L.join('\n');
  }
  function chatLog() {
    if (!Chat.msgs.length) return '<div class="tiny muted">Ask anything about trading, risk or your own habits. I will teach one step at a time.</div>';
    return Chat.msgs.map(m => `<div class="chat-msg ${m.role}${m.err ? ' err' : ''}">${m.role === 'user' ? '' : '<small>Mentor</small>'}${fmt(m.content)}</div>`).join('') + (Chat.busy ? '<div class="chat-msg assistant"><small>Mentor</small><span class="muted">Thinking…</span></div>' : '');
  }
  function chatPanel(m) {
    const note = !Store.isCloud ? '<div class="notice warning">The AI Mentor needs an account (cloud login). You are using this device only.</div>' : '';
    return `<article class="panel form-panel" id="mentor-chat"><h3>Ask the Mentor</h3>${note}
      <div class="button-row">${(PROMPTS[m.level] || []).map(p => `<button type="button" class="secondary chat-chip" data-mentor="ask" data-p="${esc(p)}">${esc(p)}</button>`).join('')}</div>
      <div id="chat-log" class="chat-log">${chatLog()}</div>
      <label style="margin:10px 0 0">Your question<textarea id="chat-input" rows="2" maxlength="1500" placeholder="Type your question. Press Ctrl+Enter to send."></textarea></label>
      <div class="form-actions" style="margin-top:8px"><button type="button" class="primary" data-mentor="send" ${Store.isCloud ? '' : 'disabled'}>Send</button></div>
      <p class="tiny muted">When you send a question, it goes to the AI provider together with a short summary of your journal numbers (not your notes, screenshots or diary). Education only, not financial advice. See the Privacy Policy.</p></article>`;
  }
  function paintChat() { const el = document.getElementById('chat-log'); if (el) { el.innerHTML = chatLog(); el.scrollTop = el.scrollHeight; } const b = document.querySelector('[data-mentor="send"]'); if (b) b.disabled = Chat.busy || !Store.isCloud; }
  async function ask(text) {
    text = (text || '').trim(); if (!text || Chat.busy || !Store.isCloud) return;
    const m = load(), id = (location.hash.match(/^#\/mentor\/(.+)$/) || [])[1], l = id && lessonById(id);
    Chat.msgs.push({ role: 'user', content: text }); Chat.busy = true; paintChat();
    const inp = document.getElementById('chat-input'); if (inp) inp.value = '';
    try {
      const history = Chat.msgs.filter(x => !x.err).slice(-10).map(x => ({ role: x.role, content: x.content }));
      const { data, error } = await Store.sb.functions.invoke('mentor-chat', { body: { messages: history, level: m.level, lesson: l ? l.title : '', context: summary() } });
      if (error) { let msg = 'The Mentor could not be reached. Check your connection and try again.'; try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) { /* keep default */ } throw new Error(msg); }
      Chat.msgs.push({ role: 'assistant', content: data.reply });
    } catch (e) { Chat.msgs.push({ role: 'assistant', content: e.message || 'Something went wrong.', err: true }); }
    Chat.busy = false; paintChat();
  }
  document.addEventListener('keydown', e => { if (e.target.id === 'chat-input' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask(e.target.value); } });

  /* ---------------------------------------------------------------- actions ---------------------------------------------------------------- */
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-mentor]'); if (!el || !Store.uid) return;
    const a = el.dataset.mentor, m = load(), id = (location.hash.match(/^#\/mentor\/(.+)$/) || [])[1];
    if (a === 'level') { await persist({ ...m, level: el.dataset.v }); location.hash = '#/mentor'; App.render(); }
    else if (a === 'send') { const i = document.getElementById('chat-input'); ask(i && i.value); }
    else if (a === 'ask') ask(el.dataset.p);
    else if (a === 'pick') { if (!Q.checked) { Q.ans[+el.dataset.q] = +el.dataset.v; App.render(); } }
    else if (a === 'retry') { Q.ans = []; Q.checked = false; App.render(); }
    else if (a === 'check') {
      const l = lessonById(id); if (!l) return; Q.checked = true;
      const score = l.quiz.filter((q, k) => Q.ans[k] === q.a).length;
      if (score >= 2) { await persist({ ...m, done: { ...m.done, [id]: { at: new Date().toISOString(), score } } }); App.toast('Lesson complete'); }
      App.render();
    }
  });

  Views.mentor = view;
  root.Mentor = { LESSONS, suggest, summary };
})(self);
