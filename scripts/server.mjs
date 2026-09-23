import http from "node:http";
import path from "node:path";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { build, root } from "./build.mjs";
import { validateProfile } from "./profile.mjs";

export const revisionOf = (text) =>
  createHash("sha256").update(text).digest("hex");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

export async function startServer({
  port = 4321,
  editable = false,
  directory = root,
} = {}) {
  const output = path.join(directory, "dist");
  const source = path.join(directory, "content/profile.json");
  const initial = JSON.parse(await readFile(source, "utf8"));
  await build({ directory: output, profile: initial });
  const token = randomBytes(32).toString("hex");
  let saving = false;
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host;
    const expectedPort = server.address().port;
    const allowed = [`127.0.0.1:${expectedPort}`, `localhost:${expectedPort}`];
    const send = (code, body, type = "application/json; charset=utf-8") => {
      res.writeHead(code, {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
        "Referrer-Policy": "same-origin",
        "Content-Security-Policy":
          "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'",
      });
      res.end(
        typeof body === "object" && !Buffer.isBuffer(body)
          ? JSON.stringify(body)
          : body,
      );
    };
    if (!allowed.includes(host))
      return send(403, { error: "Unrecognized host." });
    const sameOrigin = req.headers.origin === `http://${host}`;
    if (req.headers.origin && !sameOrigin)
      return send(403, { error: "Cross-origin requests are not allowed." });
    if (
      req.headers["sec-fetch-site"] &&
      !["same-origin", "none"].includes(req.headers["sec-fetch-site"])
    )
      return send(403, { error: "Open the editor directly on localhost." });
    try {
      const url = new URL(req.url, `http://${host}`);
      if (url.pathname === "/api/profile" && editable) {
        if (req.method === "GET") {
          const raw = await readFile(source, "utf8");
          return send(200, {
            profile: JSON.parse(raw),
            revision: revisionOf(raw),
            token,
          });
        }
        if (req.method !== "POST")
          return send(405, { error: "Method not allowed." });
        if (!sameOrigin || req.headers["x-edit-token"] !== token)
          return send(403, {
            error: "Editor session expired. Reload before saving.",
          });
        if (!req.headers["content-type"]?.startsWith("application/json"))
          return send(415, { error: "Expected JSON." });
        if (saving)
          return send(409, {
            error: "Another save is in progress. Try again.",
          });
        saving = true;
        try {
          const parts = [];
          let length = 0;
          for await (const chunk of req) {
            length += chunk.length;
            if (length > 150000)
              return send(413, { error: "Profile is too large." });
            parts.push(chunk);
          }
          const payload = JSON.parse(Buffer.concat(parts).toString("utf8"));
          const raw = await readFile(source, "utf8");
          if (payload.revision !== revisionOf(raw))
            return send(409, {
              error:
                "The file changed since you opened it. Reload this page before saving; copy any unsaved text first.",
            });
          const profile = validateProfile(payload.profile);
          profile.updated = new Date().toISOString().slice(0, 10);
          await build({ directory: output, profile });
          const next = JSON.stringify(profile, null, 2) + "\n";
          await mkdir(path.join(directory, ".local"), { recursive: true });
          await writeFile(
            path.join(directory, ".local/profile-backup.json"),
            raw,
          );
          await writeFile(source + ".tmp", next);
          await rename(source + ".tmp", source);
          return send(200, {
            revision: revisionOf(next),
            updated: profile.updated,
            message:
              "Saved on this computer. The public site changes after you publish.",
          });
        } finally {
          saving = false;
        }
      }
      if (req.method !== "GET" && req.method !== "HEAD")
        return send(405, { error: "Method not allowed." });
      const editorFiles = {
        "/edit/": "index.html",
        "/edit/editor.js": "editor.js",
        "/edit/editor.css": "editor.css",
      };
      if (url.pathname === "/edit" && editable) {
        res.writeHead(302, { Location: "/edit/" });
        return res.end();
      }
      if (editable && editorFiles[url.pathname]) {
        const file = path.join(root, "editor", editorFiles[url.pathname]);
        return send(200, await readFile(file), mime[path.extname(file)]);
      }
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.includes("\0") || pathname.includes("\\"))
        return send(400, { error: "Invalid path." });
      if (pathname.endsWith("/")) pathname += "index.html";
      const file = path.resolve(output, "." + pathname);
      if (!file.startsWith(output + path.sep))
        return send(403, { error: "Path not allowed." });
      return send(
        200,
        await readFile(file),
        mime[path.extname(file)] ?? "application/octet-stream",
      );
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EISDIR")
        return send(404, "Page not found.", "text/plain; charset=utf-8");
      return send(400, { error: error.message });
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const editable = process.argv.includes("--edit");
  const server = await startServer({ editable });
  console.log(`Biography: http://127.0.0.1:${server.address().port}/`);
  if (editable)
    console.log(
      `Local editor: http://127.0.0.1:${server.address().port}/edit/`,
    );
}
