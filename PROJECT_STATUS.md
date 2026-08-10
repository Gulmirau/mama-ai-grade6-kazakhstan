# Mama AI Project Status

Last updated: 2026-08-10

| Module | Status | What works | What is not complete |
| ------ | ------ | ---------- | -------------------- |
| Public static site | WORKING | Opens as static HTML/CSS/JS on GitHub Pages after files are uploaded. | GitHub Pages is not automatically updated from this local folder unless changes are pushed/uploaded. |
| Grade selector 1-11 | WORKING | Each grade has its own subject list. | Subject-hour plans still need official curriculum import. |
| Subject materials filtering | WORKING | Materials are filtered by selected grade and subject. | Some official entries use older/alternate subject names; aliases are handled for common cases. |
| Official textbook catalog | PARTIAL | 288 metadata/link records imported from gov.kz for grades 1-11. | Records are metadata only and marked as needing review before becoming trusted lesson content. |
| User-uploaded materials | PARTIAL | User photos/PDF metadata for grades 3, 5, and 6 are preserved separately. | PDF scans have no text layer and need OCR/human review. |
| Knowledge Base schema | PARTIAL | Normalized schema and import workflow exist. | Production database and reviewed content chunks are not populated yet. |
| AI tutor chat | DEMO | Step-by-step fallback tutor works; server can call OpenAI if configured. | No API key is configured by default; RAG over textbook page chunks is not implemented. |
| OCR/photo understanding | DEMO | Photo endpoints and statuses exist. | Real OCR requires OpenAI API or OCR service and review workflow. |
| SOR/SOCH/ENT | DEMO | UI and schema placeholders exist. | Official SOR/SOCH/ENT question banks are not imported. |
| Auth/accounts | PARTIAL | Supabase email/password registration/login client is prepared; admin role is assigned by owner email only. | A Supabase project must be created, migration must be run, and `config.js` must receive URL + anon key before public users can register for real. |
| Analytics/progress | PARTIAL | Supabase events, quiz attempts, progress, and feedback saving are wired for authenticated users; local fallback still works. | Real shared analytics appears only after Supabase is configured and users log in. |
| Cloud backend | PARTIAL | Supabase schema, RLS migration, public config template, and setup guide exist. | Supabase project, storage, Edge AI function, and email provider are not connected yet. |

## Latest MVP cloud update

- Added `supabase-client.js` for Supabase Auth and REST calls without exposing secret keys.
- Added `config.js` and `config.example.js`; only public Supabase URL and anon key belong here.
- Added `.env.example` and `.gitignore` so private keys stay out of GitHub.
- Added Supabase migration `supabase/migrations/202608100001_mvp_auth_rls.sql`.
- Added `SETUP_FOR_GULMIRA.md` with nontechnical setup steps.
- Added static security/MVP checks in `scripts/mvp-auth-check.js`.

Important: the public GitHub Pages link is still not a real shared database until Supabase credentials are filled and pushed.
| GitHub Pages E2E | PARTIAL | Local static package can be built and checked. | Public URL must be rechecked after push/upload because Codex cannot guarantee the remote deployment without successful push. |
