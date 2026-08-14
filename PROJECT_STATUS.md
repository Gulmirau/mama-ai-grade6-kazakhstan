# Mama AI Project Status

Last updated: 2026-08-14

## Summary

Supabase is connected in the public GitHub Pages build. The site no longer runs in `setup_required` mode. Public registration UI is available, admin is not self-selectable, and the frontend uses only the Supabase publishable/anon key.

Important audit note: the automated signup check on 2026-08-11 was blocked by Supabase email rate limiting after repeated test registrations. Earlier public UI signup reached Supabase Auth and returned the expected email-confirmation flow. Direct confirmation of `auth.users` and `public.profiles` rows requires either a confirmed test email session or viewing the Supabase dashboard.

## 2026-08-14 Public UX Simplification

- Public first screen was simplified to three clear choices: "Начать заниматься", "Войти", and "Как пользоваться".
- The large navigation menu is hidden from new visitors and guests.
- Guest mode now starts with a guided 3-step flow: choose grade, choose subject, choose help type.
- Parent registration is visually simplified to the minimum first-step fields: name, email, password, and role.
- Parent after login is sent toward "Мои дети" instead of being left on the general screen.
- Child session now starts with a child-only home screen: continue learning, homework photo, question, or subject choice.
- Help moved to a permanent floating "Помощь" button and right-side drawer. The existing voice-and-arrow tour is still available from that drawer.
- Video instruction area is prepared as a placeholder in the side help panel; it does not autoplay.

## 2026-08-12 Child-First Redesign

- The first screen is now child-friendly: no registration form at launch, only free trial, guide, language switch, and a small adult login link.
- Guest mode allows 3 trial learning actions by default and stores only local guest state: grade, subject, language, actions, and points.
- Adult registration is parent/teacher focused. Children no longer need email/password accounts to start.
- A parent can create a child cabinet, transfer guest progress, and receive a personal child link.
- Child links are backed by Supabase RPC functions and hashed tokens in the database. The raw link token is not stored in public tables.
- The child cabinet hides email, password, admin, and Supabase technical details.
- Interactive guide is available in the app; MP4 production script and VTT captions are prepared in `docs/` and `public_assets/`.

Important: apply `supabase/migrations/202608120001_child_guest_and_invites.sql` in Supabase SQL editor before real parent-created child links work publicly.

## Module Status

| Module | Status | Checked | What works | What is not complete |
| ------ | ------ | ------- | ---------- | -------------------- |
| Public GitHub Pages | WORKING | Public URL opened and public `config.js` checked | Site opens, loads `config.js`, Supabase mode is deployed | GitHub Pages still has no private server functions |
| Supabase config | WORKING | `scripts/mvp-auth-check.js`, `scripts/post-supabase-audit.js` | URL, publishable key, admin email, app mode are present; no service role key in public files | Keep service_role/OpenAI keys out of GitHub |
| Auth UI | WORKING | Public browser check | Email/password fields exist; student/parent/teacher only; admin cannot be selected | Google login is not implemented |
| Supabase Auth | PARTIAL | Public signup attempt | Signup reaches Supabase Auth and email confirmation flow | Current automated retest blocked by Supabase email rate limit; repeated login needs confirmed email |
| Profiles | PARTIAL | SQL trigger check | Trigger migration exists for automatic profile creation after `auth.users` insert | Row creation must be verified in Supabase dashboard or with a confirmed test account |
| RLS | PARTIAL | Static SQL audit | RLS enabled; student/parent/teacher/admin policies exist; anon cannot freely read profiles by design | Full live bypass testing needs confirmed accounts for student/parent/teacher/admin |
| Grade selector 1-11 | WORKING | Public browser check + content tests | All grades 1-11 are selectable and saved locally | Official hour-by-hour curriculum still awaits import |
| Subject filtering | WORKING | Content tests + public UI checks | 3rd grade includes `Познание мира`; 5th grade required subjects exist; 6th grade materials preserved | Subject list still should be reviewed annually against official curriculum updates |
| Textbook filtering | WORKING | Public checks for 3rd grade `Познание мира` and 6th grade `Информатика` | Materials filter by selected grade and subject; no 5/7 grade leakage in checked scenarios | Some subjects have no verified main resource |
| Official textbook catalog | PARTIAL | Coverage report regenerated | 288 official metadata/link records are available | Metadata is not full textbook text or RAG knowledge chunks |
| User materials | PARTIAL | Coverage report regenerated | 17 user-provided records for grades 3, 5, and 6 are preserved | Scans/photos need OCR and human review |
| Knowledge chunks / RAG | NOT IMPLEMENTED | Schema audit | Architecture exists | No real `knowledge_chunks` textbook-page corpus; AI does not search page chunks yet |
| AI tutor chat | DEMO | Code audit | Step-by-step tutor fallback works in browser | No secure backend AI/RAG pipeline on GitHub Pages |
| Photo / OCR | DEMO | Code audit | Photo UI and endpoint placeholders exist | No real OCR/vision backend |
| SOR / SOCH / ENT | DEMO | Code/content audit | UI modes and schema placeholders exist | Official SOR/SOCH/ENT banks are not imported |
| Mini-tests | PARTIAL | Code audit | Browser quiz works and Supabase save path exists for logged-in users | Full persistence needs confirmed login; question bank is not official |
| Progress | PARTIAL | Code audit | Supabase `progress` write path exists for logged-in quiz attempts | Full reload/relogin persistence not live-verified due email confirmation/rate limit |
| Feedback | PARTIAL | Code audit | Supabase `feedback` write path exists for logged-in users | Admin live view needs confirmed admin session |
| Parent cabinet | PARTIAL | SQL/UI audit | Parent-child table exists; safe `link_child_by_code` RPC and UI field added | Third migration must be run in Supabase; full parent E2E not yet verified |
| Teacher cabinet | PARTIAL | SQL audit | Teacher/class tables and RLS structure exist | No complete UI flow to assign teacher to class |
| Admin analytics | PARTIAL | Code audit | Admin uses Supabase analytics path when logged in as configured admin email | Needs confirmed admin login and real user activity |
| Mobile layout | PARTIAL | 390px browser check found overflow; CSS fix added | New CSS limits width and reduces overflow risk | Needs public recheck after deployment |
| Security | PARTIAL | Static checks | No public service_role/OpenAI secret; admin cannot self-select; RLS SQL present | Live multi-account RLS bypass testing still needed |

## Current Counts

- Official textbook metadata records: 288
- User-provided material records: 17
- Grades covered in report: 1-11
- Public audit: 14 passed, 0 failed, 1 blocked by Supabase email rate limit

## Knowledge Base Plan

The textbook catalog is not the same as a full AI knowledge base. The next content structure should be:

`grade -> subject -> textbook -> chapter -> section -> page -> knowledge_chunk`

Each chunk must include:

- `textbook_id`
- `grade`
- `subject`
- `chapter`
- `section`
- `page`
- `text`
- `source_url`
- `verification_status`

Mama AI should not claim RAG is working until real reviewed chunks exist and the chat searches them before answering.
