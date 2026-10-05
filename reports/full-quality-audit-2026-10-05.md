# Mama AI Full Quality Audit

Date: 2026-10-05

Public site: https://gulmirau.github.io/mama-ai-grade6-kazakhstan/

## Executive Result

Mama AI is a usable educational prototype, but it is not yet a complete verified AI tutor. After the quality and child-reliability fixes, the estimated readiness is **65/100** for supervised pilot use and **not ready for unsupervised reliance on complex school answers**.

The strongest parts are the child-first entry flow, Grades 1-11 navigation, subject filtering, responsive layout, Supabase structure, and official textbook catalog metadata. The weakest parts are the absence of a deployed AI backend, textbook page content, official curriculum lesson chunks, official SOR/SOCH/ENT question banks, real OCR, and end-to-end role testing.

## Scores

| Area | Score | Evidence |
| --- | ---: | --- |
| Child onboarding and navigation | 95/100 | Guest path works without registration; grade, subject, and textbook context stay synchronized |
| Mobile and desktop layout | 95/100 | Passed locally and publicly at 320, 360, 375, 390, 412, 430, 768, and 1280 px |
| Grade and subject structure | 85/100 | Grades 1-11 and grade-specific subject lists work; annual curriculum review still required |
| Textbook catalog | 75/100 | 599 official metadata records plus user records; official links available; no textbook page corpus |
| Deterministic math tutoring | 90/100 | Verified arithmetic, two-number word problems, fractions, percentages, simple linear equations, division-by-zero handling, and protection from partial multi-operation answers |
| Complex AI answers | 20/100 | Public GitHub Pages has no secure AI backend; complex answers use a general learning strategy |
| Knowledge base / RAG | 15/100 | Schema and search architecture exist; verified page-level chunks are not imported |
| SOR / SOCH / ENT | 10/100 | Training shells only; official banks are not imported and are now clearly labelled |
| Photo recognition / OCR | 10/100 | Interface honestly blocks fake recognition when OCR is unavailable; real OCR is not yet deployed |
| Authentication and child links | 70/100 | Supabase tables/RLS/RPC exist; full multi-account live test is still required |
| Parent, teacher and admin analytics | 45/100 | Data paths and UI exist; real dashboards need production activity and role-based E2E tests |
| Security and privacy readiness | 72/100 | No service-role/OpenAI secret in public files; RLS exists; child-facing privacy warning and answer reporting added; full policy, retention operations and live RLS attack tests remain |

## Defects Fixed During Audit

- New children no longer start with invented 120 points, a 5-day streak, or a higher level.
- A question or quiz attempt no longer awards the same participation points twice.
- Grade 3 mathematics no longer receives a percentage question; it receives an age-appropriate multiplication check.
- Simple arithmetic and basic two-number word problems now produce an exact result, step-by-step reasoning, an inverse-operation check, a similar task, and praise.
- The chat now states which answers are exact and when a full AI or verified official source is required.
- Generic SOR/SOCH entries are labelled as non-official training rather than being presented as official assessments.
- New backend profiles no longer use the name “Аружан” or invented marks.
- Fraction, percentage, and simple linear-equation answers are now calculated and checked exactly.
- Expressions with several operations are not reduced to a misleading partial answer.
- The photo button no longer claims that an unavailable OCR service read the page.
- Children can report an incorrect answer from the learning screen.

## Verified Example

Input: `У Маши было 12 яблок, она отдала 5. Сколько осталось?`

Verified output includes:

- operation: `12 - 5`
- answer: `7`
- inverse check: `7 + 5 = 12`
- similar task: `14 - 6`

## Current Truth About Educational Content

- The catalog contains official textbook metadata and links, not full textbook text.
- The official Ministry list is a valid primary source, but editions must be reviewed every academic year.
- The 2026-2027 year includes new books and pilot editions in several grades, so a catalog record must not automatically be treated as the exact book used by every school.
- The knowledge base does not yet contain reviewed chapter/page chunks, official lesson objectives, or licensed assessment banks.
- The application must not claim that it answers from a selected textbook page until that page is imported and verified.

## Required Work Before 90-100%

1. Deploy a private AI backend or Supabase Edge Function. Keep the OpenAI key only in server secrets, add rate limits, content filters, logging, and cost controls.
2. Import official curriculum data by academic year: grade, subject, quarter, section, topic, lesson, objective, and competency.
3. Import legally usable textbook text as page-level reviewed chunks with source URL, edition, language, page, and verification status.
4. Add licensed official or teacher-verified SOR/SOCH/ENT banks. Never scrape or invent answer keys.
5. Build a gold evaluation set covering all grades and languages. Require at least 95% exactness for deterministic questions and human review for open answers.
6. Complete end-to-end tests for parent, child, teacher, and admin accounts, including RLS isolation and analytics visibility.
7. Add a privacy policy, parental consent rules, data deletion controls, abuse reporting, and a clear notice that AI can make mistakes.
8. Add real OCR with confidence scores and a “retake photo” path when text is unreadable.

## Release Recommendation

Use the current version as a supervised pilot for navigation, textbook selection, study planning, and basic arithmetic practice. Do not advertise it yet as a complete source of correct answers for every subject, SOR, SOCH, or ENT.
