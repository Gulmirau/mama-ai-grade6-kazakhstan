from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote
from datetime import date


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_HTML = PROJECT_ROOT / "knowledge_base" / "gov_kz_textbooks_1_11_source.html"
SOURCE_HTML_KK = PROJECT_ROOT / "knowledge_base" / "gov_kz_textbooks_1_11_source_kk.html"
OUTPUT_JSON = PROJECT_ROOT / "knowledge_base" / "gov_kz_textbooks_1_11_official.json"
OUTPUT_JS = PROJECT_ROOT / "official_textbooks.js"
TARGET_ACADEMIC_YEAR = "2026-2027"


SUBJECT_KEYWORDS = [
    ("Алгебра и начала анализа", "calculus", ["алгебра и начала анализа"]),
    ("Обучение грамоте", "literacy", ["обучение грамоте", "сауат ашу", "букварь", "әліппе", "ана тілі"]),
    ("Русская литература", "russian_literature", ["русская литература"]),
    ("Русский язык", "russian", ["русский язык"]),
    ("Казахская литература", "kazakh_literature", ["қазақ әдебиеті", "казахская литература"]),
    ("Казахский язык", "kazakh", ["қазақ тілі", "казахский язык", "қазақ тілі мен әдебиеті"]),
    ("Английский язык", "english", ["английский язык", "english", "excel for kazakhstan"]),
    ("Литературное чтение", "reading", ["литературное чтение", "әдебиеттік оқу"]),
    ("Немецкий язык", "german", ["немецкий язык"]),
    ("Французский язык", "french", ["французский язык"]),
    ("Математика", "math", ["математика"]),
    ("Алгебра", "algebra", ["алгебра"]),
    ("Геометрия", "geometry", ["геометрия"]),
    ("Информатика", "informatics", ["информатика"]),
    ("Цифровая грамотность", "digital_literacy", ["цифровая грамотность"]),
    ("Познание мира", "world_knowledge", ["познание мира", "дүниетану"]),
    ("Естествознание", "science", ["естествознание", "жаратылыстану"]),
    ("История Казахстана", "history_kz", ["история казахстана", "қазақстан тарихы"]),
    ("Всемирная история", "world_history", ["всемирная история", "дүниежүзі тарихы", "история древнего мира"]),
    ("География", "geography", ["география"]),
    ("Физика", "physics", ["физика"]),
    ("Химия", "chemistry", ["химия"]),
    ("Биология", "biology", ["биология", "biology"]),
    ("Основы права", "law", ["основы права", "құқық негіздері"]),
    ("Художественный труд", "art_labor", ["художественный труд", "көркем еңбек"]),
    ("Трудовое обучение", "labor_training", ["трудовое обучение", "еңбекке баулу"]),
    ("Изобразительное искусство", "visual_art", ["изобразительное искусство", "бейнелеу өнері"]),
    ("Музыка", "music", ["музыка"]),
    ("Начальная военная и технологическая подготовка", "nvtp", ["начальная военная", "алғашқы әскери"]),
    ("Графика и проектирование", "graphics_design", ["графика и проектирование"]),
    ("Основы предпринимательства и бизнеса", "business", ["предпринимательства", "кәсіпкерлік"]),
]


class TableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_tr = False
        self.in_td = False
        self.current_cell: list[str] = []
        self.current_links: list[dict[str, str]] = []
        self.row: list[dict[str, object]] = []
        self.rows: list[list[dict[str, object]]] = []
        self.href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "tr":
            self.in_tr = True
            self.row = []
        elif tag == "td" and self.in_tr:
            self.in_td = True
            self.current_cell = []
            self.current_links = []
        elif tag == "br" and self.in_td:
            self.current_cell.append("\n")
        elif tag == "a" and self.in_td:
            self.href = attrs_dict.get("href")

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self.href = None
        elif tag == "td" and self.in_td:
            text = clean_text(" ".join(self.current_cell))
            self.row.append({"text": text, "links": self.current_links})
            self.in_td = False
        elif tag == "tr" and self.in_tr:
            if self.row:
                self.rows.append(self.row)
            self.in_tr = False

    def handle_data(self, data: str) -> None:
        if not self.in_td:
            return
        self.current_cell.append(data)
        if self.href and data.strip():
            self.current_links.append({"label": clean_text(data), "url": self.href})


def clean_text(value: str) -> str:
    value = re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()
    return value


def slug(value: str) -> str:
    value = unquote(value).lower()
    value = re.sub(r"[^a-zа-яёәғқңөұүі0-9]+", "_", value, flags=re.IGNORECASE)
    value = re.sub(r"_+", "_", value).strip("_")
    return value[:80] or "record"


def detect_subject(title: str) -> tuple[str, str]:
    lower = title.lower()
    for label, key, keywords in SUBJECT_KEYWORDS:
        if any(keyword in lower for keyword in keywords):
            return label, key
    return "Учебный предмет", "school_subject"


def detect_material_type(title: str, links: list[dict[str, str]] | None = None) -> str:
    text = title.lower()
    link_text = " ".join((link.get("label") or "") for link in (links or [])).lower()
    combined = f"{text} {link_text}"
    if "рабочая тетрад" in combined or "workbook" in combined or "grammar book" in combined:
        return "workbook"
    if "хрестомат" in combined:
        return "reader"
    if "атлас" in combined:
        return "atlas"
    if "контур" in combined and "карт" in combined:
        return "contour_maps"
    if "тренаж" in combined:
        return "trainer"
    if "метод" in combined or "teacher" in combined:
        return "teacher_material"
    return "main_textbook"


def detect_pathway(title: str) -> str:
    lower = title.lower()
    if "емн" in lower or "естественно-математ" in lower:
        return "emn"
    if "огн" in lower or "общественно-гуманитар" in lower:
        return "ogn"
    return "general"


def detect_access_status(links: list[dict[str, str]]) -> str:
    urls = " ".join(str(link.get("url") or "") for link in links).lower()
    if not urls:
        return "requires_review"
    if ".pdf" in urls or "free.atamura.kz" in urls:
        return "free"
    if "topiq.kz" in urls:
        return "registration_required"
    return "view"


def detect_part(title: str) -> str:
    match = re.search(r"(?:част[ьи]|бөлім)\s*([\d,\s]+)", title, flags=re.IGNORECASE)
    return clean_text(match.group(1)) if match else ""


def parse_source(source_html: Path, default_language: str, source_url: str) -> list[dict[str, object]]:
    parser = TableParser()
    parser.feed(source_html.read_text(encoding="utf-8"))

    records: list[dict[str, object]] = []
    current_language = default_language
    current_language_title = "оқыту қазақ тілінде" if default_language == "kk" else "с русским языком обучения"
    current_grade: int | None = None

    for row in parser.rows:
      texts = [str(cell["text"]) for cell in row]
      if len(row) == 1:
          marker = texts[0].lower()
          grade_match = re.search(r"(\d{1,2})\s*[-–—]?\s*(?:класс|сынып)", marker)
          if "казах" in marker and "обуч" in marker:
              current_language = "kk"
              current_language_title = texts[0]
          elif "оқыту қазақ тілінде" in marker:
              current_language = "kk"
              current_language_title = texts[0]
          elif "рус" in marker and "обуч" in marker:
              current_language = "ru"
              current_language_title = texts[0]
          elif grade_match:
              current_grade = int(grade_match.group(1))
          continue

      if len(row) < 6 or current_grade is None:
          continue

      number = clean_text(texts[0])
      if not re.match(r"^\d+\.?$", number):
          continue

      title = clean_text(texts[1])
      authors = clean_text(texts[2])
      year = clean_text(texts[3])
      publisher = clean_text(texts[4])
      links = row[5]["links"]
      subject_title, subject = detect_subject(title)
      material_type = detect_material_type(title, links)
      record_id = f"gov_kz_g{current_grade}_{current_language}_{subject}_{slug(title)}_{len(records)+1}"

      records.append({
          "entityType": "workbook" if material_type == "workbook" else "textbook",
          "id": record_id,
          "title": title,
          "publisher": publisher,
          "grade": current_grade,
          "language": current_language,
          "instructionLanguage": current_language,
          "instructionLanguageTitle": current_language_title,
          "subject": subject,
          "subjectTitle": subject_title,
          "authors": [item.strip(" .") for item in re.split(r",|;", authors) if item.strip(" .")],
          "authorsText": authors,
          "edition": year,
          "year": year,
          "part": detect_part(title),
          "pathway": detect_pathway(title),
          "academicYear": TARGET_ACADEMIC_YEAR,
          "officialSourceUrl": source_url,
          "electronicUrl": links[0]["url"] if links else "",
          "workbookUrl": "",
          "additionalMaterialsUrl": "",
          "accessStatus": detect_access_status(links),
          "actualityStatus": "current",
          "coverUrl": "",
          "downloadableResource": "official_links_available" if links else "awaiting_official_link",
          "resourceStatus": "metadata_and_official_links_only" if links else "metadata_only_awaiting_link",
          "materialType": material_type,
          "sourceReferences": [source_url],
          "sourceType": "official_gov_kz_textbook_catalog",
          "verificationStatus": "official_verified_metadata",
          "checkedAt": date.today().isoformat(),
          "links": links,
          "status": "official_verified_metadata"
      })

    return records


def parse_records() -> list[dict[str, object]]:
    sources = [
        (SOURCE_HTML, "ru", "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=ru"),
    ]
    if SOURCE_HTML_KK.exists():
        sources.append((SOURCE_HTML_KK, "kk", "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=kk"))
    records: list[dict[str, object]] = []
    for source_html, language, source_url in sources:
        records.extend(parse_source(source_html, language, source_url))
    return records


def main() -> None:
    records = parse_records()
    payload = {
        "note": "Official textbook metadata extracted from the Ministry of Enlightenment of Kazakhstan gov.kz page. Records are metadata and links only; full content is not copied into Mama AI.",
        "fileType": "json",
        "originalName": "gov_kz_textbooks_1_11_official.json",
        "sourceType": "official_textbook_catalog",
        "sourceUrl": "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=ru",
        "sourceUrls": [
            "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=ru",
            "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=kk"
        ],
        "license": "official_metadata_links_only",
        "academicYear": TARGET_ACADEMIC_YEAR,
        "languages": ["ru", "kk"],
        "records": records,
        "countsByGrade": {str(grade): sum(1 for item in records if item["grade"] == grade) for grade in range(1, 12)}
    }
    OUTPUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    js_records = [
        {
            "id": item["id"],
            "grade": item["grade"],
            "subject": item["subjectTitle"],
            "subjectKey": item["subject"],
            "title": item["title"],
            "publisher": item["publisher"],
            "year": item["year"],
            "part": item["part"],
            "instructionLanguage": item["instructionLanguage"],
            "pathway": item["pathway"],
            "academicYear": item["academicYear"],
            "officialSourceUrl": item["officialSourceUrl"],
            "electronicUrl": item["electronicUrl"],
            "workbookUrl": item["workbookUrl"],
            "additionalMaterialsUrl": item["additionalMaterialsUrl"],
            "accessStatus": item["accessStatus"],
            "actualityStatus": item["actualityStatus"],
            "coverUrl": item["coverUrl"],
            "language": item["language"],
            "authors": item["authors"],
            "materialType": item["materialType"],
            "source": "Официальный перечень gov.kz",
            "sourceUrl": item["officialSourceUrl"],
            "links": item["links"],
            "status": item["status"],
            "resourceStatus": item["resourceStatus"],
            "sourceType": item["sourceType"],
            "verificationStatus": item["verificationStatus"],
            "checkedAt": item["checkedAt"]
        }
        for item in records
    ]
    OUTPUT_JS.write_text(
        "window.OFFICIAL_TEXTBOOK_CATALOG = "
        + json.dumps(js_records, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8"
    )
    print(f"records={len(records)}")
    print(json.dumps(payload["countsByGrade"], ensure_ascii=False))
    print(OUTPUT_JSON)
    print(OUTPUT_JS)


if __name__ == "__main__":
    main()
