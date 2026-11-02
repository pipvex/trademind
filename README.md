# TradeMind

A private trading journal that works like your Excel journal, with a login for every trader so their data follows them to any phone or computer.

## What's inside (mirrors the Excel workbook)
| Excel sheet | TradeMind page |
|---|---|
| Settings | Settings & Account (balance, risk %, min R:R, daily loss %, max trades, instruments with pip size/value) |
| Strategy Rules | **My Trading Plan** - each trader writes their own strategies and rules (MUST / good). A clearly-labelled SAMPLE is shown as an example only. No built-in strategy. |
| Checklist | Checklist (Yes/No per rule -> GO / NO TRADE) |
| Daily Check | Daily Check (editable questions, READY / NOT READY) |
| Trade Log | Trade Log - risk pips, reward pips, planned R:R, R:R vs min, risk $, lot size, R, net P/L, outcome, balance, drawdown, order check, spread % are calculated automatically |
| Screenshots | Screenshots & Recordings (BEFORE / AFTER pictures, **screen recordings and voice notes**, lesson) |
| Daily Review | Daily Review |
| *(new)* | **Emotion Check-ins** - quick notes before / during / after trading, optionally tied to a trade |
| *(new)* | **Life Journal** - private daily diary: mood, sleep, energy, stress, exercise, best moment, what drained you |
| Weekly Check | Weekly Check |
| *(new)* | **Mentor** - guided lessons, one at a time, for beginners and experienced traders, tied to your own journal numbers, plus an **AI chat** that answers questions using your stats |
| Dashboard | Dashboard (stats, today status, equity curve, breakdowns) |

## New: emotions, recordings and daily life
- **Emotional check before AND after every trade.** On the trade form, *How I feel* (mood + strength 1-5 + what is driving it) is filled in **before** you enter; *How I feel now* is filled in once the trade is closed. Both are required (the after-check only once there is an exit price). Risky feelings (FOMO, revenge, tired...) show a warning before you enter.
- **Coach reads your feelings.** It compares mood before and after, finds "tilt" (how the next trade goes after a loss that left you angry), compares strong vs faint feelings, and compares trading results with your sleep, stress and mood from the Life Journal.
- **Screen recordings and voice notes** on every trade, stored in your private **cloud (Supabase)** storage - it syncs automatically to all your devices. Default limit **50 MB per file** (free Supabase plan; 1 GB in total). Change the limit in Settings if you upgrade.
  An oversized or failing file never blocks the rest of your sync - it is flagged on its own, with a Retry button.
- Phone screen recorders make big files: 1 minute is roughly 10-30 MB. Keep clips short.

## Setup (about 10 minutes, once)
1. Create a free project at https://supabase.com.
2. **SQL Editor -> New query**, paste all of `supabase/schema.sql`, press **Run**. (Creates the private data table, security rules and the private `trade-media` screenshot bucket.)
3. **Project Settings -> API**: copy the *Project URL* and the *anon public* key into `config.js`. Never use the `service_role` key.
4. **Authentication -> URL Configuration**: set *Site URL* to your published web address (needed for password-reset and confirmation emails). Optional: **Authentication -> Providers -> Email -> turn off "Confirm email"** so new users can start immediately.
5. Upload this whole folder to a GitHub repository, then **Settings -> Pages -> Deploy from branch (main, / root)**.
6. Open the link, create your account, and use **Install app / Add to Home screen** on your phone.

## Process grades and the weekly Stop / Keep / Start
- Every trade gets an automatic **process grade** (A / B / C) from HOW you traded: followed rules, no mistake, planned R:R above your minimum, checklist GO, calm mood. It ignores whether the trade won. The Coach then shows **A-grade losses** (normal variance, do not change the plan) and **C-grade wins** (luck, do not repeat), and the Dashboard shows results by grade.
- The **Weekly Check** now opens with a Stop / Keep / Start list built from that week's numbers. One tap copies the top "Stop" into "ONE thing to change next week".

## Process streaks and today's focus
- The Dashboard shows **process streaks**: clean trading days (every trade followed your rules and has both emotion checks), emotion checks completed in a row, Daily Check days and Daily Review days. A day you have not finished yet does not break a streak. Nothing here counts profit.
- The Mentor page opens with **Today's focus**: the one most useful thing to do now (stop for the day, cool down after an upsetting loss, do the Daily Check, finish missing emotion checks, or your top Coach action).

## Protecting you from yourself: the pre-trade pause
When you log a **new trade dated today**, TradeMind checks your state before it lets you save:
- **30-second pause** if you chose a risky feeling (FOMO, frustrated, revenge, overconfident, tired), you are coming off a loss that left you upset (or two losses in a row), the checklist said NO GO, or today's Daily Check says NOT READY. You breathe, then confirm you re-read your plan.
- **Hard stop** if you hit your daily loss limit or max trades. You can still save only by ticking that you are breaking your own rule; the trade is flagged and the Coach reports how those trades performed.
Back-filling past dates is never blocked.

## Optional: turn on the AI Mentor chat (about 10 minutes)
The lessons work without this. The chat needs a server step so your AI key is never exposed in the browser.
1. Re-run `supabase/schema.sql` in the SQL Editor (it adds a small daily-usage table; existing data is untouched).
2. Get an API key at https://console.anthropic.com.
3. Install the Supabase CLI, then in this folder: `supabase login`, `supabase link --project-ref YOUR-PROJECT-ID`.
4. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` (optional: `MENTOR_DAILY_LIMIT=30` questions per user per day, `MENTOR_MODEL=claude-sonnet-5-5`).
5. `supabase functions deploy mentor-chat` (keep JWT verification on, which is the default).
Each question costs a small amount of API credit; the daily limit protects your bill. The privacy policy already describes this.

## How accounts and sync work
- Everyone creates their own account (email + password). Row Level Security means a user can only ever read or change their own rows.
- Data is saved on the device first (works offline) and **syncs automatically**: after every change, when the app is opened or refocused, when the connection returns, and every minute. No sync button needed (there is a "Sync now" button in Settings).
- Log in on any other device with the same email and password and everything appears: trades, plan, settings, reviews and screenshots.
- Logging out clears the local copy from that device (after syncing), so shared devices stay private.
- If two devices edit the same entry, the most recent edit wins.

## Notes
- Screenshots are compressed (max 1600px) and stored in private cloud storage. The free Supabase plan includes 1 GB (shared with cloud recordings).
- Recordings are kept on the device that made them until uploaded; use **Free local copy** on a recording to reclaim phone storage once it is safely in the cloud.
- Recordings are not part of the JSON backup (they live in cloud storage).
- Pip value per lot is an approximation; check your broker's contract specs.
- The app is a journaling tool, not financial advice or a broker platform.

## Files
`index.html`, `privacy.html`, `terms.html`, `styles.css`, `config.js`, `calc.js` (calculations and coach), `store.js` (storage + sync), `views.js` (pages), `mentor.js` (Mentor lessons), `app.js` (login, routing), `sw.js` (offline), `manifest.webmanifest`, `assets/icon.svg`, `vendor/supabase.js`, `supabase/schema.sql`, `supabase/functions/mentor-chat/index.ts`.
The AI chat adds one small table: re-run `schema.sql` once if you turn it on.
