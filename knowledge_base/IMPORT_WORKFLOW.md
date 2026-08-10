# Mama AI Knowledge Base Import Workflow

This project does not include fictional Kazakhstan curriculum, SOR, SOCH, or ENT content.

All official educational records must be imported from verified materials and reviewed before use.

## Supported files

- PDF
- Word DOCX
- Excel XLSX
- CSV
- PowerPoint PPTX
- JSON

## Workflow

1. Collect official or licensed educational materials.
2. Record source, license, academic year, language, grade, subject, and file type.
3. Upload the file to `/api/kb/import`.
4. The system registers the file in `files` and creates an `imports` record.
5. JSON records can be mapped immediately when they follow `import_record_template.json`.
6. PDF, DOCX, XLSX, CSV, and PPTX files are stored as `uploaded_awaiting_mapping` until a parser maps them to normalized tables.
7. A human reviewer approves mapped records before they become trusted.
8. AI search uses trusted Knowledge Base records first.
9. If no verified records exist, AI must say materials are awaiting import and avoid inventing school facts.

## User photo textbook catalog

`grade6_textbooks_from_photos.json` contains metadata extracted from the user's photos of Grade 6 textbooks.

These records are allowed for catalog display only:

- title
- publisher
- grade
- language
- subject
- authors
- edition year
- ISBN/page count when visible or verified
- publisher or official reference link when found

They do not contain full textbook pages and must stay `imported_needs_review` until a human reviewer approves the metadata. Full textbook content, workbook tasks, SOR, SOCH, and ENT questions must be imported only from official or licensed files.

## Search priority

1. Official curriculum
2. Textbooks
3. SOR/SOCH
4. Teacher materials
5. AI explanation

## API

- `GET /api/kb/status`
- `GET /api/kb/schema`
- `GET /api/kb/search?keyword=&grade=&subject=&quarter=&topic=&lesson=&textbook=&page=&language=`
- `POST /api/kb/import`
- `POST /api/kb/lesson/generate`
- `POST /api/kb/photo-import`

## Import status values

- `awaiting_import`: the record exists as a required slot, but no verified material has been loaded yet.
- `uploaded_awaiting_mapping`: a file was uploaded or registered, but its content has not been mapped into normalized tables.
- `imported_needs_review`: structured records were imported and need human review.
- `trusted`: a reviewer approved the record for AI search and student-facing use.

## Recommended source metadata

Every import should include:

- source type: official curriculum, textbook, SOR, SOCH, UNT, workbook, teacher material
- source URL or file name
- publisher or authoring organization when available
- academic year
- grade
- subject
- language
- license or usage permission
- reviewer name and review date

## Mapping rules

1. Do not map uncertain text directly into trusted records.
2. Keep extracted content as `imported_needs_review` until a human checks it.
3. Use stable IDs from the source when available.
4. Preserve page numbers and chapter names for textbooks.
5. For SOR, SOCH, and UNT, keep the answer, explanation, scoring criteria, and difficulty together with the task.
6. For Grade 1, do not import graded SOR/SOCH workflows unless the official source explicitly requires them.

## Photo/OCR workflow

1. A student or parent uploads a textbook/workbook photo in the app.
2. The app sends the image to `/api/photo` for tutoring help and to `/api/kb/photo-import` for Knowledge Base registration.
3. The original image is saved in `data/imports`.
4. If `OPENAI_API_KEY` is configured, the server tries to extract text, tasks, and learning objectives from the image.
5. Extracted text is stored as `imported_needs_review`, not as trusted content.
6. If OCR is unavailable, the file status is `uploaded_awaiting_ocr`.
7. A parent, teacher, or admin must review the OCR result before the material can become trusted.
8. OCR must not invent missing text or solve tasks unless answers are printed on the page.

## Example import request

```json
{
  "fileType": "json",
  "originalName": "official-curriculum-grade-5-math-ru.json",
  "sourceType": "official_curriculum",
  "language": "ru",
  "academicYear": "2026-2027",
  "sourceUrl": "awaiting_official_source_url",
  "license": "awaiting_review",
  "records": [
    {
      "entityType": "subject",
      "code": "math",
      "title": "Математика",
      "gradeRange": [5]
    }
  ]
}
```
