# Mama AI PRD

## Product Goal

Mama AI is a multilingual school assistant for Grades 1-11. It should help children understand lessons step by step, support parents with progress insights, and grow into a real Kazakhstan curriculum platform through verified imports.

## Languages

The product supports:

- Russian
- Kazakh
- English

The interface language controls buttons, labels, settings, dates, and menus. The learning language controls AI answers and educational resources. The AI rule is: always answer in the selected learning language and do not mix languages unless the student asks for translation.

## Knowledge Base Policy

Mama AI must not invent official curriculum, textbook, SOR, SOCH, or UNT content. Official records are trusted only after import from verified or licensed sources and review.

When official material is unavailable, records stay in `awaiting_import` status. The AI may give a general learning strategy, but it must not present fictional school facts as official Kazakhstan curriculum.

## Knowledge Base Scope

The normalized Knowledge Base is prepared for:

- Grades
- Subjects
- Curriculum
- Quarters
- Sections
- Topics
- Lessons
- Learning objectives
- Competencies
- Textbooks
- Workbook and practical materials
- Teacher materials
- SOR
- SOCH
- UNT / ENT
- Question bank
- Practice exams
- Illustrations
- Videos
- Files
- Student progress
- Achievements
- Chat history

## AI Source Priority

For every educational answer the backend searches sources in this order:

1. Official curriculum
2. Textbooks
3. SOR/SOCH
4. Teacher materials
5. AI explanation

## Parent Version

Parents should see:

- Current topic
- Related textbook or source
- Lesson summary
- Weak topics
- Recommendations
- Practice history
- Points and achievements

## Import Requirements

The platform supports import registration for:

- PDF
- Word DOCX
- Excel XLSX
- CSV
- PowerPoint PPTX
- JSON

JSON imports can already map normalized records when they follow `knowledge_base/import_record_template.json`. Other file types are registered as `uploaded_awaiting_mapping` until a parser is connected.

Textbook and workbook photos can be registered through `/api/kb/photo-import`. With OpenAI vision configured, the server extracts text into `textbookPages`; without it, files remain `uploaded_awaiting_ocr`. Photo OCR results must stay `imported_needs_review` until a human approves them.

## Annual Updates

Curriculum updates must be data-driven. Adding a new textbook, academic year, SOR, SOCH, or UNT question should not require application code changes. New records should be imported, reviewed, and activated through Knowledge Base data.

## Current Implementation Status

- Database architecture is defined in `knowledge_base/schema.sql`.
- Runtime JSON Knowledge Base is created at `data/knowledge_base.json`.
- Import workflow is documented in `knowledge_base/IMPORT_WORKFLOW.md`.
- Backend endpoints are available under `/api/kb/*`.
- Verified official educational content is not bundled yet and remains awaiting import.
