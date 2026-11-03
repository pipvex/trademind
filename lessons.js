/* TradeMind Mentor: built-in lessons and quizzes (free, works offline, no AI needed).
   Block types: a string = paragraph, {h} heading, {ul:[..]} bullets, {tip} highlighted tip, {warn} caution.
   This is education about process and risk. It is not financial advice and never predicts the market. */
(function (root) {
  'use strict';
  const L = (id, track, title, min, body, quiz) => ({ id, track, title, min, body, quiz });
  const Q = (q, opts, a, why) => ({ q, opts, a, why });

  const LESSONS = [
    /* ------------------------------ BEGINNER ------------------------------ */
    L('b1', 'beginner', 'What trading really is (and is not)', 5, [
      'Trading is making many small bets where the odds are slightly in your favour, then letting the numbers work over time. No single trade matters much. The next 100 trades matter.',
      { h: 'Three truths to start with' },
      { ul: ['Nobody knows what the next candle will do. A good trader plans for being wrong.', 'Most beginners lose money in the first year, mainly from oversized risk and broken rules, not from bad charts.', 'Your first goal is not profit. It is to survive long enough to learn, so protect your account first.'] },
      { tip: 'Judge yourself on process (did I follow my plan?) rather than on one win or loss. TradeMind grades exactly that.' },
      { warn: 'Anyone promising guaranteed profits or a "secret" that never loses is selling something.' }
    ], [
      Q('What should a beginner treat as the first goal?', ['Doubling the account fast', 'Surviving and learning while risk stays small', 'Finding a strategy that never loses'], 1, 'Capital preservation keeps you in the game long enough to build skill.'),
      Q('Why does one trade matter little?', ['Because results come from the average over many trades', 'Because losing trades do not count', 'Because the market is rigged'], 0, 'An edge only shows up across a large sample.'),
      Q('A trade that followed your plan lost money. It was...', ['A mistake', 'Still a good trade', 'Proof the plan is broken'], 1, 'Good process can still lose. That is normal variance.')
    ]),
    L('b2', 'beginner', 'Reading a chart: candles, trend, levels', 7, [
      { h: 'Candlesticks' },
      'Each candle shows four prices for its period: open, high, low and close. The thin lines are wicks (the extremes), the thick part is the body (open to close). Long wicks show price was pushed away from a level.',
      { h: 'Timeframes' },
      'M15 means each candle covers 15 minutes, H1 one hour, D1 one day. Use a higher timeframe to see the bigger direction and a lower one to time your entry.',
      { h: 'Trend and levels' },
      { ul: ['Uptrend: a series of higher highs and higher lows. Downtrend: lower highs and lower lows.', 'Support/resistance: areas where price turned before. They are zones, not exact lines.', 'The more times a zone held and the more clearly price reacted, the more attention it deserves.'] },
      { tip: 'Mark your levels on the higher timeframe before the session starts, then only trade near them. This is what your Daily Check asks.' }
    ], [
      Q('What does a long wick usually show?', ['Price was pushed away from that level', 'The market is closed', 'A guaranteed reversal'], 0, 'It shows rejection, not certainty.'),
      Q('Which describes an uptrend?', ['Lower highs and lower lows', 'Higher highs and higher lows', 'Sideways candles'], 1, 'Rising swing highs and lows define an uptrend.'),
      Q('Why look at a higher timeframe first?', ['To see the bigger direction and key levels', 'To trade more often', 'To avoid stop losses'], 0, 'Context first, entry timing second.')
    ]),
    L('b3', 'beginner', 'Pips, lots and leverage', 7, [
      { ul: ['A pip is the standard small price step (0.0001 on EURUSD, 0.01 on JPY pairs).', 'A standard lot is 100,000 units. On EURUSD one pip on 1 standard lot is about $10; 0.10 lot is about $1 per pip.', 'Leverage lets you control a large position with a small deposit. It magnifies wins AND losses.'] },
      { h: 'The only formula you must know' },
      'Lot size = money you are willing to lose ÷ (stop-loss distance in pips × value of one pip per lot).',
      'Example: risk $10, stop 20 pips, $10 per pip per lot → 10 ÷ (20 × 10) = 0.05 lot. TradeMind calculates this for you on every trade.',
      { warn: 'High leverage does not make you richer. It lets you lose faster. Size every trade by the stop, never by how much margin is available.' }
    ], [
      Q('Risk $20, stop 40 pips, $10 per pip per lot. Lot size?', ['0.05', '0.50', '0.005'], 0, '20 ÷ (40 × 10) = 0.05 lot.'),
      Q('What does leverage do?', ['Reduces risk', 'Magnifies both gains and losses', 'Guarantees profit'], 1, 'It scales the position, so it scales the outcome both ways.'),
      Q('What should set your position size?', ['The size of the margin available', 'Your stop distance and the amount you risk', 'How confident you feel'], 1, 'Risk amount and stop distance, always.')
    ]),
    L('b4', 'beginner', 'Risk management comes first', 8, [
      'Risk management decides whether you are still trading next year. Strategy is second.',
      { h: 'Core rules' },
      { ul: ['Risk a small fixed % per trade (often 0.5% to 1% for beginners).', 'Always have a stop loss, set BEFORE you enter and never moved further away.', 'Set a daily loss limit (for example 3%) and a maximum number of trades. When hit, you are done for the day.'] },
      { h: 'Why small risk matters: the recovery math' },
      { ul: ['Lose 10% → you need +11.1% to get back.', 'Lose 20% → you need +25%.', 'Lose 30% → you need +42.9%.', 'Lose 50% → you need +100%.'] },
      'Losses hurt more than equal gains help, so avoiding big losses is the fastest way to grow.',
      { tip: 'At 1% risk, ten losses in a row cost about 9.6%. At 10% risk the same streak wipes out about 65% of the account.' }
    ], [
      Q('You lose 50% of your account. What gain restores it?', ['50%', '75%', '100%'], 2, 'Half of the original means you must double what is left.'),
      Q('What should you do when your daily loss limit is hit?', ['Take one more trade to recover', 'Stop for the day', 'Double your size'], 1, 'The limit exists to stop emotional spirals.'),
      Q('When is the stop loss set?', ['After the trade moves against you', 'Before you enter', 'Only on big trades'], 1, 'The stop is part of the plan, not an afterthought.')
    ]),
    L('b5', 'beginner', 'Risk:reward, win rate and expectancy', 8, [
      'Risk:reward (R:R) compares what you can win with what you risk. If you risk 10 pips to make 30, that is 1:3, or 3R.',
      { h: 'Break-even win rate' },
      'The win rate you need just to break even is 1 ÷ (1 + R:R).',
      { ul: ['R:R 1:1 → 50%', 'R:R 1:1.5 → 40%', 'R:R 1:2 → 33%', 'R:R 1:3 → 25%'] },
      { h: 'Expectancy' },
      'Average result per trade = (win rate × average win in R) − (loss rate × average loss in R). If it is above zero after costs, you have a positive edge. TradeMind shows this as "Average R".',
      { tip: 'A high win rate with tiny wins and big losses can still lose money. Always read win rate together with average R.' }
    ], [
      Q('At 1:2 R:R, what win rate breaks even?', ['25%', '33%', '50%'], 1, '1 ÷ (1 + 2) = 33%.'),
      Q('Win rate 40%, wins 2R, losses 1R. Average R per trade?', ['+0.2R', '+0.8R', '-0.2R'], 0, '0.4×2 − 0.6×1 = 0.2R.'),
      Q('Why is win rate alone misleading?', ['It ignores how big wins and losses are', 'It is always wrong', 'It counts open trades'], 0, 'Size of wins versus losses decides profit.')
    ]),
    L('b6', 'beginner', 'Write a simple trading plan', 8, [
      'A trading plan is your rulebook, decided when you are calm, so you do not improvise when emotions are high.',
      { h: 'Keep it to one setup at first' },
      { ul: ['Which market and session do I trade?', 'What exactly must be true for an entry? (my zone, my confirmation)', 'Where is the stop, and where is the target? Minimum R:R?', 'How much do I risk, and when do I stop for the day?', 'What makes me skip the trade (news, spread, tired)?'] },
      'Turn these into MUST items in the My Trading Plan page. The Checklist then gives you GO or NO TRADE.',
      { tip: 'If a rule cannot be answered Yes or No, it is too vague. "Price rejected the zone with a pin bar or engulfing candle" works. "Looks good" does not.' }
    ], [
      Q('Why write the plan before the session?', ['So decisions are made calmly, not under pressure', 'So it can be sold', 'It is required by brokers'], 0, 'Rules made in calm moments beat in-the-moment impulses.'),
      Q('How many setups should a beginner start with?', ['As many as possible', 'One or two', 'Fifteen'], 1, 'Mastering one setup builds a clean data set.'),
      Q('A good rule is...', ['Vague and flexible', 'Yes/No checkable', 'Changed after each loss'], 1, 'If you cannot check it, you cannot follow it.')
    ]),
    L('b7', 'beginner', 'Order types, spread and slippage', 6, [
      { ul: ['Market order: fills now at the current price.', 'Limit order: buy below / sell above the current price, fills only at your price or better.', 'Stop order: triggers when price breaks through a level (breakout entries and stop losses).'] },
      'Spread is the gap between buy and sell price. It is a cost you pay on every trade, and it widens around news and at rollover. Slippage is when you fill at a worse price than requested, usually in fast markets.',
      { tip: 'If the spread is more than about 10 to 15% of your stop distance, the trade starts with a handicap. The Trade Log shows spread % of stop.' }
    ], [
      Q('A buy limit is placed...', ['Above the current price', 'Below the current price', 'At any price'], 1, 'A buy limit waits for a lower price.'),
      Q('When does spread usually widen?', ['During high-impact news', 'In calm midday trade only', 'Never'], 0, 'News and thin liquidity widen spreads.'),
      Q('Slippage means...', ['Your fill is worse than requested', 'You earned a bonus', 'The broker closed the account'], 0, 'It is the difference between expected and actual price.')
    ]),
    L('b8', 'beginner', 'Journaling that actually improves you', 6, [
      'A journal turns experience into learning. Without one, you repeat mistakes and remember only the exciting trades.',
      { h: 'What to record every time' },
      { ul: ['The plan: setup, entry, stop, target (and a BEFORE screenshot).', 'The result in R, not just money.', 'Whether you followed your rules, and any mistake.', 'How you felt before and after. This is where hidden patterns appear.'] },
      { h: 'Then review' },
      'Do a short daily review and a weekly check. Look for the one habit that costs the most and fix only that.',
      { tip: 'You are not collecting data to feel bad. You are looking for one repeatable fix per week.' }
    ], [
      Q('Why record feelings?', ['To find emotional patterns behind mistakes', 'Because the broker needs it', 'It has no use'], 0, 'Mood often explains rule-breaking.'),
      Q('How many fixes per week should you aim for?', ['One focused habit', 'Everything at once', 'None'], 0, 'One change at a time actually sticks.'),
      Q('Why log results in R?', ['It allows fair comparison regardless of position size', 'It looks professional', 'It hides losses'], 0, 'R normalises trades of different sizes.')
    ]),
    L('b9', 'beginner', 'Demo first, then start small', 5, [
      { ul: ['Practise the full process on a demo account for at least 30 trades, journaling each one.', 'Move to live with the smallest size your broker allows. The goal is to learn how real money feels.', 'Only increase size after a long run of rule-following, not after a lucky streak.'] },
      'Emotions change when real money is on the line, so expect your behaviour to change too. That is what the mindset check and STOP screen in TradeMind are for.',
      { warn: 'Never trade money you need for rent, food or bills. Fear of losing it will ruin your decisions.' }
    ], [
      Q('Before going live, you should have...', ['A journal of at least 30 demo trades', 'The biggest account possible', 'Several indicators'], 0, 'A sample shows whether your process holds.'),
      Q('When should you increase size?', ['After a lucky win', 'After consistent rule-following over time', 'After a loss to recover'], 1, 'Scale on process quality.'),
      Q('Which money is safe to trade?', ['Rent money', 'Money you can afford to lose', 'Borrowed money'], 1, 'Risk capital only.')
    ]),
    L('b10', 'beginner', 'The ten beginner mistakes', 6, [
      { ul: ['No stop loss, or moving it further away.', 'Risking too much per trade.', 'Overtrading out of boredom.', 'Chasing price after you missed the entry.', 'Revenge trading after a loss.', 'Trading without a written plan.', 'Changing strategy after two or three losses.', 'Ignoring news and spread.', 'Skipping the journal.', 'Comparing yourself with other traders\' screenshots.'] },
      'Look at your Mistake tags in the Trade Log. Your own top two are more important than this list. The Discipline page ranks them by what they have cost you.',
      { tip: 'Fix one mistake at a time. Write a rule that prevents it and add it to your plan as a MUST.' }
    ], [
      Q('What is revenge trading?', ['Trading to win back a loss out of emotion', 'Trading with a coach', 'Trading small'], 0, 'It is emotion-driven and rarely follows the plan.'),
      Q('After two losses, you should...', ['Change your strategy immediately', 'Check whether you followed the plan; two losses is normal', 'Double the size'], 1, 'Losing streaks are normal and not enough evidence to abandon a plan.'),
      Q('What is the best way to fix a mistake?', ['Write a specific rule that prevents it', 'Promise to try harder', 'Ignore it'], 0, 'Rules beat willpower.')
    ]),

    /* ------------------------------ EXPERIENCED ------------------------------ */
    L('a1', 'experienced', 'Edge, expectancy and sample size', 9, [
      'An edge is a repeatable advantage that produces a positive average R after costs. The hard part is knowing whether yours is real or luck.',
      { ul: ['Under 30 trades tells you almost nothing. 100+ trades in one setup begins to mean something.', 'Variance is large: with a 50% win rate, a streak of 5+ losses is very likely somewhere in 100 trades.', 'Track expectancy in R and include costs. A strategy can look great before spread and commission and be flat after.'] },
      { h: 'Avoid fooling yourself' },
      { ul: ['Do not tweak rules after every loss. Change one thing, then wait for a fresh sample.', 'Do not split your data into many small slices and pick the best one (overfitting).', 'Judge by the full distribution: average R, worst drawdown, longest losing streak.'] },
      { tip: 'Decide in advance what result would make you drop or change a setup, e.g. "after 50 trades below 0R expectancy I will rework it".' }
    ], [
      Q('Roughly how many trades before a result starts to mean something?', ['5', '10', '100 or more in one setup'], 2, 'Small samples are mostly noise.'),
      Q('Why include costs in expectancy?', ['They can turn a small edge into zero', 'They never matter', 'To make results look worse'], 0, 'Spread and commission directly reduce average R.'),
      Q('What is overfitting here?', ['Cherry-picking the best-looking slice of history', 'Trading too large', 'Using stop losses'], 0, 'It finds patterns that vanish going forward.')
    ]),
    L('a2', 'experienced', 'Position sizing and drawdown control', 9, [
      { ul: ['Fixed fractional sizing (a set % per trade) scales risk with the account.', 'Cut risk after a drawdown (for example halve it at -5%) and restore it only after you recover part of the loss.', 'Count correlated trades as one risk: long EURUSD and long GBPUSD is mostly a bet against the dollar twice.', 'Cap total open risk (e.g. 2% across all positions).'] },
      'Set a maximum drawdown that forces a pause and a review. Decide it now, when you are calm.',
      { tip: 'The point is not to maximise growth. It is to keep losing streaks survivable so you can keep following your plan during them.' }
    ], [
      Q('Two long trades on EURUSD and GBPUSD are...', ['Fully independent', 'Often correlated, so combined risk is higher', 'Zero risk'], 1, 'Both depend heavily on USD direction.'),
      Q('A sensible response to a drawdown is...', ['Raise risk to recover', 'Reduce risk until you recover', 'Remove stops'], 1, 'Smaller size slows damage and protects discipline.'),
      Q('Why cap total open risk?', ['To limit damage when several trades fail together', 'To trade less often', 'Brokers require it'], 0, 'Simultaneous losses compound quickly.')
    ]),
    L('a3', 'experienced', 'Market structure and liquidity', 10, [
      'Price tends to move between pools of liquidity: areas where many stop orders sit, such as above equal highs, below equal lows and past obvious swing points.',
      { ul: ['Start with higher-timeframe bias (structure and key levels), then look for entries on a lower timeframe in the direction of that bias.', 'A sweep (a quick move through an obvious high or low followed by a sharp return) can show that resting orders were taken. It is a clue, not a signal on its own.', 'Premium/discount: in an up-move, buying in the lower half of the range gives a better risk:reward than buying at the top.'] },
      { warn: 'Every concept works sometimes and fails sometimes. Define it with checkable rules, journal it, and let your own data say whether it pays.' }
    ], [
      Q('Where do many stop orders tend to sit?', ['Beyond obvious swing highs and lows', 'Only at round numbers', 'Nowhere in particular'], 0, 'Those areas are common liquidity pools.'),
      Q('Should a liquidity sweep alone trigger an entry?', ['Yes always', 'No, it is a clue that needs your other rules', 'Only on Fridays'], 1, 'Combine with bias and your checklist.'),
      Q('Which entry has the better R:R in an up-move?', ['Buying in the discount (lower half)', 'Buying at the top of the range', 'No difference'], 0, 'Better location gives a tighter stop for the same target.')
    ]),
    L('a4', 'experienced', 'Confluence, selectivity and A+ setups', 7, [
      'More conditions do not always mean a better trade. Past a few key factors, extra "confirmations" mostly justify a trade you already wanted.',
      { ul: ['Define what an A+ setup looks like in your plan and grade each trade honestly against it.', 'Many traders find that most of their profit comes from a small share of their setups. Your journal breakdowns show yours.', 'Waiting costs nothing. A day with no valid setup is a successful day.'] },
      { tip: 'Use TradeMind "By zone type" and "By session" tables to find where your results are strongest, but wait for 30+ trades per slice before acting on it.' }
    ], [
      Q('What is the risk of adding too many confirmations?', ['They can just justify a trade you already wanted', 'They always improve results', 'They reduce spread'], 0, 'It can be rationalisation, not analysis.'),
      Q('A day with no valid setup is...', ['A failure', 'A normal, disciplined day', 'A reason to lower your standards'], 1, 'Staying out is part of the edge.'),
      Q('Before acting on a slice of your data, you want...', ['At least 30 trades in it', 'Two trades', 'No data'], 0, 'Small slices mislead.')
    ]),
    L('a5', 'experienced', 'Trade management without tinkering', 8, [
      'Management is where emotion sneaks into a good plan. Decide the rules before entry.',
      { ul: ['Choose one approach per setup: fixed target, partial profits at a set level, or a rule-based trail. Write it down.', 'Moving to break-even too early turns many winners into scratches. Test it in your data rather than assuming it helps.', 'Never widen a stop. If you want more room, you should have sized smaller.'] },
      'Track "Moved stop" in the Mistake field. Many traders find it is among their most expensive habits.',
      { tip: 'If you find yourself watching every tick, your size is probably too big for your comfort.' }
    ], [
      Q('Which is safest practice?', ['Widen the stop to avoid a loss', 'Never widen a stop once set', 'Remove the stop'], 1, 'Widening only increases the loss you agreed to.'),
      Q('When should management rules be decided?', ['Before entry', 'When price is near the stop', 'After the result'], 0, 'Rules made in advance resist emotion.'),
      Q('Constantly watching every tick suggests...', ['Size may be too large for your comfort', 'You are a pro', 'Nothing'], 0, 'Reduce size until you can follow the plan calmly.')
    ]),
    L('a6', 'experienced', 'Tilt, loss streaks and cognitive biases', 10, [
      { h: 'Biases that cost traders money' },
      { ul: ['Loss aversion: a loss hurts about twice as much as an equal gain feels good, so we cut winners early and hold losers.', 'Recency bias: the last two trades feel like the new truth about your strategy.', 'Gambler\'s fallacy: "I have lost four in a row so I am due a win". Each trade is independent.', 'Overconfidence after wins: size creeps up and standards slip.', 'FOMO: entering late because price is moving without you.'] },
      { h: 'Tilt protocol' },
      { ul: ['Set the trigger in advance (for example 2 losses in a row or the daily limit).', 'When triggered, stop and leave the screen for 10+ minutes: walk, water, slow breathing.', 'Write one sentence about what happened, then review the plan, not the chart.', 'Return only if the pause shows a clear head, and be willing to finish the day.'] },
      { tip: 'TradeMind enforces this with the STOP screen and the cool-down. Choose to follow them while you are calm, not when you are upset.' }
    ], [
      Q('"I have lost four in a row so I am due a win" is...', ['Gambler\'s fallacy', 'Good statistics', 'Risk management'], 0, 'Independent trades do not owe you a win.'),
      Q('What should happen when a tilt trigger fires?', ['Pause away from the screen and review the plan', 'Trade bigger', 'Switch strategies'], 0, 'Break the emotional momentum first.'),
      Q('After a big winning streak, the common risk is...', ['Overconfidence and larger size', 'Too much caution', 'Better discipline'], 0, 'Wins can inflate confidence and loosen rules.')
    ]),
    L('a7', 'experienced', 'Process versus outcome', 7, [
      'Judge each trade on two separate questions: was the process good, and was the result good?',
      { ul: ['Good process, good result: repeat it.', 'Good process, bad result: normal variance. Do nothing differently.', 'Poor process, good result: dangerous luck. It teaches the wrong lesson.', 'Poor process, bad result: the clearest lesson. Fix the habit.'] },
      'TradeMind grades each trade A to F on process alone. Watch the "lucky wins" count on the Discipline page. Those are the trades most likely to pull you away from your plan.',
      { tip: 'Over time, your average R on A and B trades should beat your average R on poorly graded trades. If it does not, your plan, not your discipline, may need work.' }
    ], [
      Q('A trade followed every rule and lost. What now?', ['Change the strategy', 'Treat it as normal variance', 'Increase size'], 1, 'One loss with good process is expected.'),
      Q('Why is a lucky win dangerous?', ['It reinforces a poor process', 'It lowers your balance', 'It breaks the platform'], 0, 'It rewards the behaviour you should be removing.'),
      Q('Process grades should be based on...', ['Whether the trade made money', 'Rules, plan, risk and mindset', 'Trade size'], 1, 'The outcome is a separate question.')
    ]),
    L('a8', 'experienced', 'Analysing your own performance', 9, [
      { ul: ['Slice results by setup, session, instrument, day of week, mood and mistake. Look for large, consistent gaps, not tiny ones.', 'Compare followed-rules trades with rule-breaking trades. This is often the strongest finding in a journal.', 'Review drawdowns: were they driven by the strategy or by broken rules?', 'Track MAE and MFE if you can (how far price went against you and in your favour). It shows whether stops and targets fit the setup.'] },
      'Make one change per review period, write the hypothesis ("tighter stop improves R"), and test it over a new sample.',
      { warn: 'Changing three things at once makes it impossible to know what worked.' }
    ], [
      Q('What is a strong comparison to make first?', ['Rule-following trades versus rule-breaking trades', 'Monday versus Tuesday only', 'Trades on red candles'], 0, 'It separates strategy from discipline.'),
      Q('How many changes per test period?', ['One', 'Three', 'As many as possible'], 0, 'A single change is the only way to learn from it.'),
      Q('What does MAE show?', ['How far price moved against you', 'Your account equity', 'Broker fees'], 0, 'Maximum adverse excursion helps judge stop placement.')
    ]),
    L('a9', 'experienced', 'Sessions, news and volatility', 8, [
      { ul: ['Different sessions behave differently: Asia is often quieter, London and New York carry most volume, and the overlap is often the most volatile.', 'High-impact news can cause spikes, wide spreads and slippage. Decide your rule: flat before the release, or sized down.', 'Use volatility (such as ATR) to scale stops: a fixed 10-pip stop is tight on a volatile day and loose on a quiet one.'] },
      'Position size follows stop distance, so when volatility rises the stop gets wider and the lot size gets smaller. Risk in money stays the same.',
      { tip: 'Trade the session you can focus on. Being awake and alert at 3 am is not an edge.' }
    ], [
      Q('When volatility rises and stops widen, lot size should...', ['Fall, so money risk stays the same', 'Rise', 'Stay the same'], 0, 'Lot = risk $ ÷ (stop pips × pip value).'),
      Q('Before high-impact news, a sensible rule is...', ['Decide in advance: stand aside or size down', 'Ignore it', 'Double up'], 0, 'Plan it before emotion arrives.'),
      Q('What is ATR used for here?', ['Measuring typical range to size stops', 'Predicting direction', 'Counting trades'], 0, 'Average true range reflects volatility.')
    ]),
    L('a10', 'experienced', 'Scaling up and trading as a business', 8, [
      { ul: ['Grow size only after a long, consistent sample of following the plan, not after a few good weeks.', 'Plan withdrawals and keep a reserve. Money you must withdraw soon is not risk capital.', 'Track results by month in R and money, plus rule compliance. Compare against your plan, not against other people.', 'Be careful with paid "funded account" challenges. Read the rules and fees, and treat the fee as the cost of the attempt.'] },
      'Set review cadence: daily review, weekly check, monthly summary, and a quarterly look at whether the plan still fits you.',
      { warn: 'Past performance does not guarantee future results. Plan for months where nothing works.' }
    ], [
      Q('When should you increase size?', ['After a long, consistent run of following the plan', 'After a lucky week', 'After a loss'], 0, 'Scale on proven process.'),
      Q('Funded account fees are best seen as...', ['The cost of an attempt', 'Free money', 'Guaranteed returns'], 0, 'Most attempts fail, so budget the fee as a cost.'),
      Q('A healthy review cadence is...', ['Daily, weekly, monthly and quarterly', 'Never', 'Only after big losses'], 0, 'Regular reviews catch drift early.')
    ])
  ];

  const TRACKS = { beginner: 'Beginner: start here', experienced: 'Experienced: sharpen your edge' };
  const api = { LESSONS, TRACKS, get: id => LESSONS.find(l => l.id === id), track: t => LESSONS.filter(l => l.track === t) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Lessons = api;
})(typeof self !== 'undefined' ? self : this);
