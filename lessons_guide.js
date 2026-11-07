/* TradeMind Mentor: "The Trader's Field Guide" course (Forex foundations, SMC, ICT, example plans, psychology, review).
   Added to the same Lessons list as the beginner and experienced tracks. Educational only; no strategy is guaranteed profitable.
   The two example plans are teaching material to test, they are NOT added to anyone's trading plan automatically. */
(function (root) {
  'use strict';
  const base = root.Lessons || require('./lessons.js');
  const L = (id, title, min, body, quiz) => ({ id, track: 'guide', title, min, body, quiz });
  const Q = (q, opts, a, why) => ({ q, opts, a, why });

  const GUIDE = [
    L('g1', 'Start here: how to use the Field Guide', 4, [
      'These lessons follow the Field Guide: foundations first, then structure, SMC and ICT terms, two worked example plans, risk, psychology, routine and testing.',
      { h: 'Learning path' },
      { ul: ['1. Understand currency pairs, orders, spreads and leverage.', '2. Read swing structure and identify trends and ranges.', '3. Learn SMC and ICT concepts without overloading the chart.', '4. Study the two example plans separately (forex H4 → H1 → M15 and gold H4 → M15 → M5).', '5. Apply position sizing, loss limits and emotional controls.', '6. Backtest, forward-test and review before risking capital.'] },
      { warn: 'SMC and ICT are trading frameworks. Their labels do not prove that a market participant is an institution, and they do not guarantee a reaction. Treat every setup as a hypothesis to test with realistic costs. Do not change rules in the middle of a test.' }
    ], [
      Q('How should you treat an SMC or ICT setup?', ['As a guaranteed signal', 'As a hypothesis to test with realistic costs', 'As proof of institutional activity'], 1, 'The labels describe price behaviour. They do not guarantee a reaction.'),
      Q('When should you change your rules?', ['In the middle of a test, after a loss', 'Never, even between tests', 'Between tests, with a reason, not mid-test'], 2, 'Changing rules mid-test makes the results meaningless.'),
      Q('What comes before learning SMC terms?', ['Foundations and market structure', 'Live trading', 'Buying signals'], 0, 'The course builds from basics upward.')
    ]),
    L('g2', 'Forex foundations', 8, [
      'Forex is the market for exchanging one currency for another. In EUR/USD, the euro is the base currency and the dollar is the quote currency. If EUR/USD rises, the euro is gaining value relative to the dollar.',
      { h: 'Core terms' },
      { ul: ['Pip: a standard price step (commonly 0.0001, or 0.01 for JPY pairs).', 'Lot: standard 100,000 units, mini 10,000, micro 1,000.', 'Spread: the bid/ask difference. Commission and swap may also apply.', 'Slippage: the difference between the expected and the executed price.'] },
      { h: 'Orders and leverage' },
      'Market orders seek immediate execution, limit orders seek a set price or better, and stop orders activate when a trigger is reached. Leverage magnifies both gains and losses. A stop loss is a risk instruction, not a guarantee of an exact fill during gaps or fast markets.',
      { h: 'What moves currencies' },
      'Interest-rate expectations, inflation, employment, central-bank policy, growth, geopolitical events and positioning. Check an economic calendar: news can widen spreads, cause slippage and reprice quickly.',
      { h: 'Sessions' },
      'London and New York often have substantial activity in major pairs, but no session guarantees volatility or a setup. Session times shift with daylight saving and holidays. Record session data and test whether timing improves your results.'
    ], [
      Q('In EUR/USD, which is the base currency?', ['USD', 'EUR', 'Neither'], 1, 'The first currency in the pair is the base.'),
      Q('A stop loss...', ['Guarantees an exact exit price', 'Is a risk instruction that can slip in gaps or fast markets', 'Removes all risk'], 1, 'Fills can differ from your stop in fast conditions.'),
      Q('Which size is a micro lot?', ['100,000 units', '10,000 units', '1,000 units'], 2, 'Standard 100,000, mini 10,000, micro 1,000.')
    ]),
    L('g3', 'Price action and market structure', 9, [
      { h: 'Candlesticks' },
      'Each candle records open, high, low and close. The body shows the open-to-close range; wicks show the extremes. A candle pattern is not a signal by itself: read it at a meaningful location.',
      { h: 'Trend and range' },
      'An uptrend commonly forms higher highs (HH) and higher lows (HL). A downtrend commonly forms lower lows (LL) and lower highs (LH). A range rotates between boundaries. Structure depends on the timeframe.',
      { h: 'BOS and CHOCH' },
      'Break of Structure (BOS) commonly describes a break of a meaningful swing in the direction of the current move. Change of Character (CHOCH) commonly describes an early break against prior structure. Definitions vary: decide which swing matters and whether a wick or a close qualifies.',
      { h: 'Liquidity references' },
      'Prior highs and lows, equal highs and lows, session extremes, previous-day high/low (PDH/PDL) and previous-week high/low (PWH/PWL) are watched because orders may cluster there. They are reference areas, not guaranteed reversal points.',
      { h: 'Multi-timeframe analysis' },
      { ul: ['Higher timeframe: context and location.', 'Middle timeframe: the setup.', 'Lower timeframe: execution.'] },
      { tip: 'A lower-timeframe signal does not automatically cancel the higher-timeframe structure.' }
    ], [
      Q('What does CHOCH commonly describe?', ['An early break against prior structure', 'A break in the direction of the trend', 'A news release'], 0, 'BOS goes with the move, CHOCH is the early break against it.'),
      Q('Are PDH/PDL guaranteed reversal points?', ['Yes', 'No, they are reference areas', 'Only on London open'], 1, 'They are places where orders may cluster, nothing more.'),
      Q('What is the job of the higher timeframe?', ['Execution', 'Context and location', 'Setting the stop pips'], 1, 'Give each timeframe one job.')
    ]),
    L('g4', 'Smart Money Concepts (SMC)', 10, [
      'SMC is a retail price-action framework that organises ideas such as market structure, liquidity, order blocks, fair value gaps, premium/discount and inducement. The labels do not reveal who is trading or what they intend.',
      { h: 'Order Block (OB)' },
      'A common bullish OB is the last bearish candle before strong bullish displacement; a bearish OB is the last bullish candle before strong bearish displacement. Traders differ on full-candle or body-only boundaries. Choose one definition before testing. An OB touch alone is not an entry.',
      { h: 'Fair Value Gap (FVG)' },
      'A common three-candle FVG marks non-overlap between candle 1 and candle 3. Bullish: candle 1 high is below candle 3 low. Bearish: candle 1 low is above candle 3 high. It is not a promise that price will return or reverse.',
      { h: 'Breaker and mitigation' },
      'A breaker is often described as a prior OB that fails and later acts in the opposite role after a structural shift. Mitigation describes price revisiting an area. Define the exact candles and conditions you use.',
      { h: 'Premium and discount' },
      'Some traders split a chosen dealing range at its midpoint: upper half premium, lower half discount. It is a context filter, not a buy/sell signal. Define the swing range consistently.',
      { h: 'Liquidity sweep' },
      'Price trades beyond a prior high or low and then reclaims the level. Tell a sweep-and-reclaim apart from a breakout that holds beyond the level. A wick alone does not prove a reversal.',
      { h: 'A practical process' },
      { ul: ['Define the context and mark meaningful swings.', 'Identify a relevant liquidity reference.', 'Locate an OB or FVG only after the required displacement.', 'Define invalidation and check the target distance.', 'Wait for the exact trigger and record discretionary decisions.'] }
    ], [
      Q('A bullish FVG exists when...', ['Candle 1 high is below candle 3 low', 'Candle 1 low is above candle 3 high', 'Three candles are the same colour'], 0, 'That non-overlap is the gap in a bullish FVG.'),
      Q('Is an OB touch an entry?', ['Yes always', 'No, the full predefined sequence must be present', 'Only on the H4'], 1, 'A zone is a location, not a trigger.'),
      Q('What does "premium" mean in SMC?', ['The upper half of a defined range', 'A paid signal service', 'The lower half of the range'], 0, 'Premium is above the midpoint, discount is below.')
    ]),
    L('g5', 'ICT concepts', 8, [
      'ICT education commonly discusses liquidity, dealing ranges, FVGs, OBs, market structure shifts (MSS), displacement, session timing, daily bias, premium/discount and optimal trade entry (OTE). Several terms overlap with SMC.',
      { h: 'MSS and displacement' },
      'MSS describes a break of a short-term swing that suggests a possible shift. Displacement is a decisive directional move. Define the swing and the close requirement; where you can, measure displacement with candle body size or ATR.',
      { h: 'Consequent encroachment and OTE' },
      'Some traders watch the midpoint of an FVG (consequent encroachment). OTE is commonly tied to a Fibonacci retracement zone around 62% to 79%. These are location ideas, not complete strategies.',
      { h: 'Session windows' },
      'ICT material discusses specific time windows around sessions. Treat them as filters, not guarantees. Adjust for daylight saving and test their effect after costs.',
      { warn: 'Avoid concept overload. Do not stack every ICT/SMC label on one chart. Choose a small, repeatable sequence and test it. More terminology can create hindsight explanations instead of a measurable edge.' }
    ], [
      Q('OTE is commonly linked to which zone?', ['10% to 20% retracement', '62% to 79% retracement', '100% extension only'], 1, 'The Fibonacci 62% to 79% zone.'),
      Q('What does displacement describe?', ['A decisive directional move', 'A broker outage', 'A sideways range'], 0, 'It is a strong, clear move, ideally measured.'),
      Q('Why avoid stacking many labels on one chart?', ['It creates hindsight explanations, not an edge', 'Charts load slower', 'ICT forbids it'], 0, 'A small tested sequence is easier to execute and measure.')
    ]),
    L('g6', 'Example plan: Forex "Method B" (H4 → H1 → M15)', 12, [
      'This is a worked example of a multi-timeframe plan for EURUSD, GBPUSD, USDJPY and AUDJPY. It is a framework to TEST, not a verified profitable system. It is not added to your trading plan; if you like it, write it as your own plan and test it yourself.',
      { h: 'H4: location' },
      'Mark a valid H4 supply/demand or support/resistance zone. Prefer clear displacement, structure impact (BOS/CHOCH) and a fresh or lightly tested area. Mark PDH/PDL and PWH/PWL as liquidity references, not automatic reversals. Wait for price to approach the zone.',
      { h: 'H1: setup' },
      'At or near the H4 zone, find a fresh H1 OB that matches your direction. Use a fixed boundary rule (a practical test convention is the full high-to-low range of the last opposing candle before displacement). Do not enter on an OB touch.',
      { h: 'M15: confirmation' },
      'BUY: a completed M15 candle must close above the upper boundary of the relevant H1 bullish OB. SELL: a completed M15 candle must close below the lower boundary of the relevant H1 bearish OB. A wick beyond the boundary does not qualify.',
      { h: 'M15: trigger' },
      'Mark the high and low of the confirmation candle. The very next M15 candle must break the confirmation candle high (BUY) or low (SELL). If it does not, cancel the setup. Do not chase a later move.',
      { h: 'Stop and target' },
      'Stop beyond logical structural invalidation (beyond the H1 OB or a structural swing, with a justified buffer). Target opposing H1/H4 structure or liquidity. Require at least 1:2 planned reward-to-risk, otherwise skip. Never widen a stop.',
      { h: 'No-trade conditions' },
      { ul: ['No valid H4 zone, or no relevant H1 OB.', 'No M15 close beyond the OB, or no trigger in the next candle.', 'Target distance too small for the stop.', 'Abnormal spread or slippage, or news risk under your rules.', 'Daily risk limit reached, or the urge to chase.'] },
      { h: 'Correlation' },
      'EURUSD and GBPUSD can share USD exposure; USDJPY and AUDJPY share JPY exposure. Correlation changes, so calculate combined exposure instead of treating each symbol as independent.'
    ], [
      Q('What must a BUY confirmation candle do in this plan?', ['Touch the OB with a wick', 'CLOSE above the upper boundary of the H1 OB', 'Be a doji'], 1, 'A wick beyond the boundary does not qualify; the candle must close beyond it.'),
      Q('The next M15 candle does not break the confirmation high. You...', ['Enter anyway', 'Cancel the setup and do not chase', 'Widen the stop'], 1, 'No trigger in the very next candle means no trade.'),
      Q('Minimum planned reward-to-risk in this example?', ['1:1', '1:2', '1:5'], 1, 'Skip the trade if at least 1:2 is not available.')
    ]),
    L('g7', 'Example plan: Gold XAUUSD (H4 → M15 → M5)', 9, [
      'Keep the models separate: the gold plan is not the forex plan above. It uses H4 candle reference levels, M15 SMC/ICT zones with rejection, and M5 candle-close confirmation. Like the forex example, it is a framework to test, not a proven system.',
      { h: 'H4: reference levels' },
      'Select an H4 candle and mark its high and low. Keep the selection rule consistent. These are reference levels and possible targets, not guaranteed turning points.',
      { h: 'M15: zone and rejection' },
      'Look for a defined OB, FVG, breaker block or support/resistance area. Wait for price to reach the zone and show rejection. Identify the last opposing candle tied to the rejection. Use one fixed rejection definition during testing.',
      { h: 'M5: entry' },
      'BUY: after bullish M15 rejection, wait for an M5 bullish candle to close above the high of the relevant last opposing candle. SELL: after bearish M15 rejection, wait for an M5 bearish candle to close below its low. Entry follows the M5 close.',
      { h: 'Stop and target' },
      'Stop at the last structural low (BUY) or high (SELL), consistent with your written plan. The H4 high/low is the target reference. If the target is too close to justify the risk, skip.',
      { warn: 'Gold can move sharply around USD news, yields and headlines, and spreads and slippage can widen. Size from the stop distance and volatility. A fixed dollar stop does not fit every session.' }
    ], [
      Q('Is the gold plan the same as the forex example?', ['Yes', 'No, keep the models and journals separate', 'Only on Fridays'], 1, 'Different instruments and different sequences.'),
      Q('When does a gold BUY entry occur?', ['After an M5 bullish close above the last opposing candle high, following M15 rejection', 'As soon as price touches the zone', 'At the H4 open'], 0, 'Entry follows the M5 close beyond the opposing candle.'),
      Q('What should adapt to gold volatility?', ['Position size based on stop distance', 'Nothing', 'The pip count of the H4 candle only'], 0, 'Size from the stop, never a fixed dollar stop for every session.')
    ]),
    L('g8', 'Risk management and position sizing (Field Guide)', 8, [
      { h: 'Risk per trade' },
      'A small fixed risk fraction is more survivable while learning. 0.25% to 0.5% is an educational example, not a universal rule. Choose a cap you can tolerate and keep it fixed during a test.',
      { h: 'Position sizing' },
      'Cash risk = account equity × risk percentage. Then size from stop distance and the instrument\'s tick/pip value. Verify contract size, pip value, quote-currency conversion and broker specifications. Never guess a lot size.',
      { h: 'Reward-to-risk' },
      'A planned 1:2 means the potential reward is twice the planned risk before costs. It does not guarantee positive expectancy: a high R:R system can still lose if its win rate is low or costs are high.',
      { h: 'Limits and exposure' },
      { ul: ['Set a maximum daily loss and maximum trades before the session. A sample rule: stop after two consecutive losses or a pre-set daily drawdown. Never raise the limit mid-session.', 'Several trades can be one underlying bet. Check currency exposure, direction, correlation and shared news drivers.', 'Include spread, commission, swap and slippage in testing.'] },
      { tip: 'TradeMind\'s STOP screen enforces your loss-streak rule and your daily limits for you.' }
    ], [
      Q('Cash risk equals...', ['Account equity × risk percentage', 'Lot size × 10', 'Spread × pips'], 0, 'Then size the position from the stop distance.'),
      Q('When may you raise your daily loss limit?', ['Mid-session if you feel confident', 'Never mid-session', 'After any win'], 1, 'Decide limits in advance and keep them.'),
      Q('Why is a high R:R not enough?', ['A low win rate or high costs can still lose money', 'R:R does not matter', 'It always wins'], 0, 'Expectancy needs win rate and costs too.')
    ]),
    L('g9', 'Trading psychology (Field Guide)', 9, [
      { h: 'Process over outcome' },
      'A good trade follows the plan even if it loses. A bad trade breaks the plan even if it wins. Judge execution quality separately from P&L.',
      { h: 'The usual traps' },
      { ul: ['FOMO: late entries, oversized positions, rule changes. If the trigger has passed, let it go. A missed trade costs no capital; a chased trade creates new risk.', 'Revenge trading: after a loss, traders raise size or take weak setups to recover. Pause, check whether the trade followed the rules, and resume only when another valid setup appears.', 'Overconfidence: a winning streak makes risk feel smaller. Do not raise size after a few wins; keep it constant until a large, reviewed sample supports a change.', 'Loss aversion: fear causes early exits from winners and holding losers. Define stop and target before entry.'] },
      { h: 'Patience and attention' },
      'Use alerts at important zones and scheduled chart reviews. If no valid setup exists, close the chart and come back at the next planned review. Do not force trades to justify screen time.',
      { h: 'Emotional journal' },
      'Before the trade record emotional state, fatigue, confidence and the reason for entry. Afterwards record rule adherence, impulse and one specific improvement. TradeMind\'s mindset check and "Why am I taking this trade?" box do the first part for you.'
    ], [
      Q('A trade that followed the plan lost. It was...', ['A bad trade', 'A good trade that lost', 'A system failure'], 1, 'Execution quality is separate from P&L.'),
      Q('The trigger already passed and price is running. You should...', ['Chase it', 'Let it go', 'Double the size'], 1, 'A missed trade costs nothing; a chased trade adds risk.'),
      Q('After a few wins, size should...', ['Increase', 'Stay constant until a big reviewed sample supports change', 'Be doubled'], 1, 'Overconfidence makes risk feel smaller than it is.')
    ]),
    L('g10', 'Routine, journaling and review', 7, [
      { h: 'Pre-session' },
      'Check the economic calendar, review H4 context, mark zones and prior-day/prior-week levels, set alerts, and define maximum risk and trades. Do not start by hunting for an M5 entry.',
      { h: 'During the session' },
      'Respond to alerts and check the full setup sequence. If it is incomplete, wait. Avoid watching every tick if it pushes you into impulsive decisions.',
      { h: 'Post-session' },
      'Save before/after screenshots. Record setup, instrument, entry, stop, target, result in R, costs, rule adherence and emotional state. Judge the trade by what was valid at entry time, not with hindsight.',
      { h: 'Weekly review' },
      'Review all trades, missed valid setups and avoided invalid setups. Group results by instrument, session, setup grade and market condition. Correct process errors before changing the strategy.',
      { tip: 'In TradeMind: pre-session routine on the Daily Check page, Daily Review with meditation in the evening, and the weekly psychology report on the Mindset & Discipline page.' }
    ], [
      Q('How should you start a session?', ['Hunting for an M5 entry', 'Calendar, H4 context, zones, alerts and risk limits', 'Opening a trade'], 1, 'Preparation comes before looking for entries.'),
      Q('You judge a trade by...', ['What was valid at entry time', 'How it turned out', 'Social media opinions'], 0, 'Hindsight distorts decisions.'),
      Q('Before changing the strategy, you should...', ['Correct process errors first', 'Add more indicators', 'Stop journaling'], 0, 'Often the process, not the strategy, is the problem.')
    ]),
    L('g11', 'Backtesting and measuring an edge', 10, [
      { h: 'Define the rules first' },
      'Specify zone selection, OB boundaries, confirmation close, trigger timing, stop, target, session and news filters. If a rule cannot be identified consistently on historical charts, it is not ready.',
      { h: 'Sample size' },
      'Start with at least 50 documented historical or demo examples as an initial screen, then expand across different conditions. Fifty trades do not prove long-term profitability.',
      { h: 'Metrics' },
      { ul: ['Win rate = wins ÷ total trades.', 'Expectancy (R) = win rate × average win (R) − loss rate × average loss (R).', 'Profit factor = gross profit ÷ gross loss.', 'Also track maximum drawdown, consecutive losses and rule adherence.'] },
      { h: 'Avoid hindsight bias' },
      'Use bar replay or data that shows only the candles available at the time. Do not move zones after seeing outcomes. Include losses, no-trade cases, spread and realistic slippage.',
      { h: 'Out-of-sample and demo' },
      'Develop rules on one period, then test the unchanged rules on another. Forward-test under broker conditions on demo. Do not keep tweaking rules until the history looks attractive.'
    ], [
      Q('Do 50 trades prove long-term profitability?', ['Yes', 'No, they are only an initial screen', 'Only if all are wins'], 1, 'Expand across more conditions and a fresh period.'),
      Q('Win rate 40%, average win 2R, average loss 1R. Expectancy?', ['+0.2R', '+0.8R', '-0.2R'], 0, '0.4 × 2 − 0.6 × 1 = 0.2R.'),
      Q('Which is hindsight bias?', ['Moving zones after seeing outcomes', 'Writing rules first', 'Testing on another period'], 0, 'Use replay that hides future candles.')
    ]),
    L('g12', 'Important lessons and final recap', 6, [
      { ul: ['No certainty: no indicator, pattern, SMC/ICT label or AI tool can know the next price move. Trading is probabilistic.', 'Protect capital: the first job is to survive losing periods.', 'A zone is not an entry: the full predefined sequence must be present.', 'Complexity is not skill: a small tested playbook is easier to execute.', 'Consistency is not winning every day. It is repeating the same rules, controlling risk and reviewing decisions over a meaningful sample.', 'Responsibility: a broker, mentor, signal group or concept cannot remove market risk. Understand every order before placing it.', 'Never risk money you need to live on.'] },
      { h: 'Recap of the two example models' },
      { ul: ['Forex: H4 zone → H1 OB → M15 close beyond the OB → the next M15 candle breaks the confirmation high/low.', 'Gold: H4 high/low → M15 zone and rejection → M5 close beyond the opposing candle.', 'Keep models and journals separate. Test before risking capital.'] },
      { warn: 'Leveraged forex and gold trading can cause rapid losses. Gaps, slippage, spread widening and broker conditions affect execution. This is education, not personal financial advice, and no strategy is guaranteed profitable. Verify contract specifications with your broker.' }
    ], [
      Q('Consistency means...', ['Winning every day', 'Repeating the same rules and reviewing over a meaningful sample', 'Trading every session'], 1, 'It is about process, not daily results.'),
      Q('A zone alone is...', ['Not an entry; the full sequence is needed', 'A guaranteed entry', 'A reversal'], 0, 'Wait for the predefined sequence.'),
      Q('Can any tool know the next price move for certain?', ['Yes, AI can', 'No, trading is probabilistic', 'Yes, ICT can'], 1, 'No label or tool removes uncertainty.')
    ]),
    L('g13', 'Templates and glossary', 5, [
      { h: 'Pre-trade plan: write these down' },
      { ul: ['Date and session, instrument, strategy model.', 'Higher-timeframe context, zone and reason.', 'Confirmation and trigger, entry / stop / target.', 'Planned R:R, risk amount and position size.', 'News and correlation check, emotional state.'] },
      { h: 'Post-trade journal' },
      { ul: ['Result in R, rules followed (yes/no), screenshots saved (before/after).', 'Execution grade, emotions and impulses.', 'What went well, what needs correcting, one lesson.'] },
      { h: 'Formulas' },
      { ul: ['Cash risk = account equity × risk percentage.', 'Expectancy (R) = (win rate × average win) − (loss rate × average loss).', 'Profit factor = gross profit ÷ gross loss.', 'Planned R:R = potential reward ÷ potential risk.'] },
      { h: 'Glossary' },
      { ul: ['BOS: Break of Structure. CHOCH: Change of Character. MSS: Market Structure Shift.', 'OB: Order Block. FVG: Fair Value Gap. BB: Breaker Block.', 'PDH / PDL: Previous Day High / Low. PWH / PWL: Previous Week High / Low.', 'R: one unit of initial trade risk. Drawdown: decline from an equity peak.'] }
    ], [
      Q('What does PDH stand for?', ['Previous Day High', 'Price Drop High', 'Pending Daily Hold'], 0, 'PDH/PDL are previous-day high and low.'),
      Q('What is "R"?', ['One unit of initial trade risk', 'Rate of return per year', 'A rejection candle'], 0, 'Results are measured in multiples of initial risk.'),
      Q('Planned R:R equals...', ['Potential reward ÷ potential risk', 'Risk ÷ reward', 'Win rate × lot'], 0, 'Reward divided by risk.')
    ])
  ];

  base.LESSONS.push(...GUIDE);
  base.TRACKS.guide = 'Field Guide: SMC, ICT and example plans';
  if (typeof module !== 'undefined' && module.exports) module.exports = base;
})(typeof self !== 'undefined' ? self : this);
