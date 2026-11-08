/* TradeMind app core: login / sign-up, automatic sync triggers, routing. */
(function (root) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TITLES = { dashboard: 'Dashboard', daily: 'Daily Check', checklist: 'Pre-Trade Checklist', log: 'Trade Log', trade: 'Trade', shots: 'Screenshots & Recordings', checkins: 'Emotion Check-ins', life: 'Life Journal', review: 'Daily Review', weekly: 'Weekly Check', plan: 'My Trading Plan', analyzer: 'Chart Analyzer', coach: 'Coach', discipline: 'Mindset & Discipline', mentor: 'Mentor & Lessons', help: 'Help & Guide', books: 'Books I Read', report: 'Monthly Report', replay: 'Trade Replay', search: 'Search', settings: 'Settings & Account' };
  const cfg = root.TM_CONFIG || {};
  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/YOUR-/i.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY) && root.supabase);
  const recoveryLink = /type=recovery/.test(location.hash);          // captured before supabase-js clears the URL
  let sb = null, currentPage = null, toastTimer = null, syncTimer = null;

  const App = {
    user: null,
    get sb() { return sb; },
    toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800); },
    statusText() { return ({ synced: 'Everything is saved to your account', syncing: 'Syncing…', pending: 'Saving to your account…', offline: 'Offline - changes are saved on this device and will sync when you are back online', error: 'Sync problem - will retry', signin: 'Please log in again to sync', local: 'This device only', idle: 'Ready' })[Store.status] || ''; },
    render() { route(true); },
    async signOut() {
      if (Store.isCloud) {
        $('#side-user').textContent = 'Saving…'; await Store.sync();
        if (Store.dirtyCount && !confirm(`${Store.dirtyCount} change(s) have not reached your account yet (you may be offline). Log out anyway and lose them?`)) { updateStatus(); return; }
      }
      const wasCloud = Store.isCloud; await Store.wipeDevice(); Views.reset(); App.user = null;
      if (wasCloud && sb) await sb.auth.signOut(); showAuth('Logged out. Your journal is safe in your account.', 'ok');
    },
    async changePassword(pw) {
      if (!pw || pw.length < 8) return App.toast('Use at least 8 characters.');
      const { error } = await sb.auth.updateUser({ password: pw }); App.toast(error ? error.message : 'Password changed'); if (!error) $('#new-pw').value = '';
    }
  };
  root.App = App;

  /* ---------- sync status pill ---------- */
  function updateStatus() {
    const pill = $('#sync-pill'), dot = $('#side-dot'), st = Store.status, dirty = Store.dirtyCount;
    const map = { synced: ['● Saved', 'ok'], syncing: ['● Syncing…', ''], pending: ['● Saving…', ''], offline: ['● Offline' + (dirty ? ` · ${dirty} to sync` : ''), 'warn'], error: ['● Sync problem', 'bad'], signin: ['● Log in to sync', 'bad'], local: ['● This device only', 'warn'], idle: ['● Ready', ''] };
    const [txt, c] = map[st] || map.idle; pill.textContent = txt; pill.className = 'sync-pill ' + c; pill.title = App.statusText();
    dot.className = 'status-dot ' + (c === 'bad' ? 'bad' : c === 'warn' ? 'warn' : '');
    $('#side-user').textContent = App.user ? (App.user.user_metadata?.name || App.user.email) : 'This device only';
  }

  /* ---------- routing: #/page or #/trade/<id|new> ---------- */
  function route(force) {
    if (!Store.uid || $('#app').hidden) return;
    const m = location.hash.match(/^#\/([a-z]+)(?:\/(.+))?$/); let page = m ? m[1] : 'dashboard', param = m ? m[2] : undefined;
    if (!TITLES[page] && page !== 'trade') page = 'dashboard';
    if (currentPage && currentPage !== page) Views.leaving(page);
    const changed = currentPage !== page; currentPage = page;
    $('#page-title').textContent = page === 'trade' ? (param === 'new' ? 'Log a trade' : 'Edit trade') : TITLES[page];
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page || (page === 'trade' && n.dataset.page === 'log')));
    $$('#bottom-nav a').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    $('#sidebar').classList.remove('open');
    $('#sidebar').classList.remove('open');
    $('#view').innerHTML = Views[page](param);
    Views.hydrate(); if (page === 'trade') Views.updateTradeCalc();
    if (changed && !force) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => route(false));

  /* ---------- auth screen ---------- */
  function authMsg(text, kind = '') { const m = $('#auth-msg'); m.textContent = text || ''; m.className = 'auth-msg ' + kind; }
  function authTab(name) {
    ['login', 'signup', 'forgot', 'recovery'].forEach(n => { $('#form-' + n).hidden = n !== name; });
    $('#auth-tabs').hidden = name === 'forgot' || name === 'recovery';
    $$('#auth-tabs button').forEach(b => b.classList.toggle('active', b.dataset.authTab === name)); authMsg('');
  }
  function showAuth(msg, kind) {
    enteredId = null; document.documentElement.classList.remove('returning'); $('#app').hidden = true; $('#auth-screen').hidden = false; $('#auth-config-warning').hidden = configured;
    authTab('login'); if (msg) authMsg(msg, kind); $$('#auth-screen input[type=password]').forEach(i => { i.value = ''; });
  }
  const busy = (form, on) => $$('button', form).forEach(b => { b.disabled = on; });
  const friendly = e => {
    const m = (e && e.message) || 'Something went wrong.';
    if (/invalid login/i.test(m)) return 'Wrong email or password.';
    if (/not confirmed/i.test(m)) return 'Please confirm your email first - check your inbox for the confirmation link.';
    if (/already registered|already been registered/i.test(m)) return 'That email already has an account. Try logging in instead.';
    if (/failed to fetch|network/i.test(m)) return 'No internet connection. Please try again when you are online.';
    return m;
  };

  function wireAuth() {
    $$('[data-auth-tab]').forEach(b => b.addEventListener('click', () => authTab(b.dataset.authTab)));
    $('#use-local').addEventListener('click', () => enterApp({ id: 'local', email: 'this device' }));
    $('#form-login').addEventListener('submit', async e => {
      e.preventDefault(); if (!sb) return authMsg('Cloud login is not set up yet.', 'err'); const f = e.target; busy(f, true); authMsg('Logging in…');
      const { data, error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }); busy(f, false);
      if (error) return authMsg(friendly(error), 'err'); authMsg(''); await enterApp(data.user);
    });
    $('#form-signup').addEventListener('submit', async e => {
      e.preventDefault(); if (!sb) return authMsg('Cloud login is not set up yet.', 'err'); const f = e.target; busy(f, true); authMsg('Creating your account…');
      const { data, error } = await sb.auth.signUp({ email: f.email.value.trim(), password: f.password.value, options: { data: { name: f.name.value.trim() }, emailRedirectTo: location.origin + location.pathname } }); busy(f, false);
      if (error) return authMsg(friendly(error), 'err');
      if (data.session) { authMsg(''); return enterApp(data.session.user); }
      if (data.user && data.user.identities && data.user.identities.length === 0) return authMsg('That email already has an account. Try logging in instead.', 'err');
      authTab('login'); authMsg('Account created! Check your email and tap the confirmation link, then log in here.', 'ok');
    });
    $('#form-forgot').addEventListener('submit', async e => {
      e.preventDefault(); if (!sb) return; const f = e.target; busy(f, true);
      const { error } = await sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: location.origin + location.pathname }); busy(f, false);
      authMsg(error ? friendly(error) : 'If that email has an account, a reset link is on its way.', error ? 'err' : 'ok');
    });
    $('#form-recovery').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.target; busy(f, true);
      const { data, error } = await sb.auth.updateUser({ password: f.password.value }); busy(f, false);
      if (error) return authMsg(friendly(error), 'err'); history.replaceState(null, '', location.pathname); App.toast('Password updated'); await enterApp(data.user);
    });
  }

  /* ---------- entering the app (single-flight: login form and auth events can both ask) ---------- */
  let entering = null, enteredId = null;
  function enterApp(user) {
    if (entering && entering.id === user.id) return entering.p;
    if (enteredId === user.id && Store.uid === user.id && !$('#app').hidden) return Promise.resolve();
    const p = (async () => {
      try {
        if (Store.uid && Store.uid !== user.id) Views.reset();
        App.user = user; await Store.open(user.id, user.id === 'local' ? null : sb);
        try { localStorage.setItem('tm-last-user', JSON.stringify({ id: user.id, email: user.email, name: user.user_metadata && user.user_metadata.name })); } catch (e) { /* private mode */ }
        $('#auth-screen').hidden = true; $('#app').hidden = false; document.documentElement.classList.add('returning'); Views.init(); updateStatus(); enteredId = user.id;
        currentPage = null; if (!/^#\/[a-z]/.test(location.hash)) history.replaceState(null, '', '#/dashboard'); route(false);
        if (Store.isCloud) { Store.sync(); startAutoSync(); }
      } catch (e) { console.error(e); enteredId = null; authMsg('Could not open your journal on this device: ' + e.message, 'err'); showAuth(); }
    })();
    entering = { id: user.id, p }; p.finally(() => { entering = null; }); return p;
  }

  /* ---------- automatic sync: on change, on focus, on reconnect, and every minute ---------- */
  Store.on((type, d) => {
    if (type === 'status') updateStatus();
    if (type === 'change') { updateStatus(); if (d && d.source === 'remote' && ['dashboard', 'log', 'shots', 'coach', 'checkins', 'life', 'books', 'report', 'search', 'discipline'].includes(currentPage)) route(true);
      else if (d && d.source === 'sync') { if (currentPage === 'trade') Views.refreshRecs(); else if (currentPage === 'shots') route(true); } }
  });
  function startAutoSync() {
    clearInterval(syncTimer); syncTimer = setInterval(() => { if (document.visibilityState === 'visible') Store.sync(); }, 60000);
  }
  window.addEventListener('online', () => Store.sync());
  window.addEventListener('offline', () => { if (Store.isCloud) Store.setStatus('offline'); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') Store.sync(); });
  window.addEventListener('pagehide', () => { if (Store.dirtyCount) Store.sync(); });
  window.addEventListener('beforeunload', e => { if (Store.isCloud && Store.dirtyCount && navigator.onLine === false) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- boot ---------- */
  async function boot() {
    wireAuth();
    $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    $('#more-btn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
    document.addEventListener('click', e => { const sb = $('#sidebar'); if (sb.classList.contains('open') && !e.target.closest('#sidebar,#menu-btn,#more-btn')) sb.classList.remove('open'); });
    $('#sync-pill').addEventListener('click', () => { if (Store.status === 'signin') { showAuth('Please log in again to keep syncing.'); } else { Store.sync(); App.toast('Syncing…'); } });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
    if (!configured) { showAuth(); return; }

    sb = root.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange((ev, session) => setTimeout(async () => {
      if (ev === 'PASSWORD_RECOVERY') { $('#app').hidden = true; $('#auth-screen').hidden = false; authTab('recovery'); }
      else if (ev === 'SIGNED_OUT' && App.user && App.user.id !== 'local') { App.user = null; Store.close(); showAuth('You were logged out. Please log in again.'); }
      else if (ev === 'SIGNED_IN' && session && !recoveryLink && (!App.user || App.user.id !== session.user.id)) { await enterApp(session.user); }
      else if (ev === 'TOKEN_REFRESHED' && session) { App.user = session.user; }
    }, 0));

    if (recoveryLink) { $('#auth-screen').hidden = false; authTab('recovery'); return; }
    let session = null; try { ({ data: { session } } = await sb.auth.getSession()); } catch (e) { /* offline */ }
    if (session) return enterApp(session.user);
    // Offline start with a remembered account: open the journal from this device's saved copy.
    let last = null; try { last = JSON.parse(localStorage.getItem('tm-last-user') || 'null'); } catch (e) { /* ignore */ }
    if (last && last.id && !navigator.onLine) { App.user = { id: last.id, email: last.email, user_metadata: { name: last.name } }; try { await enterApp(App.user); Store.setStatus('offline'); return; } catch (e) { /* fall through */ } }
    showAuth();
  }
  boot();
})(self);
