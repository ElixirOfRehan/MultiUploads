node upload-video.js "D:\path\to\any\short.mp4" "Backend test 1" "First test from MultiUploads backend"# Auth Hardening — Password Strength + Email Verification

**Owner:** GitHub Copilot (working with user)
**Status:** Draft, awaiting approval
**Created:** 2026-05-14

---

## Goals

1. Reject weak / common / leaked passwords at both client (live UX) and server (authoritative). Use a real entropy + dictionary estimator (`zxcvbn-ts`), not hand-rolled regex scoring. Minimum acceptable score = 3 (out of 0–4) → "Good" or "Strong".
2. Verify email ownership for credentials signups via tokenized link sent through Resend.
3. Allow unverified users to log in and explore, but block monetized / mutating features (uploads, channel connects) behind a verified gate. Show persistent banner with "Resend email" CTA.
4. Treat Google OAuth signups as already verified (Google has done KYC on the email).

## Non-goals (explicit)
- 2FA / TOTP — out of scope.
- Phone verification — out of scope.
- Password rotation policy — out of scope.
- Magic-link login — out of scope (we keep credentials + Google).
- "Forgot password" flow — out of scope for this plan, but Slice 3's email module is designed to be reused for it later.

---

## Slice 1 — Password strength with `zxcvbn-ts`

**File targets:**
- `package.json` — add deps `@zxcvbn-ts/core`, `@zxcvbn-ts/language-common`, `@zxcvbn-ts/language-en`
- NEW `lib/password.js` — shared evaluator
- `app/signup/page.js` — replace `getPasswordStrength`, show feedback list
- `app/api/auth/signup/route.js` — call evaluator server-side, reject `score < 3`

**`lib/password.js` shape:**
```js
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommon from "@zxcvbn-ts/language-common";
import * as zxcvbnEn from "@zxcvbn-ts/language-en";

zxcvbnOptions.setOptions({
  translations: zxcvbnEn.translations,
  graphs: zxcvbnCommon.adjacencyGraphs,
  dictionary: { ...zxcvbnCommon.dictionary, ...zxcvbnEn.dictionary },
});

export const MIN_SCORE = 3;

export function evaluatePassword(password, userInputs = []) {
  const r = zxcvbn(password ?? "", userInputs);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  return {
    score: r.score,
    label: labels[r.score],
    color: colors[r.score],
    ok: r.score >= MIN_SCORE,
    warning: r.feedback.warning || "",
    suggestions: r.feedback.suggestions || [],
  };
}
```

**Server enforcement** (in signup route):
```js
const { ok, score, warning, suggestions } = evaluatePassword(password, [name, email]);
if (!ok) {
  return NextResponse.json(
    { error: warning || "Password is too weak", suggestions, score },
    { status: 400 }
  );
}
```

**Rationale:** `Rehan086` will score 1 (very common name + trivial digits). `Tr0ub4dor&3` ≈ 3 (good). The user's intent — "block commonly used / weak, allow Good or Strong" — maps exactly onto zxcvbn's score boundary at 3. Also wires the user's name + email into the dictionary so users can't use their own name as password.

**Acceptance:** signup with `Rehan086` → blocked with feedback. Signup with a passphrase that scores ≥3 → succeeds.

---

## Slice 2 — User model: `emailVerified` + verification token fields

**File targets:**
- `models/User.js` — add fields
- `lib/auth.js` — propagate `emailVerified` into JWT + session

**Schema additions:**
```js
emailVerified: { type: Date, default: null },
verificationToken: { type: String, default: null, select: false },
verificationTokenExpiresAt: { type: Date, default: null, select: false },
verificationLastSentAt: { type: Date, default: null, select: false }, // throttle
```

**Auth callback:** include `emailVerified: !!user.emailVerified` (boolean) on `session.user`. Re-read in jwt callback so it updates the moment user clicks the link.

**Rationale:** `Date | null` matches NextAuth convention. `select: false` keeps tokens out of accidental queries. `verificationLastSentAt` enables throttle (Slice 4).

**Acceptance:** existing users in DB are unaffected (nullable defaults). New session payload contains `emailVerified` boolean.

---

## Slice 3 — Resend email module

**Prereq:** user provides `RESEND_API_KEY`. We sign up at https://resend.com (free tier 3k/mo, 100/day), use Resend's shared `onboarding@resend.dev` sender during dev (no domain DNS needed). Production will need a verified domain.

**File targets:**
- `package.json` — add `resend`
- `.env.local` — add `RESEND_API_KEY`, `EMAIL_FROM=MultiUploads <onboarding@resend.dev>`, `APP_URL=http://localhost:3001`
- NEW `lib/email.js` with `sendVerificationEmail({ to, name, url })`
- README env-var section updated

**Template:** dark-themed, single CTA button, plaintext fallback URL. Subject: "Verify your MultiUploads email".

**Rationale:** Resend is the cleanest dev experience and matches Next.js conventions. We isolate sending behind one function so we can swap providers later (Postmark, SES) without touching call sites.

**Acceptance:** calling `sendVerificationEmail(...)` from a one-off node script delivers an email to the user's inbox.

---

## Slice 4 — Verification endpoints + signup wiring

**File targets:**
- `app/api/auth/signup/route.js` — generate token, store, send email
- NEW `app/api/auth/verify/route.js` — GET `?token=...` validates and marks verified
- NEW `app/api/auth/resend-verification/route.js` — POST, requires session, throttle 60s

**Token:** `crypto.randomBytes(32).toString("hex")` (64 hex chars). Expiry: 24h. Stored as-is (acceptable for verification tokens, not passwords).

**Verify route flow:**
1. Look up `User.findOne({ verificationToken: token, verificationTokenExpiresAt: { $gt: new Date() } })` (use `+verificationToken +verificationTokenExpiresAt` since they're `select: false`).
2. If not found → redirect `/login?verifyError=invalid`.
3. Set `emailVerified = new Date()`, clear token fields, save.
4. Redirect `/dashboard?verified=1`.

**Resend route:** rate-limit to once per 60s per user via `verificationLastSentAt` check.

**Rationale:** Browser GET on link is the universal expectation. Throttle prevents abusing Resend quota. We do NOT auto-login on verification — user already has a session.

**Acceptance:** signup → email arrives → click link → redirected to dashboard with `?verified=1` toast → session reflects `emailVerified=true`.

---

## Slice 5 — Gate UI: banner + feature lock

**File targets:**
- NEW `components/VerifyEmailBanner.js` (client) — sticky top, gold/amber, "Verify your email" + "Resend email" button
- `app/dashboard/page.js` — mount banner if `!session.user.emailVerified`
- `app/admin/page.js` — mount banner (admin should also verify; cosmetic only since admin gate is separate)
- NEW `lib/require-verified.js` — `assertVerified(session)` throws `Response.json({error:"verify_email_required"}, {status:403})`
- `app/api/videos/route.js` POST — call `assertVerified`
- `app/api/videos/[id]/route.js` PUT/DELETE — call `assertVerified`

**Banner behavior:** dismissible per-session via `sessionStorage` (so user isn't trapped while verifying); reappears on next login. Click "Resend" → POST `/api/auth/resend-verification` → toast.

**Rationale:** matches user choice "Can log in but cannot upload/use features — banner". 403 from API routes will be handled by frontend (to be wired later when upload UI exists). Right now uploads are dummy/admin-only, so the gate is forward-compatible.

**Acceptance:** unverified user logs in → sees banner on dashboard → calling video POST returns 403 → after verify, banner disappears on next page load.

---

## Slice 6 — Google bypass + cleanup

**File targets:**
- `lib/auth.js` — in `signIn` callback for `account.provider === "google"`, set `emailVerified = new Date()` on the User doc if null
- One-shot script: delete the test `randomdf@gmail.com` user

**Rationale:** Google has already verified the email; forcing our own verification on top is friction with no security benefit.

**Acceptance:** sign in with a real Google account → User doc has `emailVerified` set immediately → no banner shown.

---

## Slice 7 — Anti-spam: rate-limit + Turnstile + disposable-email blocklist

**File targets:**
- NEW `lib/rate-limit.js` — in-memory LRU + Mongo-backed counter (so it survives across server restarts; `RateLimitHit` collection w/ `key`, `count`, `windowStart`, TTL index)
- `app/api/auth/signup/route.js` — limit 5 / IP / hour, 3 / email / hour
- `app/api/auth/resend-verification/route.js` — limit 5 / user / hour (in addition to existing 60s throttle)
- NEW `lib/disposable-emails.js` — bundled JSON blocklist (e.g. mailinator, guerrillamail, tempmail; ~3k entries, ~30KB)
- `app/api/auth/signup/route.js` — reject if `email`'s domain is in blocklist
- Integrate **Cloudflare Turnstile** (free, no Google, privacy-friendly) on signup form: client widget + server `siteverify` call before DB write
- ENV: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`

**Rationale:** layered defense. Even if a bot solves Turnstile, rate limit caps damage. Disposable blocklist stops the laziest abuse (95% of throwaway signups use ~50 well-known providers).

**Acceptance:** 6th signup from same IP in 1 hour returns 429. `name@mailinator.com` returns 400. Missing/invalid Turnstile token returns 400.

---

## Open questions (need user answer before Slice 3 starts)
- Resend API key (will request when we hit Slice 3)
- Whether to use `onboarding@resend.dev` (no DNS needed, dev-friendly) or wait until you have a verified domain

## Execution rules (per user's engineering style)
- Implement ONE slice → user tests → user confirms working → `git add -A && git commit` → next slice.
- No fallbacks, no silent error handling — if email send fails, signup must surface it.
- All async, no polling.
