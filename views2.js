/* TradeMind: psychology & mentor screens (mindset gate, STOP screen, discipline page, mentor page).
   Builds on the helpers exported by views.js (Views.h) and the engines in psych.js / mentor.js / lessons.js. */
(function (root) {
  'use strict';
  const { S, A, esc, chip, intro, yn, f, money, pc, cls, toast, go, ctx, tfsOf } = Views.h;
  const C = Calc, P = Psych, M = Mentor, Ls = Lessons, O = C.OPTIONS;
  const $ = (s, r = document) => r.querySelector(s);
  const cfg = root.TM_CONFIG || {};

  /* ---------- data helpers ---------- */
  const byDate = kind => { const m = {}; Store.list(kind).forEach(x => { if (x.date) m[x.date] = x; }); return m; };
  const bundle = () => ({ dc: byDate('dailycheck'), rv: byDate('dailyreview'), tilt: Store.list('tilt'), minds: Store.list('mindset'), med: Store.list('meditation'), pre: Store.list('presession'), planread: Store.list('planread') });
  const lowMood = m => m === 'FOMO' ? m : String(m || '').toLowerCase();
  const tiltNow = () => { const { s, rows } = ctx(); return P.tiltState(rows, s, C.todayStr(), Store.list('tilt')); };
  const mentorId = () => C.detId(Store.uid + '|mentor');
  const progress = () => { const p = Store.get(mentorId()); return { level: 'beginner', done: {}, scores: {}, ...(p || {}) }; };
  const saveProgress = p => { const { id, updatedAt, ...data } = p; return Store.save('mentor', { ...data, id: mentorId() }); };

  /* =====================================================================
     1) PRE-TRADE GATE: STOP screen -> mindset check -> cool-down
     ===================================================================== */
  const RECOVERY = ['Stand up and leave the screen for at least 10 minutes', 'Drink water or walk outside', 'Take 5 slow breaths (in 4 seconds, out 6)', 'Write one sentence about what happened (an Emotion Check-in works)', 'Review the plan, not the chart: did I follow it?'];
  function G() { const id = S.trade ? S.trade.id : 'dash'; if (!S.gate || S.gate.for !== id) S.gate = { for: id, stage: 'check', mood: '', intensity: '3', recover: '', fomo: '', plan: '', rested: '', reason: '', startedAt: 0, ovReason: '', ovOk: false, rec: {}, stopAt: Date.now() }; return S.gate; }

  function recoveryList(g) { return `<div class="recovery">${RECOVERY.map((t, i) => `<button type="button" class="rec-item ${g.rec[i] ? 'on' : ''}" data-action="rec-tick" data-i="${i}"><b>${g.rec[i] ? '✓' : i + 1}</b><span>${esc(t)}</span></button>`).join('')}</div>`; }

  function stopScreen(t) {
    const g = G(), left = Math.max(0, 60 - Math.floor((Date.now() - g.stopAt) / 1000)), can = left === 0 && g.ovReason.trim().length >= 10 && g.ovOk;
    return `<div class="stop-screen"><div class="stop-sign">STOP</div><h2>Trading is paused for today</h2>
      ${t.stop.map(x => `<p class="stop-why">${esc(x)}</p>`).join('')}
      <p class="muted">Your own rules say you are done. The next trade after a bad run is statistically the one most likely to break your plan. Protecting your account and your head now is the winning move.</p>
      <h3>Recovery routine</h3>${recoveryList(g)}
      <div class="button-row" style="justify-content:center"><button class="primary" data-action="stop-done">I am done for today</button><a class="secondary" href="#/checkins">Write an emotion check-in</a></div>
      <details class="override"><summary>I still want to trade (not recommended)</summary>
        <p class="tiny muted">This is logged, lowers today's discipline score by 15 and caps this trade's process grade. Wait 60 seconds, then explain why.</p>
        <label>Why is this trade different? (at least 10 characters)<textarea rows="2" data-bind="gate.ovReason"></textarea></label>
        <label class="check"><input type="checkbox" id="ov-ok" ${g.ovOk ? 'checked' : ''}> I understand I am breaking my own stop rule.</label>
        <button class="danger" data-action="stop-override" id="ov-btn" ${can ? '' : 'disabled'}>Override the STOP <span id="ov-timer">${left ? '(' + left + 's)' : ''}</span></button></details></div>`;
  }

  function checkScreen(t) {
    const g = G(), q = P.MOOD_RULES.questions, answered = q.every(([k]) => g[k]), cool = Math.max(1, Number(Store.settings.cooldownMin) || 3);
    return `${intro('Mindset check', `Before you plan this trade, take 20 seconds. If something is off, TradeMind will ask for a ${cool}-minute cool-down first.`)}
      ${t.level === 'caution' ? `<div class="notice warning"><b>Heads up.</b> ${t.caution.map(esc).join(' ')}</div>` : ''}
      <div class="panel form-panel"><h3>How do I feel right now?</h3>
        <div class="mood-grid">${O.moods.map(m => `<button type="button" aria-pressed="${g.mood === m}" class="mood ${g.mood === m ? 'on' : ''} ${C.RISKY_MOODS.includes(m) ? 'risky' : ''}" data-action="gate-mood" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>
        <p class="tiny muted" style="margin-top:10px">How strong is the feeling? (1 faint - 5 very strong)</p>
        <div class="seg">${['1', '2', '3', '4', '5'].map(n => `<button type="button" class="${g.intensity === n ? 'on-y' : ''}" data-action="gate-int" data-v="${n}">${n}</button>`).join('')}</div>
        ${q.map(([k, text]) => `<div class="qrow"><div class="q">${esc(text)}</div>${yn('gate-q', k, g[k])}</div>`).join('')}
        <div class="form-actions"><button class="secondary" type="button" data-action="gate-skip">Skip trading for now</button><button class="primary" type="button" data-action="gate-submit" ${g.mood && answered ? '' : 'disabled'}>Continue</button></div></div>`;
  }

  function coolScreen() {
    const g = G(), cool = Math.max(1, Number(Store.settings.cooldownMin) || 3), left = Math.max(0, cool * 60 - Math.floor((Date.now() - g.startedAt) / 1000)), v = g.verdict || { why: [] };
    const can = left === 0 && g.reason.trim().length >= 10;
    const mm = n => String(Math.floor(n / 60)) + ':' + String(n % 60).padStart(2, '0');
    return `<div class="cool-screen"><div class="eyebrow">COOL-DOWN</div><h2>Pause before you plan this trade</h2>
      <div class="why-list">${v.why.map(x => `<div class="finding warn">${esc(x)}</div>`).join('')}</div>
      <div class="timer" id="cool-timer" data-total="${cool * 60}">${left ? mm(left) : 'Ready'}</div>
      <p class="muted">Breathe slowly. Look away from the charts. Skipping this trade is always a valid, disciplined choice.</p>
      <label>In one or two sentences: why is this trade still valid according to MY plan? (at least 10 characters)<textarea rows="3" data-bind="gate.reason" placeholder="Setup, zone, confirmation, stop and target…"></textarea></label>
      <div class="button-row" style="justify-content:center"><button class="secondary" data-action="gate-skip">Skip this trade (recommended)</button><button class="primary" id="cool-go" data-action="gate-go" ${can ? '' : 'disabled'}>Continue to trade</button></div></div>`;
  }

  function gate() {
    if (!S.tradeNew || !S.trade) return null;
    if (S.gateDone === S.trade.id) return null;
    const g = G(), t = tiltNow();
    if (t.level === 'stop' && !t.overridden) return stopScreen(t);
    return g.stage === 'cool' ? coolScreen() : checkScreen(t);
  }

  async function passGate(cooled, decision) {
    const g = G(), t = tiltNow(), id = (await Store.save('mindset', { date: C.todayStr(), ts: new Date().toISOString(), mood: g.mood, intensity: g.intensity, recover: g.recover, fomo: g.fomo, plan: g.plan, rested: g.rested,
      risky: !!(g.verdict && g.verdict.risky), why: g.verdict ? g.verdict.why : [], cooled, cooldownSec: cooled ? Math.round((Date.now() - g.startedAt) / 1000) : 0, reason: g.reason || '', decision })).id;
    if (decision === 'skip') { S.gate = null; S.trade = null; toast('Good call. Not trading is a trade too.'); return go('dashboard'); }
    Object.assign(S.trade, { mood: g.mood, intensityBefore: g.intensity, emoBeforeNote: g.reason || S.trade.emoBeforeNote || '', mindsetId: id, cooled: !!cooled, overrodeStop: !!t.overridden });
    S.gateDone = S.trade.id; App.render(); window.scrollTo(0, 0);
  }

  Object.assign(A, {
    'gate-mood': el => { G().mood = el.dataset.v; App.render(); },
    'gate-int': el => { G().intensity = el.dataset.v; App.render(); },
    'gate-q': el => { G()[el.dataset.i] = el.dataset.v; App.render(); },
    'gate-submit': async () => { const g = G(); g.verdict = P.mindsetVerdict(g);
      if (!g.verdict.risky) return passGate(false, 'go');
      g.stage = 'cool'; g.startedAt = Date.now(); App.render(); },
    'gate-go': () => { const g = G(), cool = Math.max(1, Number(Store.settings.cooldownMin) || 3);
      if (Date.now() - g.startedAt < cool * 60000 || g.reason.trim().length < 10) return toast('Finish the cool-down and explain your reason first.'); passGate(true, 'go'); },
    'gate-skip': () => { const g = G(); if (!g.mood) g.mood = 'Calm'; passGate(false, 'skip'); },
    'rec-tick': el => { const g = G(); g.rec[el.dataset.i] = !g.rec[el.dataset.i]; App.render(); },
    'stop-done': async () => { const { rows } = ctx(); await Store.save('tilt', { date: C.todayStr(), action: 'stopped', tradeCount: rows.filter(r => r.date === C.todayStr()).length, reason: 'Respected the STOP screen' });
      S.gate = null; if (S.trade && S.tradeNew) { S.trade = null; } toast('Good call. Come back fresh tomorrow.'); go('dashboard'); },
    'stop-override': async () => { const g = G(), { rows } = ctx(); if (g.ovReason.trim().length < 10 || !g.ovOk) return toast('Explain why and tick the box first.');
      await Store.save('tilt', { date: C.todayStr(), action: 'override', tradeCount: rows.filter(r => r.date === C.todayStr()).length, reason: g.ovReason.trim() }); App.render(); }
  });
  document.addEventListener('change', e => { if (e.target.id === 'ov-ok') { G().ovOk = e.target.checked; tick(); } });

  /* live countdowns (cool-down and STOP override) - runs only while their element is on screen */
  let timer = null;
  function tick() {
    const g = S.gate; if (!g) return;
    const ct = $('#cool-timer');
    if (ct) { const left = Math.max(0, Number(ct.dataset.total) - Math.floor((Date.now() - g.startedAt) / 1000)); ct.textContent = left ? Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') : 'Ready'; ct.classList.toggle('ready', !left);
      const b = $('#cool-go'); if (b) b.disabled = !(left === 0 && g.reason.trim().length >= 10); }
    const ot = $('#ov-timer'); if (ot) { const left = Math.max(0, 60 - Math.floor((Date.now() - g.stopAt) / 1000)); ot.textContent = left ? `(${left}s)` : ''; const b = $('#ov-btn'); if (b) b.disabled = !(left === 0 && g.ovReason.trim().length >= 10 && g.ovOk); }
  }
  function after() { clearInterval(timer); if ($('#cool-timer') || $('#ov-timer') || $('#breath')) { timer = setInterval(() => { if (!$('#cool-timer') && !$('#ov-timer') && !$('#breath')) return clearInterval(timer); tick(); medTick(); }, 500); medTick(); } }
  document.addEventListener('input', e => { if (e.target.dataset && /^gate\./.test(e.target.dataset.bind || '')) tick(); });

  /* grade box on the trade form (live) */
  const gradeBox = () => '<div class="grade-box" id="c-grade"><small>Process grade appears when you answer "Followed my rules?"</small></div>';
  function updateGrade() {
    const el = $('#c-grade'); if (!el || !S.trade) return;
    const { s } = ctx(), others = Store.list('trade').filter(t => t.id !== S.trade.id), row = C.enrich([...others, { ...S.trade, createdAt: S.trade.createdAt || '9999' }], s).find(r => r.id === S.trade.id), g = P.gradeTrade(row);
    if (!g) { el.innerHTML = '<small>Process grade appears when you answer "Followed my rules?"</small>'; return; }
    el.innerHTML = `<div class="grade-letter ${P.gradeKind(g)}">${g.letter}</div><div><b>Process grade · ${g.points}/100</b><div class="tiny muted">${g.fix ? 'Biggest gap: ' + esc(g.fix) : 'Clean process. Whatever the result, this is how you want to trade.'}</div>
      <div class="grade-parts">${g.parts.map(p => `<span class="gp ${p.got < 0 ? 'neg' : p.got === p.max ? 'full' : 'part'}">${esc(p.label)} ${p.got}${p.max ? '/' + p.max : ''}</span>`).join('')}</div></div>`;
  }


  /* =====================================================================
     1b) MEDITATION (inside the Daily Review)
     ===================================================================== */
  const MEDS = {
    breathe: { name: 'Calm breathing', desc: 'Slow breathing: 4 seconds in, 6 seconds out. Settles your body after a stressful session.',
      prompts: ['Sit comfortably and let your shoulders drop.', 'Follow the circle. In through the nose, out slowly through the mouth.', 'If your mind drifts to a trade, notice it, then return to the breath.', 'Let your jaw, hands and stomach soften.'] },
    letgo: { name: 'Let go of the day', desc: 'A short reflection to put the trading day down before you rest.',
      prompts: ['Picture the day\'s trades without judging them. Just watch.', 'Name the strongest feeling you are carrying from today.', 'Thank yourself for one thing you did right, even if it was small.', 'Forgive one mistake. It is data, not a verdict on you.', 'Let go of any trade that is already finished. You cannot change it.'] },
    focus: { name: 'Calm focus for tomorrow', desc: 'Prepare a clear, patient head for your next session.',
      prompts: ['Imagine tomorrow morning: calm, rested, plan in front of you.', 'Silently repeat your rules. Only trade what is in the plan.', 'Accept that some trades will lose. That is already priced into your plan.', 'See yourself skipping a bad setup calmly. Not trading is a win.', 'Set one intention for tomorrow, in one sentence.'] }
  };
  S.med = S.med || { mode: 'breathe', mins: 3, calmBefore: '', running: false, startedAt: 0, last: 0, done: false, recId: null, calmAfter: '' };
  const medTotal = date => Store.list('meditation').filter(m => m.date === date).reduce((a, m) => a + (Number(m.mins) || 0), 0);
  function meditation(date, title) {
    const m = S.med; m.date = date;
    const md = MEDS[m.mode], total = medTotal(date), days = new Set(Store.list('meditation').filter(x => x.date > C.addDays(C.todayStr(), -7)).map(x => x.date)).size;
    if (m.running && Date.now() - m.last > 3000) m.running = false;                        // user left the page: do not carry a half session over
    const seg = (act, vals, cur, fmt) => `<div class="seg">${vals.map(v => `<button type="button" class="${String(cur) === String(v) ? 'on-y' : ''}" data-action="${act}" data-v="${v}">${fmt ? fmt(v) : v}</button>`).join('')}</div>`;
    let body;
    if (m.running) body = `<div class="med-run"><div class="breath in" id="breath"><span id="breath-word">Breathe in</span></div><div class="med-clock" id="med-clock">0:00</div><p class="med-cue" id="med-cue">${esc(md.prompts[0])}</p>
        <div class="button-row" style="justify-content:center"><button type="button" class="secondary" data-action="med-end">End early</button></div></div>`;
    else if (m.done) body = `<div class="med-run"><div class="breath done"><span>Done</span></div><p class="med-cue">Well done. A calm close to the day makes tomorrow's decisions easier.</p>
        <p class="tiny muted">How calm do you feel now? (1 tense - 5 very calm)</p>${seg('med-after', [1, 2, 3, 4, 5], m.calmAfter)}
        ${m.calmBefore && m.calmAfter ? `<p class="tiny muted" style="margin-top:8px">Calm went from ${esc(m.calmBefore)} to ${esc(m.calmAfter)}.</p>` : ''}
        <div class="button-row" style="justify-content:center"><button type="button" class="secondary" data-action="med-again">Meditate again</button></div></div>`;
    else body = `<p class="tiny muted">${esc(md.desc)}</p>
        <div class="chip-row">${Object.entries(MEDS).map(([k, v]) => `<button type="button" class="chip-btn ${m.mode === k ? 'on' : ''}" data-action="med-mode" data-v="${k}">${esc(v.name)}</button>`).join('')}</div>
        <div class="form-grid two"><div><label>Length (minutes)</label>${seg('med-mins', [1, 3, 5, 10], m.mins)}</div><div><label>How calm do I feel now? (1 tense - 5 calm)</label>${seg('med-before', [1, 2, 3, 4, 5], m.calmBefore)}</div></div>
        <div class="button-row"><button type="button" class="primary" data-action="med-start">Start ${m.mins}-minute meditation</button></div>`;
    return `<div class="med-panel"><div class="panel-head"><h3>${esc(title || 'Evening meditation')} <span class="tiny muted">(optional)</span></h3>${total ? chip(total + ' min today', 'ok') : chip(days + ' of last 7 days', days ? '' : 'warn')}</div>${body}</div>`;
  }
  async function medFinish(early) {
    const m = S.med, e = Math.floor((Date.now() - m.startedAt) / 1000); m.running = false;
    if (early && e < 30) { toast('Session ended. Meditate for at least 30 seconds to count it.'); return App.render(); }
    const mins = early ? Math.max(1, Math.round(e / 60)) : m.mins;
    const rec = await Store.save('meditation', { date: m.date || C.todayStr(), mins, mode: m.mode, calmBefore: m.calmBefore || '', calmAfter: '', ts: new Date().toISOString() });
    m.recId = rec.id; m.done = true; m.calmAfter = ''; App.render();
  }
  Object.assign(A, {
    'med-mode': el => { S.med.mode = el.dataset.v; App.render(); },
    'med-mins': el => { S.med.mins = +el.dataset.v; App.render(); },
    'med-before': el => { S.med.calmBefore = el.dataset.v; App.render(); },
    'med-after': async el => { const m = S.med; m.calmAfter = el.dataset.v; const r = Store.get(m.recId); if (r) await Store.save('meditation', { ...r, calmAfter: m.calmAfter }); App.render(); },
    'med-start': () => { Object.assign(S.med, { running: true, done: false, startedAt: Date.now(), last: Date.now(), recId: null, calmAfter: '' }); App.render(); },
    'med-end': () => medFinish(true),
    'med-again': () => { Object.assign(S.med, { done: false, running: false, calmBefore: '', calmAfter: '' }); App.render(); }
  });
  function medTick() {
    const m = S.med, el = $('#breath'); if (!el || !m.running) return;
    m.last = Date.now(); const e = Math.floor((Date.now() - m.startedAt) / 1000), total = m.mins * 60;
    if (e >= total) return medFinish(false);
    const inhale = e % 10 < 4; el.className = 'breath ' + (inhale ? 'in' : 'out'); $('#breath-word').textContent = inhale ? 'Breathe in' : 'Breathe out';
    const left = total - e; $('#med-clock').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    const ps = MEDS[m.mode].prompts, cue = $('#med-cue'), txt = ps[Math.floor(e / 20) % ps.length]; if (cue.textContent !== txt) cue.textContent = txt;
  }


  /* =====================================================================
     1c) PRE-SESSION ROUTINE (Daily Check page)
     ===================================================================== */
  const PRE = ['I slept enough and I feel well enough to trade', 'I read my full plan: timeframes and steps', 'I marked my levels and checked the news', 'I said my rules out loud: one setup, my stop, my daily limit', 'I accept that any single trade can lose'];
  const preId = d => C.detId(Store.uid + '|presession|' + d);
  function preSession(date) {
    if (!S.pre || S.pre.date !== date) { const ex = Store.get(preId(date)); S.pre = ex ? { ...ex, items: { ...(ex.items || {}) } } : { date, items: {}, intention: '' }; }
    const p = S.pre, n = PRE.filter((_, i) => p.items[i]).length, saved = Store.get(preId(date));
    return `<div class="med-panel"><div class="panel-head"><h3>Pre-session routine</h3>${saved && saved.done ? chip('Done today', 'go') : chip(n + ' / ' + PRE.length, n ? '' : 'warn')}</div>
      <p class="tiny muted">Two minutes before you open a chart. Tick each line honestly, set one intention, and breathe.</p>
      <div class="recovery">${PRE.map((x, i) => `<button type="button" class="rec-item ${p.items[i] ? 'on' : ''}" data-action="pre-tick" data-i="${i}"><b>${p.items[i] ? '✓' : i + 1}</b><span>${esc(x)}</span></button>`).join('')}</div>
      <label>My one intention for this session<input data-bind="pre.intention" value="${esc(p.intention)}" placeholder="e.g. Wait for my setup. Skip anything else."></label>
      <div class="button-row"><button type="button" class="primary" data-action="pre-save">Save pre-session routine</button></div>
      ${meditation(date, 'Pre-session breathing')}</div>`;
  }
  Object.assign(A, {
    'pre-tick': el => { S.pre.items[el.dataset.i] = !S.pre.items[el.dataset.i]; App.render(); },
    'pre-save': async () => { const p = S.pre, done = PRE.every((_, i) => p.items[i]); await Store.save('presession', { date: p.date, items: p.items, intention: p.intention || '', done, id: preId(p.date) });
      toast(done ? 'Routine complete. Go and trade your plan.' : 'Saved. Finish the remaining lines before you trade.'); App.render(); }
  });

  /* =====================================================================
     1d) WEEKLY PSYCHOLOGY REPORT (Discipline page)
     ===================================================================== */
  function weeklyPanel(rows, s, d) {
    const today = C.todayStr(), mon = S.wrMon || (S.wrMon = C.mondayOf(today)), r = P.weeklyReport(rows, s, d, mon, today), cur = mon === C.mondayOf(today);
    const moods = Object.entries(r.moods).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${esc(k)} ×${n}`).join(' · ') || 'no moods logged';
    const trendTxt = r.avgScore != null && r.prevAvg != null ? (r.avgScore > r.prevAvg ? `up from ${r.prevAvg}` : r.avgScore < r.prevAvg ? `down from ${r.prevAvg}` : 'same as last week') : 'no previous week to compare';
    const row = (a, b) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`;
    return `<article class="panel"><div class="panel-head"><h3>Weekly psychology report</h3><div class="button-row" style="margin:0"><button class="secondary" data-action="wr-prev" type="button">←</button><span class="chip">${esc(r.monday)} to ${esc(r.end)}</span><button class="secondary" data-action="wr-next" type="button" ${cur ? 'disabled' : ''}>→</button></div></div>
      <div class="two-col"><div class="table-wrap" style="max-height:none"><table class="dt plain"><tbody>
        ${row('Average discipline score', r.avgScore == null ? '—' : `${r.avgScore} <span class="tiny muted">(${trendTxt})</span>`)}${row('Trades (closed)', `${r.trades} (${r.closed})`)}${row('Total R', f(r.totalR))}
        ${row('Moods before trades', `<span class="tiny">${moods}</span>`)}${row('Trades in a risky mood', r.riskyTrades)}${row('STOP screens respected / overridden', `${r.stopped} / ${r.overrides}`)}</tbody></table></div>
      <div class="table-wrap" style="max-height:none"><table class="dt plain"><tbody>
        ${row('Mindset checks · cool-downs · skipped trades', `${r.checks} · ${r.cooled} · ${r.skipped}`)}${row('Meditation', `${r.medMins} min on ${r.medDays} day(s)`)}${row('Calm change after meditating', r.calmGain == null ? '—' : (r.calmGain > 0 ? '+' : '') + r.calmGain + ' of 5')}
        ${row('Pre-session routines done', r.preDays)}${row('Days I read my plan', r.planReadDays + ' of ' + r.activeDays)}${row('Process grades A / B / C / D / F', Object.values(r.grades).join(' / '))}${row('Most expensive habit', r.topHabit ? esc(r.topHabit.key) : '—')}</tbody></table></div></div>
      <h4 style="margin:14px 0 6px">Focus for next week</h4>${r.focus.map(x => `<div class="finding">${esc(x)}</div>`).join('')}</article>`;
  }
  function complianceChart(rows, d) {
    const wk = P.planCompliance(rows, d, C.todayStr(), 8), W = 640, H = 200, bw = W / wk.length, last = wk[wk.length - 1], withT = wk.filter(x => x.pct != null);
    const bars = wk.map((x, i) => { const h = x.pct == null ? 3 : Math.max(4, x.pct / 100 * 120), col = x.pct == null ? '#393449' : x.pct >= 80 ? '#54d6a0' : x.pct >= 60 ? '#f4c66a' : '#ff777f', cx = i * bw + bw / 2;
      return `<rect x="${(cx - 20).toFixed(1)}" y="${(150 - h).toFixed(1)}" width="40" height="${h.toFixed(1)}" rx="4" fill="${col}"><title>Week of ${x.monday}: ${x.pct == null ? 'no trades' : x.pct + '% of ' + x.trades + ' trade(s) followed the plan'}</title></rect>
        <text x="${cx}" y="${(144 - h).toFixed(1)}" fill="#d9d3e8" font-size="12" text-anchor="middle" font-weight="600">${x.pct == null ? '' : x.pct + '%'}</text>
        <text x="${cx}" y="168" fill="#827d8c" font-size="10" text-anchor="middle">${x.monday.slice(5)}</text>
        <text x="${cx}" y="186" fill="#9b7bff" font-size="10" text-anchor="middle">${x.activeDays ? 'read ' + x.readDays + '/' + x.activeDays : ''}</text>`; }).join('');
    const avg = withT.length ? Math.round(withT.reduce((a, x) => a + x.pct, 0) / withT.length) : null;
    return `<article class="panel"><h3>Weekly plan compliance</h3><p class="tiny muted">Share of each week's trades that followed your plan (rules followed, no mistake tagged, inside your risk rule, no STOP override). Under each bar: days you read your plan out of days you were active.</p>
      ${withT.length ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Plan compliance for the last 8 weeks" style="width:100%;height:auto">${bars}</svg>
      <p class="tiny muted">${last.pct == null ? 'No trades this week yet.' : `This week: ${last.pct}% of ${last.trades} trade(s) followed the plan.`}${avg != null ? ` Average over the weeks shown: ${avg}%.` : ''} Green is 80% or more, amber 60% to 79%, red below 60%.</p>` : '<div class="empty">The chart appears once you have logged trades.</div>'}</article>`;
  }
  Object.assign(A, {
    'wr-prev': () => { S.wrMon = C.addDays(S.wrMon || C.mondayOf(C.todayStr()), -7); App.render(); },
    'wr-next': () => { const n = C.addDays(S.wrMon, 7); if (n <= C.mondayOf(C.todayStr())) { S.wrMon = n; App.render(); } }
  });


  /* =====================================================================
     DASHBOARD: "read your plan first" card
     ===================================================================== */
  const planReadId = d => C.detId(Store.uid + '|planread|' + d);
  function planCard() {
    const sts = Store.settings.strategies, today = C.todayStr();
    if (!sts.length) return `<div class="panel plan-card"><div class="panel-head"><h3>Read your plan first</h3></div><p class="muted">You have not written your trading plan yet. Your plan is the first thing to read every day, before any chart. Write it once, then read it here each time you open the app.</p><a class="primary" href="#/plan">Write my trading plan</a></div>`;
    const lastTrade = (ctx().rows.slice(-1)[0] || {}).strategy, st = sts.find(x => x.id === S.dashPlan) || sts.find(x => x.name === lastTrade) || sts[0];
    const read = Store.get(planReadId(today)), tfs = tfsOf(st).filter(x => x.tf), must = (st.rules || []).filter(r => r.must), good = (st.rules || []).filter(r => !r.must);
    const more = (st.desc ? `<p class="muted">${esc(st.desc)}</p>` : '') + (st.full ? `<pre class="note plan-full">${esc(st.full)}</pre>` : '') + (good.length ? `<p><b>Good-to-have rules</b></p><ul class="plan-rules">${good.map(r => `<li>${esc(r.text)}</li>`).join('')}</ul>` : '') + (must.length > 4 ? `<p><b>All MUST rules</b></p><ul class="plan-rules">${must.map(r => `<li>${esc(r.text)}</li>`).join('')}</ul>` : '');
    const body = `${tfs.length ? `<div class="plan-tfs">${tfs.map(x => `<div class="tf-chip"><b>${esc(x.tf)}</b><span>${esc(x.job || '')}</span></div>`).join('')}</div>` : ''}
      ${(st.inds || []).length ? `<p class="tiny" style="margin:6px 0"><b>Indicators:</b> ${st.inds.map(x => esc(x.name) + (x.use ? ' <span class="muted">(' + esc(x.use) + ')</span>' : '')).join(' · ')}</p>` : ''}
      ${st.times ? `<p class="tiny" style="margin:6px 0"><b>When I trade:</b> ${esc(st.times)}</p>` : ''}
      ${must.length ? `<ul class="plan-rules compact">${must.slice(0, 4).map(r => `<li>${esc(r.text)}</li>`).join('')}</ul>` : ''}
      ${st.skip ? `<div class="finding warn tiny"><b>I do NOT trade when:</b> ${esc(st.skip)}</div>` : ''}
      ${!st.full && !tfs.length && !must.length ? '<p class="muted">This plan is still empty. <a href="#/plan">Add your timeframes, steps and rules.</a></p>' : ''}
      ${more ? `<details><summary class="text-btn">Show full plan</summary>${more}</details>` : ''}`;
    const picker = sts.length > 1 ? `<div class="chip-row">${sts.map(x => `<button type="button" class="chip-btn ${x.id === st.id ? 'on' : ''}" data-action="dash-plan" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>` : '';
    return `<div class="panel plan-card ${read ? 'read' : ''}"><div class="panel-head"><h3>${read ? 'Your plan' : 'Read your plan first'}${sts.length === 1 ? ' · ' + esc(st.name) : ''}</h3>${read ? chip('Read today ' + esc((read.at || '').slice(11, 16)), 'go') : chip('Not read yet today', 'warn')}</div>
      ${picker}${read ? `<details><summary class="text-btn">Show my plan again</summary>${body}</details>` : body}
      <div class="button-row">${read ? '' : '<button type="button" class="primary" data-action="plan-read">I have read my plan. I will follow it.</button>'}<a class="secondary" href="#/plan">Edit my plan</a></div></div>`;
  }
  /* the plan, one tap away on the trade form */
  function planPeek(name) {
    const st = Store.settings.strategies.find(x => x.name === name); if (!st) return '';
    const tfs = tfsOf(st).filter(x => x.tf), must = (st.rules || []).filter(r => r.must);
    if (!st.full && !tfs.length && !must.length) return '';
    return `<details class="plan-view"><summary>Read my plan: ${esc(st.name)}</summary>${(st.inds || []).length ? `<p><b>Indicators:</b> ${st.inds.map(x => esc(x.name) + (x.use ? ' (' + esc(x.use) + ')' : '')).join(' · ')}</p>` : ''}${tfs.length ? `<div class="plan-tfs">${tfs.map(x => `<div class="tf-chip"><b>${esc(x.tf)}</b><span>${esc(x.job || '')}</span></div>`).join('')}</div>` : ''}${st.times ? `<p><b>When I trade:</b> ${esc(st.times)}</p>` : ''}${st.full ? `<pre class="note plan-full">${esc(st.full)}</pre>` : ''}${must.length ? `<p><b>MUST rules</b></p><ul class="plan-rules">${must.map(r => `<li>${esc(r.text)}</li>`).join('')}</ul>` : ''}${st.skip ? `<div class="finding warn"><b>I do NOT trade when:</b> ${esc(st.skip)}</div>` : ''}</details>`;
  }
  Object.assign(A, {
    'dash-plan': el => { S.dashPlan = el.dataset.id; App.render(); },
    'plan-read': async () => { const sts = Store.settings.strategies; await Store.save('planread', { date: C.todayStr(), at: new Date().toISOString(), strategies: sts.map(x => x.name), id: planReadId(C.todayStr()) }); toast('Good. Now trade only what is in your plan.'); App.render(); }
  });

  /* =====================================================================
     2) DASHBOARD BLOCK
     ===================================================================== */

  /* ---- user-friendly helpers: welcome card, "Your day" guide, help page ---- */
  function welcome() {
    const s = Store.settings;
    if (Store.settingsSaved || s.onboarded || S.welcomeSkip) return '';
    return `<article class="panel welcome"><h3>Welcome to TradeMind - 4 quick questions</h3>
      <p class="muted">This takes 30 seconds and you can change everything later in Settings. Nothing here is a trading signal - it just sets up your own rules.</p>
      <div class="form-grid two">
        <label>Account balance<input type="number" id="wc-bal" inputmode="decimal" value="${s.balance || ''}" placeholder="e.g. 1000"></label>
        <label>Currency<input type="text" id="wc-cur" value="${esc(s.currency || 'USD')}" maxlength="5"></label>
        <label>Max % of account I risk per trade<input type="number" id="wc-risk" inputmode="decimal" step="0.1" value="${s.riskPct || 1}"><small class="tiny muted">Most careful traders use 1% or less.</small></label>
        <label>My level<select id="wc-lvl"><option value="beginner">Beginner</option><option value="experienced">Experienced</option></select></label>
      </div>
      <div class="button-row"><button class="primary" data-action="wc-save">Save and start</button><button class="secondary" data-action="wc-skip">Skip for now</button></div></article>`;
  }
  function yourDay() {
    const today = C.todayStr(), d = bundle(), { rows, s } = ctx();
    const read = d.planread.some(x => x.date === today), dc = d.dc[today], pre = d.pre.some(x => x.date === today), rv = d.rv[today], n = rows.filter(r => r.date === today).length;
    const st = [[read, 'Read my plan', 'Remind yourself what you do and what you skip.', 'dashboard', 'dash-plan-focus'], [!!dc, 'Daily Check', 'Are you fit to trade today?', 'daily'], [pre, 'Pre-session routine', 'Two minutes before you open charts.', 'daily'],
      [n > 0, n ? n + ' trade(s) logged' : 'Trade only if the checklist says GO', 'Checklist first, then log it.', 'checklist'], [!!rv, 'Daily Review', 'Close the day: grade it and note the lesson.', 'review']];
    const next = st.findIndex(x => !x[0]);
    if (!s.strategies.length) return '';
    return `<article class="panel your-day"><div class="panel-head"><h3>Your day</h3><span class="tiny muted">${st.filter(x => x[0]).length} of ${st.length} done</span></div><div class="day-steps">${st.map((x, i) => `<a class="day-step ${x[0] ? 'done' : ''} ${i === next ? 'next' : ''}" href="#/${x[3]}"><b>${x[0] ? '✓' : i + 1}</b><span><strong>${esc(x[1])}</strong><small>${esc(x[2])}</small></span></a>`).join('')}</div></article>`;
  }
  const GLOSS = [['R', 'Your risk on one trade. If you risk 10 and win 20, that is +2R. Measuring in R lets you compare trades of any size.'], ['R:R (risk to reward)', 'How much you aim to make compared with what you risk. 1:2 means aiming to win twice what you risk.'], ['Win rate', 'The share of trades that win. With a good R:R you can be profitable winning under half your trades.'], ['Drawdown', 'How far your account falls from its highest point. It shows how much a bad run hurts.'], ['Daily loss limit', 'The most you allow yourself to lose in one day. Hit it and the app tells you to stop.'], ['STOP / cool-down', 'A pause the app asks for after rule breaks or losses in a row, so you do not revenge-trade.'], ['Process grade (A-F)', 'A score for how well you followed your plan on a trade - not whether it made money.'], ['Discipline score', 'A 0-100 score for the day: plan read, checks done, limits kept, rules followed, review written.'], ['Lot size', 'The size of your position. You set it; the app only shows what your risk rule would suggest.'], ['Journal vs mentor', 'The journal records what you did. The Mentor teaches lessons and answers questions from your own data.']];
  function help() {
    return `${Views.h.intro('Help & Guide', 'Everything in one place. New here? Read the first card.')}
      <article class="panel"><h3>A simple day</h3><ol class="help-list"><li><b>Read your plan</b> on the Home page.</li><li><b>Daily Check</b> - are you rested and calm? If not, skip trading.</li><li><b>Pre-session routine</b> - two minutes before charts.</li><li><b>Checklist</b> - only trade when it says GO. Then <b>Log trade</b> with a short "why".</li><li><b>Daily Review</b> - grade the day, meditate if tense, write one lesson.</li></ol></article>
      <article class="panel"><h3>Where is everything?</h3><div class="help-grid">
        <a href="#/plan"><b>My Trading Plan</b><small>Write your own strategy, timeframes and rules.</small></a><a href="#/log"><b>Trade Log</b><small>All trades, filters and export.</small></a>
        <a href="#/discipline"><b>Mindset &amp; Discipline</b><small>Score, streak, calm tools and weekly report.</small></a><a href="#/mentor"><b>Mentor &amp; Lessons</b><small>Beginner to advanced lessons with pictures and quizzes.</small></a>
        <a href="#/weekly"><b>Weekly Check</b><small>Look back and pick one thing to improve.</small></a><a href="#/settings"><b>Settings</b><small>Balance, risk %, limits, account and backup.</small></a></div></article>
      <article class="panel"><h3>Words explained</h3><dl class="gloss">${GLOSS.map(g => `<dt>${esc(g[0])}</dt><dd>${esc(g[1])}</dd>`).join('')}</dl></article>
      <article class="panel"><h3>On your phone</h3><p class="muted">Use the buttons at the bottom: Home, My Plan, Log trade, Mentor and More (all other pages). To install the app, open the site in your browser menu and choose "Add to Home screen". Trading involves risk; TradeMind is a journal and teaching tool, not financial advice.</p></article>`;
  }


  /* =====================================================================
     BOOKS I READ
     ===================================================================== */
  const BK_STATUS = ['Want to read', 'Reading', 'Finished'];
  const BK_TOPICS = ['Trading', 'Psychology', 'Money', 'Business', 'Health', 'Faith', 'Self-growth', 'Other'];
  const newBook = () => ({ title: '', author: '', topic: 'Trading', status: 'Reading', rating: '', finished: '', summary: '', lessons: '', improve: '', quote: '', chapters: [] });
  const stars = n => n ? '★'.repeat(+n) + '☆'.repeat(5 - n) : '';
  function bookActions() {
    const acts = Store.list('bookaction').sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (!acts.length) return '';
    const open = acts.filter(x => !x.done).length;
    return `<article class="panel"><div class="panel-head"><h3>Things I will do from my books</h3><span class="tiny muted">${open} to do</span></div><div class="day-steps">${acts.map(x => `<div class="day-step ${x.done ? 'done' : ''}"><button type="button" class="chk" data-action="bk-tick" data-id="${esc(x.id)}" aria-pressed="${!!x.done}" aria-label="Mark done">${x.done ? '✓' : ''}</button><span><strong>${esc(x.text)}</strong><small>${esc(x.book || '')}</small></span><button type="button" class="text-btn" data-action="bk-actdel" data-id="${esc(x.id)}" aria-label="Remove">✕</button></div>`).join('')}</div></article>`;
  }
  function books() {
    const all = Store.list('book').sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    if (S.bk) {
      const b = S.bk;
      return `${intro(b.id ? 'Edit book' : 'Add a book', 'Write it in your own words - that is how it stays with you.')}
        <div class="panel form-panel"><div class="form-grid two"><label>Book title<input type="text" data-bind="bk.title" value="${esc(b.title)}" placeholder="e.g. Trading in the Zone"></label><label>Author<input type="text" data-bind="bk.author" value="${esc(b.author)}"></label>
          <label>Topic<select data-bind="bk.topic">${BK_TOPICS.map(x => `<option ${b.topic === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label>Status<select data-bind="bk.status">${BK_STATUS.map(x => `<option ${b.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label>My rating<select data-bind="bk.rating"><option value="">Not rated</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${String(b.rating) === String(n) ? 'selected' : ''}>${stars(n)}</option>`).join('')}</select></label>
          <label>Date finished<input type="date" data-bind="bk.finished" value="${esc(b.finished)}"></label></div>
          <label>Summary - what the book is about, in my own words<textarea rows="5" data-bind="bk.summary" placeholder="The main idea and the story of the book...">${esc(b.summary)}</textarea></label>
          <h4 style="margin:14px 0 4px">Chapter by chapter</h4><p class="tiny muted">Add a row for each chapter: its name or number, and the lesson you took from it.</p>
          ${(b.chapters || []).map((c, i) => `<div class="chapter-row"><input data-ch="title" data-i="${i}" value="${esc(c.title || '')}" placeholder="Chapter (e.g. 3 - The Market Is Random)"><textarea rows="2" data-ch="lesson" data-i="${i}" placeholder="Lesson from this chapter">${esc(c.lesson || '')}</textarea><button type="button" class="secondary" data-action="ch-del" data-i="${i}" aria-label="Remove chapter">✕</button></div>`).join('')}
          <div class="button-row"><button type="button" class="secondary" data-action="ch-add">＋ Add a chapter</button></div>
          <label>Overall lessons from the whole book (one per line)<textarea rows="5" data-bind="bk.lessons" placeholder="1. ...&#10;2. ...">${esc(b.lessons)}</textarea></label>
          <label>How this can improve my life / what I will do differently<textarea rows="4" data-bind="bk.improve" placeholder="Be specific: what will I start, stop or change this week?">${esc(b.improve)}</textarea></label>
          <label>A quote worth keeping (optional)<textarea rows="2" data-bind="bk.quote">${esc(b.quote)}</textarea></label>
          <div class="form-actions"><button type="button" class="secondary" data-action="bk-cancel">Cancel</button><button class="primary" data-action="bk-save">Save book</button></div></div>`;
    }
    const q = (S.bkQ || '').toLowerCase(), list = all.filter(b => !q || (b.title + ' ' + b.author + ' ' + b.topic + ' ' + b.lessons).toLowerCase().includes(q));
    const fin = all.filter(b => b.status === 'Finished').length;
    const card = b => `<article class="panel book"><div class="panel-head"><div><h3>${esc(b.title)}</h3><small class="muted">${esc(b.author || 'Unknown author')} · ${esc(b.topic || '')}</small></div>${chip(esc(b.status || ''), b.status === 'Finished' ? 'go' : 'warn')}</div>
      ${b.rating ? `<div class="stars" aria-label="${b.rating} out of 5">${stars(b.rating)}</div>` : ''}
      ${b.improve ? `<div class="finding good"><b>How it improves my life:</b> ${esc(b.improve)}<div><button type="button" class="text-btn" data-action="bk-act" data-id="${esc(b.id)}">＋ Make this an action to do</button></div></div>` : ''}
      <details><summary class="text-btn">Read my summary and lessons</summary>${(b.chapters || []).filter(c => c.title || c.lesson).length ? `<h4>Chapters</h4><ol class="chapters">${b.chapters.filter(c => c.title || c.lesson).map(c => `<li><b>${esc(c.title || '')}</b><p class="prewrap">${esc(c.lesson || '')}</p></li>`).join('')}</ol>` : ''}${b.summary ? `<h4>Summary</h4><p class="prewrap">${esc(b.summary)}</p>` : ''}${b.lessons ? `<h4>Overall lessons</h4><p class="prewrap">${esc(b.lessons)}</p>` : ''}${b.quote ? `<blockquote class="note">${esc(b.quote)}</blockquote>` : ''}${b.finished ? `<p class="tiny muted">Finished ${esc(b.finished)}</p>` : ''}</details>
      <div class="button-row"><button type="button" class="secondary" data-action="bk-edit" data-id="${esc(b.id)}">Edit</button><button type="button" class="text-btn" data-action="bk-del" data-id="${esc(b.id)}">Delete</button></div></article>`;
    return `${intro('Books I Read', 'Keep a short summary, the lessons, and what you will change in your life. Reading only helps when you act on it.')}
      <div class="panel lf-datebar"><div class="lf-date" style="text-align:left;align-items:flex-start"><b>${all.length} book${all.length === 1 ? '' : 's'} · ${fin} finished</b></div><button type="button" class="primary" style="width:auto;padding:0 16px;font-size:15px" data-action="bk-new">＋ Add a book</button></div>
      ${bookActions()}
      ${all.length > 3 ? `<input type="search" id="bk-q" placeholder="Search title, author or lesson" value="${esc(S.bkQ || '')}" style="margin-bottom:12px">` : ''}
      ${list.length ? list.map(card).join('') : `<div class="panel"><div class="empty">${all.length ? 'No book matches your search.' : 'No books yet. Add the book you are reading now - even one line of summary counts.'}</div></div>`}`;
  }
  Object.assign(A, {
    'bk-act': async el => { const b = Store.get(el.dataset.id); if (!b) return; const txt = (b.improve || '').split(/\n/)[0].slice(0, 160); await Store.save('bookaction', { text: txt, book: b.title, bookId: b.id, done: false }); toast('Added to your to-do list'); App.render(); },
    'bk-tick': async el => { const x = Store.get(el.dataset.id); if (!x) return; const { id, updatedAt, ...d } = x; await Store.save('bookaction', { ...d, id: el.dataset.id, done: !x.done }); App.render(); },
    'bk-actdel': async el => { await Store.remove(el.dataset.id); App.render(); },
    'ch-add': () => { S.bk.chapters = [...(S.bk.chapters || []), { title: '', lesson: '' }]; App.render(); },
    'ch-del': el => { S.bk.chapters = (S.bk.chapters || []).filter((_, i) => i !== +el.dataset.i); App.render(); },
    'bk-new': () => { S.bk = newBook(); App.render(); window.scrollTo(0, 0); },
    'bk-cancel': () => { S.bk = null; App.render(); },
    'bk-edit': el => { const b = Store.get(el.dataset.id); if (b) { S.bk = { ...newBook(), ...b, id: b.id || el.dataset.id }; App.render(); window.scrollTo(0, 0); } },
    'bk-del': async el => { if (!confirm('Delete this book and your notes on it?')) return; await Store.remove(el.dataset.id); toast('Book deleted'); App.render(); },
    'bk-save': async () => { const b = S.bk; if (!(b.title || '').trim()) return toast('Type the book title first.'); const { id, updatedAt, ...d } = b; d.chapters = (b.chapters || []).filter(c => (c.title || '').trim() || (c.lesson || '').trim()); await Store.save('book', { ...d, title: b.title.trim(), ...(id ? { id } : {}) }); S.bk = null; toast('Book saved'); App.render(); window.scrollTo(0, 0); }
  });
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.ch && S.bk) { S.bk.chapters = (S.bk.chapters || []).map(c => ({ ...c })); S.bk.chapters[+t.dataset.i][t.dataset.ch] = t.value; return; } });
  document.addEventListener('input', e => { if (e.target.id === 'bk-q') { S.bkQ = e.target.value; const pos = e.target.selectionStart; App.render(); const n = document.getElementById('bk-q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } } });

  function dashBlock() {
    const { s, rows } = ctx(), d = bundle(), sm = P.disciplineSummary(rows, s, d, C.todayStr()), t = tiltNow(), h = P.habitCost(rows), td = sm.today;
    const banner = t.level === 'stop' && !t.stopped ? `<div class="notice stop-banner"><b>STOP for today.</b> ${t.stop.map(esc).join(' ')} <a href="#/discipline">Open the recovery routine</a></div>`
      : t.level === 'stop' ? '<div class="notice good"><b>You stopped for today.</b> Good discipline. Rest, review and come back tomorrow.</div>'
      : t.level === 'caution' ? `<div class="notice warning"><b>Caution.</b> ${t.caution.map(esc).join(' ')}</div>` : '';
    const card = (l, v, sm2 = '', c = '') => `<article class="stat-card"><span>${l}</span><strong class="${c}">${v}</strong><small>${sm2}</small></article>`;
    return `${welcome()}${planCard()}${yourDay()}${banner}<div class="stats-grid three">
      ${card('Discipline today', td ? td.score + '<small style="font-size:12px"> / 100</small>' : '—', td ? (td.flags[0] ? esc(td.flags[0]) : 'Everything on track') : 'Do your Daily Check to start', td ? (td.score >= P.GOOD_DAY ? 'positive' : td.score < 50 ? 'negative' : '') : '')}
      ${card('Good-day streak', sm.streak + (sm.streak === 1 ? ' day' : ' days'), `Best ${sm.best} · 7-day average ${sm.avg7 == null ? '—' : sm.avg7}`)}
      ${card('Most expensive habit', h.top ? esc(h.top.key) : '—', h.top ? `${h.top.count} trade(s) · ${money(h.top.net)} ${esc(s.currency)}` : 'Tag mistakes and moods to find yours', h.top ? 'negative' : '')}</div>`;
  }

  /* =====================================================================
     3) DISCIPLINE PAGE
     ===================================================================== */
  function trend(sm, today) {
    const days = []; for (let i = 13; i >= 0; i--) days.push(C.addDays(today, -i));
    const map = Object.fromEntries(sm.days.map(x => [x.date, x])), W = 640, H = 120, bw = W / days.length;
    const bars = days.map((d, i) => { const x = map[d], sc = x ? x.score : 0, h = x ? Math.max(4, sc / 100 * (H - 22)) : 3, col = !x ? '#393449' : sc >= P.GOOD_DAY ? '#54d6a0' : sc >= 50 ? '#f4c66a' : '#ff777f';
      return `<rect x="${(i * bw + 5).toFixed(1)}" y="${(H - 16 - h).toFixed(1)}" width="${(bw - 10).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${col}"><title>${d}: ${x ? sc : 'no activity'}</title></rect><text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 3}" fill="#827d8c" font-size="9" text-anchor="middle">${d.slice(8)}</text>`; }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Discipline score for the last 14 days" style="width:100%;height:auto">${bars}</svg>`;
  }
  function discipline() {
    const { s, rows } = ctx(), today = C.todayStr(), d = bundle(), sm = P.disciplineSummary(rows, s, d, today), t = tiltNow(), h = P.habitCost(rows), pv = P.processVsResult(rows), td = sm.today;
    const closed = rows.filter(r => r.outcome), gr = { A: 0, B: 0, C: 0, D: 0, F: 0 }; closed.forEach(r => { const g = P.gradeTrade(r); if (g) gr[g.letter]++; });
    const gTotal = Object.values(gr).reduce((a, b) => a + b, 0), g = G();
    const status = t.level === 'stop' ? `<div class="notice stop-banner"><b>STOP today.</b> ${t.stop.map(esc).join(' ')}</div>` : t.level === 'caution' ? `<div class="notice warning"><b>Caution.</b> ${t.caution.map(esc).join(' ')}</div>` : '<div class="notice good">You are inside your limits and your head is clear on paper. Keep it that way.</div>';
    return `${intro('Mindset & Discipline', 'Your score rewards following your plan, not making money. Profit is the by-product of good process repeated many times, and nobody can promise it.')}
      ${status}
      <div class="two-col">
        <article class="panel"><div class="panel-head"><h3>Today's discipline score</h3>${td ? chip(td.score >= P.GOOD_DAY ? 'Good day' : 'Needs work', td.score >= P.GOOD_DAY ? 'go' : 'warn') : ''}</div>
          ${td ? `<div class="score-big ${td.score >= P.GOOD_DAY ? 'positive' : td.score < 50 ? 'negative' : ''}">${td.score}<small> / 100</small></div>
            <div class="table-wrap" style="max-height:none"><table class="dt plain"><tbody>${td.parts.map(p => `<tr><td>${esc(p[0])}</td><td class="num">${p[1]} / ${p[2]}</td></tr>`).join('')}</tbody></table></div>
            ${td.flags.length ? `<p class="tiny muted" style="margin-top:8px">Fix next: ${td.flags.map(esc).join(' · ')}</p>` : ''}`
          : '<div class="empty">Nothing recorded today yet. Do your <a href="#/daily">Daily Check</a> to start the day with a score.</div>'}</article>
        <article class="panel"><h3>Last 14 days</h3>${trend(sm, today)}
          <p class="tiny muted">${sm.streak} good-day streak · best ${sm.best} · 7-day average ${sm.avg7 == null ? '—' : sm.avg7} · 30-day average ${sm.avg30 == null ? '—' : sm.avg30}. A good day scores ${P.GOOD_DAY}+; weekends do not break a streak.</p></article></div>

      ${weeklyPanel(rows, s, d)}
      ${complianceChart(rows, d)}
      <article class="panel"><h3>Badges</h3><div class="badge-grid">${sm.badges.map(b => `<div class="badge ${b.earned ? 'earned' : ''}" title="${esc(b.desc)}"><div class="b-icon">${b.icon}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small><div class="b-bar"><i style="width:${Math.round(b.have / b.need * 100)}%"></i></div><small>${b.have}/${b.need}</small></div>`).join('')}</div></article>

      <div class="two-col">
        <article class="panel"><h3>Process grades</h3>
          ${gTotal ? `<div class="grade-dist">${Object.entries(gr).map(([k, n]) => `<div><div class="gd-bar"><i style="height:${gTotal ? Math.round(n / gTotal * 100) : 0}%"></i></div><b>${k}</b><small>${n}</small></div>`).join('')}</div>
          <p class="tiny muted">Average process score ${pv.avgPoints}/100 over ${pv.graded} graded trade(s). Grades look at plan, checklist, R:R, rules, mistakes and mindset, never at profit.</p>
          <div class="finding good">${pv.goodWin} good-process win(s) and ${pv.goodLoss} good-process loss(es): losing with good process is normal variance.</div>
          ${pv.luckyWin ? `<div class="finding warn">${pv.luckyWin} win(s) came from a poor process. Those are lucky wins: do not repeat them.</div>` : ''}
          ${pv.avgRGood != null && pv.avgRPoor != null ? `<div class="finding">Trades graded B or better averaged ${f(pv.avgRGood)}R; poorly graded trades averaged ${f(pv.avgRPoor)}R.</div>` : ''}`
          : '<div class="empty">Grades appear once you answer "Followed my rules?" on a trade.</div>'}</article>
        <article class="panel"><h3>Most expensive habits</h3>
          ${h.list.length ? `<div class="table-wrap" style="max-height:none"><table class="dt plain"><thead><tr><th>Habit</th><th class="num">Trades</th><th class="num">Total R</th><th class="num">Net ${esc(s.currency)}</th></tr></thead><tbody>${h.list.map(x => `<tr><td>${esc(x.key)}</td><td class="num">${x.count}</td><td class="num ${cls(x.totalR)}">${f(x.totalR)}</td><td class="num ${cls(x.net)}">${money(x.net)}</td></tr>`).join('')}</tbody></table></div>
          ${h.flaggedCount >= 3 && h.cleanCount >= 3 ? `<div class="finding">${h.flaggedCount} flagged trades totalled ${money(h.flaggedNet)} ${esc(s.currency)} (${f(h.flaggedAvgR)}R average). ${h.cleanCount} clean trades totalled ${money(h.cleanNet)} (${f(h.cleanAvgR)}R average). Small samples can mislead, but this is the comparison to watch.</div>` : ''}`
          : '<div class="empty">No costly habits yet. Tag mistakes, moods and rule-breaks honestly and this table finds the expensive ones.</div>'}</article></div>

      <article class="panel"><h3>Recovery routine</h3><p class="muted">Use it after a loss, when you feel the urge to "get it back", or whenever you feel off. It works better than willpower.</p>
        ${recoveryList(g)}<div class="button-row"><button class="primary" data-action="stop-done">I am stepping away for today</button><a class="secondary" href="#/checkins">Write an emotion check-in</a><a class="secondary" href="#/mentor/a6">Read: tilt and loss streaks</a></div></article>
      ${recentMinds()}`;
  }
  function recentMinds() {
    const m = Store.list('mindset').sort((a, b) => (b.ts || '').localeCompare(a.ts || '')).slice(0, 8);
    if (!m.length) return '';
    return `<article class="panel"><h3>Recent mindset checks</h3><div class="table-wrap" style="max-height:none"><table class="dt plain"><thead><tr><th>When</th><th>Mood</th><th>Flagged</th><th>Result</th></tr></thead><tbody>${m.map(x => `<tr><td>${esc((x.ts || '').slice(0, 16).replace('T', ' '))}</td><td>${esc(x.mood)}</td><td>${x.risky ? esc((x.why || []).join(' ')) : 'Clear'}</td><td>${x.decision === 'skip' ? chip('Skipped trade', 'ok') : x.cooled ? chip('Cooled down', 'ok') : chip('Went ahead', '')}</td></tr>`).join('')}</tbody></table></div></article>`;
  }

  /* =====================================================================
     4) MENTOR PAGE
     ===================================================================== */
  S.mt = S.mt || { chat: [], quiz: null, aiBusy: false };
  const mentorCtx = () => { const { s, rows } = ctx(), today = C.todayStr(), d = bundle(); return { rows, s, st: C.stats(rows, s), habits: P.habitCost(rows), tilt: P.tiltState(rows, s, today, d.tilt), dc: d.dc[today], date: today, level: progress().level, disc: P.disciplineSummary(rows, s, d, today) }; };
  const aiOn = () => !!(cfg.AI_MENTOR && Store.isCloud && App.sb);
  function block(b) {
    if (typeof b === 'string') return `<p>${esc(b)}</p>`;
    if (b.h) return `<h4>${esc(b.h)}</h4>`;
    if (b.ul) return `<ul>${b.ul.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (b.fig) return root.Figures ? Figures.render(b) : '';
    if (b.tip) return `<div class="finding good"><b>Tip:</b> ${esc(b.tip)}</div>`;
    if (b.warn) return `<div class="notice warning">${esc(b.warn)}</div>`;
    return '';
  }
  function lessonView(id) {
    const l = Ls.get(id); if (!l) return mentorHome();
    const p = progress(), q = S.mt.quiz && S.mt.quiz.id === id ? S.mt.quiz : (S.mt.quiz = { id, picks: {} }), n = l.quiz.length, answered = Object.keys(q.picks).length;
    const score = l.quiz.reduce((a, x, i) => a + (q.picks[i] === x.a ? 1 : 0), 0), fin = answered === n;
    const idx = Ls.LESSONS.indexOf(l), next = Ls.LESSONS[idx + 1];
    return `<div class="lesson"><p><a href="#/mentor">← All lessons</a></p><div class="eyebrow">${({ beginner: 'BEGINNER', experienced: 'EXPERIENCED', guide: 'FIELD GUIDE' })[l.track]} · ${l.min} MIN READ</div><h2>${esc(l.title)}</h2>
      <article class="panel lesson-body">${l.body.map(block).join('')}</article>
      <article class="panel"><h3>Quick quiz</h3>${l.quiz.map((x, i) => `<div class="quiz-q"><b>${i + 1}. ${esc(x.q)}</b>${x.opts.map((o, k) => { const pk = q.picks[i], st = pk == null ? '' : k === x.a ? 'right' : k === pk ? 'wrong' : '';
          return `<button type="button" class="quiz-opt ${st}" ${pk == null ? '' : 'disabled'} data-action="mt-pick" data-q="${i}" data-o="${k}">${esc(o)}</button>`; }).join('')}
        ${q.picks[i] != null ? `<div class="finding ${q.picks[i] === x.a ? 'good' : 'warn'}">${q.picks[i] === x.a ? 'Correct. ' : 'Not quite. '}${esc(x.why)}</div>` : ''}</div>`).join('')}
        ${fin ? `<div class="verdict ${score >= 2 ? 'go' : 'stop'}">${score} / ${n} ${score >= 2 ? '· Lesson complete' : '· Review and try again'}</div>
          <div class="button-row">${score >= 2 ? `<button class="primary" data-action="mt-finish" data-id="${id}" data-score="${score}">${p.done[id] ? 'Saved' : 'Save progress'}</button>` : ''}<button class="secondary" data-action="mt-retry">Try the quiz again</button>${next ? `<a class="secondary" href="#/mentor/${next.id}">Next lesson →</a>` : ''}</div>` : `<p class="tiny muted">${answered} of ${n} answered.</p>`}</article></div>`;
  }
  function mentorHome() {
    const p = progress(), c = mentorCtx(), rec = M.recommend(p.level, p, c), total = Ls.LESSONS.length, done = Object.keys(p.done).filter(k => Ls.get(k)).length;
    const track = t => `<article class="panel"><h3>${esc(Ls.TRACKS[t])}</h3><div class="lesson-list">${Ls.track(t).map(l => `<a class="lesson-row ${p.done[l.id] ? 'done' : ''}" href="#/mentor/${l.id}"><b>${p.done[l.id] ? '✓' : ''}</b><span>${esc(l.title)}</span><small>${l.min} min${p.scores[l.id] != null ? ' · quiz ' + p.scores[l.id] + '/3' : ''}</small></a>`).join('')}</div></article>`;
    const ask = `<article class="panel"><h3>Ask the mentor</h3><p class="tiny muted">Free answers from the lessons and your own journal numbers. The mentor never predicts the market or gives buy/sell signals.</p>
      <form id="mt-form" class="ask-row"><input id="mt-q" placeholder="e.g. Should I trade now? What is my biggest mistake?" autocomplete="off"><button class="primary" type="submit">Ask</button>${aiOn() ? '<button class="secondary" type="button" data-action="mt-ai">Ask the AI mentor</button>' : ''}</form>
      <div class="chip-row">${M.SUGGESTIONS.map(x => `<button type="button" class="chip-btn" data-action="mt-suggest" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <div id="mt-chat">${S.mt.chat.slice().reverse().map(m => `<div class="chat-q">${esc(m.q)}</div><div class="chat-a ${m.ai ? 'ai' : ''}">${m.ai ? '<small class="ai-tag">AI mentor</small>' : ''}${esc(m.text).replace(/\n/g, '<br>')}${m.lesson ? `<div><a href="#/mentor/${m.lesson.id}">Read: ${esc(m.lesson.title)} →</a></div>` : ''}</div>`).join('')}</div>
      ${S.mt.aiBusy ? '<p class="tiny muted">The AI mentor is thinking…</p>' : ''}</article>`;
    return `${intro('Mentor', 'Free lessons, quizzes and coaching from your own data. Pick your level; the mentor suggests what to study next.')}
      <div class="panel"><div class="panel-head"><h3>Your level</h3><div class="seg"><button type="button" class="${p.level === 'beginner' ? 'on-y' : ''}" data-action="mt-level" data-v="beginner">Beginner</button><button type="button" class="${p.level === 'experienced' ? 'on-y' : ''}" data-action="mt-level" data-v="experienced">Experienced</button></div></div>
        <div class="progress-line"><i style="width:${Math.round(done / total * 100)}%"></i></div><p class="tiny muted">${done} of ${total} lessons completed.</p>
        ${rec ? `<div class="next-lesson"><div><div class="eyebrow">NEXT FOR YOU</div><b>${esc(rec.lesson.title)}</b><p class="tiny muted">${esc(rec.reason)}</p></div><a class="primary" href="#/mentor/${rec.lesson.id}">Start lesson</a></div>` : '<div class="finding good">You have finished every lesson. Revisit any of them when your data shows a weak spot.</div>'}</div>
      ${ask}
      <div class="two-col">${track(p.level === 'experienced' ? 'experienced' : 'beginner')}${track(p.level === 'experienced' ? 'beginner' : 'experienced')}</div>
      ${track('guide')}
      <div class="notice">Education only. Nothing here is financial advice or a promise of profit. Most traders lose money; the lessons are about managing risk and your own behaviour.</div>`;
  }
  const mentor = param => param ? lessonView(param) : mentorHome();

  async function askAI(q) {
    if (!aiOn()) return toast('The AI mentor is not switched on for this app.');
    S.mt.aiBusy = true; App.render();
    try {
      const { data, error } = await App.sb.functions.invoke('mentor-ai', { body: { question: q, context: M.aiContext(mentorCtx()) } });
      let text = data && data.answer;
      if (error || !text) { const st = error && error.context && error.context.status; text = st === 429 ? 'You have used your AI mentor questions for today. The free mentor and lessons still work.' : 'The AI mentor could not answer right now. Try the free mentor instead.'; }
      S.mt.chat.push({ q, text, ai: !!(data && data.answer), lesson: null });
    } catch (e) { S.mt.chat.push({ q, text: 'The AI mentor could not be reached. Check your connection and try again.', ai: false }); }
    S.mt.aiBusy = false; App.render();
  }
  Object.assign(A, {
    'wc-save': async () => { const g = i => document.getElementById(i), s = Store.settings, n = parseFloat(g('wc-bal').value), r = parseFloat(g('wc-risk').value);
      if (!(n > 0) || !(r > 0 && r <= 10)) { Views.h.toast('Enter a balance above 0 and a risk % between 0 and 10.'); return; }
      await Store.saveSettings({ ...s, balance: n, currency: (g('wc-cur').value || 'USD').trim().toUpperCase(), riskPct: r, onboarded: true });
      const p = progress(); p.level = g('wc-lvl').value; await saveProgress(p); Views.h.toast('Saved - next, write your own trading plan.'); App.render(); },
    'wc-skip': () => { S.welcomeSkip = true; App.render(); },
    'mt-level': async el => { const p = progress(); p.level = el.dataset.v; await saveProgress(p); App.render(); },
    'mt-suggest': el => { const a = M.answer(el.dataset.q, mentorCtx()); S.mt.chat.push({ q: el.dataset.q, text: a.text, lesson: a.lesson }); App.render(); },
    'mt-ai': () => { const i = $('#mt-q'), q = i && i.value.trim(); if (!q) return toast('Type your question first.'); askAI(q); },
    'mt-pick': el => { S.mt.quiz.picks[+el.dataset.q] = +el.dataset.o; App.render(); },
    'mt-retry': () => { S.mt.quiz = null; App.render(); },
    'mt-finish': async el => { const p = progress(); p.done[el.dataset.id] = true; p.scores[el.dataset.id] = Math.max(+el.dataset.score, p.scores[el.dataset.id] || 0); await saveProgress(p); toast('Lesson saved'); location.hash = '#/mentor'; }
  });
  document.addEventListener('submit', e => {
    if (e.target.id !== 'mt-form') return; e.preventDefault();
    const i = $('#mt-q'), q = i.value.trim(); if (!q) return; const a = M.answer(q, mentorCtx()); S.mt.chat.push({ q, text: a.text, lesson: a.lesson }); App.render();
  });

  Object.assign(Views, { discipline, mentor, help, books, Psy: { bundle, gate, after, gradeBox, updateGrade, dashBlock, meditation, preSession, planPeek } });
  root.Psy = Views.Psy;
})(self);
