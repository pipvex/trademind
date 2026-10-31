/* TradeMind pages. Each page is a function that returns HTML; user actions are handled by data-action delegation. */
(function (root) {
  'use strict';
  const C = Calc, O = Calc.OPTIONS;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = (n, d = 2) => n == null || n === '' || Number.isNaN(n) ? '' : Number(n).toFixed(d);
  const money = n => n == null || n === '' ? '' : (n < 0 ? '-' : '') + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pc = n => n == null ? '—' : (n * 100).toFixed(1) + '%';
  const cls = n => n > 0 ? 'positive' : n < 0 ? 'negative' : '';
  const toast = m => root.App.toast(m);
  const go = h => { location.hash = '#/' + h; };
  const clone = o => JSON.parse(JSON.stringify(o));
  const ctx = () => { const s = Store.settings; return { s, rows: C.enrich(Store.list('trade'), s) }; };
  const dcId = d => C.detId(Store.uid + '|dailycheck|' + d), rvId = d => C.detId(Store.uid + '|review|' + d), wkId = d => C.detId(Store.uid + '|weekly|' + d);
  const SAMPLE_BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

  /* ---------- page state (drafts live here until saved) ---------- */
  const S = { dcDate: null, dcDraft: null, clStrategy: '', clAnswers: {}, tradePrefill: null, trade: null, tradeParam: null, tradeNew: false, tradeSaved: false,
    rvDate: null, rvDraft: null, wkMonday: null, wkDraft: null, planDraft: null, planDirty: false, setDraft: null, filter: { q: '', strategy: '', outcome: '' } };

  /* ---------- small HTML helpers ---------- */
  const options = (list, cur, blank) => {
    const l = !cur || list.includes(cur) ? list : [...list, cur];
    return (blank == null ? '' : `<option value="">${esc(blank)}</option>`) + l.map(o => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('');
  };
  const field = (sc, k, label, type = 'text', attrs = '') => `<label>${label}<input type="${type}" data-bind="${sc}.${k}" value="${esc(S[sc][k])}" ${attrs}></label>`;
  const select = (sc, k, label, list, blank = '') => `<label>${label}<select data-bind="${sc}.${k}">${options(list, S[sc][k], blank)}</select></label>`;
  const area = (sc, k, label, rows = 2, ph = '') => `<label>${label}<textarea rows="${rows}" data-bind="${sc}.${k}" placeholder="${esc(ph)}">${esc(S[sc][k])}</textarea></label>`;
  const yn = (action, i, val) => `<div class="seg"><button type="button" class="${val === 'Y' ? 'on-y' : ''}" data-action="${action}" data-i="${i}" data-v="Y">Yes</button><button type="button" class="${val === 'N' ? 'on-n' : ''}" data-action="${action}" data-i="${i}" data-v="N">No</button></div>`;
  const intro = (title, text, right = '') => `<div class="section-intro"><div><h2>${title}</h2><p class="muted">${text}</p></div>${right}</div>`;
  const chip = (txt, kind = '') => txt ? `<span class="chip ${kind}">${esc(txt)}</span>` : '';

  /* ---------- screenshots: local blob first, else download from the cloud ---------- */
  const urlCache = new Map();
  async function mediaUrl(id) {
    if (urlCache.has(id)) return urlCache.get(id);
    const rec = Store.get(id); if (!rec) return null;
    const blob = await Store.mediaBlob(rec); if (!blob) return null;
    const u = URL.createObjectURL(blob); urlCache.set(id, u); return u;
  }
  const img = (id, alt) => `<img data-media="${id}" alt="${esc(alt)}" src="${SAMPLE_BLANK}">`;
  function hydrate() {
    const imgs = $$('img[data-media]'); if (!imgs.length) return;
    const load = async el => {
      const u = await mediaUrl(el.dataset.media);
      if (u) el.src = u; else el.replaceWith(Object.assign(document.createElement('div'), { className: 'ph', textContent: 'Screenshot not available yet - it appears once the device that took it has finished syncing.' }));
    };
    if (!('IntersectionObserver' in window)) { imgs.forEach(load); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); load(en.target); } }), { rootMargin: '200px' });
    imgs.forEach(i => io.observe(i));
  }
  async function compress(file, max = 1600, q = 0.82) {
    try {
      const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const b = await new Promise(r => cv.toBlob(r, 'image/jpeg', q)); if (b) return b;
    } catch (e) { /* fall through */ }
    if (file.size > 6 * 1024 * 1024) throw new Error('That image is too large and could not be compressed.');
    return file;
  }
  const mediaFor = tradeId => { const m = {}; Store.list('media').filter(x => x.tradeId === tradeId).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')).forEach(x => { m[x.slot] = x; }); return m; };

  /* =====================================================================
     DASHBOARD
     ===================================================================== */
  function equity(rows, s) {
    const c = rows.filter(r => r.outcome);
    if (c.length < 2) return '<div class="empty">Your equity curve appears after your second closed trade.</div>';
    const pts = [s.balance, ...c.map(r => r.balanceAfter)], W = 640, H = 170, p = 8;
    const min = Math.min(...pts), max = Math.max(...pts), rng = max - min || 1;
    const x = i => p + i * (W - 2 * p) / (pts.length - 1), y = v => H - p - (v - min) / rng * (H - 2 * p);
    const d = pts.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    return `<div class="equity"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Equity curve"><path d="${d}" fill="none" stroke="${last >= pts[0] ? '#54d6a0' : '#ff777f'}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/></svg>
      <p class="muted tiny">Start ${money(pts[0])} → now ${money(last)} · low ${money(min)} · high ${money(max)}</p></div>`;
  }
  const bd = (title, rows, key) => {
    const b = C.breakdown(rows, key); if (!b.length) return '';
    return `<article class="panel"><h3>${title}</h3><div class="table-wrap" style="max-height:none"><table class="dt plain"><thead><tr><th>${title.replace(/^By /, '')}</th><th class="num">Trades</th><th class="num">Win rate</th><th class="num">Avg R</th><th class="num">Total R</th><th class="num">Net P/L</th></tr></thead><tbody>${
      b.map(x => `<tr><td>${esc(x.key)}</td><td class="num">${x.count}</td><td class="num">${pc(x.winRate)}</td><td class="num ${cls(x.avgR)}">${f(x.avgR)}</td><td class="num ${cls(x.totalR)}">${f(x.totalR)}</td><td class="num ${cls(x.net)}">${money(x.net)}</td></tr>`).join('')}</tbody></table></div></article>`;
  };
  function dashboard() {
    const { s, rows } = ctx(), st = C.stats(rows, s), td = C.today(rows, s, C.todayStr()), dc = Store.get(dcId(C.todayStr()));
    const steps = [[Store.settingsSaved, 'Set your balance, risk % and instruments', 'settings'], [s.strategies.length > 0, 'Write your own trading plan', 'plan'], [!!dc, "Do today's Daily Check", 'daily'], [rows.length > 0, 'Log your first trade', 'trade/new']];
    const card = (l, v, sm = '', c = '') => `<article class="stat-card"><span>${l}</span><strong class="${c}">${v}</strong><small>${sm}</small></article>`;
    const dcState = !dc ? chip('Not done yet', 'warn') : dc.ready ? chip('READY', 'go') : chip('NOT READY', 'stop');
    return `
      ${steps.some(x => !x[0]) ? `<div class="panel"><h3>Get started</h3><div class="steps">${steps.map((x, i) => `<a class="step ${x[0] ? 'done' : ''}" href="#/${x[2]}"><b>${x[0] ? '✓' : i + 1}</b><span>${x[1]}</span></a>`).join('')}</div></div>` : ''}
      <div class="stats-grid">
        ${card('Closed trades', st.closed, 'Trades with an exit price')}${card('Win rate', pc(st.winRate), `${st.wins} wins · ${st.losses} losses`)}
        ${card('Average R (expectancy)', st.avgR == null ? '—' : f(st.avgR) + 'R', 'Per closed trade', cls(st.avgR))}${card('Total R', f(st.totalR) + 'R', '', cls(st.totalR))}
        ${card('Profit factor', st.profitFactor == null ? '—' : f(st.profitFactor), 'Gross profit ÷ gross loss')}${card('Net P/L ' + esc(s.currency), money(st.net) || '0.00', '', cls(st.net))}
        ${card('Current balance', money(st.balance), 'Starting ' + money(s.balance))}${card('Return', pc(st.returnPct), 'On starting balance', cls(st.returnPct))}
        ${card('Max drawdown', money(st.maxDD) || '0.00', pc(st.maxDDPct) + ' of start')}${card('Average win / loss', `${st.avgWinR == null ? '—' : f(st.avgWinR)} / ${st.avgLossR == null ? '—' : f(st.avgLossR)}`, 'In R')}
        ${card('Rule compliance', pc(st.compliance), 'Followed rules = Yes')}${card('Trades below min R:R', st.lowRR, 'Planned R:R under ' + s.minRR, st.lowRR ? 'negative' : '')}
      </div>
      <div class="two-col">
        <article class="panel"><div class="panel-head"><h3>Today · ${esc(td.date)}</h3>${chip(td.status, td.stop ? 'stop' : 'go')}</div>
          <div class="table-wrap" style="max-height:none"><table class="dt plain"><tbody>
            <tr><td>Daily Check</td><td class="num">${dcState}</td></tr>
            <tr><td>Trades today</td><td class="num">${td.trades} / ${s.maxTradesPerDay}</td></tr>
            <tr><td>Net P/L today</td><td class="num ${cls(td.pnl)}">${money(td.pnl) || '0.00'}</td></tr>
            <tr><td>Daily loss limit (${s.maxDailyLossPct}%)</td><td class="num">${money(td.limit)}</td></tr></tbody></table></div></article>
        <article class="panel"><h3>Equity curve</h3>${equity(rows, s)}</article>
      </div>
      ${rows.length ? '' : '<div class="panel empty">No trades yet. Tap <b>＋ Log trade</b> to record your first one. Everything on this page fills in automatically.</div>'}
      <div class="breakdown-grid">${bd('By strategy', rows, 'strategy')}${bd('By instrument', rows, 'instrument')}${bd('By session', rows, 'session')}${bd('By mood before the trade', rows, 'mood')}${bd('By mistake', rows, 'mistake')}${bd('By direction', rows, 'direction')}${bd('By order type', rows, 'orderType')}${bd('By zone type', rows, 'zone')}${bd('By rejection sign', rows, 'rejection')}${bd('Checklist said GO?', rows, 'goCheck')}</div>`;
  }

  /* =====================================================================
     DAILY CHECK
     ===================================================================== */
  function daily() {
    const s = Store.settings, date = S.dcDate || (S.dcDate = C.todayStr());
    if (!S.dcDraft || S.dcDraft.date !== date) { const ex = Store.get(dcId(date)); S.dcDraft = ex ? { ...ex, answers: [...(ex.answers || [])] } : { date, plan: '', answers: [], notes: '', questions: s.dailyQuestions.slice() }; }
    const d = S.dcDraft, qs = d.questions, anyN = qs.some((_, i) => d.answers[i] === 'N'), all = qs.length && qs.every((_, i) => d.answers[i] === 'Y');
    const verdict = all ? ['READY', 'go'] : anyN ? ['NOT READY', 'stop'] : ['Answer every question', ''];
    const hist = Store.list('dailycheck').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    return `${intro('Daily Check', 'Before the session, answer every question honestly. All Yes = READY. Any No = no trading until it is fixed.')}
      <div class="panel form-panel">
        <div class="form-grid two"><label>Date<input type="date" id="dc-date" value="${esc(date)}"></label>${select('dcDraft', 'plan', "Plan for today", s.strategies.map(x => x.name), 'No plan chosen')}</div>
        ${qs.map((q, i) => `<div class="qrow"><div class="q">${esc(q)}</div>${yn('dc-ans', i, d.answers[i])}</div>`).join('')}
        <div class="verdict ${verdict[1]}">${verdict[0]}</div>
        ${area('dcDraft', 'notes', 'Notes', 2, 'e.g. NFP at 13:30 - skip that hour')}
        <div class="form-actions"><button class="primary" data-action="dc-save">Save daily check</button></div>
      </div>
      <div class="panel"><h3>Recent checks</h3>${hist.length ? `<div class="table-wrap" style="max-height:none"><table class="dt"><thead><tr><th>Date</th><th>Plan</th><th>Result</th><th>Notes</th></tr></thead><tbody>${hist.map(h => `<tr data-action="dc-open" data-date="${esc(h.date)}"><td>${esc(h.date)}</td><td>${esc(h.plan)}</td><td>${h.ready ? chip('READY', 'go') : chip('NOT READY', 'stop')}</td><td>${esc(h.notes)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No daily checks yet.</div>'}</div>`;
  }

  /* =====================================================================
     CHECKLIST (pre-trade)
     ===================================================================== */
  function checklist() {
    const strats = Store.settings.strategies;
    if (!strats.length) return `${intro('Pre-Trade Checklist', 'Your own rules, answered before every entry.')}<div class="panel empty">You have not written a trading plan yet.<br>Your checklist is built from the rules in <b>your</b> plan.<div class="button-row" style="justify-content:center"><a class="primary" href="#/plan">Write my trading plan</a></div></div>`;
    const st = strats.find(x => x.id === S.clStrategy) || strats[0]; S.clStrategy = st.id;
    const rules = st.rules, a = S.clAnswers, pending = rules.some((r, i) => r.must && !a[i]), anyN = rules.some((r, i) => r.must && a[i] === 'N');
    const dec = C.checklistDecision(rules, a), v = anyN ? ['NO TRADE', 'stop'] : pending ? ['Answer every MUST rule', ''] : dec === 'GO' ? ['GO', 'go'] : [dec, 'stop'];
    return `${intro('Pre-Trade Checklist', 'Choose your strategy and answer Yes / No from the highest timeframe down. All MUST rules = Yes gives GO. Any No = NO TRADE.')}
      <div class="panel form-panel">
        <label>Strategy<select id="cl-strategy">${strats.map(x => `<option value="${x.id}" ${x.id === st.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        ${st.desc ? `<p class="muted" style="margin-bottom:10px">${esc(st.desc)}</p>` : ''}
        ${rules.length ? rules.map((r, i) => `<div class="qrow"><div class="q">${esc(r.text)}<small>${r.must ? 'MUST' : 'good to have'}</small></div>${yn('cl-ans', i, a[i])}</div>`).join('') : '<div class="empty">This strategy has no rules yet. Add them in My Trading Plan.</div>'}
        <div class="verdict ${v[1]}">${v[0]}</div>
        <div class="form-actions"><button class="secondary" data-action="cl-reset">Clear answers</button><button class="primary" data-action="cl-log">Log a trade with this result →</button></div>
      </div>`;
  }

  /* =====================================================================
     TRADE LOG
     ===================================================================== */
  const COLS = [
    ['n', '#', r => r.n, 'sticky num'], ['date', 'Date', r => r.date, 'sticky'], ['strategy', 'Strategy'], ['instrument', 'Instrument'], ['direction', 'Buy / Sell'], ['tf', 'Timeframe'], ['session', 'Session'],
    ['entry', 'Entry'], ['sl', 'Stop loss'], ['tp', 'Take profit'], ['exit', 'Exit price'],
    ['riskPips', 'Risk (pips)', r => f(r.riskPips, 1), 'num'], ['rewardPips', 'Reward (pips)', r => f(r.rewardPips, 1), 'num'], ['plannedRR', 'Planned R:R', r => f(r.plannedRR), 'num'],
    ['rrCheck', 'R:R vs min', r => r.rrCheck ? chip(r.rrCheck, r.rrCheck === 'OK' ? 'ok' : 'warn') : ''],
    ['riskUsd', 'Risk $', r => money(r.riskUsd), 'num'], ['lot', 'Lot size', r => f(r.lot), 'num'],
    ['R', 'Result (R)', r => r.R == null ? '' : `<b class="${cls(r.R)}">${f(r.R)}</b>`, 'num'], ['costs', 'Costs $', null, 'num'],
    ['net', 'Net P/L $', r => r.net == null ? '' : `<b class="${cls(r.net)}">${money(r.net)}</b>`, 'num'],
    ['outcome', 'Outcome', r => r.outcome ? chip(r.outcome, r.outcome === 'Win' ? 'ok' : r.outcome === 'Loss' ? 'bad' : '') : ''],
    ['balanceAfter', 'Balance after', r => money(r.balanceAfter), 'num'], ['drawdown', 'Drawdown $', r => r.drawdown ? money(r.drawdown) : r.drawdown === 0 ? '0.00' : '', 'num'],
    ['followed', 'Followed rules?'], ['mistake', 'Mistake'], ['mood', 'Mood before'], ['notes', 'Notes'],
    ['zone', 'Zone type'], ['rejection', 'Rejection sign'], ['spread', 'Spread (pips)', null, 'num'], ['spreadPct', 'Spread % of stop', r => f(r.spreadPct, 3), 'num'],
    ['orderType', 'Order type'], ['pendingResult', 'Pending order result'], ['orderCheck', 'Order check', r => r.orderCheck ? chip(r.orderCheck, r.orderCheck === 'OK' ? 'ok' : 'bad') : ''],
    ['goCheck', 'Checklist said GO?'], ['shots', 'Screenshots', r => { const n = Object.keys(mediaFor(r.id)).length; return n ? `▣ ${n}` : ''; }]
  ];
  const filtered = () => {
    const { rows } = ctx(), q = S.filter.q.toLowerCase();
    return rows.filter(r => (!S.filter.strategy || r.strategy === S.filter.strategy) &&
      (!S.filter.outcome || (S.filter.outcome === 'Open' ? !r.outcome : r.outcome === S.filter.outcome)) &&
      (!q || [r.strategy, r.instrument, r.notes, r.mistake, r.mood, r.date].join(' ').toLowerCase().includes(q))).reverse();
  };
  function logTable() {
    const rows = filtered();
    if (!rows.length) return '<div class="panel empty">No trades found. Tap <b>＋ Log trade</b> to add one.</div>';
    return `<div class="table-wrap"><table class="dt"><thead><tr>${COLS.map(c => `<th class="${c[3] || ''}">${c[1]}</th>`).join('')}</tr></thead><tbody>${
      rows.map(r => `<tr data-action="edit-trade" data-id="${r.id}">${COLS.map(c => `<td class="${c[3] || ''}" title="${c[0] === 'notes' ? esc(r.notes) : ''}">${c[2] ? c[2](r) : esc(r[c[0]] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function log() {
    const { s } = ctx();
    return `${intro('Trade Log', 'Every trade you take. Risk, lot size, R, P/L, balance and drawdown are calculated for you. Tap a row to edit it.', '<a class="primary" href="#/trade/new">＋ Log trade</a>')}
      <div class="panel" style="padding:12px"><div class="form-grid" style="grid-template-columns:2fr 1fr 1fr auto;align-items:end">
        <label style="margin:0">Search<input id="f-q" placeholder="Instrument, strategy, notes…" value="${esc(S.filter.q)}"></label>
        <label style="margin:0">Strategy<select id="f-strategy">${options([...new Set([...s.strategies.map(x => x.name), ...Store.list('trade').map(t => t.strategy).filter(Boolean)])], S.filter.strategy, 'All')}</select></label>
        <label style="margin:0">Result<select id="f-outcome"><option value="">All</option>${['Win', 'Loss', 'BE', 'Open'].map(o => `<option ${S.filter.outcome === o ? 'selected' : ''} value="${o}">${o === 'Open' ? 'Open / not closed' : o}</option>`).join('')}</select></label>
        <button class="secondary" data-action="export-csv" style="margin-bottom:0">Export CSV</button></div></div>
      <div id="log-table">${logTable()}</div>`;
  }

  /* =====================================================================
     TRADE FORM (new / edit)
     ===================================================================== */
  function initTrade(param) {
    S.tradeParam = param; S.tradeSaved = false;
    if (param === 'new') {
      const last = ctx().rows.slice(-1)[0] || {}, pre = S.tradePrefill || {}; S.tradePrefill = null; S.tradeNew = true;
      S.trade = { id: uuid(), date: C.todayStr(), strategy: pre.strategy ?? last.strategy ?? '', instrument: last.instrument || '', direction: '', tf: last.tf || 'M15', session: last.session || 'London', entry: '', sl: '', tp: '', exit: '', costs: '',
        followed: '', mistake: 'None', mood: 'Calm', notes: '', zone: '', rejection: '', spread: '', orderType: 'Market', pendingResult: 'n/a (market)', goCheck: pre.goCheck || '', lesson: '' };
    } else {
      const t = Store.get(param); S.tradeNew = false;
      S.trade = t ? { lesson: '', ...t } : null;
    }
  }
  function trade(param) {
    if (S.tradeParam !== param || !S.trade) initTrade(param);
    if (!S.trade) { toast('That trade was not found.'); go('log'); return ''; }
    const s = Store.settings, t = S.trade, m = mediaFor(t.id);
    const slot = (k, label) => `<div class="shot-slot"><h4>${label}</h4>${m[k] ? img(m[k].id, label) : '<div class="ph">No screenshot yet</div>'}
      <div class="button-row" style="justify-content:center;margin:0"><button type="button" class="secondary" data-action="shot-pick" data-slot="${k}">${m[k] ? 'Replace' : 'Add'} photo</button>${m[k] ? `<button type="button" class="danger" data-action="shot-remove" data-slot="${k}">Remove</button>` : ''}</div>
      <input type="file" accept="image/*" hidden data-slot-file="${k}"></div>`;
    return `${intro(S.tradeNew ? 'Log a trade' : 'Edit trade', 'Yellow-sheet style: type the plan, then the result. Everything calculated shows live below.')}
      ${!s.instruments.length ? '<div class="notice warning">You have no instruments yet. Add your pairs (pip size and pip value) in <a href="#/settings">Settings</a>.</div>' : ''}
      <form id="trade-form" class="panel form-panel" autocomplete="off">
        <div class="form-section"><h3>1 · The plan (before you click buy / sell)</h3><div class="form-grid">
          ${field('trade', 'date', 'Date *', 'date', 'required')}
          ${select('trade', 'strategy', 'Strategy', s.strategies.map(x => x.name), s.strategies.length ? 'Choose…' : 'No strategy yet')}
          ${select('trade', 'instrument', 'Instrument *', s.instruments.map(x => x.name), 'Choose…')}
          ${select('trade', 'direction', 'Buy / Sell *', ['Buy', 'Sell'], 'Choose…')}
          ${select('trade', 'tf', 'Entry timeframe', O.timeframes, null)}
          ${select('trade', 'session', 'Session', O.sessions, null)}
          ${field('trade', 'entry', 'Entry price *', 'number', 'step="any" inputmode="decimal"')}
          ${field('trade', 'sl', 'Stop loss *', 'number', 'step="any" inputmode="decimal"')}
          ${field('trade', 'tp', 'Take profit', 'number', 'step="any" inputmode="decimal"')}
          ${select('trade', 'orderType', 'Order type', O.orderTypes, null)}
          ${select('trade', 'pendingResult', 'Pending order result', O.pendingResults, null)}
          ${select('trade', 'goCheck', 'Checklist said GO?', ['Y', 'N'], '—')}
        </div>
        <div class="calc-strip"><div><small>Risk (pips)</small><b id="c-riskPips">—</b></div><div><small>Reward (pips)</small><b id="c-rewardPips">—</b></div><div><small>Planned R:R</small><b id="c-plannedRR">—</b></div><div><small>R:R vs min ${s.minRR}</small><b id="c-rrCheck">—</b></div><div><small>Risk $</small><b id="c-riskUsd">—</b></div><div><small>Lot size</small><b id="c-lot">—</b></div></div>
        <p class="tiny muted" id="c-warn"></p></div>

        <div class="form-section"><h3>2 · After the trade</h3><div class="form-grid">
          ${field('trade', 'exit', 'Exit price', 'number', 'step="any" inputmode="decimal"')}
          ${field('trade', 'costs', 'Costs $ (spread / commission)', 'number', 'step="any" inputmode="decimal"')}
          ${field('trade', 'spread', 'Spread at entry (pips)', 'number', 'step="any" inputmode="decimal"')}</div>
          <p class="tiny muted">Leave the exit price empty while the trade is open. For a pending order that never filled, set <b>Pending order result</b> to Cancelled or Expired - it will not be counted.</p>
        <div class="calc-strip result"><div><small>Result (R)</small><b id="c-R">—</b></div><div><small>Net P/L $</small><b id="c-net">—</b></div><div><small>Outcome</small><b id="c-outcome">—</b></div><div><small>Balance after</small><b id="c-bal">—</b></div></div></div>

        <div class="form-section"><h3>3 · Review & psychology</h3><div class="form-grid">
          ${select('trade', 'followed', 'Followed my rules?', ['Y', 'N'], '—')}
          ${select('trade', 'mistake', 'Mistake', O.mistakes, null)}
          ${select('trade', 'mood', 'Mood before', O.moods, null)}
          ${field('trade', 'zone', 'Zone type', 'text', 'list="dl-zone" placeholder="e.g. OB, FVG, S/R"')}
          ${field('trade', 'rejection', 'Rejection sign', 'text', 'list="dl-rej" placeholder="e.g. Pin bar"')}</div>
          <datalist id="dl-zone">${O.zones.map(z => `<option>${z}</option>`).join('')}</datalist><datalist id="dl-rej">${O.rejections.map(z => `<option>${z}</option>`).join('')}</datalist>
          ${area('trade', 'notes', 'Notes', 3, 'What did you do well? What would you change?')}</div>

        <div class="form-section"><h3>4 · Screenshots</h3><div class="shot-slots">${slot('before', 'BEFORE - the plan: zone, entry, stop, target')}${slot('after', 'AFTER - how it played out')}</div>
          ${area('trade', 'lesson', 'What the two pictures taught me', 2)}</div>

        <div class="form-actions">${S.tradeNew ? '' : '<button type="button" class="danger" data-action="trade-delete">Delete trade</button>'}<button type="button" class="secondary" data-action="trade-cancel">Cancel</button><button type="submit" class="primary">Save trade</button></div>
      </form>`;
  }
  function tradeRow() {
    const others = Store.list('trade').filter(t => t.id !== S.trade.id);
    return C.enrich([...others, { ...S.trade, createdAt: S.trade.createdAt || '9999' }], Store.settings).find(r => r.id === S.trade.id);
  }
  function updateTradeCalc() {
    if (!$('#c-riskPips')) return;
    const r = tradeRow(), set = (id, v, c) => { const e = $('#' + id); if (e) { e.textContent = v == null || v === '' ? '—' : v; e.className = c || ''; } };
    set('c-riskPips', f(r.riskPips, 1)); set('c-rewardPips', f(r.rewardPips, 1)); set('c-plannedRR', f(r.plannedRR));
    set('c-rrCheck', r.rrCheck, r.rrCheck === 'LOW' ? 'negative' : r.rrCheck === 'OK' ? 'positive' : '');
    set('c-riskUsd', money(r.riskUsd)); set('c-lot', f(r.lot));
    set('c-R', f(r.R), cls(r.R)); set('c-net', money(r.net), cls(r.net)); set('c-outcome', r.outcome, r.outcome === 'Win' ? 'positive' : r.outcome === 'Loss' ? 'negative' : ''); set('c-bal', money(r.balanceAfter));
    const w = [], t = S.trade, inst = Store.settings.instruments.find(i => i.name === t.instrument);
    if (r.orderCheck === 'CHECK') w.push('⚠ Order type does not match Buy / Sell - check it.');
    if (t.entry !== '' && t.entry === t.sl) w.push('⚠ Entry and stop loss are the same price.');
    if (t.instrument && !inst) w.push('⚠ This instrument is not in Settings, so pips and lot size cannot be calculated.');
    if (r.rrCheck === 'LOW') w.push(`⚠ Planned R:R is below your minimum of ${Store.settings.minRR}.`);
    if ((t.pendingResult === 'Cancelled' || t.pendingResult === 'Expired') && t.exit !== '') w.push('Cancelled / expired orders are not counted, so the exit price is ignored.');
    const el = $('#c-warn'); if (el) el.innerHTML = w.map(esc).join('<br>');
  }

  /* =====================================================================
     SCREENSHOTS GALLERY
     ===================================================================== */
  function shots() {
    const { rows } = ctx(), list = rows.filter(r => Object.keys(mediaFor(r.id)).length || r.lesson).reverse();
    return `${intro('Screenshots', 'BEFORE and AFTER pictures for every trade, with what you learned. Add them when you log or edit a trade.')}
      ${list.length ? list.map(r => { const m = mediaFor(r.id); return `<article class="panel shot-card"><div class="panel-head" style="margin:0"><h3 style="margin:0">#${r.n} · ${esc(r.date)} · ${esc(r.instrument)} ${esc(r.direction)} ${r.R == null ? '' : `<span class="${cls(r.R)}">${f(r.R)}R</span>`}</h3><a class="text-btn" href="#/trade/${r.id}">Open trade</a></div>
        <div class="shot-pair"><figure><figcaption>BEFORE</figcaption>${m.before ? img(m.before.id, 'Before') : '<div class="ph">—</div>'}</figure><figure><figcaption>AFTER</figcaption>${m.after ? img(m.after.id, 'After') : '<div class="ph">—</div>'}</figure></div>
        ${r.lesson ? `<p class="muted"><b>Lesson:</b> ${esc(r.lesson)}</p>` : ''}</article>`; }).join('') : '<div class="panel empty">No screenshots yet. Open <b>Log trade</b> and add a BEFORE and AFTER picture.</div>'}`;
  }

  /* =====================================================================
     DAILY REVIEW
     ===================================================================== */
  function review() {
    const { s, rows } = ctx(), date = S.rvDate || (S.rvDate = C.todayStr());
    if (!S.rvDraft || S.rvDraft.date !== date) { const ex = Store.get(rvId(date)); S.rvDraft = ex ? { ...ex } : { date, mood: '', sleep: '', followed: '', best: '', mistake: '', focus: '' }; }
    const d = S.rvDraft, auto = C.dayAuto(rows, s, date), flag = C.reviewFlag(d, auto, s);
    const hist = Store.list('dailyreview').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    return `${intro('Daily Review', 'Two minutes at the end of the day: mood, sleep, plan followed, lesson. Trades and P/L fill in from your Trade Log.')}
      <div class="panel form-panel">
        <div class="form-grid"><label>Date<input type="date" id="rv-date" value="${esc(date)}"></label>
          <label>Trades taken<input value="${auto.trades}" disabled></label><label>Net P/L ${esc(s.currency)}<input value="${money(auto.pnl) || '0.00'}" disabled></label></div>
        <div class="form-grid">${select('rvDraft', 'mood', 'Mood today', O.moods, 'Choose…')}${field('rvDraft', 'sleep', 'Hours of sleep', 'number', 'step="0.5" min="0" max="24"')}
          <div><label>Followed my plan all day?</label>${yn('rv-followed', 0, d.followed)}</div></div>
        ${area('rvDraft', 'best', 'Best thing I did', 2)}${area('rvDraft', 'mistake', 'Biggest mistake', 2)}${area('rvDraft', 'focus', 'Focus for tomorrow', 2)}
        <p>Flag: ${flag === 'REVIEW' ? chip('REVIEW', 'warn') : chip('ok', 'ok')} <span class="tiny muted">REVIEW appears if you broke your plan, were in a Revenge / FOMO / Tired mood, or hit your daily loss limit.</span></p>
        <div class="form-actions"><button class="primary" data-action="rv-save">Save daily review</button></div></div>
      <div class="panel"><h3>Recent reviews</h3>${hist.length ? `<div class="table-wrap" style="max-height:none"><table class="dt"><thead><tr><th>Date</th><th>Mood</th><th class="num">Sleep</th><th>Plan followed</th><th>Flag</th><th>Focus for tomorrow</th></tr></thead><tbody>${hist.map(h => { const a = C.dayAuto(rows, s, h.date); return `<tr data-action="rv-open" data-date="${esc(h.date)}"><td>${esc(h.date)}</td><td>${esc(h.mood)}</td><td class="num">${esc(h.sleep)}</td><td>${esc(h.followed)}</td><td>${C.reviewFlag(h, a, s) === 'REVIEW' ? chip('REVIEW', 'warn') : chip('ok', 'ok')}</td><td>${esc(h.focus)}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">No daily reviews yet.</div>'}</div>`;
  }

  /* =====================================================================
     WEEKLY CHECK
     ===================================================================== */
  const WEEK_Q = ['Every trade logged with screenshots?', 'Every loss reviewed - cause found?', 'Followed the plan all week?', 'Rules left unchanged mid-week?', "Next week's higher-timeframe zones marked?"];
  function weekly() {
    const { s, rows } = ctx(), mon = S.wkMonday || (S.wkMonday = C.mondayOf(C.todayStr()));
    if (!S.wkDraft || S.wkDraft.monday !== mon) { const ex = Store.get(wkId(mon)); S.wkDraft = ex ? { ...ex, answers: [...(ex.answers || [])] } : { monday: mon, answers: [], best: '', mistake: '', change: '' }; }
    const d = S.wkDraft, a = C.week(rows, mon), ans = WEEK_Q.map((_, i) => d.answers[i]), verdict = C.weekVerdict(a, ans), done = ans.every(Boolean);
    const card = (l, v, c = '') => `<article class="stat-card"><span>${l}</span><strong class="${c}">${v}</strong></article>`;
    const hist = Store.list('weekly').sort((x, y) => y.monday.localeCompare(x.monday)).slice(0, 26);
    return `${intro('Weekly Check', 'Every weekend: pick the week (Monday), read your numbers, answer five questions and choose ONE thing to change.')}
      <div class="panel form-panel"><div class="form-grid two"><label>Week starting (Monday)<input type="date" id="wk-date" value="${esc(mon)}"></label><label>Week ends<input value="${esc(a.end)}" disabled></label></div>
        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">${card('Closed trades', a.closed)}${card('Wins / losses', a.wins + ' / ' + a.losses)}${card('Win rate', pc(a.winRate))}${card('Total R', f(a.totalR) + 'R', cls(a.totalR))}
          ${card('Net P/L ' + esc(s.currency), money(a.net) || '0.00', cls(a.net))}${card('Rule compliance', pc(a.compliance))}${card('Trades below min R:R', a.lowRR, a.lowRR ? 'negative' : '')}${card('Trades in a risky mood', a.riskyMood, a.riskyMood ? 'negative' : '')}</div>
        ${WEEK_Q.map((q, i) => `<div class="qrow"><div class="q">${q}</div>${yn('wk-ans', i, d.answers[i])}</div>`).join('')}
        <div class="verdict ${done ? (verdict === 'GOOD WEEK' ? 'go' : 'stop') : ''}">${done ? verdict : 'Answer all five questions'}</div>
        ${area('wkDraft', 'best', 'Best thing I did', 2)}${area('wkDraft', 'mistake', 'Biggest mistake', 2)}${area('wkDraft', 'change', 'ONE thing to change next week', 2)}
        <div class="form-actions"><button class="primary" data-action="wk-save">Save weekly check</button></div></div>
      <div class="panel"><h3>Past weeks</h3>${hist.length ? `<div class="table-wrap" style="max-height:none"><table class="dt"><thead><tr><th>Week of</th><th class="num">Trades</th><th class="num">Win rate</th><th class="num">Total R</th><th class="num">Net P/L</th><th>Verdict</th><th>One thing to change</th></tr></thead><tbody>${hist.map(h => { const x = C.week(rows, h.monday), v = C.weekVerdict(x, WEEK_Q.map((_, i) => h.answers[i])); return `<tr data-action="wk-open" data-date="${esc(h.monday)}"><td>${esc(h.monday)}</td><td class="num">${x.closed}</td><td class="num">${pc(x.winRate)}</td><td class="num ${cls(x.totalR)}">${f(x.totalR)}</td><td class="num ${cls(x.net)}">${money(x.net)}</td><td>${chip(v, v === 'GOOD WEEK' ? 'go' : 'warn')}</td><td>${esc(h.change)}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty">No weekly checks yet.</div>'}</div>`;
  }

  /* =====================================================================
     MY TRADING PLAN  (every trader writes their own; the sample is only an example)
     ===================================================================== */
  const SAMPLE = {
    name: 'SAMPLE - Trend pullback (example only)',
    desc: 'An example of how to write a plan: trade pullbacks in the direction of the higher-timeframe trend. Replace every line with rules you have tested yourself.',
    rules: [
      ['[H4] The trend is clear: higher highs and higher lows (buy) or lower highs and lower lows (sell)', 1],
      ['[H4] Price is pulling back into a level I marked in advance (support / resistance or moving average)', 1],
      ['[H1] No major opposing level sits between my entry and my target', 1],
      ['[M15] A confirmation candle has CLOSED in my direction (for example engulfing or pin bar)', 1],
      ['Entry, stop loss and take profit are written down BEFORE I click buy / sell', 1],
      ['Stop loss is beyond the point that proves my idea wrong', 1],
      ['Planned reward is at least my minimum R:R', 1],
      ['No high-impact news in the next 30 minutes', 1],
      ['I am trading inside my chosen session (for example London or New York)', 0],
      ['Spread is normal', 0]],
    note: 'SAMPLE CHART NOTE\n1) H4: trend direction + marked level\n2) H1: path to target is clear\n3) M15: wait for the confirmation candle to CLOSE\n4) SL beyond invalidation, TP at least min R:R\nNo setup = no trade.'
  };
  function plan() {
    if (!S.planDraft) { S.planDraft = clone(Store.settings.strategies); S.planDirty = false; }
    const sd = S.planDraft;
    return `${intro('My Trading Plan', 'TradeMind does not give you a strategy - <b>you</b> write yours. Each rule becomes a question in your Checklist, and each strategy name appears in your Trade Log.', `<span id="plan-dirty">${S.planDirty ? chip('Unsaved changes', 'warn') : ''}</span>`)}
      <details class="strategy sample" ${sd.length ? '' : 'open'}><summary><span class="sample-tag">SAMPLE</span><b>${esc(SAMPLE.name)}</b></summary>
        <p class="muted" style="margin:10px 0">${esc(SAMPLE.desc)}</p>
        ${SAMPLE.rules.map(r => `<div class="rule-line">${chip(r[1] ? 'MUST' : 'good', r[1] ? 'warn' : '')}<span>${esc(r[0])}</span></div>`).join('')}
        <pre class="note">${esc(SAMPLE.note)}</pre>
        <div class="button-row"><button class="secondary" data-action="plan-sample">Copy this sample into my plan and edit it</button></div></details>
      ${sd.length ? sd.map((st, si) => `<section class="strategy">
        <div class="panel-head"><h3 style="margin:0">Strategy ${si + 1}</h3><button class="danger" data-action="plan-del" data-si="${si}" type="button">Delete</button></div>
        <label>Strategy name *<input data-plan="name" data-si="${si}" value="${esc(st.name)}" placeholder="e.g. London breakout"></label>
        <label>Short description / timeframes<input data-plan="desc" data-si="${si}" value="${esc(st.desc)}" placeholder="e.g. H4 zone, M15 entry, TP 2R"></label>
        <p class="muted tiny" style="margin-bottom:6px">Rules - one clear Yes / No condition each. MUST = no trade if it is a No.</p>
        ${st.rules.map((r, ri) => `<div class="rule-row"><input data-plan="rule-text" data-si="${si}" data-ri="${ri}" value="${esc(r.text)}" placeholder="A clear Yes / No rule"><select data-plan="rule-must" data-si="${si}" data-ri="${ri}"><option value="1" ${r.must ? 'selected' : ''}>MUST</option><option value="0" ${r.must ? '' : 'selected'}>good</option></select><button class="secondary" type="button" data-action="rule-del" data-si="${si}" data-ri="${ri}" aria-label="Remove rule">✕</button></div>`).join('')}
        <div class="button-row"><button class="secondary" type="button" data-action="rule-add" data-si="${si}">＋ Add rule</button></div>
        <label>Chart note (optional) - a short reminder to paste onto your chart<textarea rows="4" data-plan="note" data-si="${si}">${esc(st.note)}</textarea></label>
        ${st.note ? `<button class="text-btn" type="button" data-action="copy-note" data-si="${si}">Copy note</button>` : ''}</section>`).join('') : '<div class="panel empty">You have no strategy yet. Copy the sample above and change it, or start from scratch.</div>'}
      <div class="form-actions" style="justify-content:flex-start"><button class="secondary" data-action="plan-add" type="button">＋ New strategy</button><button class="primary" data-action="plan-save" type="button">Save my plan</button></div>
      <p class="tiny muted">If you rename a strategy, older trades keep the name they were logged with.</p>`;
  }

  /* =====================================================================
     COACH
     ===================================================================== */
  function coach() {
    const { s, rows } = ctx(), c = C.coach(rows, s);
    return `${intro('Coach', 'Free, rule-based feedback from your own journal. It reads numbers, not charts, and it never predicts the market.')}
      <div class="two-col"><article class="panel"><h3>What your data says</h3>${c.findings.map((x, i) => `<div class="finding ${i === 0 ? 'good' : 'warn'}">${esc(x)}</div>`).join('')}</article>
      <article class="panel"><h3>Next actions</h3>${c.actions.map(x => `<div class="finding">${esc(x)}</div>`).join('')}</article></div>
      <div class="notice">Small samples mislead. Judge a strategy on 30+ trades, include costs, and compare like with like.</div>`;
  }

  /* =====================================================================
     SETTINGS & ACCOUNT
     ===================================================================== */
  function settings() {
    const s = Store.settings;
    if (!S.setDraft) S.setDraft = { balance: s.balance, currency: s.currency, riskPct: s.riskPct, minRR: s.minRR, maxDailyLossPct: s.maxDailyLossPct, maxTradesPerDay: s.maxTradesPerDay, instruments: clone(s.instruments), questions: s.dailyQuestions.join('\n') };
    const d = S.setDraft, u = App.user || {}, last = Store.lastSync ? Store.lastSync.toLocaleString() : 'not yet';
    return `${intro('Settings & Account', 'Your account, your risk rules and your instruments.')}
      <div class="panel form-panel"><h3>Account</h3>
        ${Store.isCloud ? `<p class="muted">Signed in as <b>${esc(u.email)}</b>${u.user_metadata?.name ? ' (' + esc(u.user_metadata.name) + ')' : ''}. Your journal saves automatically to your private cloud account - log in on any phone or computer to see the same data.</p>
        <p class="tiny muted">Last synced: ${esc(last)} · ${App.statusText()}${Store.lastError ? ' · ' + esc(Store.lastError) : ''}</p>
        <div class="button-row"><button class="secondary" data-action="sync-now">Sync now</button><button class="secondary" data-action="sign-out">Log out</button></div>
        <div class="form-grid two" style="margin-top:8px"><label>New password<input type="password" id="new-pw" minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></label><label>&nbsp;<button class="secondary" data-action="change-pw" type="button">Change password</button></label></div>`
        : '<div class="notice warning">You are using the app on this device only (no account). Your data is NOT backed up or available on other devices.</div>'}</div>

      <div class="panel form-panel"><h3>Account & risk rules</h3>
        <p class="tiny muted">Like the Settings sheet in your Excel journal. Changing these recalculates every trade (risk $, lot size, balance).</p>
        <div class="form-grid">${field('setDraft', 'balance', 'Starting balance', 'number', 'step="any" min="0"')}${field('setDraft', 'currency', 'Account currency', 'text', 'maxlength="5"')}${field('setDraft', 'riskPct', 'Risk per trade (% of balance)', 'number', 'step="any" min="0" max="100"')}
          ${field('setDraft', 'minRR', 'Minimum planned R:R', 'number', 'step="any" min="0"')}${field('setDraft', 'maxDailyLossPct', 'Max daily loss (% of balance)', 'number', 'step="any" min="0" max="100"')}${field('setDraft', 'maxTradesPerDay', 'Max trades per day', 'number', 'step="1" min="1"')}</div></div>

      <div class="panel form-panel"><h3>Instruments</h3>
        <p class="tiny muted">Pip size = the price step you count as 1 pip. Value = what 1 pip is worth per 1 lot in your account currency (check your broker's contract specs - JPY pairs and gold change with price). Lot size = risk $ ÷ (stop pips × value).</p>
        <div class="table-wrap" style="max-height:none"><table class="dt plain"><thead><tr><th>Instrument</th><th>Pip size</th><th>Value of 1 pip per 1 lot</th><th></th></tr></thead><tbody>${d.instruments.map((i, k) => `<tr><td><input data-inst="name" data-k="${k}" value="${esc(i.name)}"></td><td><input data-inst="pipSize" data-k="${k}" type="number" step="any" value="${esc(i.pipSize)}"></td><td><input data-inst="pipValue" data-k="${k}" type="number" step="any" value="${esc(i.pipValue)}"></td><td><button class="secondary" type="button" data-action="inst-del" data-k="${k}">✕</button></td></tr>`).join('')}</tbody></table></div>
        <div class="button-row"><button class="secondary" type="button" data-action="inst-add">＋ Add instrument</button></div></div>

      <div class="panel form-panel"><h3>Daily Check questions</h3><p class="tiny muted">One question per line. Every question must be Yes for READY.</p>
        <textarea rows="8" data-bind="setDraft.questions">${esc(d.questions)}</textarea>
        <div class="form-actions"><button class="primary" data-action="settings-save">Save settings</button></div></div>

      <div class="panel form-panel"><h3>Your data</h3><div class="button-row"><button class="secondary" data-action="export-csv">Download trades (CSV)</button><button class="secondary" data-action="export-json">Download full backup</button>
        <label class="secondary" style="display:inline-block;margin:0;cursor:pointer">Restore backup<input type="file" accept="application/json" hidden id="import-json"></label></div>
        <p class="tiny muted">Screenshots are stored in your private cloud storage and are not part of the JSON backup.</p></div>`;
  }

  /* =====================================================================
     ACTIONS (data-action delegation)
     ===================================================================== */
  const A = {
    'dc-ans': el => { S.dcDraft.answers[+el.dataset.i] = el.dataset.v; App.render(); },
    'dc-save': async () => { const d = S.dcDraft; if (!d.questions.length) return toast('Add questions in Settings first.'); const ready = d.questions.every((_, i) => d.answers[i] === 'Y');
      await Store.save('dailycheck', { ...d, id: dcId(d.date), ready }); toast(ready ? 'Saved - you are READY' : 'Saved - NOT READY'); App.render(); },
    'dc-open': el => { S.dcDate = el.dataset.date; S.dcDraft = null; App.render(); window.scrollTo(0, 0); },
    'cl-ans': el => { S.clAnswers[+el.dataset.i] = el.dataset.v; App.render(); },
    'cl-reset': () => { S.clAnswers = {}; App.render(); },
    'cl-log': () => { const st = Store.settings.strategies.find(x => x.id === S.clStrategy); const pending = st.rules.some((r, i) => r.must && !S.clAnswers[i]);
      S.tradePrefill = { strategy: st.name, goCheck: pending ? '' : C.checklistDecision(st.rules, S.clAnswers) === 'GO' ? 'Y' : 'N' }; S.trade = null; go('trade/new'); },
    'edit-trade': el => go('trade/' + el.dataset.id),
    'export-csv': () => {
      const { rows } = ctx(), cols = COLS.filter(c => c[0] !== 'shots').map(c => [c[0], c[1]]), q = v => '"' + String(v ?? '').replaceAll('"', '""') + '"';
      UI.download('trademind-trades.csv', [cols.map(c => q(c[1])).join(','), ...rows.map(r => cols.map(c => q(r[c[0]])).join(','))].join('\n'), 'text/csv'); },
    'export-json': () => UI.download('trademind-backup.json', JSON.stringify(Store.exportAll(), null, 2), 'application/json'),
    'shot-pick': el => $(`input[data-slot-file="${el.dataset.slot}"]`).click(),
    'shot-remove': async el => { const m = mediaFor(S.trade.id)[el.dataset.slot]; if (m) { await Store.remove(m.id); urlCache.delete(m.id); } App.render(); },
    'trade-cancel': async () => { if (S.tradeNew && !S.tradeSaved) await dropMedia(S.trade.id); S.trade = null; go('log'); },
    'trade-delete': async () => { if (!confirm('Delete this trade and its screenshots?')) return; await dropMedia(S.trade.id); await Store.remove(S.trade.id); S.trade = null; toast('Trade deleted'); go('log'); },
    'rv-followed': el => { S.rvDraft.followed = el.dataset.v; App.render(); },
    'rv-save': async () => { const d = S.rvDraft; await Store.save('dailyreview', { ...d, id: rvId(d.date) }); toast('Daily review saved'); App.render(); },
    'rv-open': el => { S.rvDate = el.dataset.date; S.rvDraft = null; App.render(); window.scrollTo(0, 0); },
    'wk-ans': el => { S.wkDraft.answers[+el.dataset.i] = el.dataset.v; App.render(); },
    'wk-save': async () => { const d = S.wkDraft; await Store.save('weekly', { ...d, id: wkId(d.monday) }); toast('Weekly check saved'); App.render(); },
    'wk-open': el => { S.wkMonday = el.dataset.date; S.wkDraft = null; App.render(); window.scrollTo(0, 0); },
    'plan-sample': () => { S.planDraft.push({ id: uuid(), name: 'My strategy (rename me)', desc: '', note: SAMPLE.note.replace('SAMPLE CHART NOTE', 'MY CHART NOTE'), rules: SAMPLE.rules.map(r => ({ text: r[0], must: !!r[1] })) }); S.planDirty = true; App.render(); toast('Sample copied - now edit it into YOUR rules'); },
    'plan-add': () => { S.planDraft.push({ id: uuid(), name: '', desc: '', note: '', rules: [{ text: '', must: true }] }); S.planDirty = true; App.render(); },
    'plan-del': el => { if (!confirm('Delete this strategy? Trades already logged keep their strategy name.')) return; S.planDraft.splice(+el.dataset.si, 1); S.planDirty = true; App.render(); },
    'rule-add': el => { S.planDraft[+el.dataset.si].rules.push({ text: '', must: true }); S.planDirty = true; App.render(); },
    'rule-del': el => { S.planDraft[+el.dataset.si].rules.splice(+el.dataset.ri, 1); S.planDirty = true; App.render(); },
    'copy-note': el => { navigator.clipboard?.writeText(S.planDraft[+el.dataset.si].note).then(() => toast('Note copied')); },
    'plan-save': async () => {
      const out = S.planDraft.map(st => ({ ...st, name: st.name.trim(), rules: st.rules.map(r => ({ text: r.text.trim(), must: !!r.must })).filter(r => r.text) }));
      if (out.some(st => !st.name)) return toast('Every strategy needs a name.');
      if (new Set(out.map(st => st.name.toLowerCase())).size !== out.length) return toast('Two strategies have the same name.');
      await Store.saveSettings({ ...Store.settings, strategies: out }); S.planDraft = clone(Store.settings.strategies); S.planDirty = false; toast('Trading plan saved'); App.render(); },
    'inst-add': () => { S.setDraft.instruments.push({ name: '', pipSize: '', pipValue: '' }); App.render(); },
    'inst-del': el => { S.setDraft.instruments.splice(+el.dataset.k, 1); App.render(); },
    'settings-save': async () => {
      const d = S.setDraft, n = x => Number(x), bad = [d.balance, d.riskPct, d.minRR, d.maxDailyLossPct, d.maxTradesPerDay].some(x => x === '' || !Number.isFinite(n(x)) || n(x) < 0);
      if (bad || n(d.balance) <= 0) return toast('Please fill the balance and risk fields with valid numbers.');
      const inst = d.instruments.filter(i => i.name.trim()).map(i => ({ name: i.name.trim().toUpperCase(), pipSize: n(i.pipSize), pipValue: n(i.pipValue) }));
      if (inst.some(i => !(i.pipSize > 0) || !(i.pipValue > 0))) return toast('Every instrument needs a pip size and pip value above 0.');
      if (new Set(inst.map(i => i.name)).size !== inst.length) return toast('Two instruments have the same name.');
      await Store.saveSettings({ ...Store.settings, balance: n(d.balance), currency: (d.currency || 'USD').trim().toUpperCase(), riskPct: n(d.riskPct), minRR: n(d.minRR), maxDailyLossPct: n(d.maxDailyLossPct), maxTradesPerDay: n(d.maxTradesPerDay),
        instruments: inst, dailyQuestions: d.questions.split('\n').map(x => x.trim()).filter(Boolean) });
      S.setDraft = null; toast('Settings saved'); App.render(); },
    'sync-now': () => { Store.sync(); toast('Syncing…'); },
    'sign-out': () => App.signOut(),
    'change-pw': () => App.changePassword($('#new-pw').value)
  };
  async function dropMedia(tradeId) { for (const m of Store.list('media').filter(x => x.tradeId === tradeId)) { await Store.remove(m.id); urlCache.delete(m.id); } }

  /* ---------- delegated events ---------- */
  function init() {
    if (init.done) return; init.done = true;
    document.addEventListener('click', e => {
      const z = e.target.closest('.shot-slot img, .shot-pair img'); if (z && z.src && !z.src.startsWith('data:image/gif')) { const lb = $('#lightbox'); $('img', lb).src = z.src; lb.hidden = false; return; }
      const el = e.target.closest('[data-action]'); if (el && A[el.dataset.action]) { e.preventDefault(); A[el.dataset.action](el, e); }
    });
    $('#lightbox').addEventListener('click', () => { $('#lightbox').hidden = true; });
    document.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.bind) { const [sc, k] = t.dataset.bind.split('.'); S[sc][k] = t.value;
        if (sc === 'trade') { if (k === 'orderType') { S.trade.pendingResult = t.value === 'Market' ? 'n/a (market)' : (S.trade.pendingResult === 'n/a (market)' ? 'Filled' : S.trade.pendingResult); const p = $('[data-bind="trade.pendingResult"]'); if (p) p.value = S.trade.pendingResult; } updateTradeCalc(); } }
      else if (t.dataset.plan) { const st = S.planDraft[+t.dataset.si], k = t.dataset.plan;
        if (k === 'rule-text') st.rules[+t.dataset.ri].text = t.value; else if (k === 'rule-must') st.rules[+t.dataset.ri].must = t.value === '1'; else st[k] = t.value;
        if (!S.planDirty) { S.planDirty = true; const d = $('#plan-dirty'); if (d) d.innerHTML = chip('Unsaved changes', 'warn'); } }
      else if (t.dataset.inst) S.setDraft.instruments[+t.dataset.k][t.dataset.inst] = t.value;
      else if (t.id === 'f-q') { S.filter.q = t.value; $('#log-table').innerHTML = logTable(); }
      else if (t.id === 'f-strategy') { S.filter.strategy = t.value; $('#log-table').innerHTML = logTable(); }
      else if (t.id === 'f-outcome') { S.filter.outcome = t.value; $('#log-table').innerHTML = logTable(); }
    });
    document.addEventListener('change', async e => {
      const t = e.target;
      if (t.id === 'dc-date' && t.value) { S.dcDate = t.value; S.dcDraft = null; App.render(); }
      else if (t.id === 'rv-date' && t.value) { S.rvDate = t.value; S.rvDraft = null; App.render(); }
      else if (t.id === 'wk-date' && t.value) { S.wkMonday = C.mondayOf(t.value); S.wkDraft = null; App.render(); }
      else if (t.id === 'cl-strategy') { S.clStrategy = t.value; S.clAnswers = {}; App.render(); }
      else if (t.id === 'import-json' && t.files[0]) { try { const n = await Store.importAll(JSON.parse(await t.files[0].text())); toast(n + ' item(s) restored'); S.setDraft = null; S.planDraft = null; App.render(); } catch (err) { toast(err.message || 'That file could not be read.'); } t.value = ''; }
      else if (t.dataset.slotFile && t.files[0]) {
        const slotName = t.dataset.slotFile; try { toast('Adding photo…'); const blob = await compress(t.files[0]), old = mediaFor(S.trade.id)[slotName];
          if (old) { await Store.remove(old.id); urlCache.delete(old.id); }
          const rec = await Store.save('media', { tradeId: S.trade.id, slot: slotName, uploaded: false, size: blob.size, mime: 'image/jpeg' }); await Store.putBlob(rec.id, blob); Store.queueSync(2500); App.render();
        } catch (err) { toast(err.message || 'Could not add that photo.'); } t.value = '';
      }
    });
    document.addEventListener('submit', async e => {
      if (e.target.id !== 'trade-form') return; e.preventDefault();
      const t = S.trade; if (!t.date || !t.instrument || !t.direction || t.entry === '' || t.sl === '') return toast('Date, instrument, Buy/Sell, entry and stop loss are required.');
      if (Number(t.entry) === Number(t.sl)) return toast('Entry and stop loss cannot be the same price.');
      await Store.save('trade', { ...t, strategy: t.strategy || '' }); S.tradeSaved = true; S.trade = null; toast('Trade saved'); go('log');
    });
  }

  const Views = { dashboard, daily, checklist, log, trade, shots, review, weekly, plan, coach, settings, init, hydrate, updateTradeCalc,
    reset() { S.dcDraft = S.rvDraft = S.wkDraft = S.planDraft = S.setDraft = S.trade = null; S.tradeParam = null; S.dcDate = S.rvDate = S.wkMonday = null; S.clAnswers = {}; S.filter = { q: '', strategy: '', outcome: '' }; urlCache.clear(); },
    leaving(page) { if (page !== 'trade' && S.trade && S.tradeNew && !S.tradeSaved) dropMedia(S.trade.id); if (page !== 'plan') { S.planDraft = null; S.planDirty = false; } if (page !== 'settings') S.setDraft = null; if (page !== 'trade') { S.trade = null; S.tradeParam = null; } } };
  const UI = { download(name, content, type = 'text/plain') { const a = document.createElement('a'), u = URL.createObjectURL(new Blob([content], { type })); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } };
  root.Views = Views;
})(self);
