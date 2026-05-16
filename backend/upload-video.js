/**
 * upload-video.js
 *
 * CLI: upload a local video file to your YouTube channel using the refresh
 * token saved by connect-youtube.js.
 *
 * Run:
 *   node upload-video.js <file> "<title>" "<description>" [privacy]
 *
 * Example:
 *   node upload-video.js .\sample.mp4 "Test upload" "Hello from MultiUploads backend" private
 *
 * privacy is optional and defaults to DEFAULT_PRIVACY in .env (private).
 * Allowed: private | unlisted | public
 */

import "dotenv/config";
import fs from "node:fs";
import { google } from "googleapis";

function loadClientSecret() {
  const p = process.env.GOOGLE_CLIENT_SECRET_FILE;
  if (!p || !fs.existsSync(p)) {
    throw new Error(`GOOGLE_CLIENT_SECRET_FILE missing or file not found: ${p}`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const node = raw.installed || raw.web;
  return { clientId: node.client_id, clientSecret: node.client_secret };
}

function loadTokens() {
  const p = process.env.YT_TOKEN_FILE || "./secrets/yt_token.json";
  if (!fs.existsSync(p)) {
    throw new Error(`Token file not found: ${p}\nRun:  node connect-youtube.js  first.`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function fmtBytes(n) {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${u[i]}`;
}

async function main() {
  const [, , file, title, description, privacyArg] = process.argv;
  if (!file || !title) {
    console.error('Usage: node upload-video.js <file> "<title>" "<description>" [privacy]');
    process.exit(1);
  }
  if (!fs.existsSync(file)) {
    throw new Error(`Video file not found: ${file}`);
  }

  const privacy = (privacyArg || process.env.DEFAULT_PRIVACY || "private").toLowerCase();
  if (!["private", "unlisted", "public"].includes(privacy)) {
    throw new Error(`Invalid privacy '${privacy}'. Use private, unlisted, or public.`);
  }

  const stat = fs.statSync(file);
  console.log(`File:    ${file}  (${fmtBytes(stat.size)})`);
  console.log(`Title:   ${title}`);
  console.log(`Privacy: ${privacy}`);
  console.log("");

  const { clientId, clientSecret } = loadClientSecret();
  const tokens = loadTokens();

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: tokens.refresh_token });

  const yt = google.youtube({ version: "v3", auth: oauth2 });

  console.log("Uploading...");
  const startedAt = Date.now();
  let lastPct = -1;

  const res = await yt.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description: description || "",
          categoryId: "22", // People & Blogs (safe default; we'll make this configurable later)
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(file),
      },
    },
    {
      // Track upload progress
      onUploadProgress: (evt) => {
        const pct = Math.floor((evt.bytesRead / stat.size) * 100);
        if (pct !== lastPct) {
          lastPct = pct;
          process.stdout.write(`\r  ${pct}% (${fmtBytes(evt.bytesRead)} / ${fmtBytes(stat.size)})`);
        }
      },
    }
  );

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write("\n");

  const v = res.data;
  console.log("\nUpload complete.");
  console.log(`videoId:        ${v.id}`);
  console.log(`status:         ${v.status?.uploadStatus} / ${v.status?.privacyStatus}`);
  console.log(`watch URL:      https://youtube.com/watch?v=${v.id}`);
  console.log(`studio URL:     https://studio.youtube.com/video/${v.id}/edit`);
  console.log(`elapsed:        ${elapsed}s`);
}

main().catch((err) => {
  console.error("\nupload-video failed:", err.message);
  if (err.response?.data) {
    console.error(JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
