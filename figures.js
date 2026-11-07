/* TradeMind lesson illustrations: original SVG diagrams drawn for teaching (not real charts, not trade signals).
   Lessons reference them with {fig:'id', cap:'caption'} blocks; the map at the bottom places them inside the lessons. */
(function (root) {
  'use strict';
  const W = 640, H = 280, K = { up: '#54d6a0', dn: '#ff777f', vio: '#9b7bff', amb: '#f4c66a', txt: '#d9d3e8', mut: '#827d8c', grid: '#201e2b' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wrap = (inner, label, h = H) => `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg" font-family="DM Sans,system-ui,sans-serif"><rect width="${W}" height="${h}" rx="10" fill="#100f16"/>${inner}</svg>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.c || K.txt}" font-size="${o.s || 12}" text-anchor="${o.a || 'start'}" font-weight="${o.w || 500}">${esc(s)}</text>`;
  const mk = (lo, hi, x0 = 30, x1 = W - 20, top = 26, bot = H - 24) => ({ x0, x1, top, bot, Y: p => bot - (p - lo) / (hi - lo) * (bot - top), X: (i, n) => x0 + (i + .5) * (x1 - x0) / n });
  const grid = c => [0, 1, 2, 3].map(i => `<line x1="${c.x0}" x2="${c.x1}" y1="${c.top + i * (c.bot - c.top) / 3}" y2="${c.top + i * (c.bot - c.top) / 3}" stroke="${K.grid}"/>`).join('');
  function candles(c, list, n, off = 0, bw = 14) {
    return list.map(([o, h, l, cl], i) => { const x = c.X(i + off, n), up = cl >= o, col = up ? K.up : K.dn, yt = c.Y(Math.max(o, cl)), yb = c.Y(Math.min(o, cl));
      return `<line x1="${x}" x2="${x}" y1="${c.Y(h)}" y2="${c.Y(l)}" stroke="${col}" stroke-width="1.6"/><rect x="${x - bw / 2}" y="${yt}" width="${bw}" height="${Math.max(2, yb - yt)}" fill="${col}" rx="1.5"/>`; }).join('');
  }
  const zone = (c, xa, xb, pa, pb, color, label, lx, below) => `<rect x="${xa}" y="${c.Y(Math.max(pa, pb))}" width="${xb - xa}" height="${Math.abs(c.Y(pa) - c.Y(pb))}" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-opacity=".7" stroke-dasharray="4 3" rx="3"/>${label ? T(lx == null ? xa + 6 : lx, below ? c.Y(Math.min(pa, pb)) + 14 : c.Y(Math.max(pa, pb)) - 5, label, { c: color, w: 700, s: 11 }) : ''}`;
  const hl = (c, p, xa, xb, color, label, dash = '5 4', la = 'start') => `<line x1="${xa}" x2="${xb}" y1="${c.Y(p)}" y2="${c.Y(p)}" stroke="${color}" stroke-dasharray="${dash}" stroke-width="1.3"/>${label ? T(la === 'end' ? xb : xa, c.Y(p) - 5, label, { c: color, a: la, s: 11, w: 600 }) : ''}`;
  const dot = (x, y, n, col = K.vio) => `<circle cx="${x}" cy="${y}" r="10" fill="${col}"/>${T(x, y + 4, n, { a: 'middle', c: '#0d0c12', w: 700 })}`;
  const poly = (c, pts, n, col = K.vio) => `<polyline fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" points="${pts.map((p, i) => c.X(i, n).toFixed(1) + ',' + c.Y(p).toFixed(1)).join(' ')}"/>`;

  const F = {
    candle: () => { const c = mk(0, 100, 0, W), one = (cx, o, cl, name, col) => { const up = cl > o, h = 88, l = 12; const yo = c.Y(o), yc = c.Y(cl), top = Math.min(yo, yc), bot = Math.max(yo, yc);
        const lab = (y, s, side) => `<line x1="${cx + 26}" x2="${cx + 80}" y1="${y}" y2="${y}" stroke="${K.mut}"/>` + T(cx + 86, y + 4, s);
        return `<line x1="${cx}" x2="${cx}" y1="${c.Y(h)}" y2="${c.Y(l)}" stroke="${col}" stroke-width="3"/><rect x="${cx - 24}" y="${top}" width="48" height="${bot - top}" fill="${col}" rx="3"/>${lab(c.Y(h), 'High')}${lab(up ? yc : yo, up ? 'Close' : 'Open')}${lab(up ? yo : yc, up ? 'Open' : 'Close')}${lab(c.Y(l), 'Low')}${T(cx, 268, name, { a: 'middle', c: col, w: 700 })}${T(cx - 36, (top + bot) / 2 + 4, 'body', { a: 'end', c: K.mut, s: 11 })}${T(cx - 8, c.Y(80), 'wick', { a: 'end', c: K.mut, s: 11 })}`; };
      return wrap(one(150, 30, 70, 'Bullish candle (close above open)', K.up) + one(470, 70, 30, 'Bearish candle (close below open)', K.dn), 'Candlestick anatomy: open, high, low, close, body and wicks'); },

    trend: () => { const a = mk(10, 90, 20, 310), b = mk(10, 90, 330, 620), up = [20, 45, 32, 60, 48, 78, 64], dn = [80, 55, 68, 40, 52, 22, 36], lab = (c, i, s, p, col, below) => T(c.X(i, 7), c.Y(p) + (below ? 20 : -10), s, { a: 'middle', c: col, w: 700 });
      return wrap(grid(a) + grid(b) + poly(a, up, 7, K.up) + poly(b, dn, 7, K.dn) + lab(a, 2, 'HL', 32, K.up, 1) + lab(a, 3, 'HH', 60, K.up) + lab(a, 4, 'HL', 48, K.up, 1) + lab(a, 5, 'HH', 78, K.up) + lab(b, 2, 'LH', 68, K.dn) + lab(b, 3, 'LL', 40, K.dn, 1) + lab(b, 4, 'LH', 52, K.dn) + lab(b, 5, 'LL', 22, K.dn, 1) +
        T(165, 268, 'Uptrend: higher highs + higher lows', { a: 'middle', c: K.up, w: 700 }) + T(475, 268, 'Downtrend: lower lows + lower highs', { a: 'middle', c: K.dn, w: 700 }), 'Uptrend with higher highs and higher lows next to a downtrend with lower lows and lower highs'); },

    bos: () => { const c = mk(10, 90), pts = [20, 45, 33, 62, 50, 80, 64, 42, 48], n = 9, x = i => c.X(i, n);
      return wrap(grid(c) + poly(c, pts, n, K.vio) + hl(c, 45, x(1), x(3), K.amb) + T(x(3), c.Y(45) + 16, 'BOS', { a: 'middle', c: K.amb, w: 700 }) + hl(c, 62, x(3), x(5), K.amb) + T(x(5), c.Y(62) + 16, 'BOS', { a: 'middle', c: K.amb, w: 700 }) +
        hl(c, 50, x(4), x(7), K.dn, '', '3 3') + T(x(7) + 6, c.Y(50) - 6, 'CHOCH', { c: K.dn, w: 700 }) + T(x(4), c.Y(50) + 18, 'last higher low', { a: 'middle', c: K.mut, s: 11 }) +
        T(320, 268, 'BOS = break in the direction of the move. CHOCH = early break against it.', { a: 'middle', c: K.txt, s: 12 }), 'Break of structure continuing an uptrend, then a change of character breaking the last higher low'); },

    mtf: () => { const box = (x, t, j, d, col) => `<rect x="${x}" y="70" width="190" height="130" rx="12" fill="${col}" fill-opacity=".12" stroke="${col}"/>${T(x + 95, 105, t, { a: 'middle', c: col, s: 22, w: 700 })}${T(x + 95, 132, j, { a: 'middle', w: 700 })}${T(x + 95, 156, d[0], { a: 'middle', c: K.mut, s: 11 })}${T(x + 95, 172, d[1], { a: 'middle', c: K.mut, s: 11 })}`;
      return wrap(box(20, 'H4', 'Context and location', ['Trend, zones, PDH/PDL,', 'where is price?'], K.vio) + box(225, 'H1', 'Setup', ['Order block aligned', 'with the direction'], K.amb) + box(430, 'M15', 'Execution', ['Close beyond the OB,', 'then the trigger'], K.up) +
        `<path d="M212 135h10m-4-4l4 4-4 4M417 135h10m-4-4l4 4-4 4" stroke="${K.mut}" fill="none" stroke-width="2"/>` + T(320, 245, 'Give each timeframe one job. A lower-timeframe signal does not cancel higher-timeframe structure.', { a: 'middle', s: 11, c: K.mut }), 'Three timeframes with one job each: H4 context, H1 setup, M15 execution'); },

    ob: () => { const c = mk(30, 85), n = 11, L = [[60, 62, 55, 56], [56, 58, 50, 51], [51, 53, 44, 46], [46, 48, 40, 41], [41, 70, 40, 68], [68, 76, 66, 74], [74, 78, 69, 70], [70, 71, 60, 62], [62, 63, 47, 50], [50, 60, 40.5, 58], [58, 68, 57, 66]];
      return wrap(grid(c) + zone(c, c.X(3, n) - 12, c.x1, 40, 48, K.amb, '') + T(30, 18, 'Bullish order block = the shaded zone', { c: K.amb, w: 700, s: 12 }) + candles(c, L, n) +
        dot(c.X(3, n), c.Y(36), '1', K.amb) + dot(c.X(4, n), c.Y(36), '2', K.up) + dot(c.X(9, n), c.Y(36), '3', K.vio) + T(30, 268, '1 last bearish candle   2 strong bullish displacement   3 price returns to the zone and reacts', { s: 11, c: K.mut }), 'Bullish order block: the last bearish candle before a strong bullish move, with price later returning to the zone'); },

    fvg: () => { const c = mk(30, 90, 30, 400), n = 3, L = [[40, 52, 38, 50], [50, 75, 49, 73], [73, 82, 58, 80]];
      return wrap(grid(c) + `<rect x="${c.X(0, n) + 7}" y="${c.Y(58)}" width="${c.x1 - c.X(0, n) - 7}" height="${c.Y(52) - c.Y(58)}" fill="${K.amb}" fill-opacity=".25" stroke="${K.amb}" stroke-dasharray="4 3"/>` + candles(c, L, n, 0, 22) +
        hl(c, 52, c.X(0, n), c.x1 + 8, K.mut, '', '2 3') + hl(c, 58, c.X(2, n), c.x1 + 8, K.mut, '', '2 3') + T(c.x1 + 14, c.Y(52) + 14, 'Candle 1 high', { s: 11 }) + T(c.x1 + 14, c.Y(58) - 4, 'Candle 3 low', { s: 11 }) + T(c.x1 - 10, c.Y(55) + 4, 'FVG', { c: K.amb, w: 700, s: 12, a: 'end' }) +
        [0, 1, 2].map(i => T(c.X(i, n), 268, String(i + 1), { a: 'middle', c: K.mut })).join('') + T(c.x1 + 14, 56, 'Bullish FVG: candle 1 high', { s: 11, c: K.mut }) + T(c.x1 + 14, 72, 'is below candle 3 low', { s: 11, c: K.mut }) + T(c.x1 + 14, 88, '(the candles do not overlap).', { s: 11, c: K.mut }) + T(c.x1 + 14, 112, 'Not a promise that price', { s: 11, c: K.mut }) + T(c.x1 + 14, 128, 'returns or reverses.', { s: 11, c: K.mut }), 'Bullish fair value gap between the high of candle one and the low of candle three'); },

    sweep: () => { const a = mk(50, 90, 20, 310), b = mk(50, 90, 330, 620), n = 6, base = [[60, 70, 58, 66], [66, 68, 60, 62], [62, 70, 60, 68]];
      const left = base.concat([[68, 75, 66, 67], [67, 68, 58, 59], [59, 60, 50, 52]]), right = base.concat([[68, 76, 67, 75], [75, 80, 73, 79], [79, 86, 77, 84]]);
      return wrap(grid(a) + grid(b) + hl(a, 70, a.x0, a.x1, K.amb, 'Equal highs (resting orders)') + hl(b, 70, b.x0, b.x1, K.amb, 'Same level') + candles(a, left, n, 0, 13) + candles(b, right, n, 0, 13) +
        T(a.X(3, n), a.Y(75) - 8, 'sweep', { a: 'middle', c: K.dn, w: 700, s: 11 }) + T(b.X(3, n) + 4, b.Y(76) - 8, 'closes above', { a: 'end', c: K.up, w: 700, s: 11 }) +
        T(165, 268, 'Sweep and reclaim: closes back below', { a: 'middle', c: K.dn, w: 700 }) + T(475, 268, 'Breakout that holds above the level', { a: 'middle', c: K.up, w: 700 }), 'A liquidity sweep that closes back below equal highs versus a breakout that holds above them'); },

    prem: () => { const c = mk(10, 90, 30, 420);
      return wrap(`<rect x="${c.x0}" y="${c.Y(80)}" width="${c.x1 - c.x0}" height="${c.Y(50) - c.Y(80)}" fill="${K.dn}" fill-opacity=".13"/><rect x="${c.x0}" y="${c.Y(50)}" width="${c.x1 - c.x0}" height="${c.Y(20) - c.Y(50)}" fill="${K.up}" fill-opacity=".13"/>` +
        hl(c, 80, c.x0, c.x1, K.mut, 'Swing high', '2 3') + hl(c, 20, c.x0, c.x1, K.mut, 'Swing low', '2 3') + hl(c, 50, c.x0, c.x1, K.amb, 'Midpoint (50%)') +
        `<polyline fill="none" stroke="${K.vio}" stroke-width="2" points="${c.x0 + 150},${c.Y(20)} ${c.x0 + 230},${c.Y(80)} ${c.x0 + 300},${c.Y(45)} ${c.x0 + 360},${c.Y(62)}"/>` + T(c.x0 + 8, c.Y(65), 'PREMIUM', { c: K.dn, w: 700 }) + T(c.x0 + 8, c.Y(35), 'DISCOUNT', { c: K.up, w: 700 }) +
        T(c.x1 + 14, 110, 'Upper half of the range = premium.', { s: 11, c: K.mut }) + T(c.x1 + 14, 126, 'Lower half = discount.', { s: 11, c: K.mut }) + T(c.x1 + 14, 150, 'A context filter, not a signal.', { s: 11, c: K.mut }) + T(c.x1 + 14, 166, 'Use one range definition.', { s: 11, c: K.mut }), 'A dealing range split at its midpoint into premium and discount halves'); },

    ote: () => { const c = mk(10, 90, 30, 420), z1 = 80 - .62 * 60, z2 = 80 - .79 * 60;
      return wrap(zone(c, c.x0, c.x1, z2, z1, K.amb, 'OTE zone: 62% to 79%') + hl(c, 80, c.x0, c.x1, K.mut, 'Swing high 100%', '2 3') + hl(c, 20, c.x0, c.x1, K.mut, 'Swing low', '2 3') +
        `<polyline fill="none" stroke="${K.vio}" stroke-width="2" points="${c.x0 + 160},${c.Y(20)} ${c.x0 + 270},${c.Y(80)} ${c.x0 + 350},${c.Y(37)}"/>` + T(c.x1 + 14, 100, 'Optimal trade entry (OTE) is a', { s: 11, c: K.mut }) + T(c.x1 + 14, 116, 'location idea: the 62% to 79%', { s: 11, c: K.mut }) + T(c.x1 + 14, 132, 'Fibonacci retracement of a leg.', { s: 11, c: K.mut }) + T(c.x1 + 14, 156, 'Not a complete strategy.', { s: 11, c: K.mut }), 'Fibonacci retracement zone between 62 and 79 percent of an up-move'); },

    methodb: () => { const c = mk(20, 72, 30, 470), n = 9, L = [[56, 58, 50, 51], [51, 52, 44, 45], [45, 46, 36, 37], [37, 38, 30, 31], [32, 40, 31, 39], [39, 46, 38.5, 44], [44, 52, 43, 50], [50, 58, 49, 56], [56, 66, 55, 64]], x = i => c.X(i, n);
      return wrap(grid(c) + zone(c, x(2) - 12, x(4) + 14, 28, 46, K.vio, 'H4 zone', x(2) - 12) + zone(c, x(3) - 11, x(5) + 8, 30, 38, K.amb, 'H1 OB', x(3) - 11, true) + candles(c, L, n) +
        hl(c, 40, x(4), c.x1, K.mut, '', '3 3') + T(c.x1 + 6, c.Y(40) + 4, 'Entry', { s: 11, c: K.txt, w: 700 }) + hl(c, 28, x(3), c.x1, K.dn, '', '3 3') + T(c.x1 + 6, c.Y(28) + 4, 'Stop (below the OB)', { s: 11, c: K.dn, w: 700 }) + hl(c, 64, x(5), c.x1, K.up, '', '3 3') + T(c.x1 + 6, c.Y(64) + 4, 'Target (1:2)', { s: 11, c: K.up, w: 700 }) + T(c.x1 + 6, c.Y(52) + 4, 'Risk 12 : reward 24', { s: 10, c: K.mut }) +
        dot(x(3), c.Y(21), '1', K.amb) + dot(x(4), c.Y(21), '2', K.up) + dot(x(5), c.Y(21), '3', K.up) + T(30, 268, '1 H1 OB at the H4 zone   2 M15 candle CLOSES above the OB   3 next candle breaks its high: BUY', { s: 11, c: K.mut }), 'Schematic of the example forex plan: H4 zone, H1 order block, M15 close above the order block, next candle trigger, stop and 1 to 2 target'); },

    gold: () => { const c = mk(0, 90), n = 9, L = [[50, 52, 44, 45], [45, 46, 36, 37], [37, 38, 28, 30], [30, 34, 22, 32], [32, 40, 31, 39.5], [39.5, 48, 39, 47], [47, 58, 46, 56], [56, 66, 55, 64], [64, 74, 63, 72]], x = i => c.X(i, n);
      return wrap(grid(c) + hl(c, 80, c.x0, c.x1, K.up, 'H4 candle high (target reference)') + hl(c, 14, c.x0, c.x1, K.mut, 'H4 candle low', '2 3', 'end') + zone(c, x(1) - 12, x(5), 20, 34, K.vio, 'M15 zone', x(1) - 12, true) + candles(c, L, n) +
        hl(c, 38, x(2), x(4) + 40, K.amb, 'last opposing candle high', '3 3', 'start') + hl(c, 21, x(3), c.x1, K.dn, 'Stop: structural low', '3 3', 'end') +
        dot(x(2), c.Y(4), '1', K.amb) + dot(x(3), c.Y(4), '2', K.vio) + dot(x(4), c.Y(4), '3', K.up) + T(30, 276, '1 last opposing (bearish) candle   2 rejection in the M15 zone   3 M5 bullish candle CLOSES above (1): BUY', { s: 11, c: K.mut }), 'Schematic of the example gold plan: H4 reference levels, M15 zone rejection and an M5 close above the last opposing candle'); },

    rr: () => { const c = mk(0, 100, 0, W);
      return wrap(`<rect x="60" y="${c.Y(100) + 24}" width="300" height="${c.Y(50) - c.Y(100) - 24}" fill="${K.up}" fill-opacity=".18" stroke="${K.up}"/><rect x="60" y="${c.Y(50)}" width="300" height="${c.Y(25) - c.Y(50)}" fill="${K.dn}" fill-opacity=".18" stroke="${K.dn}"/>` +
        T(70, c.Y(100) + 44, 'Take profit  +2R', { c: K.up, w: 700 }) + T(70, c.Y(50) - 6, 'Entry', { c: K.txt, w: 700 }) + T(70, c.Y(25) - 8, 'Stop loss  -1R', { c: K.dn, w: 700 }) +
        T(390, 90, 'Planned R:R = reward ÷ risk', { w: 700 }) + T(390, 112, '= 2R ÷ 1R = 1:2', { c: K.amb, w: 700 }) + T(390, 144, 'Break-even win rate = 1 ÷ (1 + 2) = 33%', { s: 11, c: K.mut }) + T(390, 166, 'Lot size = risk $ ÷ (stop pips × pip value)', { s: 11, c: K.mut }) + T(390, 188, 'Costs (spread, commission) reduce the real R.', { s: 11, c: K.mut }), 'Risk to reward diagram with entry, stop loss at minus one R and take profit at plus two R'); },

    dd: () => { const rows = [[10, 11.1], [20, 25], [30, 42.9], [50, 100]];
      return wrap(rows.map(([l, g], i) => { const y = 50 + i * 48; return T(20, y + 16, `Lose ${l}%`, { w: 700 }) + `<rect x="100" y="${y}" width="${l * 4}" height="24" fill="${K.dn}" rx="4"/>` + T(110 + l * 4, y + 16, `-${l}%`, { c: K.dn, s: 11 }) + `<rect x="100" y="${y + 26}" width="${g * 4}" height="10" fill="${K.up}" rx="3"/>` + T(110 + g * 4, y + 36, `need +${g}% to recover`, { c: K.up, s: 11 }); }).join('') + T(320, 268, 'Big losses need much bigger gains to repair. Keep per-trade risk small.', { a: 'middle', s: 11, c: K.mut }), 'Bars showing the gain needed to recover from losses of 10, 20, 30 and 50 percent', 290); },

    be: () => { const rows = [['1:1', 50], ['1:1.5', 40], ['1:2', 33.3], ['1:3', 25]];
      return wrap(rows.map(([r, v], i) => { const y = 40 + i * 48; return T(20, y + 17, `R:R ${r}`, { w: 700 }) + `<rect x="110" y="${y}" width="${v * 6}" height="26" fill="${K.vio}" rx="4"/>` + T(118 + v * 6, y + 18, `${v}% wins to break even`, { s: 11 }); }).join('') + T(320, 268, 'Break-even win rate = 1 ÷ (1 + R:R), before costs.', { a: 'middle', s: 11, c: K.mut }), 'Bars showing the win rate needed to break even at different risk to reward ratios', 290); }
  };

  const render = b => { const f = F[b.fig]; return f ? `<figure class="fig">${f()}<figcaption>${esc(b.cap || '')} <em>Illustration drawn for teaching, not a real chart or a signal.</em></figcaption></figure>` : ''; };

  /* where each figure goes: after the paragraph that follows a heading (or after the first paragraph when no heading is given) */
  const PLACE = { b2: [['Candlesticks', 'candle', 'Anatomy of a candle: four prices and two wicks.'], ['Trend and levels', 'trend', 'Trend is read from swing highs and swing lows.']],
    b4: [['Why small risk matters: the recovery math', 'dd', 'The bigger the loss, the bigger the gain needed to recover.']], b5: [[null, 'rr', 'Entry, stop and target drawn as risk and reward.'], ['Break-even win rate', 'be', 'Break-even win rate at common R:R values.']],
    a3: [[null, 'sweep', 'Two ways price can trade beyond an obvious high.']],
    g3: [['Candlesticks', 'candle', 'Open, high, low and close.'], ['Trend and range', 'trend', 'Higher highs and lows versus lower lows and highs.'], ['BOS and CHOCH', 'bos', 'Two breaks of structure, then a change of character.'], ['Multi-timeframe analysis', 'mtf', 'Each timeframe has one job.']],
    g4: [['Order Block (OB)', 'ob', 'A bullish order block and the later return to the zone.'], ['Fair Value Gap (FVG)', 'fvg', 'A three-candle bullish fair value gap.'], ['Premium and discount', 'prem', 'The two halves of a dealing range.'], ['Liquidity sweep', 'sweep', 'Sweep and reclaim versus a breakout that holds.']],
    g5: [['Consequent encroachment and OTE', 'ote', 'The OTE retracement zone.']], g6: [[null, 'mtf', 'The three timeframes of the example plan.'], ['M15: trigger', 'methodb', 'The whole sequence on one schematic (buy side).']],
    g7: [['M5: entry', 'gold', 'The gold sequence on one schematic (buy side).']], g8: [['Reward-to-risk', 'rr', 'A planned 1:2 trade.']] };
  function place() {
    const Ls = root.Lessons || (typeof require !== 'undefined' ? require('./lessons_guide.js') : null); if (!Ls) return;
    Object.entries(PLACE).forEach(([id, items]) => { const l = Ls.get(id); if (!l || l.figsDone) return; l.figsDone = true;
      items.forEach(([after, fig, cap]) => { let at = after == null ? 1 : l.body.findIndex(b => b && b.h === after) + 2; if (after != null && at < 2) at = l.body.length; l.body.splice(Math.min(at, l.body.length), 0, { fig, cap }); }); });
  }
  place();
  const api = { render, figures: Object.keys(F), draw: id => F[id] ? F[id]() : '' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Figures = api;
})(typeof self !== 'undefined' ? self : this);
