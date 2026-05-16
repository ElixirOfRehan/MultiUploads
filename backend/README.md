# MultiUploads Backend (CLI prototype)

Terminal-driven distribution backend. Built standalone to validate platform
upload logic before integrating into the main MultiUploads Next.js app.

**Status:** Slice 1 — YouTube upload via CLI.

## Setup

```powershell
cd D:\MultiUploads\backend
npm install
Copy-Item .env.example .env   # if .env doesn't already exist
# Edit .env if you need to override paths.
```

The OAuth Desktop client lives at `secrets/client_secret.json` (gitignored).

## Slice 1 — YouTube CLI upload

### One-time: authorize your channel

```powershell
node connect-youtube.js
```

A browser opens → sign in with the Google account that owns your YouTube
channel → click **Allow**. The script saves the refresh token to
`secrets/yt_token.json` (also gitignored).

### Upload a video

```powershell
node upload-video.js .\path\to\video.mp4 "My title" "My description"
# privacy defaults to 'private' (set via .env DEFAULT_PRIVACY)

# Or override per-call:
node upload-video.js .\path\to\video.mp4 "Public test" "Hi" public
```

Output prints videoId, watch URL, and Studio URL.

## Roadmap (after YouTube CLI proves out)

- Persist channels + jobs to MongoDB
- Add Instagram (Reels) uploader
- Add Facebook uploader
- Job queue + retry/backoff
- Wrap into HTTP service or library, glue back into MultiUploads Next.js app
