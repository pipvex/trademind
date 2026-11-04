/* TradeMind - views3.js: goals, reminders, monthly report, trade replay, search, theme.
   Builds on Views.h (views.js) and Views.Psy (views2.js). */
(function (root) {
  'use strict';
  const { S, A, esc, chip, intro, f, money, pc, cls, toast, ctx, tfsOf } = Views.h, C = root.Calc, P = root.Psych, Ls = root.Lessons;
  const $ = s => document.querySelector(s);
  const bundle = () => Views.Psy.bundle();
  const month0 = () => C.todayStr().slice(0, 7);
  const shiftMonth = (m, n) => { const [y, mo] = m.split('-').map(Number), d = new Date(Date.UTC(y, mo - 1 + n, 1)); return d.toISOString().slice(0, 7); };
  const monthName = m => { const [y, mo] = m.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }); };

  /* ---------------- THEME ---------------- */
  const getTheme = () => { try { return localStorage.getItem('tm-theme') || 'dark'; } catch (e) { return 'dark'; } };
  const setTheme = t => { try { localStorage.setItem('tm-theme', t); } catch (e) { /* ignore */ } document.documentElement.setAttribute('data-theme', t); const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'light' ? '#f6f4fb' : '#0d0c12'; };
  setTheme(getTheme());

  /* ---------------- GOALS (monthly, process-based) ---------------- */
  const GOALS = [
    ['planread', 'Days I read my plan', 'Read your plan before trading'], ['goodday', 'Good discipline days', 'Score 75 or more'],
    ['review', 'Daily Reviews written', 'Close the day'], ['clean', 'Clean trades', 'Followed rules, no mistake, risk kept'], ['journal', 'Life Journal days', 'Events or a day summary']];
  function goalValues(month) {
    const { rows, s } = ctx(), d = bundle(), today = C.todayStr(), inM = x => (x || '').slice(0, 7) === month, sm = P.disciplineSummary(rows, s, d, today);
    return { planread: new Set(d.planread.filter(x => inM(x.date)).map(x => x.date)).size, goodday: sm.days.filter(x => inM(x.date) && x.score >= P.GOOD_DAY).length,
      review: Object.keys(d.rv).filter(inM).length, clean: rows.filter(r => inM(r.date) && r.outcome && P.isCleanTrade(r)).length,
      journal: new Set([...Store.list('life').filter(x => inM(x.date)).map(x => x.date), ...Store.list('lifeevent').filter(x => inM(x.date)).map(x => x.date)]).size };
  }
  function goalsCard(month = month0()) {
    const g = Store.settings.goals || {}, active = GOALS.filter(x => +g[x[0]] > 0);
    if (!active.length) return '';
    const v = goalValues(month);
    return `<article class="panel goals"><div class="panel-head"><h3>My goals · ${esc(monthName(month))}</h3><a class="text-btn" href="#/settings">Change</a></div>${active.map(x => { const t = +g[x[0]], n = v[x[0]], p = Math.min(100, Math.round(n / t * 100)); return `<div class="goal"><div class="goal-top"><span>${esc(x[1])}</span><b>${n} / ${t}${n >= t ? ' ✓' : ''}</b></div><div class="bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div></div>`; }).join('')}</article>`;
  }

  /* ---------------- SETTINGS EXTRA: goals, reminders, look ---------------- */
  function settingsExtra() {
    const s = Store.settings, g = s.goals || {}, r = s.remind || { on: false, plan: '08:00', review: '20:00' }, th = getTheme();
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    return `<div class="panel form-panel"><h3>Look</h3><div class="seg"><button type="button" class="${th === 'dark' ? 'on-y' : ''}" data-action="theme" data-v="dark">Dark</button><button type="button" class="${th === 'light' ? 'on-y' : ''}" data-action="theme" data-v="light">Light</button></div></div>
      <div class="panel form-panel"><h3>My monthly goals</h3><p class="tiny muted">Goals about <b>process</b>, not profit. Leave 0 to switch a goal off. Progress shows on Home.</p>
        <div class="form-grid">${GOALS.map(x => `<label>${esc(x[1])} <small class="muted">(${esc(x[2])})</small><input type="number" min="0" max="31" inputmode="numeric" data-goal="${x[0]}" value="${+g[x[0]] || 0}"></label>`).join('')}</div>
        <div class="form-actions"><button class="primary" data-action="goals-save">Save goals</button></div></div>
      <div class="panel form-panel"><h3>Reminders</h3><p class="tiny muted">A nudge to read your plan and write your Daily Review. Reminders appear while TradeMind is open or installed on your phone - they cannot wake a closed app.</p>
        <label class="check-row"><input type="checkbox" id="rm-on" ${r.on ? 'checked' : ''}> Remind me</label>
        <div class="form-grid two"><label>Read my plan at<input type="time" id="rm-plan" value="${esc(r.plan || '08:00')}"></label><label>Daily Review at<input type="time" id="rm-review" value="${esc(r.review || '20:00')}"></label></div>
        <p class="tiny muted">Phone notifications: <b>${perm === 'granted' ? 'allowed' : perm === 'denied' ? 'blocked in your browser settings' : perm === 'unsupported' ? 'not supported here (you will see in-app reminders)' : 'not allowed yet'}</b></p>
        <div class="form-actions">${perm === 'default' ? '<button type="button" class="secondary" data-action="rm-perm">Allow notifications</button>' : ''}<button class="primary" data-action="rm-save">Save reminders</button></div></div>`;
  }
  function checkReminders() {
    const r = Store.settings && Store.settings.remind; if (!r || !r.on || !Store.uid) return;
    const now = new Date(), hm = now.toTimeString().slice(0, 5), today = C.todayStr(), d = bundle(), mins = x => { const [h, m] = (x || '0:0').split(':').map(Number); return h * 60 + m; }, nowM = mins(hm);
    const fire = (key, at, done, title, body) => { if (!at || done || nowM < mins(at) || nowM > mins(at) + 180) return; let k = 'tm-rm-' + key + today; try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { /* ignore */ }
      toast(title + ' - ' + body); if ('Notification' in window && Notification.permission === 'granted') { try { navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: 'assets/icon.svg', tag: key })); } catch (e) { /* ignore */ } } };
    if (!(Store.settings.strategies || []).length) return;
    fire('plan', r.plan, d.planread.some(x => x.date === today), 'Read your plan', 'Before any chart, read your plan.');
    fire('review', r.review, !!d.rv[today], 'Daily Review', 'Close the day: grade it and note one lesson.');
  }

  /* ---------------- MONTHLY REPORT ---------------- */
  function report() {
    const { s, rows } = ctx(), d = bundle(), m = S.rpMonth || month0(), pm = shiftMonth(m, -1), inM = mm => x => (x || '').slice(0, 7) === mm;
    const mr = rows.filter(r => inM(m)(r.date)), pr = rows.filter(r => inM(pm)(r.date)), st = C.stats(mr, s), ps = C.stats(pr, s);
    const sm = P.disciplineSummary(rows, s, d, C.todayStr()), md = sm.days.filter(x => inM(m)(x.date)), pd = sm.days.filter(x => inM(pm)(x.date));
    const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y.score, 0) / a.length) : null, da = avg(md), pa = avg(pd);
    const habit = P.habitCost(mr), gv = goalValues(m), evs = Store.list('lifeevent').filter(x => inM(m)(x.date)), lives = Store.list('life').filter(x => inM(m)(x.date));
    const books = Store.list('book').filter(b => b.status === 'Finished' && inM(m)(b.finished || (b.updatedAt || '')));
    const gr = { A: 0, B: 0, C: 0, D: 0, F: 0 }; mr.filter(r => r.outcome).forEach(r => { const g = P.gradeTrade(r); if (g) gr[g.letter]++; });
    const num = (v, dp = 0) => v == null || Number.isNaN(v) ? '—' : (+v).toFixed(dp);
    const delta = (a, b, dp = 0, unit = '') => a == null || b == null ? '' : `<small class="${a - b >= 0 ? 'positive' : 'negative'}"> ${a - b >= 0 ? '+' : ''}${(a - b).toFixed(dp)}${unit} vs last month</small>`;
    const slp = lives.filter(x => x.sleep !== '' && x.sleep != null), avgSleep = slp.length ? slp.reduce((a, b) => a + +b.sleep, 0) / slp.length : null;
    const row = (l, v) => `<tr><td>${l}</td><td class="num">${v}</td></tr>`;
    const empty = !mr.length && !md.length && !evs.length;
    return `${intro('Monthly Report', 'One page to review the month. Compare it with last month and pick one thing to improve.', '<button class="secondary no-print" data-action="rp-print">Print / save as PDF</button>')}
      <div class="panel lf-datebar no-print"><button type="button" class="secondary" data-action="rp-step" data-d="-1" aria-label="Previous month">‹</button><div class="lf-date"><b>${esc(monthName(m))}</b><small>${m === month0() ? 'This month' : '<a href="#" data-action="rp-now">Jump to this month</a>'}</small></div><button type="button" class="secondary" data-action="rp-step" data-d="1" aria-label="Next month">›</button></div>
      ${empty ? '<div class="panel empty">Nothing recorded in this month yet.</div>' : `
      <div class="two-col">
        <article class="panel"><h3>Trading</h3><table class="dt plain"><tbody>${row('Closed trades', st.closed + delta(st.closed, ps.closed))}${row('Win rate', pc(st.winRate))}${row('Average R', st.avgR == null ? '—' : f(st.avgR) + 'R')}${row('Total R', f(st.totalR) + 'R')}${row('Profit factor', st.profitFactor == null ? '—' : f(st.profitFactor))}
          ${row('Net P/L ' + esc(s.currency), `<span class="${cls(st.net)}">${money(st.net) || '0.00'}</span>` + delta(st.net, ps.net, 2))}${row('Max drawdown', money(st.maxDD) || '0.00')}</tbody></table></article>
        <article class="panel"><h3>Discipline</h3><table class="dt plain"><tbody>${row('Average discipline score', (da == null ? '—' : da + ' / 100') + delta(da, pa))}${row('Good days (75+)', md.filter(x => x.score >= P.GOOD_DAY).length + ' of ' + md.length)}${row('Days I read my plan', gv.planread)}${row('Daily Reviews written', gv.review)}${row('Clean trades', gv.clean + ' of ' + st.closed)}
          ${row('Process grades', Object.entries(gr).filter(x => x[1]).map(x => x[0] + ' ×' + x[1]).join(' · ') || '—')}</tbody></table></article></div>
      <div class="two-col">
        <article class="panel"><h3>Habits to fix</h3>${habit.top ? `<div class="finding warn"><b>Most expensive habit:</b> ${esc(habit.top.key)} - ${habit.top.count} trade(s), ${money(habit.top.net)} ${esc(s.currency)}.</div>` : '<div class="empty">No costly habit found. Keep tagging mistakes and moods.</div>'}${st.lowRR ? `<div class="finding warn">${st.lowRR} trade(s) were below your minimum R:R.</div>` : ''}${st.compliance != null && st.compliance < 0.8 ? `<div class="finding warn">You followed your rules on ${pc(st.compliance)} of trades. Aim for 100%.</div>` : ''}</article>
        <article class="panel"><h3>Life and learning</h3><table class="dt plain"><tbody>${row('Events I wrote down', `${evs.length} (${evs.filter(x => x.feel === 'good').length} good · ${evs.filter(x => x.feel === 'bad').length} hard)`)}${row('Average sleep', avgSleep == null ? '—' : avgSleep.toFixed(1) + ' h')}${row('Books finished', books.length ? books.map(b => esc(b.title)).join(', ') : '0')}</tbody></table></article></div>
      ${goalsCard(m)}`}
      <div class="notice no-print">Trading involves risk. This report describes your own behaviour; it is not financial advice.</div>`;
  }

  /* ---------------- TRADE REPLAY ---------------- */
  function replay(id) {
    const { s, rows } = ctx(), r = rows.find(x => x.id === id);
    if (!r) return `${intro('Trade Replay', 'This trade was not found.')}<div class="panel"><a class="primary" href="#/log">Back to Trade Log</a></div>`;
    const g = P.gradeTrade(r), shots = Views.h.mediaFor(id), checks = Store.list('checkin').filter(x => x.tradeId === id), st = s.strategies.find(x => x.name === r.strategy);
    const kv = (k, v) => v === '' || v == null ? '' : `<tr><td>${k}</td><td>${v}</td></tr>`;
    const shot = (k, l) => `<figure class="replay-shot"><figcaption>${l}</figcaption>${shots[k] ? Views.h.img(shots[k].id, l) : '<div class="ph">No screenshot</div>'}</figure>`;
    return `${intro('Trade Replay', 'Look at this trade calmly: what was the plan, what did you do, what does it teach?', `<a class="secondary" href="#/trade/${esc(id)}">Edit trade</a>`)}
      <div class="panel"><div class="panel-head"><h3>${esc(r.instrument || '')} ${esc(r.direction || '')} · ${esc(r.date)}</h3><div>${r.outcome ? chip(esc(r.outcome), r.outcome === 'Win' ? 'ok' : r.outcome === 'Loss' ? 'bad' : '') : chip('Open', 'warn')} ${g ? chip(g.letter + ' · ' + g.points, P.gradeKind(g)) : ''}</div></div>
        <div class="replay-nums"><div><small>Result</small><b class="${cls(r.net)}">${r.outcome ? money(r.net) + ' ' + esc(s.currency) : '—'}</b></div><div><small>R</small><b class="${cls(r.R)}">${r.R == null ? '—' : f(r.R) + 'R'}</b></div><div><small>Planned R:R</small><b>${r.plannedRR == null ? '—' : f(r.plannedRR)}</b></div><div><small>Risk used</small><b>${r.riskPctUsed == null ? '—' : f(r.riskPctUsed, 2) + '%'}</b></div></div></div>
      <div class="replay-grid">${shot('before', 'BEFORE - the plan')}${shot('after', 'AFTER - how it played out')}</div>
      <div class="two-col"><article class="panel"><h3>My plan and reason</h3><table class="dt plain"><tbody>${kv('Strategy', esc(r.strategy || ''))}${kv('Why I took it', esc(r.whyNow || ''))}${kv('Reason matched plan?', esc(r.reasonMatch || ''))}${kv('Checklist said GO?', esc(r.goCheck || ''))}${kv('Followed my rules?', esc(r.followed || ''))}${kv('Mistake', esc(r.mistake || ''))}${kv('Mood before / after', esc([r.mood, r.moodAfter].filter(Boolean).join(' → ')))}</tbody></table>${st ? Views.Psy.planPeek(st.name) : ''}</article>
        <article class="panel"><h3>Process grade</h3>${g ? `<table class="dt plain"><tbody>${g.parts.map(p => { const l = p.label || p[0], got = p.got != null ? p.got : p[1], mx = p.max != null ? p.max : p[2]; return `<tr><td>${esc(l)}</td><td class="num ${got < mx ? 'negative' : 'positive'}">${got} / ${mx}</td></tr>`; }).join('')}</tbody></table>${g.fix ? `<div class="finding warn"><b>Biggest thing to fix:</b> ${esc(g.fix)}</div>` : ''}` : '<div class="empty">Answer "Followed my rules?" on the trade to see a grade.</div>'}</article></div>
      ${r.notes || r.lesson ? `<div class="panel"><h3>What I wrote</h3>${r.notes ? `<p class="prewrap">${esc(r.notes)}</p>` : ''}${r.lesson ? `<p class="prewrap"><b>Lesson:</b> ${esc(r.lesson)}</p>` : ''}</div>` : ''}
      ${checks.length ? `<div class="panel"><h3>How I felt</h3>${checks.map(c => `<div class="finding">${esc(c.time || '')} · ${esc(c.context || '')}: <b>${esc(c.emotion || '')}</b> (${esc(c.intensity || '')}/5) ${esc(c.trigger || '')}</div>`).join('')}</div>` : ''}
      <div class="panel form-panel"><h3>One lesson from this trade</h3><p class="tiny muted">Write it in one line - it is saved on the trade.</p><input id="rp-lesson" value="${esc(r.replayLesson || '')}" placeholder="Next time I will..."><div class="form-actions"><button class="primary" data-action="rp-lesson" data-id="${esc(id)}">Save lesson</button></div></div>`;
  }

  /* ---------------- SEARCH ---------------- */
  const hit = (q, ...t) => t.join(' ').toLowerCase().includes(q);
  const snip = (t, q) => { t = String(t || ''); const i = t.toLowerCase().indexOf(q); if (i < 0) return esc(t.slice(0, 90)); const a = Math.max(0, i - 30); return (a ? '…' : '') + esc(t.slice(a, a + 110)); };
  function searchResults() {
    const q = (S.sq || '').trim().toLowerCase(); if (q.length < 2) return '<div class="empty">Type at least 2 letters. Search covers trades, events, journal, books, lessons and your plan.</div>';
    const { rows, s } = ctx(), out = [];
    rows.filter(r => hit(q, r.instrument, r.strategy, r.notes, r.whyNow, r.mistake, r.mood, r.lesson, r.date)).slice(-20).reverse().forEach(r => out.push(['Trade', `${r.date} · ${r.instrument || ''} ${r.direction || ''} ${r.outcome || ''}`, r.whyNow || r.notes, '#/replay/' + r.id]));
    Store.list('lifeevent').filter(x => hit(q, x.text, x.cat)).forEach(x => out.push(['Event', `${x.date} · ${x.cat || ''}`, x.text, '#/life']));
    Store.list('life').filter(x => hit(q, x.diary, x.highlight, x.drain)).forEach(x => out.push(['Journal', x.date, x.diary || x.highlight || x.drain, '#/life']));
    Store.list('book').filter(b => hit(q, b.title, b.author, b.summary, b.lessons, b.improve, b.quote)).forEach(b => out.push(['Book', b.title, b.lessons || b.summary || b.improve, '#/books']));
    Ls.LESSONS.filter(l => hit(q, l.title)).forEach(l => out.push(['Lesson', l.title, '', '#/mentor/' + l.id]));
    s.strategies.filter(x => hit(q, x.name, x.desc, x.full, x.skip, (x.rules || []).map(r => r.text).join(' '), (x.inds || []).map(i => i.name + ' ' + i.use).join(' '))).forEach(x => out.push(['Plan', x.name, x.full || x.desc, '#/plan']));
    return out.length ? out.slice(0, 60).map(o => `<a class="sr-item" href="${o[3]}"><span class="sr-tag">${o[0]}</span><span><b>${esc(o[1])}</b><small>${snip(o[2], q)}</small></span></a>`).join('') : '<div class="empty">Nothing found for that. Try another word.</div>';
  }
  const search = () => `${intro('Search', 'Find anything you wrote: trades, events, journal, books, lessons and plan.')}<div class="panel"><input type="search" id="sq" placeholder="Search everything…" value="${esc(S.sq || '')}" autocomplete="off"></div><div class="panel" id="sr">${searchResults()}</div>`;

  /* ---------------- ACTIONS & EVENTS ---------------- */
  Object.assign(A, {
    'theme': el => { setTheme(el.dataset.v); App.render(); },
    'theme-toggle': () => { setTheme(getTheme() === 'light' ? 'dark' : 'light'); if (location.hash.includes('settings')) App.render(); },
    'goals-save': async () => { const g = {}; document.querySelectorAll('[data-goal]').forEach(i => { g[i.dataset.goal] = Math.max(0, Math.min(31, Math.round(+i.value || 0))); }); await Store.saveSettings({ ...Store.settings, goals: g }); toast('Goals saved'); App.render(); },
    'rm-perm': async () => { try { await Notification.requestPermission(); } catch (e) { /* ignore */ } App.render(); },
    'rm-save': async () => { const r = { on: $('#rm-on').checked, plan: $('#rm-plan').value || '08:00', review: $('#rm-review').value || '20:00' }; await Store.saveSettings({ ...Store.settings, remind: r }); toast(r.on ? 'Reminders saved' : 'Reminders are off'); App.render(); },
    'rp-step': el => { S.rpMonth = shiftMonth(S.rpMonth || month0(), +el.dataset.d); App.render(); },
    'rp-now': () => { S.rpMonth = month0(); App.render(); },
    'rp-print': () => window.print(),
    'rp-lesson': async el => { const t = Store.get(el.dataset.id); if (!t) return; const { id, updatedAt, ...d } = t; await Store.save('trade', { ...d, id: el.dataset.id, replayLesson: $('#rp-lesson').value.trim() }); toast('Lesson saved'); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'sq') { S.sq = e.target.value; const r = $('#sr'); if (r) r.innerHTML = searchResults(); } });
  document.addEventListener('toggle', e => { if (e.target.id === 'after-details') S.quickOpen = e.target.open; }, true);
  setInterval(checkReminders, 30000); setTimeout(checkReminders, 4000);

  Object.assign(Views, { report, replay, search, Ext: { settingsExtra, goalsCard, getTheme } });
})(typeof window !== 'undefined' ? window : globalThis);
