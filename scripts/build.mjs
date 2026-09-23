import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { validateProfile, escapeHtml as e } from "./profile.mjs";
import { createHash } from "node:crypto";

export const root = fileURLToPath(new URL("../", import.meta.url));
const arrow = '<span aria-hidden="true">↗</span>';
const lines = (value) => e(value).replace(/\n/g, "<br>");
const tags = (values) =>
  `<ul class="tags">${values.map((t) => `<li>${e(t)}</li>`).join("")}</ul>`;
const label = (n, title) =>
  `<div class="section-label"><span>${n}</span><p>${title}</p></div>`;
const external = (url, text, cls = "") =>
  `<a class="${cls}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(text)} ${arrow}</a>`;

export function renderProfile(input) {
  const p = validateProfile(input);
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: p.siteUrl,
    description: p.intro,
    jobTitle: p.current,
    sameAs: [p.linkedin, p.github],
    knowsAbout: p.expertise.flatMap((x) => x.skills),
  }).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(p.name)} — AI Infrastructure & Product Leadership</title>
<meta name="description" content="${e(p.intro)}"><meta name="theme-color" content="#f6f7f5">
<meta property="og:type" content="profile"><meta property="og:title" content="${e(p.name)} — ${e(p.role)}"><meta property="og:description" content="${e(p.intro)}"><meta property="og:url" content="${e(p.siteUrl)}">
<meta name="twitter:card" content="summary"><link rel="canonical" href="${e(p.siteUrl)}"><link rel="icon" href="./assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="./style.css"><script type="application/ld+json">${schema}</script><script src="./app.js" defer></script>
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><a class="brand" href="#top" aria-label="${e(p.name)}, home"><span class="monogram">sg<span>/</span></span><span class="brand-name">${e(p.name)}</span></a>
<nav aria-label="Main navigation"><a href="#about">About</a><a href="#experience">Experience</a><a href="#work">Focus</a><a href="#writing">Writing</a></nav><a class="header-contact" href="#contact">Let’s talk ${arrow}</a></header>
<main id="main"><section class="hero page-width" id="top" aria-labelledby="hero-title">
<div class="hero-copy"><p class="eyebrow">${e(p.name)} <span>/</span> ${e(p.location)}</p><h1 id="hero-title">${lines(p.headline)}</h1><p class="hero-role">${e(p.role)}</p><p class="hero-intro">${e(p.intro)}</p>
<div class="hero-actions"><a class="button primary" href="#experience">Career & achievements <span aria-hidden="true">↓</span></a><a class="text-link" href="./cv/">View & print CV ${arrow}</a></div>
<p class="current-role"><span class="small-line" aria-hidden="true"></span>${e(p.current)}</p></div>
<figure class="portrait"><div class="portrait-frame"><img src="./assets/sergey-goncharov.png" alt="${e(p.name)}" width="429" height="653" fetchpriority="high"><span class="portrait-corner" aria-hidden="true">SG /</span></div><figcaption><span>Architecture meets product.</span><span>Prague / Global</span></figcaption></figure>
</section>
<div class="career-strip page-width" aria-label="Career across"><span>Built on experience at</span><div><span>HP / HPE</span><span>Red Hat</span><span>Mirantis</span><span>Virtuozzo</span></div></div>
<section id="about" class="section page-width" aria-labelledby="about-title">${label("01", "Perspective")}<div class="section-body"><h2 id="about-title">${lines(p.aboutTitle)}</h2><div class="about-copy">${p.about.map((t) => `<p>${e(t)}</p>`).join("")}</div><div class="expertise-grid">${p.expertise.map((x, i) => `<article><span class="micro-index">0${i + 1}</span><h3>${e(x.title)}</h3><p>${e(x.description)}</p>${tags(x.skills)}</article>`).join("")}</div></div></section>
<section class="vectors-band" aria-labelledby="vectors-title"><div class="page-width"><div class="vectors-intro"><p class="eyebrow">A working philosophy</p><h2 id="vectors-title">Five vectors.<br>Every decision.</h2><p>I use these five lenses to question a design, evaluate a platform and decide what to build next.</p></div><ol class="vectors">${p.vectors.map((v, i) => `<li><span>0${i + 1}</span><h3>${e(v.name)}</h3><p>${e(v.description)}</p></li>`).join("")}</ol></div></section>
<section id="experience" class="section page-width" aria-labelledby="experience-title">${label("02", "Career & impact")}<div class="section-body"><div class="section-heading"><h2 id="experience-title">A career across the stack.</h2><a class="text-link" href="./cv/">Full CV ${arrow}</a></div><div class="achievements" aria-label="Selected achievements">${p.achievements.map((x) => `<article><p class="eyebrow">${e(x.context)}</p><h3>${e(x.title)}</h3><p>${e(x.description)}</p></article>`).join("")}</div><h3 class="timeline-heading">Professional experience</h3><div class="timeline">${p.experience.map((x, i) => `<article class="role-entry"><div class="role-date"><span>${e(x.period)}</span>${i === 0 ? '<span class="present-label">Current</span>' : ""}</div><div><h3>${e(x.company)}</h3><p class="job-title">${e(x.role)}</p><p>${e(x.summary)}</p><details><summary>Scope & focus <span aria-hidden="true">+</span></summary><ul>${x.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul></details>${tags(x.tags)}</div></article>`).join("")}</div><p class="career-note">${e(p.additionalExperience)}</p><div class="credentials"><div><h3>Education & credentials</h3><p>${e(p.education)}</p><ul>${p.credentials.map((c) => `<li>${e(c)}</li>`).join("")}</ul></div><div><h3>Languages</h3><p>${e(p.languages)}</p></div></div></div></section>
<section id="work" class="work-section" aria-labelledby="work-title"><div class="section page-width">${label("03", "Current focus")}<div class="section-body"><div class="section-heading"><h2 id="work-title">Where I’m taking this next.</h2><span class="initiative-count">${p.projects.length} active initiatives</span></div><p class="section-lead">Applying enterprise experience to the next set of infrastructure and AI challenges.</p><div class="focus-list">${p.projects.map((x, i) => `<article><span class="micro-index">${String(i + 1).padStart(2, "0")}</span><div><h3>${e(x.name)}</h3><p class="focus-area">${e(x.focus)}</p></div><p>${e(x.description)}</p></article>`).join("")}</div><p class="projects-note">${e(p.projectsNote)}</p></div></div></section>
<section id="writing" class="section page-width" aria-labelledby="writing-title">${label("04", "Writing")}<div class="section-body"><h2 id="writing-title">Thinking out loud.</h2><p class="section-lead">Notes on the systems we build, the costs we overlook and the responsibility that comes with intelligent software.</p><div class="writing-list">${p.writing.map((x) => `<a href="${e(x.url)}" target="_blank" rel="noopener noreferrer"><div><p class="eyebrow">${e(x.topic)} <span>/</span> ${e(x.publication)}</p><h3>${e(x.title)}</h3></div>${arrow}</a>`).join("")}</div></div></section>
<section id="contact" class="contact-section page-width" aria-labelledby="contact-title"><div><p class="eyebrow">Have a useful problem?</p><h2 id="contact-title">${lines(p.contactTitle)}</h2><p>${e(p.contactText)}</p></div><div class="contact-links">${external(p.bookingUrl, "Book a meeting with me", "booking-link")}<div>${external(p.linkedin, "LinkedIn", "text-link")}${external(p.github, "GitHub", "text-link")}</div></div></section>
</main><footer class="page-width"><span>© ${e(p.updated.slice(0, 4))} ${e(p.name)}</span><span>${e(p.location)} · Updated ${e(p.updated)}</span><a href="#top">Back to top ↑</a><a class="owner-link" href="https://github.com/sgprg/sgprg.github.io/edit/main/content/profile.json">Edit content ${arrow}</a></footer>
</body></html>`;
}

export function renderCv(p) {
  validateProfile(p);
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(p.name)} — CV</title><meta name="robots" content="noindex"><link rel="icon" href="../assets/favicon.svg"><link rel="stylesheet" href="../cv.css"><script src="../cv.js" defer></script></head><body><div class="cv-toolbar"><a href="../">← Back to biography</a><button id="print-cv">Print / Save as PDF</button></div><main><header><h1>${e(p.name)}</h1><p class="role">${e(p.role)}</p><p>${e(p.location)} · <a href="${e(p.bookingUrl)}">Book a meeting with me</a> · <a href="${e(p.linkedin)}">LinkedIn / sergeyrh</a> · <a href="${e(p.github)}">GitHub / sgprg</a></p></header><section><h2>Profile</h2><p>${e(p.intro)}</p></section><section><h2>Experience</h2>${p.experience.map((x) => `<article><div class="job-heading"><h3>${e(x.company)}</h3><span>${e(x.period)}</span></div><p class="job-role">${e(x.role)}</p><p>${e(x.summary)}</p><ul>${x.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul></article>`).join("")}<p>${e(p.additionalExperience)}</p></section><section><h2>Selected achievements</h2>${p.achievements.map((x) => `<article><h3>${e(x.title)} <span class="status">${e(x.context)}</span></h3><p>${e(x.description)}</p></article>`).join("")}</section><section><h2>Expertise</h2>${p.expertise.map((x) => `<p><strong>${e(x.title)}:</strong> ${e(x.skills.join(", "))}.</p>`).join("")}</section><section><h2>Education & credentials</h2><p>${e(p.education)}</p><p>${e(p.credentials.join(" · "))}</p><p><strong>Languages:</strong> ${e(p.languages)}</p></section></main></body></html>`;
}

export async function build({
  directory = path.join(root, "dist"),
  profile,
} = {}) {
  const p =
    profile ??
    JSON.parse(await readFile(path.join(root, "content/profile.json"), "utf8"));
  let html = renderProfile(p),
    cv = renderCv(p);
  await mkdir(path.join(directory, "cv"), { recursive: true });
  await cp(path.join(root, "public"), directory, { recursive: true });
  const assetNames = new Map();
  for (const file of [
    "assets/inter-latin.woff2",
    "assets/favicon.svg",
    "assets/sergey-goncharov.png",
    "app.js",
    "cv.js",
    "style.css",
    "cv.css",
  ]) {
    let bytes = await readFile(path.join(root, "public", file));
    if (file.endsWith(".css")) {
      let css = bytes.toString("utf8");
      for (const [original, versioned] of assetNames) css = css.replaceAll(`./${original}`, `./${versioned}`);
      bytes = Buffer.from(css);
    }
    const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const versioned = file.replace(/(\.[^.]+)$/, `.${digest}$1`);
    assetNames.set(file, versioned);
    await writeFile(path.join(directory, versioned), bytes);
    html = html.replaceAll(`="./${file}"`, `="./${versioned}"`);
    cv = cv.replaceAll(`="../${file}"`, `="../${versioned}"`);
  }
  await writeFile(path.join(directory, "index.html"), html);
  await writeFile(path.join(directory, "cv/index.html"), cv);
  await writeFile(path.join(directory, ".nojekyll"), "");
  await writeFile(
    path.join(directory, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap.xml", p.siteUrl).href}\n`,
  );
  await writeFile(
    path.join(directory, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(p.siteUrl)}</loc><lastmod>${e(p.updated)}</lastmod></url></urlset>`,
  );
  return p;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await build();
  console.log("Built biography and print CV in dist/.");
}
