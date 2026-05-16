# MultiUploads — Project Context & Handoff

> **Purpose of this doc:** Single source of truth so any AI assistant (or human) can pick up exactly where we left off without re-discovering the project. Read this top-to-bottom before doing anything.
>
> **Last updated:** 2026-05-14 by GitHub Copilot (working with owner Rehan)

---

## 0. The 30-second pitch

**MultiUploads** is a SaaS for Indian content creators: upload one video → it gets distributed to YouTube, Instagram, TikTok, Facebook, X, and LinkedIn with per-platform metadata. Pricing in ₹. Target: first 200 paying users.

Tech: Next.js 16 App Router (Turbopack), MongoDB Atlas, NextAuth (Credentials + Google), all custom CSS (no Tailwind utilities in components), JWT sessions, Mongoose 9.

---

## 0.1 The problem we're solving

Indian video creators (especially short-form: Reels / Shorts / TikTok-style) routinely re-upload the same video 4–6 times — once per platform — because every platform demands different aspect ratios, captions, hashtags, descriptions, and metadata. Existing tools either:
- target text/image scheduling (Buffer, Hootsuite — priced in $, ignore video specifics), or
- target US/EU markets at $30+/mo (Repurpose.io, Hypefury — unaffordable for Indian creators just starting out).

**The biggest gap we exploit:** a video-first, rúpee-priced, India-friendly tool that handles the upload + per-platform metadata in one click. Free tier so creators can actually start. Paid tiers at the price of a chai-per-day (₹49/mo) up to a full-time creator plan (₹249/mo).

## 0.2 Goals

### Long-term vision (12–18 months)
- Become the default "upload once, post everywhere" tool for Indian creators (10k+ active users).
- Expand from upload-only into the adjacent workflows: AI smart clipping (long video → shorts), unified analytics, comment/DM aggregation.
- Add a creator marketplace tier: brand collaborations, sponsored content management.
- International expansion only after India PMF — don't dilute the Indian-creator focus early.

### Short-term goals (next 4–8 weeks)
1. **Get to a working v1 we can put in front of creators.** Real auth, real file upload, real YouTube distribution at minimum. Other platforms can be "coming soon" badges.
2. **First 200 waitlist conversions.** Already collecting waitlist emails on the landing page — currently no follow-up flow exists.
3. **First 10 paying users at ₹49/mo.** Validates pricing + willingness to pay.
4. **Zero security incidents.** No leaked passwords, no spam signups, no unverified-email abuse.

### Right-now goal (this work block)
Make the auth surface trustworthy: real password strength, email verification, gate uploads behind verified email. (See §6 — Active Plan.)

### Owner's personal future use (context only — NOT a feature of this product)
Owner plans to *separately* use MultiUploads (as an end-user, with a personal account) to power a YouTube automation passive-income workflow. **This is NOT a product feature** — we don't build "automation pipelines" into the SaaS for this reason. The product stays a clean upload-distribution tool for all creators; owner's personal automation will live in a separate repo and call MultiUploads as just another user. Keep this in mind when designing APIs (they should be usable programmatically by an external script via the same auth surface a normal user gets), but **do not add automation-specific features** unless explicitly requested.

## 0.3 Pricing (live on landing page)

| Plan | Price | Limit | Platforms | Notable |
|---|---|---|---|---|
| Free | ₹0 | 2 videos/week | YouTube + Facebook | No card, no watermark, forever |
| Lite | ₹49/mo | 5 videos/week | + Instagram | AI metadata |
| Growth | ₹99/mo | 12 videos/week | All platforms | AI metadata + captions, unified analytics. **Marketed as most popular.** |
| Pro | ₹249/mo | Unlimited | All platforms | AI smart clips, advanced analytics, 1-on-1 support |

## 0.4 Competitive positioning (from landing-page FAQ)

- **vs Buffer/Hootsuite:** they schedule text/image posts; we actually process video (format detection, resolution conversion, platform-specific encoding + metadata). Built for video creators, not social media managers.
- **vs Repurpose.io / OneUp:** we're ₹-priced, India-first, free forever tier. They start at $20–$30/mo.
- **vs manual cross-posting:** that's the real competitor today — 90% of creators just do it by hand. Our pitch is "save 4 hours per video."

---

## 1. How to read this document

| Section | Read when |
|---|---|
| §0.1–0.4 Vision/problem/goals/pricing | First time onboarding — understand WHY before HOW. |
| §2 Engineering Rules | Always. Non-negotiable owner preferences. |
| §3 Stack & repo layout | First time onboarding. |
| §4 What exists today | Before implementing anything — don't rebuild what's there. |
| §5 Project history (pre-AI + AI sessions) | To understand WHEN/WHY each piece was built. |
| §6 Active plan (auth hardening) | To pick up the in-progress work. |
| §7 Hardening roadmap (post-auth) | After §6 ships, this is the next backlog. |
| §8 Known gaps & landmines | Before touching any related area. |
| §9 Setup / env / commands | First-time setup or after pulling. |
| §10 Credentials index | When something fails auth. |
| §11 Resume-with-any-AI prompt | When swapping AI assistants. |
| §12 Logging discipline | How this doc stays current. |
| §13 Changelog | What changed when. |

---

## 2. Engineering rules (owner: Rehan)

These come from `/memories/engineering-style.md` — every AI working on this repo must follow them.

1. **No assumptions.** If unsure, STOP and ASK. Don't infer "it probably works like X". Verify in the codebase or ask the owner.
2. **No silent fallbacks.** Things should break loudly. Fallbacks hide bugs and are forbidden unless owner explicitly approves one.
3. **No "find-and-iterate" / `findObjectsOfType` brute force.** Cache references, register event listeners. O(1) lookups preferred.
4. **No per-frame loops, no polling.** Event-based only. Consider time + space complexity for every line.
5. **Async by default.** Anything that *can* run async *must* run async. Delay is acceptable, frame drops / blocked event loops are not.
6. **Slice-based workflow** for any non-trivial task:
   - Break into named slices in `Documentation/Planning/<feature>.md` (NOT short summaries — exhaustive plans with rationale per slice).
   - Show plan → wait for explicit approval → implement ONE slice → ask user to test → wait for explicit confirmation ("yes" / "works" / "looks good"; silence ≠ confirmation; "it compiles" ≠ confirmation) → `git add -A && git commit -m "<summary>"` → next slice.
   - When done, move folder to `Documentation/Planning/Bin/` (don't delete) and write a system doc to `Documentation/Context/<system>/` matching existing README style.
7. **Git discipline:** every response containing code/file changes ends with a commit run via terminal. Don't just remind the user.
8. **KISS + SOLID.** Suggest simpler alternatives if you see one — don't blindly implement worse approaches the owner asked for. Confirm design before coding.
9. **Future-proof event hooks.** Make `onLoad`, `onUnload` etc. even when not currently consumed.
10. **Communication:** Ask clarifying questions aggressively when intent is unclear. Don't guess.

**Styling rule (project-specific):** All UI is in `app/globals.css` classes + inline `style={{}}` props. Tailwind v4 is loaded but **only** for resets / `@theme`. **DO NOT refactor components to Tailwind utilities.**

**Next.js version warning:** This is Next 16.2.3. APIs, conventions, and file structure have breaking changes vs older Next. Always check `node_modules/next/dist/docs/` before writing code. Heed deprecation notices. (From `AGENTS.md`.)

---

## 3. Stack & repo layout

### Stack
- **Next.js 16.2.3** (App Router, Turbopack)
- **React 19.2.4**
- **NextAuth v4.24** — JWT sessions, 30-day. JWT callback re-syncs user from DB on every refresh, so plan/role changes propagate without re-login.
- **MongoDB Atlas** via **Mongoose 9** (`lib/db.js` caches connection on `global.mongoose`, forces DNS to 8.8.8.8 for SRV records)
- **bcryptjs** (cost 12)
- **Tailwind v4** — reset + theme tokens only. No utility classes in components.
- jsconfig path alias `@/*` → repo root (most files use relative imports though)

### Repo structure
```
MultiUploads/
├── AGENTS.md                  # "Next.js has breaking changes" warning
├── CLAUDE.md                  # @AGENTS.md (alias)
├── README.md
├── package.json               # deps: next, react, mongoose, next-auth, bcryptjs
├── next.config.mjs
├── jsconfig.json              # @/* alias
├── eslint.config.mjs
├── postcss.config.mjs
├── proxy.js                   # ⚠️ NOT a middleware.js — likely inactive
├── client_secret.json         # ⚠️ Google OAuth download (gitignored now)
├── .env.local                 # ⚠️ secrets (gitignored)
├── .gitignore
├── Documentation/
│   ├── Planning/              # active plans
│   │   └── auth-hardening.md  # CURRENT WORK
│   └── Context/               # finished system docs (none yet)
├── app/
│   ├── layout.js              # Geist fonts + SessionProvider + script that strips browser-extension hydration noise
│   ├── globals.css            # design tokens + ALL component classes
│   ├── page.js                # landing (~700 lines)
│   ├── login/page.js
│   ├── signup/page.js
│   ├── dashboard/page.js      # ~1500 lines — protected client-side
│   ├── admin/page.js          # admin-only (role==='admin')
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.js
│       │   └── signup/route.js
│       ├── waitlist/route.js
│       ├── videos/
│       │   ├── route.js       # GET list, POST create
│       │   └── [id]/route.js  # PATCH, DELETE
│       ├── admin/
│       │   ├── data/route.js
│       │   ├── update-user/route.js
│       │   └── delete-user/route.js
│       └── seed/route.js      # dev-only; wipes & seeds Users+Videos
├── components/
│   └── SessionProvider.js
├── lib/
│   ├── db.js                  # cached mongoose connect
│   ├── auth.js                # authOptions; jwt re-syncs from DB; signIn auto-creates Google users
│   └── dashboard-data.js      # PLATFORM_ORDER, THUMB_BY_CATEGORY, normalizeTags, buildPlatformPayload, serializeConnectedAccounts, serializeVideo
├── models/
│   ├── User.js                # name, email, password (select:false), image, provider, plan, role, connectedPlatforms, videosUploaded, lastLogin
│   ├── Video.js               # userId ref, title, desc, tags, status, visibility, category, language, file*, thumb, duration (string "12:34"), platforms{<p>:PlatformStatusSchema}, allowComments, ageRestricted, license
│   └── WaitlistEntry.js       # email unique, status, source, metadata, invitedAt, convertedAt
└── public/
```

---

## 4. What exists today (feature inventory)

### ✅ Working
- Landing page (`/`) — hero, dashboard mockup, platform pills, animated stats, flow diagram, problem cards, features grid, testimonials, pricing (₹), waitlist email capture (real → DB), FAQ, footer.
- Signup (`/signup`) — name + email + password + (placeholder) password strength meter. Auto sign-in after signup.
- Login (`/login`) — credentials + Google (Google button only renders if `getProviders()` returns google).
- Dashboard (`/dashboard`) — tabs:
  - **My Videos** — lists user's videos from `/api/videos`, filter by status, click to edit
  - **Upload** — multi-step form (file → details → platforms → review). ⚠️ saves metadata only, no real file storage
  - **Editor** — per-platform metadata override (title/desc/tags/visibility per platform)
  - **Analytics** — placeholder UI
  - **AI Clips** — "Coming soon"
  - **Accounts** — list of connected platforms (read-only currently; no real OAuth flows wired)
  - **Settings** — placeholder Save/Cancel/Delete buttons (all disabled)
- Admin (`/admin`) — role-gated. Tabs:
  - **Overview** — totalUsers, totalVideos, activeToday, proUsers + plan distribution + recent users
  - **Users** — table with inline plan + role select, delete (refuses to delete admins; cascades videos)
  - **Videos** — read-only recent 50
- Waitlist API — idempotent on email
- Auth flow — JWT, role/plan re-synced from DB every request

### ❌ Not yet built / placeholder
- Real video file storage (S3 / R2 / Vercel Blob — TBD)
- Real per-platform OAuth (YouTube, Instagram, TikTok, FB, X, LinkedIn)
- Email sending (no provider integrated)
- Email verification
- Forgot password
- 2FA
- Real billing / Stripe / Razorpay integration
- AI Clips feature
- Settings page Save / Delete account
- Real analytics aggregation

### ⚠️ Existing-but-suspect
- ~~`proxy.js` is dead code.~~ **CORRECTION (2026-05-14):** In Next.js 16, the middleware file was renamed from `middleware.js` to `proxy.js` (breaking change). It IS active and gates `/dashboard` + `/admin` server-side. Confirmed by dev-server logs showing `proxy.ts: 80ms` on `/dashboard` requests. The `useSession` checks in pages are now defense-in-depth, not the only line.
- `client_secret.json` at repo root — currently gitignored, but should ideally be deleted entirely since the same values are in `.env.local`.

---

## 5. Project history (pre-AI + this AI session)

### 5A. Pre-AI history (built before this AI assistant joined)

This section is reconstructed from reading the codebase — dates are inferred from `package.json` deps and code style, not git history (repo had no `.git` until this session).

**Phase 0 — Initial scaffold (pre-Apr 2026 estimate)**
- `npx create-next-app@latest` with App Router + Tailwind v4. README is the default boilerplate (untouched).
- Geist fonts wired into root layout.

**Phase 1 — Brand + landing page**
- Built `app/page.js` (~700 lines) — the entire marketing site as one component:
  - Auth-aware nav (swaps "Sign in" ↔ avatar based on `useSession`)
  - Hero with animated counter + waitlist count
  - Live product mockup with progress bars (4 platforms uploading)
  - Platform pills (YouTube, IG, TikTok, FB, X, LinkedIn)
  - Animated stats counters (IntersectionObserver-driven)
  - Flow diagram, problem cards, features grid
  - Testimonials
  - Pricing (₹ tiers — see §0.3)
  - **Real waitlist form** → `POST /api/waitlist` → MongoDB
  - FAQ + footer
- Established design language: dark theme, custom CSS in `app/globals.css` + inline `style={{}}`. **Tailwind only used for reset / `@theme`** — no utility classes in components. (This is a deliberate, locked-in choice.)

**Phase 2 — Auth foundation**
- NextAuth v4 (Credentials + Google providers).
- JWT sessions (30-day), with the unusual choice that the **jwt callback re-fetches the User from MongoDB on every refresh** — so plan/role changes propagate without re-login. Trade-off: 1 DB read per authenticated nav.
- `models/User.js` schema with `plan` (free/lite/growth/pro), `role` (user/admin), `connectedPlatforms{youtube|instagram|tiktok|facebook|x|linkedin}`, `videosUploaded`, `lastLogin`.
- Signup with bcrypt(12). Auto sign-in after creation.
- `lib/db.js` caches mongoose connection on `global.mongoose`, **forces DNS to 8.8.8.8** for SRV resolution (works around some Indian ISP DNS that botches SRV).

**Phase 3 — Dashboard + admin**
- `app/dashboard/page.js` (~1500 lines) — single-file dashboard with tabs: My Videos, Upload, Editor, Analytics, AI Clips, Accounts, Settings. Reads real data from `/api/videos`.
- Per-platform editor: each video has overridable title/desc/tags/visibility per platform.
- `app/admin/page.js` — role-gated. Tabs: Overview (stats + plan distribution), Users (inline plan/role select + delete), Videos (read-only).
- API routes: `/api/videos` (GET list, POST create, PATCH/DELETE per id), `/api/admin/data`, `/api/admin/update-user`, `/api/admin/delete-user`, `/api/seed` (dev-only — wipes & seeds 7 users + 5 videos).
- `lib/dashboard-data.js` — normalizers: `serializeVideo`, `serializeConnectedAccounts`, `buildPlatformPayload`, `normalizeTags`, plus `THUMB_BY_CATEGORY` emoji map.

**Phase 4 — Suspect / inconsistent state at handoff**
- `proxy.js` exists with NextAuth `withAuth` config and a `dashboard|admin` matcher — **but the file is named `proxy.js`, not `middleware.js`**, so Next never invokes it. Auth gating is duplicated in client-side `useSession` checks. **Decision deferred** to roadmap (§7A).
- `client_secret.json` (Google OAuth Desktop type) was checked into the working directory — not gitignored. Owner intended Web type for NextAuth.
- No git repo had been initialized yet (`.git` did not exist).
- Settings tab Save/Cancel/Delete are intentionally `disabled` placeholders.
- AI Clips tab is a "Coming soon" placeholder.
- Editor blocks save when `thumbUrl.startsWith("blob:")` — deliberate guard because there's no storage backend yet.
- `/memories/session/multiuploads-map.md` notes: "AGENTS.md only says: 'Next.js has breaking changes; read `node_modules/next/dist/docs/` before writing code.'"

### 5B. This AI session (chronological)

**Session opened:** 2026-05-12, owner asked AI to review the codebase before any work.

1. **Codebase review & memory map** — read ~20 files; saved comprehensive map to `/memories/session/multiuploads-map.md` so future sessions don't have to re-discover.
2. **OAuth credential triage** — owner pasted a `client_secret.json`. Identified it as Desktop OAuth type, which can't be used by NextAuth (needs Web type). Flagged secret leakage in chat.
3. **Guided owner through GCP Web OAuth client creation** — redirect URIs `http://localhost:3000/api/auth/callback/google` + `/api/auth/callback/youtube`. Owner replaced `client_secret.json`.
4. **MongoDB onboarding** — owner had no prior Atlas experience; explained URI structure, walked through Atlas signup, cluster creation. Cluster `multiuploads` (AWS Mumbai M0 free), DB user `entertainme108_db_user`.
5. **Date jumped May 12 → May 14** (timezone / context resume). Reloaded session memory to recover state.
6. **`.env.local` written** with real values (Atlas URI, fresh `NEXTAUTH_SECRET`, GCP client id/secret, `NEXTAUTH_URL`).
7. **`.gitignore` hardened** — added `client_secret.json` and `client_secret*.json`.
8. **DB connection test #1 failed** — Atlas IP whitelist blocked the dev machine. Owner added `0.0.0.0/0` (with `dev` comment).
9. **DB connection test #2 succeeded** — mongoose `.connect()` returns OK, target DB `multiuploads`.
10. **Dev server start — site unreachable.** Diagnosed: PostgreSQL (PID 5800) was already listening on port 3000. Moved Next.js to **port 3001**, updated `NEXTAUTH_URL` to match. Site loaded.
11. **Owner test-signed-up** as `randomdf@gmail.com` / `Rehan086`. Discovered two real bugs:
    - The "strength meter" labels `Rehan086` as "Strong" (it's not — common name + trivial digits). Hand-rolled regex meter is decorative.
    - Server only enforces password length ≥6 — the UI score is never validated server-side.
    - No email verification at all — anyone can claim any email.
12. **Auth-hardening plan written** — 6-slice plan, owner approved. Slice 1 ready to start.
13. **`Documentation/Planning/PROJECT_CONTEXT.md` created** (this file) — onboarding doc for any future AI/human.
14. **Git repo initialized** (`git init -b main`) — first commit `3bd5d8e` includes existing codebase + planning docs.
15. **PROJECT_CONTEXT expanded** with full history (this section), vision, goals, pricing, logging discipline.
16. **Owner future-use note logged** (§0.2) — owner will use MultiUploads as an end-user for a separate YouTube automation income project; not a product feature, kept in mind for API ergonomics.
17. **Session paused** — owner stopping for the day. Next slice (Slice 1: real password strength via `zxcvbn-ts`) is queued and ready to start tomorrow.
18. **Session resumed** (2026-05-14 morning).
19. **Discovery: `proxy.js` IS active.** Next.js 16 renamed `middleware.js` → `proxy.js`. Updated §8 landmines — server-side route gating works as intended.
20. **Slice 1 completed** — installed `@zxcvbn-ts/core` + `language-common` + `language-en`; created `lib/password.js` (`evaluatePassword`, `MIN_SCORE=3`); replaced fake regex meter in `app/signup/page.js` with real entropy+dictionary scoring (includes user's name + email in dictionary); enforced same rule server-side in `app/api/auth/signup/route.js`. Tested: `Rehan086` → score 1 rejected, `password123` → score 0 rejected, `Rehan` → 0 rejected, `Tr0ub4dor&3` → 4 accepted, `correct horse battery staple` → 4 accepted.
21. **UX addons** (same slice, owner-requested mid-slice):
    - Show/Hide password toggle on both signup password fields and the login password field.
    - Positive "✓ Passwords match" green indicator on signup confirm field (was only showing the negative).
    - Login `<input>` got `autoComplete="current-password"`; signup got `"new-password"` for browser autofill correctness.
22. **YouTube-first roadmap added** (§7G) per owner directive: focus only on YouTube; build connect-tutorial-video flow + user-supplied OAuth credentials (avoids the 100-user cap on a single SaaS-wide OAuth app); add thumbnail upload; test existing OAuth key; build real file upload.
23. **DB cleanup** (2026-05-15) — deleted all 3 test User docs (`randomdf@gmail.com`, `hehehhe@gmail.com`, `entertainme108@gmail.com`) and 0 Video docs. Owner thought there were 2; flagged the third in case it was their real account.
24. **UX fix: error auto-scroll** — signup + login now `scrollIntoView({behavior:'smooth',block:'center'})` whenever the error banner appears (was previously off-screen for users who scrolled down).
25. **Slice 2 completed** — added `emailVerified` (Date|null), `verificationToken`, `verificationTokenExpiresAt`, `verificationLastSentAt` to `models/User.js` (last three `select:false`). Propagated `emailVerified` boolean through JWT + session in `lib/auth.js`. Existing users default to `null` so login still works (banner will show for them once Slice 5 ships).
26. **Facebook backend (Slices A/B/C completed 2026-05-16)** — three-slice plan to mirror YouTube upload pattern for Meta Pages.
    - **Slice A (env):** Added `FB_APP_ID`, `FB_APP_SECRET`, `FB_REDIRECT_URI`, `FB_API_VERSION`, `FB_TOKEN_FILE` to `backend/.env` and `.env.example`.
    - **Slice B (`backend/connect-facebook.js`):** Loopback OAuth on port 3100; exchanges code → short-lived user token → long-lived user token (~60d) → per-Page access tokens; writes `secrets/fb_token.json`. Scopes: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`. Includes `auth_type=rerequest` so Meta re-shows Page picker every run (default flow defaults to none-selected, surprising). SIGINT/SIGTERM cleanup ensures port 3100 always released.
    - **Slice C (`backend/post-facebook.js`):** CLI `node post-facebook.js <pageId> <message> [mediaPath]`. Auto-detects text vs photo (jpg/png/gif/webp) vs video (mp4/mov/m4v/avi/mkv). Routes: `/feed` for text, `/photos` (multipart) for images, `/videos` simple upload for <100MB, resumable (start/transfer/finish) for ≥100MB. **All three modes tested successfully** by owner against Page `Zack D. Films Hindi` (id `1072851405919298`).
    - Debugging journey worth noting for next AI: leading-space env var bug, Threads-app-id-vs-Facebook-app-id confusion (Threads is a separate Meta app), stale port 3100 EADDRINUSE, Meta's new "0 pages selected by default" consent flow. All resolved.
27. **Decision: web-based OAuth callbacks in Next.js (multi-user) before Vercel deploy.** The current `connect-facebook.js` / `connect-youtube.js` loopback flow only works locally for a single owner. For SaaS, build `/api/auth/facebook/connect` (redirect) + `/api/auth/facebook/callback` (token exchange + persist to User.connectedPlatforms.facebook) routes inside Next.js. Same pattern for YouTube. Loopback scripts stay as dev tools for owner's personal automation use case (§0.2).
28. **Decision: deploy to Vercel on `*.vercel.app` NOW, custom domain later.** Switching domains is 2 minutes in Vercel + DNS update + adding the new domain as a second redirect URI in each OAuth provider (don't remove vercel.app until DNS is solid). Blocker: need web-based OAuth routes (item 27) before deploy because serverless can't run loopback servers.
29. **Decision: private GitHub repo on owner's professional account.** Repo will be the lifelong backup + portfolio piece. Will require: setting `git config user.email` in this repo to match the pro account email; optionally rewriting past commits if attribution matters for the green-squares contribution graph.

### 5C. Files modified this session
- `.env.local` (created/overwritten with real values; gitignored)
- `.gitignore` (added `client_secret.json` patterns)
- `Documentation/Planning/auth-hardening.md` (created — current work plan)
- `Documentation/Planning/PROJECT_CONTEXT.md` (created + expanded)
- `.git/` (repo initialized; first commit `3bd5d8e`)

### 5D. Files NOT modified this session
- All `app/`, `lib/`, `models/`, `components/` source code is unchanged from initial review.

---

## 6. Active plan — Auth Hardening (in progress)

**Plan file:** `Documentation/Planning/auth-hardening.md`

**Status:** awaiting owner approval to start Slice 1.

**Why this work:**
- Current "password strength" meter is decorative (regex of length/upper/digit) and lies — `Rehan086` shows as "Strong".
- Server only enforces length ≥6 — UI score is never validated server-side.
- No email verification — anyone can sign up as `randomdf@gmail.com`.
- Spammers can fill the DB; an attacker could "claim" someone else's email.

**Owner decisions (locked in):**
- Password rule: use a real estimator (zxcvbn-ts), block "Weak" and "Fair", allow "Good" and "Strong" (score ≥3 of 4). Don't enforce a specific char-mix; let the estimator judge entropy + dictionary likeness. Includes user's own name+email in the dictionary so they can't use them.
- Email service: **Resend** (3k/mo free tier; `onboarding@resend.dev` sender for dev — no DNS needed).
- Verification gate: unverified users **can log in and browse** but **cannot upload / mutate video data**. Persistent banner with "Resend email" CTA.
- Google sign-ins are auto-verified (Google already verified the inbox).

### Slice list (one slice → test → confirm → commit → next)

| # | Slice | Files touched | Acceptance test |
|---|---|---|---|
| 1 | Replace fake strength meter with `zxcvbn-ts` (client + server) | `package.json`, NEW `lib/password.js`, `app/signup/page.js`, `app/api/auth/signup/route.js` | `Rehan086` → blocked with feedback. Strong passphrase → succeeds. |
| 2 | Add `emailVerified`, `verificationToken`, `verificationTokenExpiresAt`, `verificationLastSentAt` to User. Propagate `emailVerified` boolean into session. | `models/User.js`, `lib/auth.js` | Existing users still log in. New session has `emailVerified` field. |
| 3 | Resend integration. NEW `lib/email.js` with `sendVerificationEmail({to, name, url})`. New env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`. | `package.json`, `.env.local`, NEW `lib/email.js`, README | One-off node script delivers test email to inbox. |
| 4 | Wire signup → token + email. NEW `GET /api/auth/verify`, NEW `POST /api/auth/resend-verification` (60s throttle). | `app/api/auth/signup/route.js`, NEW `app/api/auth/verify/route.js`, NEW `app/api/auth/resend-verification/route.js` | Click link → verified → redirect `/dashboard?verified=1` → session reflects verified. |
| 5 | Banner UI on dashboard/admin if unverified. `assertVerified()` helper guarding video API mutations (POST/PUT/DELETE → 403 if unverified). | NEW `components/VerifyEmailBanner.js`, `app/dashboard/page.js`, `app/admin/page.js`, NEW `lib/require-verified.js`, `app/api/videos/route.js`, `app/api/videos/[id]/route.js` | Unverified user sees banner. Video POST returns 403. After verify, banner gone next page load. |
| 6 | Google bypass + cleanup test user `randomdf@gmail.com`. | `lib/auth.js`, one-shot script | Google sign-in → User has `emailVerified` set instantly → no banner. |

**Pending owner action:** approve plan; sign up at https://resend.com and provide API key (only needed before Slice 3).

---

## 7. Hardening roadmap — post auth-hardening (UX + Security backlog)

These are explicitly **not** part of the current plan — they're recorded here so we don't lose them. Owner asked for "more user experience as well as user and our data security".

Each item should become its own `Documentation/Planning/<name>.md` when started.

### 7A. Identity & access security
- **Forgot password / reset flow** — token in email, same Resend module from §6. Owner asked, mentioned in auth-hardening as out-of-scope but unblocked by it.
- **Rate limiting on auth endpoints** — login, signup, resend-verification, forgot-password. Use `@upstash/ratelimit` (free tier) or in-memory LRU for single-instance dev.
- **Account lockout** — after N failed login attempts, temporary lock (with email notification).
- **Session revocation** — "Sign out everywhere" button (currently impossible because we use JWT not DB sessions; will need to bump a `tokenVersion` field on User and check it in JWT callback).
- **Password breach check (HIBP API)** — optional secondary check during signup using HaveIBeenPwned's k-anonymity API (no password leaves server in cleartext).
- **2FA (TOTP)** — `otpauth` lib, QR code, backup codes. Optional per user.
- **Audit log** — separate `AuditLog` model: who did what when (login, plan change, role change, video upload, account delete). Critical for admin trust.
- **Rotate the leaked secrets** — during this session, the Google OAuth client secret and the MongoDB password were both pasted in chat. Owner should regenerate both before going to production.
- **Move `proxy.js` → `middleware.js`** — server-side route gating instead of client-only. Or delete and consolidate.
- **CSP + security headers** — `next.config.mjs` headers: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- **CSRF on mutations** — NextAuth handles its own CSRF, but our custom POST routes (`/api/videos`, `/api/admin/*`) should verify same-origin or use anti-CSRF tokens.

### 7B. Data security
- **At-rest encryption of sensitive fields** — refresh tokens for connected platforms (when implemented) MUST be encrypted before storing (`crypto.createCipheriv` AES-GCM with key from env).
- **Field-level redaction in logs** — no email/password/token strings in console.error.
- **Backups** — Atlas free tier doesn't auto-backup. Add a scheduled `mongodump` to S3/R2 once data matters.
- **GDPR/DPDP compliance prep (Indian users)** — "Export my data" + "Delete my account" endpoints. Currently the admin can delete users but the user themselves cannot.
- **PII minimization** — review what we store and why; drop anything unused.

### 7C. UX polish
- **Toast / snackbar system** — currently nothing. Need it for "verified!", "saved!", "error", "resent email", etc. Recommend a tiny custom one (no library) matching the existing inline-style aesthetic.
- **Form-level inline validation** — show errors next to fields, not just one banner at top.
- **Loading skeletons** — dashboard list is currently blank → "loading" → content. Skeletons feel faster.
- **Empty states with CTAs** — "no videos yet" should have a big "Upload your first video" button.
- **Keyboard shortcuts** — `?` opens help, `g d` go to dashboard, `g a` go to admin, `n` new upload, `/` focus search.
- **Mobile nav** — landing page nav and dashboard sidebar need responsive behavior (hamburger).
- **Accessibility audit** — alt text on icons, aria-labels on icon-only buttons, focus rings, color contrast on `--t3` / `--t4` text colors.
- **Error boundary + nice 500 page** — currently any unhandled error falls through to Next's default.
- **Success celebration on first upload** — small dopamine moment, confetti or "your video is on its way to N platforms" animation.
- **Onboarding flow** — first-login wizard: connect a platform → upload sample → see dashboard populate.
- **Better password input UX** — show/hide toggle, paste support, autofill hints (`autocomplete="new-password"` on signup, `current-password` on login).

### 7D. Admin / ops
- **Admin can impersonate a user** (debug only, audit-logged).
- **Admin search** — currently the users table is unfiltered.
- **Per-user activity panel in admin** — last login, IP, recent uploads, recent errors.
- **Plan-change history** — when did user X go from free→pro and who changed it.
- **Soft-delete users** instead of hard delete (so we can recover).
- **Feature flags** — toggle features per-user/per-plan without code deploy. Minimal: a `featureFlags: [String]` field on User + a `useFeatureFlag()` hook.

### 7E. Observability
- **Structured logging** — replace `console.error` with a tiny logger (`pino` or hand-rolled) so logs are JSON.
- **Error tracking** — Sentry free tier (5k errors/mo).
- **Uptime monitoring** — Better Stack / UptimeRobot ping `/api/health` (which we don't have yet — add it).
- **Basic analytics** — Plausible (privacy-friendly, ₹ for self-host).

### 7F. Core product (the actual SaaS)
- Real file upload (multipart → R2/S3, signed URLs, resumable for large videos)
- Real per-platform OAuth (YouTube Data API v3 first since you already have a key)
- Real per-platform upload jobs (BullMQ + Redis or Inngest free tier)
- Webhooks from platforms back to us (status updates)
- Billing (Razorpay for ₹ users, Stripe for international)
- Email digests (weekly performance summary)

### 7G. YouTube-first connect & upload (added 2026-05-14)
Owner directive: **focus only on YouTube for now**, get the full upload loop working end-to-end before touching IG/TikTok/FB/X/LinkedIn. Each item below should become its own slice plan.

- **Slice: "Connect YouTube account" UI + tutorial.** Owner will record/embed a tutorial video showing creators how to:
  1. Create a Google Cloud project
  2. Enable YouTube Data API v3
  3. Create OAuth client credentials
  4. Get their refresh token
  Why: We're not auto-handling OAuth-app-verification quotas for the SaaS — each creator brings their own OAuth credentials. Avoids the 100-user verification cap on a single app.
- **Slice: Server-side OAuth handshake.** Accept user-pasted OAuth client ID + secret, run the consent flow, store encrypted refresh token on `User.connectedPlatforms.youtube`.
- **Slice: Thumbnail upload.** Upload tab currently has no thumbnail input — need file picker + storage (R2/S3/Vercel Blob) + preview + per-platform thumbnail override.
- **Slice: Test the existing OAuth key.** Owner has an OAuth key already pending verification — wire it up, attempt one real upload, confirm the video reaches YouTube.
- **Slice: Real video file upload.** Currently the upload form only saves metadata + placeholder URLs. Need actual file storage (start with Vercel Blob — simplest, free 1GB) and a queue worker to handle the YouTube push.
- **Slice: Owner's tutorial video.** Embed a YouTube/Loom tutorial in the "Connect YouTube" modal/screen so creators are unblocked self-serve.

Order owner wants: get the password hardening + email verification done first (§6), THEN YouTube connect tutorial → OAuth handshake → thumbnail upload → real upload → test push.

**Order of operations recommendation (after auth hardening):**
1. Forgot password (Slice 7A — reuses Slice 3 email module)
2. Rate limiting (Slice 7A — protect what we just built)
3. Toast system + inline validation (Slice 7C — UX foundation everything else builds on)
4. Audit log (Slice 7A — needed before real money flows)
5. Real file upload (Slice 7F — unblocks the actual product)
6. Stripe/Razorpay (Slice 7F — start charging)

---

## 8. Known gaps / landmines (read before touching)

1. **`proxy.js` is dead code right now.** Don't trust it for security. All route gating is client-side in pages.
2. **Dashboard's `mockVideos` and `connectedAccounts` arrays are empty `[]`** — real data only via API. If you see code referencing them as if they had data, it's stale.
3. **Editor blocks save when `thumbUrl.startsWith("blob:")`** — there's no storage backend yet. Don't "fix" this; it's a guard.
4. **Settings tab buttons are intentionally `disabled`** — they're placeholders. Don't wire them without owner approval.
5. **`/api/seed` wipes and reseeds** — never call in production.
6. **Mongoose connection forces DNS to 8.8.8.8** in `lib/db.js`. If a corporate network blocks 8.8.8.8, this will silently fail SRV. Owner is on home WiFi → fine.
7. **Layout has a `beforeInteractive` script that strips `bis_register`, `bis_skin_checked`, `__processed_*` attrs** — these come from browser extensions (BitDefender, Honey, etc.) and would otherwise cause hydration mismatches. Leave it alone.
8. **JWT callback re-fetches User on every request.** Means plan/role changes propagate instantly but adds 1 DB read per authenticated page nav. If we ever scale, cache this.
9. **Port 3000 history** — earlier in this project's lifetime a local Postgres instance was squatting on 3000 and we temporarily ran Next on 3001. As of 2026-05-16 that Postgres process is gone; **we are back on port 3000** and `NEXTAUTH_URL` is `http://localhost:3000`. Google OAuth redirect URIs in GCP are already configured for 3000, so sign-in works without changes. If port 3000 ever gets squatted again, `npm run dev` will auto-pick 3001 and you'll need to add 3001 variants in GCP/Meta.
10. **Tailwind is loaded but unused.** Don't `className="flex items-center"` — use the project's `.input`, `.btn-primary`, etc. classes or inline styles.
11. **Owner uses Windows + PowerShell.** Don't write bash-only commands. Don't use `&&` (use `;`).
12. **Facebook long-lived tokens expire in ~60 days.** The `backend/secrets/fb_token.json` file stores `userTokenExpiresAt`. **Per-Page tokens are effectively non-expiring** as long as the parent user token is still alive OR has been refreshed within its 60-day window. **Refresh strategy (to build with the UI):** a backend job/route should check daily; when `daysRemaining < 14`, call `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=<current_long_lived_user_token>` to get a new 60-day token, then re-fetch `/me/accounts` and overwrite `fb_token.json`. If the token fully expires (no refresh in 60 days), the user must re-run the OAuth consent flow — same Page, same data, just re-grant. The dashboard "Accounts" tab MUST surface `daysRemaining` (green >14, yellow 3–14, red <3 + "Reconnect" button).
13. **Port allocations (LOCK THESE; don't reassign).**

| Port | Service | Why locked |
|---|---|---|
| 3000 | Next.js dev server | Industry default; `NEXTAUTH_URL` + Google OAuth redirect URIs all hard-coded to this. |
| 3100 | Backend OAuth loopback (`connect-facebook.js`, future `connect-*.js`) | Registered as Valid OAuth Redirect URI in Meta dashboard; moving it requires re-registration. |
| 5432 | PostgreSQL (when re-added) | Postgres default. **Never put Postgres on 3000 again** — that's what caused the May-12 outage. |
| 27017 | MongoDB (local, if ever needed; we use Atlas today) | Mongo default. |
| 6379 | Redis (when added) | Redis default. |
| 3001–3099 | Reserved for future Next.js apps / micro-frontends | Don't squat. |
| 4000–4099 | Reserved for future backend APIs | Don't squat. |

---

## 9. Setup / commands

### First-time setup on a fresh clone
```powershell
cd D:\MultiUploads\multiuploads
npm install
# Create .env.local with the values from §10
npm run dev
# Open http://localhost:3000  (Next auto-picks 3001 if 3000 is squatted)
```

### Verify DB connection
```powershell
node --env-file=.env.local -e "const m=require('mongoose'); m.connect(process.env.MONGODB_URI).then(()=>{console.log('Connected to DB:', m.connection.name); return m.disconnect();}).catch(e=>{console.error('FAIL:',e.message); process.exit(1);})"
```

### Seed test data
```powershell
# Visit http://localhost:3000/api/seed in browser (dev only)
```
Creates test accounts:
- `admin@multiuploads.com` / `admin123` (admin, pro)
- `test@multiuploads.com` / `password123` (user, free, with 5 sample videos)
- `user1..5@test.com` / `password123`

### Promote a user to admin (one-shot)
```powershell
node --env-file=.env.local -e "require('mongoose').connect(process.env.MONGODB_URI).then(async m=>{const U=(await import('./models/User.js')).default; await U.updateOne({email:'<EMAIL>'},{role:'admin',plan:'pro'}); console.log('done'); process.exit(0);})"
```
*(Note: User model uses ESM `export default`. If the script errors, save it as `.mjs` and run with `node --env-file=.env.local promote.mjs`.)*

### Run dev server
```powershell
npm run dev
# Defaults to port 3000. If something is squatting on 3000, Next auto-picks 3001.
# To force a specific port: $env:PORT=3100; npm run dev
```

---

## 10. Credentials index (where things live)

> **All real values are in `.env.local` only. This file is gitignored. Do not paste real secrets into chat or commit them.**

| Name | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | `.env.local` | Atlas connection string. Cluster `multiuploads`, AWS Mumbai, M0 free tier, DB user `entertainme108_db_user`, DB name `multiuploads`. |
| `NEXTAUTH_SECRET` | `.env.local` | JWT signing. Generated this session via `crypto.randomBytes(32).toString('base64')`. |
| `NEXTAUTH_URL` | `.env.local` | `http://localhost:3000` (restored from 3001 on 2026-05-16 after Postgres process went away). |
| `GOOGLE_CLIENT_ID` | `.env.local` | Web OAuth client from GCP project `multiuploads-ytapi-to-test`. |
| `GOOGLE_CLIENT_SECRET` | `.env.local` | Same. |
| `client_secret.json` | repo root | Google OAuth Web client download. **Gitignored.** Should ideally be deleted (values duplicated in `.env.local`). |
| `FB_APP_ID` | `backend/.env` | Meta app ID (Facebook app `2192077251604730`, NOT the Threads app). |
| `FB_APP_SECRET` | `backend/.env` | Meta app secret. Rotated 2026-05-16 after chat exposure. |
| `FB_REDIRECT_URI` | `backend/.env` | `http://localhost:3100/oauth/facebook/callback`. Must match Meta dashboard Valid OAuth Redirect URIs exactly. |
| `FB_API_VERSION` | `backend/.env` | `v21.0` (pinned for reproducibility). |
| `FB_TOKEN_FILE` | `backend/.env` | Path to cached Page tokens (default `./secrets/fb_token.json`). |
| `backend/secrets/fb_token.json` | `backend/secrets/` | Cached long-lived user token + per-Page tokens. **Gitignored.** Contains `userTokenExpiresAt` for refresh logic. |
| `backend/secrets/yt_token.json` | `backend/secrets/` | Cached YouTube OAuth refresh token. **Gitignored.** |

### Atlas
- Cluster: `multiuploads` (AWS ap-south-1 / Mumbai)
- DB: `multiuploads`
- DB user: `entertainme108_db_user`
- Network access: `0.0.0.0/0` (open — fine for dev, tighten for prod)
- Backup: none (M0 free)

### Google Cloud Console
- Project: `multiuploads-ytapi-to-test`
- OAuth client type: Web application
- Authorized JS origins: `http://localhost:3000` (matches current dev port; if you ever fall back to 3001, add that too)
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`, `http://localhost:3000/api/auth/callback/youtube`

### Pending external accounts (not yet created)
- **Resend** (https://resend.com) — needed at Slice 3 of auth-hardening.
- **Sentry / Plausible / S3-compatible storage / Razorpay** — not needed yet.

### Secrets that have been exposed in chat this session and should be rotated before going public
- The Google OAuth client secret (was discussed when troubleshooting `client_secret.json`)
- The MongoDB password
- The NEXTAUTH_SECRET (less critical but trivial to rotate)

---

## 11. How to resume this work with a fresh AI

Paste the AI this prompt:

> I'm working on `D:\MultiUploads\multiuploads`. Read these files in order before doing anything:
> 1. `Documentation/Planning/PROJECT_CONTEXT.md` (this file)
> 2. `Documentation/Planning/auth-hardening.md` (the in-progress plan)
> 3. `AGENTS.md`
> 4. `package.json`, `lib/auth.js`, `models/User.js`
>
> Then tell me which slice we're on, what's blocking, and propose the next single action. Do NOT modify any code until I approve.

That's enough for any competent AI to take over.

---

## 12. Logging discipline (how this doc stays current)

**Rule:** the AI assistant working in this repo logs every materially important event into this file. After logging, replies to the owner with a single line: `Logged.`

**What counts as "materially important" — always log:**
- New feature / slice completed (→ update §4 + §5B + §13 changelog).
- Bug discovered (→ §8 landmines).
- Architectural decision made (→ §3 or §8 with rationale).
- New dependency added (→ §3).
- New env var introduced (→ §10).
- New external account / service (Resend, Stripe, etc.) (→ §10).
- Secret rotated, leaked, or invalidated (→ §10).
- Plan/slice approved, started, blocked, or finished (→ §6).
- Anything moved from "❌ missing" → "✅ working" or vice versa (→ §4).
- Owner preference / decision recorded for future AIs (→ §2 if engineering, §6 if product).
- Goal change — short or long term (→ §0.2).

**What NOT to log here:**
- Mid-implementation scratch notes (use session memory).
- Trivia ("ran the tests, they passed").
- Conversational back-and-forth.
- Code snippets longer than 10 lines (link to the file instead).

**How to log:**
1. Edit this file's relevant section.
2. Add a one-line entry to §13 changelog with date + author + 1-line summary.
3. Reply `Logged.` to the owner (no prose).

**Goal:** any AI reading this doc cold should be able to take over within one paragraph of reading.

---

## 13. Changelog

| Date | Author | Change |
|---|---|---|
| 2026-05-14 | Copilot | Initial creation. Captures state through port-3001 fix + auth-hardening plan acceptance. |
| 2026-05-14 | Copilot | Expanded with vision/problem/goals/pricing (§0.1–0.4), full pre-AI project history (§5A), and logging discipline (§12). |
| 2026-05-14 | Copilot | Logged owner's personal future use (separate YouTube automation project) in §0.2; logged session pause — Slice 1 queued for next session. |
| 2026-05-14 | Copilot | Resumed; corrected §8 (`proxy.js` IS Next 16's middleware, active server-side); shipped Slice 1 (real password strength via zxcvbn-ts, client + server) plus owner-requested UX (show/hide password on signup+login, positive passwords-match indicator); added §7G YouTube-first roadmap (user-supplied OAuth, tutorial video, thumbnail upload, real file upload). |
| 2026-05-15 | Copilot | DB cleanup (deleted 3 test users); UX fix: signup/login now auto-scroll to error banner; shipped Slice 2 (User model `emailVerified` + verification token fields, propagated through JWT/session). |
| 2026-05-16 | Copilot | Shipped Facebook backend Slices A/B/C (env vars + `connect-facebook.js` loopback OAuth + `post-facebook.js` text/photo/video posting). All three modes tested successfully against `Zack D. Films Hindi` Page. Logged §8 landmines #12 (FB token ~60d expiry + auto-refresh strategy) and #13 (port allocation lock table). Added FB credentials to §10. Logged decisions: web-based OAuth callbacks for multi-user, deploy to Vercel now on `*.vercel.app`, private GitHub on pro account. |
