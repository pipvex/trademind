# TradeMind

A local-first trading journal PWA with personal trading plans, trade evidence, psychology tracking, analytics, risk tools and private account sync.

## What's included
- Dashboard, trade journal, emotion journal, life journal, risk calculator, weekly review and rule-based free coach.
- **My trading plan:** every trader defines their own setup, entry, exit, risk and no-trade rules. The example shown in the app is illustrative only. No fixed strategy or Method B is imposed.
- A trade checklist generated from the user's own setup and entry rules.
- Offline-first local storage with manual account sync.
- Supabase email/password accounts and row-level security (RLS) for separate user records.
- Google Drive media upload integration for screenshots and recordings (requires each user to connect their own Google account).

## Publish as an installable app
1. Upload the contents of this `trademind` folder to the root of a GitHub repository.
2. In GitHub, open **Settings → Pages** and publish the `main` branch from `/ (root)`.
3. Open the resulting HTTPS URL in Chrome and choose **Install app** / **Add to Home screen**.

## Configure private accounts and cross-device journal sync
1. Create a Supabase project.
2. Open **SQL Editor** and run the complete `supabase/schema.sql` file.
3. In **Project Settings → API**, copy the Project URL and anon/publishable key.
4. Open TradeMind → **Settings & sync**, paste the URL and anon key.
5. Create an account using email and password. Confirm the email if Supabase email confirmation is enabled.
6. Sign in and press **Sync / restore my account data**. On another device, open the same deployed site, enter the same Supabase URL/key, sign in with the same email/password, then sync. Journal entries and the personal trading plan are pulled from that account.

The database uses Row Level Security policies tied to `auth.uid()`. Each account can read and write only its own records. Never publish a Supabase service-role key. The browser anon/publishable key is expected to be public when RLS is correctly enabled.

### Important account behaviour
- The first account to sync on a browser claims that browser's existing local journal. If a different account signs in on that same browser later, the local cache is cleared before that account's cloud data is downloaded, to prevent cross-account mixing.
- Use the same account on all devices. Sync after recording trades and when switching devices; this build does not yet perform continuous background or real-time sync.
- Do not use multiple devices offline and then sync conflicting edits to the same record; conflict resolution is based on record timestamps.

## Media and Google Drive
Google Drive media upload is separate from Supabase journal sync. Configure a Google OAuth Web Client ID, enable the Google Drive API, authorise the exact deployed HTTPS origin, then connect Drive in Settings and upload pending files. Each user should connect their own Drive. The current Drive integration uploads local evidence but does not automatically download media onto a second device; cloud journal rows and the personal trading plan do sync cross-device.

## Free coach
The included coach uses transparent local statistics and rules. It does not call a paid AI API and does not automatically interpret uploaded video. No subscription or paid AI API is required for core journaling.

## Privacy and operational notes
- Keep the Supabase project URL and anon key in app settings; never place service-role credentials in browser code.
- Use HTTPS hosting (GitHub Pages provides this) for service worker installation and Google OAuth.
- Back up important data periodically. This is a starter application, not a regulated financial service or broker execution platform.
