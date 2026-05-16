/**
 * post-facebook.js
 *
 * CLI: post text, a photo, or a video to a Facebook Page using the per-Page
 * access token saved by connect-facebook.js.
 *
 * Usage:
 *   node post-facebook.js <pageId> "<message>"                      # text
 *   node post-facebook.js <pageId> "<caption>" <path-to-image>      # photo
 *   node post-facebook.js <pageId> "<description>" <path-to-video>  # video
 *
 * Media type is inferred from file extension:
 *   .jpg .jpeg .png .gif .webp   -> photo  (POST /{pageId}/photos)
 *   .mp4 .mov .m4v .avi .mkv     -> video  (POST /{pageId}/videos, resumable for large)
 *
 * The Page must have been authorized via `node connect-facebook.js` first.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".m4v", ".avi", ".mkv"]);
// Threshold above which we use the resumable upload protocol for videos.
// Below this, a single multipart POST is simpler and faster.
const VIDEO_RESUMABLE_THRESHOLD = 100 * 1024 * 1024; // 100 MB

function env(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

function loadTokenFile() {
  const p = env("FB_TOKEN_FILE", "./secrets/fb_token.json");
  if (!fs.existsSync(p)) {
    throw new Error(
      `Token file not found: ${p}\nRun:  node connect-facebook.js  first.`
    );
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

function classifyMedia(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  throw new Error(
    `Unsupported file extension '${ext}'. Supported: ${[
      ...IMAGE_EXTS,
      ...VIDEO_EXTS,
    ].join(", ")}`
  );
}

async function graphJson(url) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const msg = body.error?.message || `HTTP ${res.status}`;
    const err = new Error(`Graph API error: ${msg}`);
    err.response = body;
    throw err;
  }
  return body;
}

async function graphPost(url, form) {
  const res = await fetch(url, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const msg = body.error?.message || `HTTP ${res.status}`;
    const err = new Error(`Graph API error: ${msg}`);
    err.response = body;
    throw err;
  }
  return body;
}

async function postText({ pageId, pageToken, apiVersion, message }) {
  const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
  const form = new URLSearchParams();
  form.set("message", message);
  form.set("access_token", pageToken);
  return graphPost(url, form);
}

async function postPhoto({ pageId, pageToken, apiVersion, message, filePath }) {
  const url = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
  const form = new FormData();
  form.set("caption", message);
  form.set("access_token", pageToken);
  // Read file into a Blob (Node 18+ has Blob/FormData/fetch built in)
  const buf = await fs.promises.readFile(filePath);
  form.set("source", new Blob([buf]), path.basename(filePath));
  return graphPost(url, form);
}

async function postVideoSimple({ pageId, pageToken, apiVersion, message, filePath }) {
  const url = `https://graph-video.facebook.com/${apiVersion}/${pageId}/videos`;
  const form = new FormData();
  form.set("description", message);
  form.set("access_token", pageToken);
  const buf = await fs.promises.readFile(filePath);
  form.set("source", new Blob([buf]), path.basename(filePath));
  return graphPost(url, form);
}

async function postVideoResumable({ pageId, pageToken, apiVersion, message, filePath }) {
  const url = `https://graph-video.facebook.com/${apiVersion}/${pageId}/videos`;
  const fileSize = (await fs.promises.stat(filePath)).size;

  // 1. Start
  const startForm = new URLSearchParams();
  startForm.set("upload_phase", "start");
  startForm.set("file_size", String(fileSize));
  startForm.set("access_token", pageToken);
  const startRes = await graphPost(url, startForm);
  const { upload_session_id, video_id } = startRes;
  let { start_offset, end_offset } = startRes;
  start_offset = Number(start_offset);
  end_offset = Number(end_offset);

  // 2. Transfer chunks
  const fh = await fs.promises.open(filePath, "r");
  try {
    while (start_offset < end_offset) {
      const length = end_offset - start_offset;
      const chunk = Buffer.alloc(length);
      await fh.read(chunk, 0, length, start_offset);

      const chunkForm = new FormData();
      chunkForm.set("upload_phase", "transfer");
      chunkForm.set("upload_session_id", upload_session_id);
      chunkForm.set("start_offset", String(start_offset));
      chunkForm.set("access_token", pageToken);
      chunkForm.set("video_file_chunk", new Blob([chunk]), path.basename(filePath));

      const pct = Math.floor((start_offset / fileSize) * 100);
      process.stdout.write(
        `\r  uploading ${pct}% (${fmtBytes(start_offset)} / ${fmtBytes(fileSize)})`
      );

      const transferRes = await graphPost(url, chunkForm);
      start_offset = Number(transferRes.start_offset);
      end_offset = Number(transferRes.end_offset);
    }
    process.stdout.write(
      `\r  uploading 100% (${fmtBytes(fileSize)} / ${fmtBytes(fileSize)})\n`
    );
  } finally {
    await fh.close();
  }

  // 3. Finish
  const finishForm = new URLSearchParams();
  finishForm.set("upload_phase", "finish");
  finishForm.set("upload_session_id", upload_session_id);
  finishForm.set("description", message);
  finishForm.set("access_token", pageToken);
  const finishRes = await graphPost(url, finishForm);

  return { id: video_id, ...finishRes };
}

async function main() {
  const [, , pageId, message, filePathArg] = process.argv;
  if (!pageId || message === undefined) {
    console.error(
      'Usage:\n' +
        '  node post-facebook.js <pageId> "<message>"\n' +
        '  node post-facebook.js <pageId> "<caption>" <path-to-image>\n' +
        '  node post-facebook.js <pageId> "<description>" <path-to-video>'
    );
    process.exit(1);
  }

  const tokenData = loadTokenFile();
  const apiVersion = tokenData.apiVersion || env("FB_API_VERSION", "v21.0");
  const page = (tokenData.pages || []).find((p) => p.id === pageId);
  if (!page) {
    const known = (tokenData.pages || []).map((p) => `${p.id} (${p.name})`).join(", ") || "<none>";
    throw new Error(
      `Page id '${pageId}' not found in ${env("FB_TOKEN_FILE", "./secrets/fb_token.json")}.\n` +
        `Known pages: ${known}\n` +
        `Re-run connect-facebook.js if you added a Page after authorizing.`
    );
  }
  const pageToken = page.accessToken;
  if (!pageToken) throw new Error(`No access token cached for Page ${pageId}`);

  console.log(`Page:    ${page.name}  (id: ${page.id})`);
  console.log(`Message: ${message}`);

  let result;
  if (!filePathArg) {
    console.log(`Mode:    text\n`);
    console.log("Posting...");
    result = await postText({ pageId, pageToken, apiVersion, message });
  } else {
    if (!fs.existsSync(filePathArg)) {
      throw new Error(`File not found: ${filePathArg}`);
    }
    const kind = classifyMedia(filePathArg);
    const stat = fs.statSync(filePathArg);
    console.log(`Mode:    ${kind}`);
    console.log(`File:    ${filePathArg}  (${fmtBytes(stat.size)})\n`);

    if (kind === "image") {
      console.log("Uploading photo...");
      result = await postPhoto({
        pageId,
        pageToken,
        apiVersion,
        message,
        filePath: filePathArg,
      });
    } else {
      if (stat.size >= VIDEO_RESUMABLE_THRESHOLD) {
        console.log(`Uploading video (resumable, threshold ${fmtBytes(VIDEO_RESUMABLE_THRESHOLD)})...`);
        result = await postVideoResumable({
          pageId,
          pageToken,
          apiVersion,
          message,
          filePath: filePathArg,
        });
      } else {
        console.log("Uploading video (single request)...");
        result = await postVideoSimple({
          pageId,
          pageToken,
          apiVersion,
          message,
          filePath: filePathArg,
        });
      }
    }
  }

  console.log("\nPost complete.");
  // Different endpoints return different id shapes:
  //   /feed   -> { id: "<pageId>_<postId>" }
  //   /photos -> { id: "<photoId>", post_id: "<pageId>_<postId>" }
  //   /videos -> { id: "<videoId>" }  (post_id often null until processing finishes)
  const postId = result.post_id || result.id;
  console.log(`id:           ${result.id}`);
  if (result.post_id && result.post_id !== result.id) {
    console.log(`post_id:      ${result.post_id}`);
  }
  if (postId) {
    console.log(`permalink:    https://www.facebook.com/${postId}`);
  }
}

main().catch((err) => {
  console.error("\npost-facebook failed:", err.message);
  if (err.response) {
    console.error(JSON.stringify(err.response, null, 2));
  }
  process.exit(1);
});
