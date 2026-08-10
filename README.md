# Mama AI — школьный помощник для 1–11 классов Казахстана

Mama AI is a school helper prototype for Kazakhstan grades 1-11. The app now includes grade-specific subject lists and an official textbook metadata catalog extracted from the Kazakhstan Ministry of Enlightenment gov.kz page.

This project is still not a full production platform: AI tutoring, OCR, RAG, cloud database, authentication, progress, SOR/SOCH, and ENT are either demo or partial unless configured with real services and reviewed educational materials. See `PROJECT_STATUS.md`.

## Knowledge Base: official educational materials

Mama AI now has the backend architecture for a real Knowledge Base. The project does not include fictional official Kazakhstan curriculum, textbook, SOR, SOCH, or UNT content. Missing records are marked as `awaiting_import`.

Educational data should come from verified or licensed sources only: official curriculum files, official or licensed textbooks, workbooks, SOR/SOCH materials, UNT/ENT question banks, and teacher materials.

Files:

- `knowledge_base/schema.sql` - normalized database schema for production storage.
- `knowledge_base/IMPORT_WORKFLOW.md` - import and review workflow.
- `knowledge_base/import_record_template.json` - JSON import template.
- `knowledge_base/gov_kz_textbooks_1_11_official.json` - 288 official textbook metadata/link records extracted from gov.kz for grades 1-11.
- `official_textbooks.js` - static-browser version of the official catalog for GitHub Pages.
- `knowledge_base/grade6_textbooks_from_photos.json` - catalog records created from the user's Grade 6 textbook photos and checked against publisher/official references where available. These are metadata records only, not full textbook content.
- `knowledge_base/grade3_5_textbooks_from_scans.json` - catalog records created from the user's Grade 3 and Grade 5 photos/PDF scans. PDF scans currently have no text layer and are marked `uploaded_awaiting_ocr`.
- `reports/content-coverage.md` - coverage report by grade and subject.
- `reports/textbooks-update-report.md` - diff report for checking whether gov.kz changed.
- `reports/repository-audit.md` - audit of what was in Git and what was only local.
- `scripts/extract-gov-kz-textbooks.py` - importer for the official gov.kz textbook page.
- `scripts/update_textbooks_catalog.py` - update checker that creates a diff report without overwriting reviewed data.
- `scripts/content-audit.js` - content coverage and regression tests for grades 1-11.
- `data/knowledge_base.json` - local runtime Knowledge Base created by the Node server.
- `data/imports/` - folder reserved for imported source files.

API endpoints:

- `GET /api/kb/status` - Knowledge Base readiness, counts, supported import types.
- `GET /api/kb/schema` - schema description used by the app.
- `GET /api/kb/search` - search by keyword, topic, lesson, textbook, page, grade, subject, quarter, language.
- `POST /api/kb/import` - register/import PDF, DOCX, XLSX, CSV, PPTX, or JSON material.
- `POST /api/kb/lesson/generate` - prepare a lesson package only from verified Knowledge Base sources.
- `POST /api/kb/photo-import` - save a textbook/workbook photo, run OCR when OpenAI vision is configured, and store the result as `imported_needs_review`.

AI source priority: official curriculum, textbooks, SOR/SOCH, teacher materials, then AI explanation. If no verified material exists, Mama AI must say that official materials are awaiting import and avoid inventing school facts.

Next official-data steps: collect verified Kazakhstan educational materials, record source metadata, import them through `/api/kb/import`, review records before marking them trusted, then move runtime data to PostgreSQL/Supabase using `knowledge_base/schema.sql`.

## Product modules added after MVP

- Student cabinet and parent cabinet.
- Parent summary with current topic, weak topics, and recommendations.
- Weekly learning plan generator.
- GIA / ENT trainer shell with demo diagnostic questions.
- Trainer attempt tracking.
- Cloud backend status endpoint: `GET /api/cloud/status`.
- Supabase is selected as the cloud database provider; local JSON remains the fallback until credentials are added.
- City is collected during authorization and included in analytics for future regional reports.
- Supabase Auth-ready profile fields: email, provider, owner admin email, and account records.
- Admin dashboard sections for student table, city/grade activity, and inactive students.
- Domain preparation for `mama-ai.kz` is documented in `../Mama AI Ссылки/Домен mama-ai.md`.
- Account inactivity lifecycle: `GET /api/account/lifecycle` and `POST /api/account/lifecycle/run`.
- After 30 days without login Mama AI queues an email warning; after 3 more days without login the student account and related local records are deleted. The day counts can be changed with `INACTIVITY_WARNING_DAYS` and `INACTIVITY_GRACE_DAYS`.
- Cloud-ready env configuration in `.env.example`.

The trainer does not include official GIA / ENT materials yet. It uses demo questions until verified materials are imported into the Knowledge Base.

Real warning emails require an email provider. Until `EMAIL_PROVIDER` and sender settings are configured, warnings are saved in the local `notifications` queue and shown in the admin panel.

## Быстрый запуск

Вариант без сервера:

1. Откройте папку `mama_ai_app`.
2. Запустите `index.html` двойным кликом.
3. Приложение будет работать в локальном демо-режиме.

Вариант с сервером, аналитикой и JSON-базой:

1. Откройте терминал в папке `mama_ai_app`.
2. Запустите `npm start`.
3. Откройте `http://localhost:3000`.

## Проверки

```bash
npm run check
npm run content:test
npm run content:report
```

To check whether the official gov.kz textbook page changed:

```bash
python scripts/update_textbooks_catalog.py
```

## Подключение AI API

1. Скопируйте `.env.example` в `.env`.
2. Вставьте ключ в `OPENAI_API_KEY`.
3. При необходимости поменяйте `OPENAI_MODEL`.
4. Перезапустите сервер.

Если ключ не указан, iMama продолжит работать через встроенный репетиторский шаблон.

## Что реализовано

- Backend на чистом Node.js без внешних пакетов.
- Локальная JSON-база: `data/db.json`.
- Простая сессия пользователя с ролями: ученик, родитель, учитель, администратор.
- Выбор ученика, класса с 1 по 11 и режима обучения.
- Структура `curriculumData` для каждого класса: `grade`, `subjects`, `topics`, `textbookLinks`, `sorTopics`, `sochTopics`.
- Автоматический список предметов строго под выбранный класс.
- Раздел "Учебники": темы предмета, учебник, рабочая тетрадь, СОР, СОЧ и мини-тест.
- Для 6 класса добавлен первый каталог реальных учебников по фото пользователя: информатика, всемирная история, естествознание, русский язык, русская литература, музыка, английский язык и художественный труд.
- Для 3 и 5 классов добавлены первые ресурсы по фото/сканам пользователя: познание мира 3 класс, математика 5 класс, английский workbook 5 класс, атласы и контурные карты 5 класса.
- Полные страницы учебников, СОР, СОЧ и рабочие тетради не копируются без официального источника или лицензии; такие материалы остаются со статусом `imported_needs_review` или `awaiting_official_source`.
- Режимы: школьная программа, СОР, СОЧ, ЕНТ.
- Оригинальный мультяшный персонаж Mama AI с приветственным взмахом и мягкой idle-анимацией.
- Детский интерфейс: мягкие цвета, округлые карточки, декоративные книги, карандаши и звездочки.
- Анимации карточек, typing-состояния, прыгающих звезд, похвалы и конфетти после правильного ответа.
- Кнопка "Озвучить ответ" через Web Speech API браузера.
- Кнопка "Сказать голосом" через SpeechRecognition, если браузер поддерживает голосовой ввод.
- Настройки включения/выключения анимаций и звука.
- Виджет даты и времени Казахстана через `Intl.DateTimeFormat` с `timeZone: "Asia/Almaty"`.
- Ежедневные декоративные темы из массива `dailyThemes`.
- Спокойные SVG-частицы темы дня по краям экрана.
- Тематическая награда за правильный ответ: птицы, цветы, книги, звезды, мороженое и другие варианты.
- Настройки доступности: анимации, звуки, уменьшить движение, отключить тему дня.
- Учет системной настройки `prefers-reduced-motion`.
- Тихий синтезированный звук птиц для темы birds только после нажатия пользователем.
- Мультиязычность: Russian, Kazakh, English.
- Отдельный выбор языка интерфейса и языка обучения в школе.
- Быстрое переключение языка ответа в чате: RU, KZ, EN.
- Словарь переводов в `i18n.js`.
- Сохранение выбранных языков в `localStorage`.
- AI prompt содержит правило: `Always answer in the selected learning language. Do not mix languages unless the student asks for translation.`
- Пошаговый чат-помощник по выбранному классу и предмету.
- Подключение к OpenAI API через серверный endpoint `/api/ask`.
- Endpoint `/api/photo` для будущего OCR/vision-разбора фото задания.
- Мини-тесты с учетом правильных и неправильных ответов.
- Начисление баллов за попытку, старание и правильный ответ.
- Панель успеваемости ученика.
- Импорт оценок через JSON.
- Панель администратора: заходы, ученики, вопросы, ответы, ошибки, отзывы, фото, последние действия.
- Экспорт аналитики в CSV на фронтенде.

## Поддержка классов и предметов

Mama AI теперь поддерживает 1–11 классы. После выбора класса приложение показывает расширенный стандартный набор предметов для Казахстана. Списки предметов подготовлены по структуре типовых учебных планов РК; точные часы, разделы, цели обучения и учебники должны импортироваться из официальных материалов.

- 1 класс: обучение грамоте, математика, казахский язык, английский язык, познание мира, естествознание, художественный труд, музыка, физическая культура, цифровая грамотность.
- 2–4 классы: русский язык, литературное чтение, казахский язык, английский язык, математика, познание мира, естествознание, художественный труд, музыка, физическая культура, цифровая грамотность.
- 5–6 классы: русский язык, русская литература, казахский язык, казахская литература, английский язык, математика, естествознание, история Казахстана, всемирная история, география, информатика, художественный труд, музыка, физическая культура, глобальные компетенции.
- 7–8 классы: языки и литература, алгебра, геометрия, информатика, физика, химия, биология, география, история Казахстана, всемирная история, художественный труд, физическая культура, глобальные компетенции.
- 9 класс: предметы 7–8 классов плюс основы права.
- 10–11 классы: обязательные и профильные предметы: алгебра и начала анализа, геометрия, информатика, языки и литература, история Казахстана, физическая культура, начальная военная и технологическая подготовка, физика, химия, биология, география, всемирная история, основы права, основы предпринимательства и бизнеса, графика и проектирование, глобальные компетенции, подготовка к ЕНТ.

Выбранный класс сохраняется в `localStorage`, поэтому при следующем открытии приложение возвращается к последнему выбранному классу.

В будущем в `curriculumData` можно постепенно добавлять реальные учебники, рабочие тетради, темы СОР/СОЧ и материалы по программе РК для каждого класса и предмета.

Важно: для 1 класса приложение не показывает оценки, СОР и СОЧ. В этом классе используются мягкая практика, мини-тесты без школьного оценивания, похвала и наблюдение за интересом ребенка.

## Формат импорта оценок

Вставьте в поле "Импорт оценок":

```json
[
  { "subject": "Математика", "value": 5, "type": "СОР", "date": "2026-07-10" },
  { "subject": "Английский язык", "value": 4, "type": "Домашняя работа", "date": "2026-07-10" }
]
```

## Правило поведения AI

iMama должен работать как терпеливый репетитор, а не как калькулятор. Он не выдает сразу готовый ответ. При решении задания он:

- определяет класс, предмет, тему и сложность;
- объясняет условие простыми словами;
- спрашивает ребенка, что уже понятно и где трудность;
- дает подсказку;
- показывает решение по шагам;
- после важных шагов задает короткий вопрос;
- мягко объясняет ошибку;
- дает итоговый ответ только после хода решения;
- предлагает похожее задание;
- хвалит ребенка и начисляет баллы.

## Языки

Mama AI поддерживает три языка: Russian, Kazakh, English.

- Язык интерфейса переводит кнопки, меню, режимы, подписи и основные панели.
- Язык обучения в школе определяет язык ответа AI.
- Быстрые кнопки RU/KZ/EN в чате меняют язык ответа.
- Для казахского используется литературный қазақ тілі, корректные школьные термины и запрет на смешивание с русским без просьбы ученика.
- Для английского используется clear school English, correct grammar, no slang unless requested, and grade-adapted explanations.

## Следующие усиления

- Настоящая авторизация с паролем, SMS или email.
- Интеграция с электронным журналом школы.
- Импорт Excel/Google Sheets напрямую.
- Полноценная база данных PostgreSQL/Supabase вместо JSON.
- Расширенная учебная база: темы, КТП, типовые задания, СОР/СОЧ, ЕНТ.
