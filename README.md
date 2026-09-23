# Sergey Goncharov

A personal biography, portfolio and printable CV focused on infrastructure architecture, AI platforms and technical product leadership.

**Website:** https://sgprg.github.io/

## Update the page

### From any browser

1. Open [Edit content on GitHub](https://github.com/sgprg/sgprg.github.io/edit/main/content/profile.json) while signed in to the owner account.
2. Change text in `content/profile.json`. Keep the surrounding quotes, commas and brackets.
3. Commit the change. [GitHub Actions](https://github.com/sgprg/sgprg.github.io/actions) validates it and publishes the new page and CV automatically.

### With the visual editor on your computer

Requires Node.js 22 or later. No dependencies, account keys or paid service required.

```sh
npm run edit
```

Open **http://127.0.0.1:4321/edit/**. Choose a section, edit fields, add or reorder entries, then **Save changes**. The preview updates and `content/profile.json` is saved. Your previous content is backed up in the ignored `.local/profile-backup.json` file. Unsaved edits remain only in the open editor; save before closing.

To put saved edits online:

```sh
npm run publish
```

This checks the destination, runs tests, builds, commits changes to the profile and portrait, and pushes to `main`. It requires GitHub Git authentication already configured. It refuses unrelated staged changes, uncommitted code changes, another branch, or remote commits you have not pulled. If a push fails, the local commit remains; correct authentication or pull the newer changes, then retry. The command reports the Actions URL; the site becomes live only after the deployment succeeds.

The visual editor runs **only on your computer**. There is no public write API, stored browser token or online admin password. The public footer's “Edit content” opens GitHub's authenticated editor.

## Content

- `content/profile.json` — all biography, experience, expertise, project, writing and contact content.
- `public/assets/sergey-goncharov.png` — portrait; replace this file to update the photo.
- `public/style.css` — layout, colors and typography.
- `scripts/build.mjs` — static biography and CV templates.
- `editor/` and `scripts/server.mjs` — local visual editor, excluded from the deployed output.
- `docs/DESIGN.md` — design research and rationale.

The biography leads with career experience and specific contributions. The **Achievements** editor section maintains the selected contributions; **Current focus** maintains a compact list of independent initiative goals. The count updates automatically. Describe visions and goals without product names or repository links. Omit the children's play application. Keep any financial or adoption figures out until the underlying evidence has been reconciled. Text fields are plain text, not HTML or Markdown; publication and contact links use HTTPS.

The CV at `/cv/` is generated from the same content. Click **Print / Save as PDF** and select A4 paper; browser header/footer settings are optional. This keeps future CV exports aligned with the site. The original private CVs and assessments are not part of this repository.

## Develop and verify

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run dev
```

Preview at http://127.0.0.1:4321/. The server binds to loopback. Restart `npm run dev` after source edits to rebuild, or run `npm run build` and refresh the page. A built `dist/` directory works on any static host. There are no runtime dependencies, analytics, tracking pixels or third-party font requests.

GitHub Pages is configured to deploy using Actions. Only `dist/` is uploaded. Changes in `main` trigger validation and publication; pull requests validate without deployment. For a custom domain, configure it in repository Settings → Pages and update `siteUrl` before publishing; do not add a DNS record unless you control the domain.

## Content and asset rights

Biography, portrait and original site material © Sergey Goncharov. This repository does not grant a general reuse license to the portrait, personal biography or original site source. Third-party Inter font files retain their SIL Open Font License; see `public/assets/INTER-LICENSE.txt` and [asset credits](docs/ASSETS.md).
