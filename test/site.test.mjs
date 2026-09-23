import test from "node:test";
import assert from "node:assert/strict";
import {
  readFile,
  mkdtemp,
  mkdir,
  writeFile,
  readdir,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { build, root, renderProfile, renderCv } from "../scripts/build.mjs";
import { validateProfile } from "../scripts/profile.mjs";
import { startServer } from "../scripts/server.mjs";

const original = JSON.parse(
  await readFile(path.join(root, "content/profile.json"), "utf8"),
);
test("unsafe URL schemes are rejected in all published link locations", () => {
  for (const key of ["bookingUrl", "linkedin", "siteUrl"]) {
    const p = structuredClone(original);
    p[key] = "javascript:alert(1)";
    assert.throws(() => validateProfile(p), /https/);
  }
  for (const key of ["projects", "writing"]) {
    const p = structuredClone(original);
    p[key][0].url = "data:text/html,bad";
    assert.throws(() => validateProfile(p), /https/);
  }
});
test("content and structured data cannot inject HTML", () => {
  const p = structuredClone(original);
  p.name = "<img src=x onerror=alert(1)>";
  p.intro = "</script><script>alert(1)</script>";
  const html = renderProfile(p);
  assert.ok(!html.includes(p.name));
  assert.ok(!html.includes(p.intro));
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("\\u003c/script>"));
  assert.ok(!renderCv(p).includes(p.name));
});
test("incomplete data fails before publishing", () => {
  const p = structuredClone(original);
  delete p.experience[0].role;
  assert.throws(() => validateProfile(p), /role/);
  const q = structuredClone(original);
  q.about = [];
  assert.throws(() => validateProfile(q), /About/);
});
test("site and CV are derived from the same content", () => {
  const p = structuredClone(original);
  p.experience[0].company = "A new company & team";
  assert.match(renderProfile(p), /A new company &amp; team/);
  assert.match(renderCv(p), /A new company &amp; team/);
});
test("build publishes only public artifacts, not sources or editor", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sg-build-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await build({ directory, profile: original });
  const files = await readdir(directory, { recursive: true });
  assert.ok(files.includes("index.html"));
  assert.ok(files.includes(path.join("cv", "index.html")));
  assert.ok(
    !files.some(
      (file) =>
        file.includes("profile.json") ||
        file.includes("editor") ||
        file.includes(".local") ||
        file.endsWith(".pdf"),
    ),
  );
  const html = await readFile(path.join(directory, "index.html"), "utf8");
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ["about", "experience", "work", "writing", "contact"])
    assert.ok(html.includes(`id="${id}"`));
});
test("local editor saves, rebuilds both views, and rejects unsafe writes", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sg-edit-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, "content"));
  await writeFile(
    path.join(directory, "content/profile.json"),
    JSON.stringify(original),
  );
  const server = await startServer({ port: 0, editable: true, directory });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const snapshot = await (await fetch(origin + "/api/profile")).json();
  const p = structuredClone(original);
  p.intro = "Updated profile from the local editor.";
  const send = (headers, body = { profile: p, revision: snapshot.revision }) =>
    fetch(origin + "/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  assert.equal((await send({ Origin: origin })).status, 403);
  assert.equal(
    (
      await send({
        Origin: "https://example.com",
        "X-Edit-Token": snapshot.token,
      })
    ).status,
    403,
  );
  const headers = { Origin: origin, "X-Edit-Token": snapshot.token };
  const malicious = structuredClone(p);
  malicious.writing[0].url = "javascript:alert(1)";
  assert.equal(
    (await send(headers, { profile: malicious, revision: snapshot.revision }))
      .status,
    400,
  );
  const result = await send(headers);
  assert.equal(result.status, 200);
  const saved = await result.json();
  assert.notEqual(saved.revision, snapshot.revision);
  assert.match(
    await (await fetch(origin + "/")).text(),
    /Updated profile from the local editor/,
  );
  assert.match(
    await (await fetch(origin + "/cv/")).text(),
    /Updated profile from the local editor/,
  );
  assert.equal(
    JSON.parse(
      await readFile(path.join(directory, "content/profile.json"), "utf8"),
    ).intro,
    p.intro,
  );
  assert.equal((await send(headers)).status, 409);
  assert.equal(
    (await fetch(origin + "/.local/profile-backup.json")).status,
    404,
  );
  assert.equal((await fetch(origin + "/content/profile.json")).status, 404);
  const badHostStatus = await new Promise((resolve, reject) => {
    const req = http.request(
      origin + "/api/profile",
      { headers: { Host: "evil.example" } },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(badHostStatus, 403);
  assert.equal(
    (
      await fetch(origin + "/api/profile", {
        headers: { "Sec-Fetch-Site": "cross-site" },
      })
    ).status,
    403,
  );
});
test("ordinary preview does not expose the editor or write endpoint", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "sg-preview-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, "content"));
  await writeFile(
    path.join(directory, "content/profile.json"),
    JSON.stringify(original),
  );
  const server = await startServer({ port: 0, directory });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(origin + "/edit/")).status, 404);
  assert.equal((await fetch(origin + "/api/profile")).status, 404);
  assert.equal(
    (await fetch(origin + "/api/profile", { method: "POST" })).status,
    405,
  );
});
