# Repository Audit

Date: 2026-08-10

## Findings

- Current Git HEAD before this update was `029ebaa Add admin dashboard auth and domain prep`.
- `official_textbooks.js` was not present in Git history.
- `knowledge_base/gov_kz_textbooks_1_11_official.json` was not present in Git history.
- `knowledge_base/grade3_5_textbooks_from_scans.json` was not present in Git history.
- `knowledge_base/grade6_textbooks_from_photos.json` was not present in Git history.
- The 21 July textbook work existed only as local/uncommitted files and local public-static builds, so GitHub Pages could still show `awaiting_import` if `official_textbooks.js`, updated `index.html`, and updated `script.js` were not uploaded/pushed together.

## Restored Or Created

- Recreated official textbook extraction from the gov.kz source page.
- Created `official_textbooks.js` with 288 official metadata/link records.
- Created `knowledge_base/gov_kz_textbooks_1_11_official.json`.
- Preserved user-uploaded/photo metadata for grades 3, 5, and 6.
- Added checks and reports so the catalog can be audited without reading code.

## Source Verification

- Official source checked: `https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=ru`
- Latest local diff check: `reports/textbooks-update-report.md`
- Result: no added, removed, or changed records against the downloaded gov.kz page at the time of checking.

## Why The Public Site Showed Awaiting Import

The public static site must include all of these files:

- `index.html`
- `style.css`
- `i18n.js`
- `script.js`
- `official_textbooks.js`

If `official_textbooks.js` is missing from GitHub Pages, the browser cannot load the official catalog and the app falls back to messages such as `awaiting_import` or `Учебники будут подключены позже`.
