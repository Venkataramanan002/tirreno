<img width="1577" height="860" alt="Screenshot 2025-12-06 at 4 02 16 PM" src="https://github.com/user-attachments/assets/5d03e29b-0b36-4948-a398-d415e5fadb59" /># Email Threat Analysis – Project Overview


A client-side web app for multi-account Gmail security insights. It authenticates with Google OAuth, caches data locally, and visualizes threat, behavior, and settings insights across tabs.

## Goals
- Help users inspect Gmail-related security signals (spam/suspicious domains, forwarding, delegated accounts).
- Provide risk-oriented views (threat detection, security events, user behavior, scenario analysis).
- Support multiple Google accounts with easy switching, entirely client-side persistence.

## Tech Stack
- Frontend: React + TypeScript, Tailwind-style classes, lucide-react icons.
- Auth: Google OAuth 2.0 via Supabase client SDK (client-side flow).
- Persistence: Browser `localStorage` for accounts, active account, and cached Google/Gmail data.
- UI components: Shadcn-style dropdowns, buttons, tabs.

## Key Flows
1. **Login**: Google OAuth → profile (name/email/picture) saved to `localStorage.accounts`; current account saved to `localStorage.activeAccount`.
2. **Account switching**: Accounts dropdown uses Google’s `select_account` prompt to pick/switch; active account updated in localStorage.
3. **Add account**: Forces Google account picker; new account stored locally.
4. **Refresh**: Refresh button reloads data for the active account.
5. **Page reload**: `initializeFromOAuthProfile()` rebuilds state from localStorage to stay consistent after refresh.

<img width="393" height="192" alt="Screenshot 2025-12-08 at 6 57 17 PM" src="https://github.com/user-attachments/assets/dffba8c2-3337-4485-85f7-67d0235b47c6" />

## LocalStorage Keys
- `accounts`: `[{ name, email, profileImgUrl }]`
- `activeAccount`: `{ name, email, profileImgUrl }`
- `oauth_profile`: basic Google profile
- `gmail_metadata`: mailbox stats (counts, suspicious domains, senders)
- `gmail_settings`: forwarding, delegated accounts, POP/IMAP, etc.
- `gmail_messag<img width="393" height="192" alt="Screenshot 2025-12-08 at 6 57 17 PM" src="https://github.com/user-attachments/assets/e8ccc3c4-2b25-49d6-a4a1-d75e85dc88e4" />
es`, `google_real_data`: cached Gmail/profile data for components

## UI Tabs & Data Shown
- **Dashboard**: High-level metrics, risk summary.
- **Threat Detection**: Suspicious domains, spam counts, forwarding/delegation, IP/ISP/Proxy/VPN/Tor signals.
- **Security Events**: Events derived from Gmail data (forwarding enabled, delegated accounts, spam thresholds).
- **User Behavior**: Profile + device/location context; some charts are simulated.
- **Security Scenario Analysis**: Scenario-based insights (mixed real/calculated).
- **Data Validation Report**: Profile, settings, IP/location; real Gmail/Google profile data surfaced.
- **User Management**: Profile snapshot, risk-derived metrics (some metrics simulated).

## Real vs Calculated vs Fake (Highlights)
- **Real (fetched)**: Google profile (name/email/picture/locale/email verified), Gmail metadata (inbox/spam/unread, suspicious domains, unique senders, labels), Gmail settings (forwarding, delegated accounts, POP/IMAP, auto-reply), IP and geolocation (IPify + IPInfo/IPAPI), network detection (proxy/VPN/Tor), device info (navigator).
- **Calculated (from real inputs)**: Risk score, threat counts, timelines, risk distributions, flagged activities.
- **Simulated/Fake (placeholders)**: Active users count, some session/behavior metrics, fallback events or timelines when no real data is available. Labels that claim “live”/“real” may in places be algorithmic/simulated.

## Multi-Account System (Accounts Button)
- Dropdown in the header.
- Lists all stored accounts; highlights the active one with a checkmark.
- Clicking an account triggers OAuth with `select_account` to switch.
- “Add account” forces account picker to add another login.
- Entirely backed by localStorage; survives page refreshes.

## Important Files
- `src/services/localAccountService.ts`: LocalStorage CRUD for accounts and active account; UI update events.
- `src/services/oauthService.ts`: Google OAuth triggers with `select_account`; stores accounts from OAuth callback.
- `src/components/AccountSwitcher.tsx`: Dropdown UI, click-outside handling, active highlighting, localStorage-powered.
- `src/pages/OAuthCallback.tsx`: After OAuth, caches Google/Gmail data and stores the account locally.
- `src/pages/Index.tsx`: Main dashboard; initializes accounts on load.
- Other feature components: `Dashboard.tsx`, `ThreatDetection.tsx`, `SecurityEvents.tsx`, `UserBehavior.tsx`, `SecurityScenarioAnalysis.tsx`, `DataValidationReport.tsx`, `UserManagement.tsx`.

## Privacy & Scope
- Account data and cached Gmail/profile data stay in the browser (localStorage).
- OAuth uses Google’s official flow with `select_account` when switching/adding.

## How Data Is Obtained
- Google OAuth → access token → Google People/Gmail APIs → cached in localStorage keys listed above.
- IP/location/network → IPify + IPInfo/IPAPI.
- Device info → browser navigator APIs.

## Known Simulations
- Some counts and timelines (active users, certain session metrics, generated threat timelines) are simulated for demo purposes; risk scores and derived counts are calculated from real inputs.
