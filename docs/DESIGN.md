# Design research

Reviewed 23 September 2026.

The references are useful examples of clear professional communication. No claim is made that a specific design caused hiring success or outperforms alternatives in a controlled study.

## References

- [Brittany Chiang](https://brittanychiang.com/) — concise role statement, curated experience and projects, direct links to source work, visible CV, and a writing section. Applied: a scannable story with outward paths to evidence, accessible anchors and meaningful project stages. The visual design and code are original.
- [Lee Robinson](https://leerob.com/) — personal writing, a direct biography and minimal interface. Applied: first-person language, clear point of view and selective content.
- [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — automatic publishing from versioned source, with a separate validation and deployment job.

## Direction

A typographic, editorial portfolio for a senior infrastructure architect and product leader. A monochrome portrait, ink and white palette, a restrained lime accent, indexed sections and a five-vector panel connect a human introduction with engineering discipline. Typography and whitespace establish hierarchy; there are no simulated terminal panels or decorative performance claims.

The first screen answers who Sergey is, what he works on, where he is based and how to explore his work or CV. The page then develops his perspective, career, independent work, writing and contact options. Career details can expand without forcing every visitor through a long CV.

## Implementation choices

- Static HTML for readable, searchable content without requiring JavaScript.
- Local font and portrait files; no third-party requests on page load.
- Semantic landmarks, heading hierarchy, keyboard focus, a skip link, native disclosures and reduced-motion support.
- Responsive grids collapse into a readable mobile sequence.
- A separate print layout uses the same content source as the website.
- Local browser editing plus GitHub revision history; a failed validation prevents deployment.
- Original source documents and private project assessments remain outside the public repository.
