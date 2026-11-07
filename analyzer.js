/* Chart Analyzer: offline SMC / ICT screenshot reader (analyzer.html) shown inside TradeMind.
   "Send to my trade log" opens the Log trade form with direction, entry, stop, target and notes filled in. */
(function (root) {
  'use strict';
  const Views = root.Views, h = Views.h;
  const analyzer = () => `${h.intro('Chart Analyzer', 'Add 3 screenshots (H4, H1, M15). It marks zones and structure and suggests a plan, all on this device with no internet. Educational only; you decide.')}
    <div class="panel" style="padding:0;overflow:hidden"><iframe id="an-frame" src="analyzer.html" title="Chart Analyzer" style="width:100%;height:calc(100vh - 190px);min-height:640px;border:0;display:block;background:#0b0f1a"></iframe></div>`;
  Object.assign(Views, { analyzer });
  window.addEventListener('message', e => {
    const d = e.data; if (!d || d.type !== 'trademind-plan' || !d.plan) return;
    const f = document.getElementById('an-frame'); if (!f || e.source !== f.contentWindow) return;
    const p = d.plan, s = Store.settings || {}, norm = x => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const inst = (s.instruments || []).find(i => norm(i.name) === norm(p.symbol));
    const num = v => (v == null || !isFinite(v)) ? '' : String(Math.round(v * 1e6) / 1e6);
    const fields = { direction: p.direction, entry: num(p.entry), sl: num(p.sl), tp: num(p.tp), orderType: p.orderType || 'Market', tf: 'M15',
      notes: 'From Chart Analyzer (' + p.state + ', grade ' + p.grade + ', zone ' + p.zone + ')\n' + p.notes };
    if (inst) fields.instrument = inst.name;
    h.S.tradePrefill = { fields }; h.S.trade = null; h.S.tradeParam = null; h.go('trade/new');
    if (!inst) h.toast('Plan copied into the form. Choose the instrument (' + (p.symbol || 'not set') + ').');
  });
})(window);
