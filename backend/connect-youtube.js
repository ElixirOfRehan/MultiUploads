/**
 * connect-youtube.js
 *
 * One-time script: opens a browser, asks you to authorize the app to manage
 * your YouTube channel, exchanges the code for tokens, then writes the
 * refresh token + access token to YT_TOKEN_FILE (default: secrets/yt_token.json).
 *
 * Run:  node connect-youtube.js
 *
 * After it succeeds, upload-video.js uses the saved refresh token to mint
 * fresh access tokens automatically — you only authorize once.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { URL } from "node:url";
import { google } from "googleapis";
import open from "open";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",          // manage channel (thumbnails, playlists)
  "https://www.googleapis.com/auth/youtube.readonly", // read channel info
];

function loadClientSecret() {
  const p = process.env.GOOGLE_CLIENT_SECRET_FILE;
  if (!p) throw new Error("GOOGLE_CLIENT_SECRET_FILE is not set in .env");
  if (!fs.existsSync(p)) throw new Error(`client secret file not found: ${p}`);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  const node = raw.installed || raw.web;
  if (!node) throw new Error("client_secret.json missing 'installed' or 'web' key");
  if (!node.client_id || !node.client_secret) {
    throw new Error("client_secret.json missing client_id or client_secret");
  }
  return { clientId: node.client_id, clientSecret: node.client_secret };
}

function pickPort() {
  // Let the OS choose any free port by binding to 0
  return 0;
}

async function main() {
  const { clientId, clientSecret } = loadClientSecret();

  // Bind a temporary loopback server to receive the OAuth callback
  const server = http.createServer();
  await new Promise((res) => server.listen(pickPort(), "127.0.0.1", res));
  const { port } = server.address();
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",      // ask for refresh token
    prompt: "consent",            // force refresh_token even if previously granted
    scope: SCOPES,
  });

  console.log("\nOpening browser for Google authorization...");
  console.log("If it does not open, paste this URL manually:\n");
  console.log(authUrl, "\n");

  const codePromise = new Promise((resolve, reject) => {
    server.on("request", async (req, res) => {
      try {
        const url = new URL(req.url, redirectUri);
        if (url.pathname !== "/oauth2callback") {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`<h2>Authorization failed: ${error}</h2><p>You can close this tab.</p>`);
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        if (!code) {
          res.writeHead(400);
          res.end("Missing code");
          reject(new Error("No code in callback"));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<h2>Authorized.</h2><p>You can close this tab and return to the terminal.</p>`);
        resolve(code);
      } catch (e) {
        reject(e);
      }
    });
  });

  await open(authUrl);

  const code = await codePromise;
  server.close();

  console.log("Exchanging code for tokens...");
  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh_token returned. Revoke prior access at https://myaccount.google.com/permissions and re-run."
    );
  }

  oauth2.setCredentials(tokens);

  // Quick sanity check — fetch the channel that just authorized
  const yt = google.youtube({ version: "v3", auth: oauth2 });
  const me = await yt.channels.list({ part: ["snippet", "statistics"], mine: true });
  const ch = me.data.items?.[0];

  const tokenFile = process.env.YT_TOKEN_FILE || "./secrets/yt_token.json";
  fs.mkdirSync(path.dirname(tokenFile), { recursive: true });
  fs.writeFileSync(
    tokenFile,
    JSON.stringify(
      {
        ...tokens,
        channel: ch
          ? {
              id: ch.id,
              title: ch.snippet?.title,
              subscriberCount: ch.statistics?.subscriberCount,
            }
          : null,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("\nAuthorized successfully.");
  if (ch) {
    console.log(`Channel:   ${ch.snippet?.title}  (id: ${ch.id})`);
    console.log(`Subs:      ${ch.statistics?.subscriberCount ?? "n/a"}`);
  }
  console.log(`Tokens saved to: ${tokenFile}`);
  console.log("\nNext: node upload-video.js <path-to-mp4> \"<title>\" \"<description>\"");
}

main().catch((err) => {
  console.error("\nconnect-youtube failed:", err.message);
  process.exit(1);
});
