/**
 * connect-facebook.js
 *
 * One-time script: opens a browser, asks you to authorize the app to manage
 * your Facebook Page(s), exchanges the code for a long-lived user token,
 * then fetches per-Page access tokens (which are non-expiring as long as
 * they were minted from a long-lived user token) and writes everything to
 * FB_TOKEN_FILE (default: secrets/fb_token.json).
 *
 * Run:  node connect-facebook.js
 *
 * Prereqs:
 *  1. FB_APP_ID and FB_APP_SECRET set in backend/.env
 *  2. In Meta for Developers (https://developers.facebook.com/apps):
 *     - Use cases -> "Manage everything on your Page" -> Customize ->
 *       add permissions: pages_show_list, pages_read_engagement, pages_manage_posts
 *     - Use cases -> "Authentication and account creation" -> Settings ->
 *       Valid OAuth Redirect URIs -> add EXACTLY: http://localhost:3100/oauth/facebook/callback
 *  3. Your FB user must be an Admin/Developer/Tester on the app
 *     (App roles -> Roles) and an Admin of the target Page.
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { URL } from "node:url";
import crypto from "node:crypto";
import open from "open";

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
];

function env(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

function parseRedirect(uri) {
  const u = new URL(uri);
  if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
    throw new Error(
      `FB_REDIRECT_URI must be a localhost URL for this CLI flow. Got: ${uri}`
    );
  }
  if (!u.port) {
    throw new Error(`FB_REDIRECT_URI must include an explicit port. Got: ${uri}`);
  }
  return { port: Number(u.port), pathname: u.pathname };
}

async function graph(version, pathSeg, params) {
  const url = new URL(`https://graph.facebook.com/${version}/${pathSeg}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
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

async function main() {
  const appId = env("FB_APP_ID");
  const appSecret = env("FB_APP_SECRET");
  const apiVersion = env("FB_API_VERSION", "v21.0");
  const redirectUri = env("FB_REDIRECT_URI");
  const tokenFile = env("FB_TOKEN_FILE", "./secrets/fb_token.json");
  const { port, pathname } = parseRedirect(redirectUri);

  // CSRF state token — verified on callback
  const state = crypto.randomBytes(16).toString("hex");

  // Bind loopback server to the exact port Meta has registered
  const server = http.createServer();
  // Ensure the listener is released on ANY exit path (success, error, Ctrl+C)
  // so a re-run never hits EADDRINUSE from a zombie socket.
  const closeServer = () => new Promise((r) => server.close(() => r()));
  const onFatal = () => {
    server.closeAllConnections?.();
    server.close(() => process.exit(1));
  };
  process.once("SIGINT", onFatal);
  process.once("SIGTERM", onFatal);

  await new Promise((resolve, reject) => {
    server.once("error", (e) => {
      if (e.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use. Free it (or change FB_REDIRECT_URI ` +
              `and update Meta's Valid OAuth Redirect URIs to match) and retry.`
          )
        );
      } else {
        reject(e);
      }
    });
    server.listen(port, "127.0.0.1", resolve);
  });

  try {
    await runAuthFlow({ appId, appSecret, apiVersion, redirectUri, tokenFile, port, pathname, state, server });
  } finally {
    await closeServer();
  }
}

async function runAuthFlow({ appId, appSecret, apiVersion, redirectUri, tokenFile, port, pathname, state, server }) {

  const authUrl = new URL(
    `https://www.facebook.com/${apiVersion}/dialog/oauth`
  );
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", SCOPES.join(","));
  authUrl.searchParams.set("response_type", "code");
  // Force Meta to re-show the Page picker every run, so previously skipped
  // Pages can be added without revoking the whole grant manually.
  authUrl.searchParams.set("auth_type", "rerequest");

  console.log("\nOpening browser for Facebook authorization...");
  console.log("If it does not open, paste this URL manually:\n");
  console.log(authUrl.toString(), "\n");

  const codePromise = new Promise((resolve, reject) => {
    server.on("request", (req, res) => {
      try {
        const url = new URL(req.url, redirectUri);
        if (url.pathname !== pathname) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(
            `<h2>Authorization failed: ${error}</h2><p>${errorDescription || ""}</p>`
          );
          reject(new Error(`OAuth error: ${error} ${errorDescription || ""}`));
          return;
        }
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        if (!code) {
          res.writeHead(400);
          res.end("Missing code");
          reject(new Error("No code in callback"));
          return;
        }
        if (returnedState !== state) {
          res.writeHead(400);
          res.end("State mismatch");
          reject(new Error("OAuth state mismatch (possible CSRF). Aborting."));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          `<h2>Authorized.</h2><p>You can close this tab and return to the terminal.</p>`
        );
        resolve(code);
      } catch (e) {
        reject(e);
      }
    });
  });

  await open(authUrl.toString());

  const code = await codePromise;
  // server is closed by the finally block in main()

  // 1. Exchange code -> short-lived user token
  console.log("Exchanging code for short-lived user token...");
  const shortLived = await graph(apiVersion, "oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  if (!shortLived.access_token) {
    throw new Error("No access_token in short-lived response");
  }

  // 2. Exchange short-lived -> long-lived (~60 days)
  console.log("Exchanging for long-lived user token (~60 days)...");
  const longLived = await graph(apiVersion, "oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLived.access_token,
  });
  if (!longLived.access_token) {
    throw new Error("No access_token in long-lived response");
  }

  const userToken = longLived.access_token;
  const expiresInSec = Number(longLived.expires_in || 0);
  const userTokenExpiresAt = expiresInSec
    ? new Date(Date.now() + expiresInSec * 1000).toISOString()
    : null;

  // 3. Identify the user (sanity check)
  const me = await graph(apiVersion, "me", {
    fields: "id,name",
    access_token: userToken,
  });

  // 4. Fetch Pages + per-Page access tokens.
  //    Per-Page tokens minted from a long-lived user token are themselves
  //    long-lived (effectively non-expiring while the grant is alive).
  console.log("Fetching Pages and per-Page tokens...");
  const pagesRes = await graph(apiVersion, "me/accounts", {
    fields: "id,name,category,access_token,tasks",
    access_token: userToken,
  });
  const pages = (pagesRes.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    tasks: p.tasks,
    accessToken: p.access_token,
  }));

  // 5. Persist
  fs.mkdirSync(path.dirname(tokenFile), { recursive: true });
  fs.writeFileSync(
    tokenFile,
    JSON.stringify(
      {
        user: { id: me.id, name: me.name },
        userToken,
        userTokenExpiresAt,
        pages,
        apiVersion,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("\nAuthorized successfully.");
  console.log(`User:            ${me.name}  (id: ${me.id})`);
  console.log(
    `User token:      long-lived${
      userTokenExpiresAt ? `, expires ${userTokenExpiresAt}` : ""
    }`
  );
  console.log(`Pages found:     ${pages.length}`);
  for (const p of pages) {
    console.log(`  - ${p.name}  (id: ${p.id}, category: ${p.category || "n/a"})`);
  }
  console.log(`\nTokens saved to: ${tokenFile}`);
  if (pages.length === 0) {
    console.log(
      "\nNo Pages returned. Make sure your FB user is an Admin of at least one Page,\n" +
        "and that you granted the requested permissions on the consent screen."
    );
  } else {
    console.log(
      `\nNext: node post-facebook.js <pageId> "Hello from MultiUploads"`
    );
  }
}

main().catch((err) => {
  console.error("\nconnect-facebook failed:", err.message);
  if (err.response) {
    console.error(JSON.stringify(err.response, null, 2));
  }
  process.exit(1);
});
