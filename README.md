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
| Dashboard | Dashboard (stats, today status, equity curve, breakdowns) |

## New: emotions, recordings and daily life
- **Emotional check before AND after every trade.** On the trade form, *How I feel* (mood + strength 1-5 + what is driving it) is filled in **before** you enter; *How I feel now* is filled in once the trade is closed. Both are required (the after-check only once there is an exit price). Risky feelings (FOMO, revenge, tired...) show a warning before you enter.
- **Coach reads your feelings.** It compares mood before and after, finds "tilt" (how the next trade goes after a loss that left you angry), compares strong vs faint feelings, and compares trading results with your sleep, stress and mood from the Life Journal.
- **Screen recordings and voice notes** on every trade, stored in **either**:
  - **Cloud (Supabase)** - syncs automatically to all your devices. Default limit **50 MB per file** (free Supabase plan; 1 GB in total). Change the limit in Settings if you upgrade.
  - **Your own Google Drive** - for long or large recordings. Files go into a `TradeMind` folder in *your* Drive and play back on any device where you connect Drive.
  You choose per recording (and set your usual choice in Settings). An oversized or failing file never blocks the rest of your sync - it is flagged on its own, with a Retry button.
- Phone screen recorders make big files: 1 minute is roughly 10-30 MB. Keep clips short for the cloud option, or use Drive.

## Setup (about 10 minutes, once)
1. Create a free project at https://supabase.com.
2. **SQL Editor -> New query**, paste all of `supabase/schema.sql`, press **Run**. (Creates the private data table, security rules and the private `trade-media` screenshot bucket.)
3. **Project Settings -> API**: copy the *Project URL* and the *anon public* key into `config.js`. Never use the `service_role` key.
4. **Authentication -> URL Configuration**: set *Site URL* to your published web address (needed for password-reset and confirmation emails). Optional: **Authentication -> Providers -> Email -> turn off "Confirm email"** so new users can start immediately.
5. Upload this whole folder to a GitHub repository, then **Settings -> Pages -> Deploy from branch (main, / root)**.
6. Open the link, create your account, and use **Install app / Add to Home screen** on your phone.

### Google Drive setup (only if you want the Drive option; each trader does this once)
1. Go to https://console.cloud.google.com, create a project, then **APIs & Services -> Library -> Google Drive API -> Enable**.
2. **APIs & Services -> OAuth consent screen**: choose *External*, fill in the app name and your email, and add yourself under *Test users* (while the app is in Testing mode, only listed test users can connect).
3. **Credentials -> Create credentials -> OAuth client ID -> Web application**. Under *Authorised JavaScript origins* add your site address exactly (e.g. `https://yourname.github.io`). No redirect URI is needed.
4. Copy the **Client ID** into TradeMind -> **Settings -> Screen recordings & voice notes -> Google Drive**, press **Save ID**, then **Connect Google Drive**.
- TradeMind asks only for the narrow `drive.file` permission, so it can see **only the files it created itself**, never the rest of your Drive.
- Google sign-in lasts about an hour. If an upload or playback says Drive is not connected, tap **Connect Google Drive** again.
- Removing a recording in TradeMind also deletes it from Drive when Drive is connected at that moment.

### Google verification (only needed if you publish the Drive option to everyone)
1. Put your real email in `privacy.html` and `terms.html` (replace `REPLACE-WITH-YOUR-EMAIL@example.com`). Publish to GitHub.
2. In Google Search Console (same Google account that owns the Cloud project) add a **URL prefix** property `https://YOURNAME.github.io/trademind/`, choose **HTML file** verification, upload the file Google gives you to the repository root, then press **Verify**.
3. In Google Cloud -> Google Auth Platform -> Branding use: home page `https://YOURNAME.github.io/trademind/`, privacy `.../privacy.html`, terms `.../terms.html`, authorised domain `YOURNAME.github.io`. Wait 24 hours after verifying, then choose **I have fixed the issues**.
The `drive.file` permission is non-sensitive, so no security assessment is required.

## How accounts and sync work
- Everyone creates their own account (email + password). Row Level Security means a user can only ever read or change their own rows.
- Data is saved on the device first (works offline) and **syncs automatically**: after every change, when the app is opened or refocused, when the connection returns, and every minute. No sync button needed (there is a "Sync now" button in Settings).
- Log in on any other device with the same email and password and everything appears: trades, plan, settings, reviews and screenshots.
- Logging out clears the local copy from that device (after syncing), so shared devices stay private.
- If two devices edit the same entry, the most recent edit wins.

## Notes
- Screenshots are compressed (max 1600px) and stored in private cloud storage. The free Supabase plan includes 1 GB (shared with cloud recordings).
- Recordings are kept on the device that made them until uploaded; use **Free local copy** on a recording to reclaim phone storage once it is safely in the cloud or Drive.
- Recordings are not part of the JSON backup (they live in cloud storage / Drive).
- Google Drive is now **optional** (per recording) and uses each trader's own Drive - see "Google Drive setup" above.
- Pip value per lot is an approximation; check your broker's contract specs.
- The app is a journaling tool, not financial advice or a broker platform.

## Files
`index.html`, `privacy.html`, `terms.html`, `styles.css`, `config.js`, `calc.js` (calculations and coach), `store.js` (storage + sync), `drive.js` (Google Drive), `views.js` (pages), `app.js` (login, routing), `sw.js` (offline), `manifest.webmanifest`, `assets/icon.svg`, `vendor/supabase.js`, `supabase/schema.sql`.
The database does **not** change for this update - re-running `schema.sql` is not required.
