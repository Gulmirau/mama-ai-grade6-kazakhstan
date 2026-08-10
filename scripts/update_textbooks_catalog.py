from __future__ import annotations

import importlib.util
import json
import tempfile
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CURRENT_JSON = PROJECT_ROOT / "knowledge_base" / "gov_kz_textbooks_1_11_official.json"
REPORT_PATH = PROJECT_ROOT / "reports" / "textbooks-update-report.md"
SOURCE_URL = "https://www.gov.kz/memleket/entities/edu/documents/details/892700?lang=ru"
EXTRACTOR_PATH = PROJECT_ROOT / "scripts" / "extract-gov-kz-textbooks.py"


def load_extractor():
    spec = importlib.util.spec_from_file_location("extract_gov_kz_textbooks", EXTRACTOR_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


def record_signature(record: dict) -> dict:
    return {
        "grade": record.get("grade"),
        "subject": record.get("subject"),
        "title": record.get("title"),
        "authorsText": record.get("authorsText"),
        "publisher": record.get("publisher"),
        "year": record.get("year"),
        "links": record.get("links"),
        "materialType": record.get("materialType")
    }


def main() -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    extractor = load_extractor()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".html") as tmp:
        html_path = Path(tmp.name)
        tmp.write(urllib.request.urlopen(SOURCE_URL, timeout=30).read())

    original_source = extractor.SOURCE_HTML
    extractor.SOURCE_HTML = html_path
    fresh_records = extractor.parse_records()
    extractor.SOURCE_HTML = original_source

    current_payload = json.loads(CURRENT_JSON.read_text(encoding="utf-8")) if CURRENT_JSON.exists() else {"records": []}
    current_records = current_payload.get("records", [])
    current_by_id = {record["id"]: record for record in current_records}
    fresh_by_id = {record["id"]: record for record in fresh_records}

    added = [record for record_id, record in fresh_by_id.items() if record_id not in current_by_id]
    removed = [record for record_id, record in current_by_id.items() if record_id not in fresh_by_id]
    changed = []
    for record_id, fresh in fresh_by_id.items():
        current = current_by_id.get(record_id)
        if current and record_signature(current) != record_signature(fresh):
            changed.append({"id": record_id, "current": current, "fresh": fresh})

    lines = [
        "# Textbooks Update Report",
        "",
        f"Source: {SOURCE_URL}",
        f"Current records: {len(current_records)}",
        f"Fresh records: {len(fresh_records)}",
        "",
        f"Added: {len(added)}",
        f"Removed: {len(removed)}",
        f"Changed: {len(changed)}",
        "",
        "This script does not overwrite the catalog automatically. Review changes before importing.",
        ""
    ]

    def append_records(title: str, records: list[dict]) -> None:
        lines.append(f"## {title}")
        lines.append("")
        if not records:
            lines.append("None.")
            lines.append("")
            return
        for record in records[:50]:
            lines.append(f"- Grade {record.get('grade')}: {record.get('title')} — {record.get('publisher')} ({record.get('year')})")
        if len(records) > 50:
            lines.append(f"- ...and {len(records) - 50} more")
        lines.append("")

    append_records("Added", added)
    append_records("Removed", removed)
    lines.append("## Changed")
    lines.append("")
    if not changed:
        lines.append("None.")
    else:
        for item in changed[:50]:
            fresh = item["fresh"]
            lines.append(f"- Grade {fresh.get('grade')}: {fresh.get('title')} ({item['id']})")
        if len(changed) > 50:
            lines.append(f"- ...and {len(changed) - 50} more")
    lines.append("")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    html_path.unlink(missing_ok=True)
    print(f"added={len(added)} removed={len(removed)} changed={len(changed)}")
    print(REPORT_PATH)


if __name__ == "__main__":
    main()
