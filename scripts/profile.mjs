export function validateProfile(p) {
  if (!p || typeof p !== "object" || Array.isArray(p))
    throw new Error("The profile must be an object.");
  const text = (v, label, allowEmpty = false) => {
    if (typeof v !== "string" || (!allowEmpty && !v.trim()) || v.length > 10000)
      throw new Error(`${label} must be text (1–10,000 characters).`);
  };
  const strings = [
    "name",
    "role",
    "location",
    "bookingUrl",
    "linkedin",
    "siteUrl",
    "headline",
    "intro",
    "current",
    "aboutTitle",
    "interviewTitle",
    "interviewIntro",
    "growthTitle",
    "growthIntro",
    "additionalExperience",
    "projectsNote",
    "education",
    "languages",
    "contactTitle",
    "contactText",
    "updated",
  ];
  for (const key of strings) text(p[key], key);
  const secureUrl = (value, label) => {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${label} must be a complete https URL.`);
    }
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error(
        `${label} must be a complete https URL without credentials.`,
      );
  };
  for (const key of ["bookingUrl", "linkedin", "siteUrl"])
    secureUrl(p[key], key);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(p.updated) ||
    Number.isNaN(Date.parse(p.updated))
  )
    throw new Error("Updated must use YYYY-MM-DD.");
  const array = (value, label, check, min = 0) => {
    if (!Array.isArray(value) || value.length < min || value.length > 50)
      throw new Error(`${label} must contain ${min}–50 items.`);
    value.forEach((v, i) => check(v, `${label} ${i + 1}`));
  };
  array(p.about, "About", text, 1);
  array(p.credentials, "Credentials", text);
  const groups = {
    achievements: ["title", "context", "description"],
    expertise: ["title", "description"],
    vectors: ["name", "description"],
    interviewJourney: ["name"],
    growthLayers: ["name", "summary"],
    experience: ["company", "role", "period", "summary"],
    projects: ["name", "description", "focus"],
    writing: ["title", "topic", "publication", "url"],
  };
  for (const [key, fields] of Object.entries(groups)) {
    array(p[key], key, (item, label) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        throw new Error(`${label} must be an object.`);
      for (const field of fields)
        text(
          item[field],
          `${label}: ${field}`,
          field === "url" && key === "projects",
        );
      if ("url" in item && item.url) secureUrl(item.url, `${label}: URL`);
      if (key === "experience") {
        array(item.highlights, label + " highlights", text);
        array(item.tags, label + " tags", text);
      }
      if (key === "expertise") array(item.skills, label + " skills", text);
      if (key === "interviewJourney" || key === "growthLayers") {
        const nested = key === "interviewJourney" ? "steps" : "practices";
        array(item[nested], `${label} ${nested}`, (entry, entryLabel) => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry))
            throw new Error(`${entryLabel} must be an object.`);
          for (const field of nested === "steps" ? ["name", "description"] : ["name", "description", "tip"])
            text(entry[field], `${entryLabel}: ${field}`);
        }, 1);
      }
    });
  }
  for (const key of ["interviewJourney", "growthLayers"])
    if (!p[key].length) throw new Error(`${key} must contain at least one item.`);
  const allowed = new Set([
    ...strings,
    "about",
    "credentials",
    ...Object.keys(groups),
  ]);
  for (const key of Object.keys(p))
    if (!allowed.has(key)) throw new Error(`Unknown profile field: ${key}`);
  return p;
}

export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
