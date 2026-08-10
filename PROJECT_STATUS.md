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
| Auth/accounts | DEMO | Local role/profile flow exists. | Production Supabase Auth is not configured. |
| Analytics/progress | DEMO | Local/demo analytics and grade import exist. | Public static GitHub Pages cannot persist real analytics without backend. |
| Cloud backend | NOT IMPLEMENTED | Supabase configuration placeholders exist. | Supabase project keys, tables, storage, and deployment are not connected. |
| GitHub Pages E2E | PARTIAL | Local static package can be built and checked. | Public URL must be rechecked after push/upload because Codex cannot guarantee the remote deployment without successful push. |
