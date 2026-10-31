# TradeMind — personal trading journal PWA

A mobile-first, installable web app starter for trade logging, emotional journaling, Method B checklists, weekly reviews, risk calculations and a free rule-based trading coach.

## Included now

- Responsive dashboard and navigation
- Trade logging with Forex instruments, execution notes, outcomes and Method B checklist
- Emotional check-ins before / after trades
- Screenshot, audio and video file attachment to local IndexedDB
- Local-first journaling and service-worker app-shell caching
- Free deterministic coach (no paid AI API, no subscription)
- Weekly review and basic analytics
- Risk position-size estimate (requires broker-specific pip/point value)
- Daily life journal
- CSV export and JSON backup / restore
- Supabase email/password auth integration scaffold, private database schema and private cloud media upload flow

## Important implementation boundaries

1. **Cloud is not live until configured.** Create your own Supabase project, apply `supabase/schema.sql`, create a private Storage bucket called `trade-media`, and enter the project URL and anon/publishable key in Settings. Never put a service-role key in browser code.
2. The browser-side Supabase integration uses the Supabase JS CDN. Local journaling works without Supabase. For fully offline-first cloud sync, production work should add a durable sync queue, retry/backoff, deletion tombstones and conflict resolution.
3. The current sync uploads the current local records and media to Supabase; it does not yet download/merge cloud records into a new device. Treat this as a development starter, not a production multi-device sync implementation.
4. Large videos can exceed browser IndexedDB quota. The current local attachment flow is best for small/medium files. Cloud upload happens when the user presses Sync after signing in. Production should add resumable/chunked uploads, file-size validation, compression and storage quota controls.
5. The coach is intentionally transparent and rule-based. It calculates from the user's own saved fields; it does not claim to watch videos, inspect chart screenshots, predict prices or prove that emotions caused losses. It is not a generative LLM.
6. Weekly metrics are descriptive and should not be interpreted as a promise of future returns. Position sizing requires correct broker contract and pip/point values.

## Run locally

Use a local static server (service workers generally require localhost or HTTPS):

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.

## Install on Android

1. Deploy the folder to an HTTPS static host (for example, a static hosting provider).
2. Open the site in Chrome on your Samsung Galaxy A06.
3. Open Chrome menu → **Add to Home screen** or **Install app**.
4. Launch TradeMind from the home screen.

## Supabase setup

1. Create a Supabase project.
2. In SQL Editor, run `supabase/schema.sql`.
3. Create a **private** Storage bucket named `trade-media`.
4. Enable email/password authentication. Configure email confirmation and password reset in Supabase Auth.
5. Copy the Project URL and anon/publishable key from Project Settings → API.
6. Enter them in TradeMind → Settings & sync.
7. Create an account, sign in, then use **Sync journal to cloud**.

Do not disable Row Level Security. Do not expose a service-role key. Review Supabase free-plan limits, retention and backup policies before storing valuable records.

## Suggested production hardening

- Implement true bidirectional offline sync with an IndexedDB outbox and per-record sync state.
- Use resumable uploads for long screen recordings.
- Add signed, time-limited media URLs and private media playback.
- Add pagination, deletion propagation and conflict handling.
- Add account deletion, export and password-reset flows.
- Add automated tests for calculations, privacy rules and sync.
- Consider a native Android wrapper only if browser PWA capabilities are insufficient.

## Google Drive media storage (added)

TradeMind can upload trade screenshots, screen recordings and voice notes to a `TradeMind` folder in the Google account you authorise. Media uploads use the Google Drive API resumable-upload endpoint. The Google OAuth access token is kept in memory for the current page session; it is not saved in IndexedDB. The app requests the narrow `drive.file` scope, which allows it to create and manage files created/opened by this app rather than reading the user's entire Drive.

Setup:
1. Open Google Cloud Console and create/select a project.
2. Enable **Google Drive API**.
3. Configure the OAuth consent screen (for personal testing, add your Google account as a test user if the app is in Testing mode).
4. Create an **OAuth 2.0 Client ID** of type **Web application**.
5. Add the exact deployed HTTPS website origin to **Authorised JavaScript origins** (for local testing, add `http://localhost:8000`). Do not add a path.
6. Copy the Client ID into TradeMind → Settings & sync → Google Drive.
7. Press **Connect Google Drive**, complete Google's consent flow, then press **Upload pending media**.

Google Drive storage is not unlimited: a standard personal Google account generally has 15 GB shared across Drive, Gmail and Google Photos. Google may require OAuth verification for broader/public distribution. Never share your OAuth client secret; browser apps use the client ID only. This integration has not been connected to your Google account by the developer and requires your own consent and OAuth configuration.

Supabase remains the optional private email/password account and journal-record database. Google Drive is used for media files. The current starter does not yet download/merge cloud records to a second device automatically; local journaling remains available offline and uploads resume when you reconnect and retry.
