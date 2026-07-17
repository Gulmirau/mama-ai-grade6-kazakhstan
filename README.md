# Knowledge Base: official educational materials

Mama AI now has the backend architecture for a real Knowledge Base. The project does not include fictional official Kazakhstan curriculum, textbook, SOR, SOCH, or UNT content. Missing records are marked as `awaiting_import`.

Educational data should come from verified or licensed sources only: official curriculum files, official or licensed textbooks, workbooks, SOR/SOCH materials, UNT/ENT question banks, and teacher materials.

Files:

- `knowledge_base/schema.sql` - normalized database schema for production storage.
- `knowledge_base/IMPORT_WORKFLOW.md` - import and review workflow.
- `knowledge_base/import_record_template.json` - JSON import template.
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
- Cloud-ready env configuration in `.env.example`.

The trainer does not include official GIA / ENT materials yet. It uses demo questions until verified materials are imported into the Knowledge Base.

# Mama AI

Фронтенд + backend-прототип учебной платформы Mama AI — школьного помощника для 1–11 классов по программе Казахстана.

## Быстрый запуск

Вариант без сервера:

1. Откройте папку `mama_ai_app`.
2. Запустите `index.html` двойным кликом.
3. Приложение будет работать в локальном демо-режиме.

Вариант с сервером, аналитикой и JSON-базой:

1. Откройте терминал в папке `mama_ai_app`.
2. Запустите `npm start`.
3. Откройте `http://localhost:3000`.

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
- Заглушки для будущих материалов: "Учебники будут подключены позже" и "Материалы по программе РК будут добавлены в базу знаний".
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

Mama AI теперь поддерживает 1–11 классы. После выбора класса приложение показывает предметы именно для этого уровня:

- 1–4 классы: математика, русский язык, казахский язык, английский язык, познание мира, литературное чтение.
- 5–6 классы: математика, русский язык, казахский язык, английский язык, естествознание, история Казахстана, география, информатика.
- 7–9 классы: алгебра, геометрия, физика, химия, биология, география, история Казахстана, всемирная история, русский язык, казахский язык, английский язык, информатика.
- 10–11 классы: алгебра и начала анализа, геометрия, физика, химия, биология, география, история Казахстана, всемирная история, русский язык, казахский язык, английский язык, информатика, подготовка к ЕНТ.

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
