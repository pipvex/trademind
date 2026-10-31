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
| Screenshots | Screenshots (BEFORE / AFTER per trade + lesson) |
| Daily Review | Daily Review |
| Weekly Check | Weekly Check |
| Dashboard | Dashboard (stats, today status, equity curve, breakdowns) |

## Setup (about 10 minutes, once)
1. Create a free project at https://supabase.com.
2. **SQL Editor -> New query**, paste all of `supabase/schema.sql`, press **Run**. (Creates the private data table, security rules and the private `trade-media` screenshot bucket.)
3. **Project Settings -> API**: copy the *Project URL* and the *anon public* key into `config.js`. Never use the `service_role` key.
4. **Authentication -> URL Configuration**: set *Site URL* to your published web address (needed for password-reset and confirmation emails). Optional: **Authentication -> Providers -> Email -> turn off "Confirm email"** so new users can start immediately.
5. Upload this whole folder to a GitHub repository, then **Settings -> Pages -> Deploy from branch (main, / root)**.
6. Open the link, create your account, and use **Install app / Add to Home screen** on your phone.

## How accounts and sync work
- Everyone creates their own account (email + password). Row Level Security means a user can only ever read or change their own rows.
- Data is saved on the device first (works offline) and **syncs automatically**: after every change, when the app is opened or refocused, when the connection returns, and every minute. No sync button needed (there is a "Sync now" button in Settings).
- Log in on any other device with the same email and password and everything appears: trades, plan, settings, reviews and screenshots.
- Logging out clears the local copy from that device (after syncing), so shared devices stay private.
- If two devices edit the same entry, the most recent edit wins.

## Notes
- Screenshots are compressed (max 1600px) and stored in private cloud storage. The free Supabase plan includes 1 GB.
- Google Drive upload from the old version was replaced by this built-in storage (no per-user Google setup).
- Pip value per lot is an approximation; check your broker's contract specs.
- The app is a journaling tool, not financial advice or a broker platform.
