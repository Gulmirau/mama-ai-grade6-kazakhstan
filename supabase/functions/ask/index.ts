// Mama AI — функция ИИ-репетитора (Supabase Edge Function, Deno).
// Сайт на GitHub Pages вызывает её, а она обращается к Google Gemini.
// Ключ GEMINI_API_KEY хранится в секретах Supabase и никогда не попадает на сайт.
//
// GET  → { ok: true, ai: true }  — проверка, что ИИ подключён
// POST → { answer, sources, model } — ответ репетитора

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
// Модели по порядку: если первая недоступна, пробуем следующую.
const MODELS = (Deno.env.get("GEMINI_MODELS") ?? "gemini-flash-latest,gemini-3.8-flash,gemini-flash-lite-latest")
  .split(",").map((m) => m.trim()).filter(Boolean);
// Поиск Google повышает достоверность фактов, но на бесплатном тарифе он быстро
// упирается в лимит. Поэтому по умолчанию выключен; включить: GEMINI_USE_SEARCH=true.
const USE_SEARCH = (Deno.env.get("GEMINI_USE_SEARCH") ?? "false") === "true";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://gulmirau.github.io,http://localhost:8766,http://localhost:3000")
  .split(",").map((o) => o.trim());

const MAX_QUESTION = 2000;
const MAX_HISTORY = 8;
const MAX_IMAGE_BASE64 = 6_000_000; // ~4.5 МБ фото

const SYSTEM_PROMPT = `Ты — Mama AI, терпеливый репетитор для школьников Казахстана (1–11 класс).
Главная цель — чтобы ребёнок ПОНЯЛ тему и смог сам написать СОР и СОЧ, а не просто получил готовый ответ.

ДОСТОВЕРНОСТЬ — самое важное:
1. Говори только то, в чём уверена. Если не уверена — прямо скажи: «Я не уверена, проверь в учебнике или спроси учителя». Честно не знать лучше, чем выдумать.
2. Никогда не выдумывай: цитаты, даты, имена, номера страниц и упражнений, содержание конкретного учебника, «официальные» задания СОР/СОЧ. Если ребёнок пишет про упражнение или страницу, но не прислал текст — попроси сфотографировать или переписать задание.
3. Опирайся на школьную программу Казахстана (обновлённое содержание образования) и термины казахстанских учебников. История Казахстана — так, как её изучают в казахстанской школе.
4. В математике, физике, химии считай по шагам и обязательно делай проверку результата.
5. Пересказывая произведения (басни, рассказы, стихи), опирайся на известный сюжет; не придумывай сцены и цитаты. Если не помнишь точно — скажи об этом.
6. Административное деление Казахстана менялось: в 2022 году появились Абайская, Жетысуская и Улытауская области, в 2018 — Туркестанская. Называя место рождения или расположение, лучше указывай исторический край, город или село. Современную область называй только если уверена.
7. Если вопрос не про учёбу или опасный — мягко верни разговор к урокам. Никогда не проси имя, адрес, телефон и другие личные данные.

КАК УЧИТЬ:
- Пиши коротко и просто, под возраст (поле grade). Для 1–4 класса — очень простые слова и примеры из жизни.
- Понимай вопрос, даже если он написан с ошибками или сказан голосом. Не исправляй ребёнка и не обсуждай его ошибки в словах — просто отвечай по смыслу. Если смысл совсем непонятен — переспроси одним коротким вопросом.
- Вопрос «объясни / что значит / в чём смысл» (например, смысл басни): 3–6 коротких предложений и один понятный пример. В конце строка «Проверь себя:» (по-казахски «Өзіңді тексер:», по-английски «Check yourself:») и ОДИН вопрос, чтобы ребёнок проверил, понял ли он.
- Задача или упражнение: не давай сразу ответ. Скажи, что нужно сделать, дай одну подсказку со значком 💡 и попроси попробовать и прислать свой ответ. Затем отдельной строкой поставь только символ 🔒, а после неё — полное решение по шагам, ответ и проверку (ребёнок откроет это по кнопке «Показать решение»).
- Если ребёнок присылает свой ответ (смотри историю диалога): скажи, верно или нет. Если неверно — покажи, где ошибка, дай подсказку и попроси попробовать ещё раз. Хвали за старание, не ругай.
- Подготовка к СОР/СОЧ (поле mode = sor или soch, или ребёнок просит подготовиться): 1) коротко — что главное в теме и что обычно проверяют; 2) дай ОДНО тренировочное задание в формате СОР/СОЧ и критерии оценивания (дескрипторы); 3) попроси ответить. После ответа проверь по дескрипторам и дай следующее задание. Скажи, что задания тренировочные, а не официальные.
- Не пиши длинных вступлений и слов вроде «диагностика», «уровень сложности». Не используй markdown-заголовки (#), таблицы и жирный шрифт (**). Можно нумерованные шаги и эмодзи 💡 ✅.

ЯЗЫК: отвечай на языке из поля language: ru — грамотный русский; kk — литературный казахский язык с правильными школьными терминами, без русских слов; en — простой школьный английский. Не смешивай языки, если ребёнок сам не просит перевод: все служебные слова (подсказка, проверь себя, ответ) тоже пиши на языке ответа.`;

const corsHeaders = (origin: string | null) => {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
};

// Простая защита от злоупотреблений: не больше 20 вопросов в минуту с одного адреса.
const hits = new Map<string, number[]>();
function tooManyRequests(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

type HistoryItem = { role: "user" | "model"; text: string };

function clean(value: unknown, max = 300): string {
  return String(value ?? "").slice(0, max);
}

function buildContents(body: Record<string, unknown>) {
  const history = Array.isArray(body.history) ? (body.history as HistoryItem[]).slice(-MAX_HISTORY) : [];
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];
  for (const item of history) {
    const text = clean(item?.text, 3000).trim();
    if (!text) continue;
    contents.push({ role: item.role === "model" ? "model" : "user", parts: [{ text }] });
  }
  // Gemini требует, чтобы диалог начинался с реплики пользователя.
  while (contents.length && contents[0].role !== "user") contents.shift();

  const context = {
    grade: Number(body.grade) || null,
    subject: clean(body.subjectTitle),
    language: ["ru", "kk", "en"].includes(String(body.language)) ? body.language : "ru",
    mode: ["school", "sor", "soch", "unt"].includes(String(body.mode)) ? body.mode : "school",
    selectedTextbook: body.selectedTextbook ?? null,
  };
  const question = clean(body.question, MAX_QUESTION).trim();
  const parts: Array<Record<string, unknown>> = [{
    text: `Контекст ученика: ${JSON.stringify(context)}\n\nСообщение ученика: ${question || "(ученик прислал фото задания)"}`,
  }];
  const image = body.image as { mimeType?: string; data?: string } | undefined;
  if (image?.data && /^image\/(png|jpe?g|webp|heic|heif)$/.test(String(image.mimeType))) {
    parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } });
    parts.push({ text: "На фото — школьное задание. Сначала перепиши условие так, как ты его видишь. Если что-то не читается — так и скажи и попроси переснять, ничего не додумывай." });
  }
  contents.push({ role: "user", parts });
  return contents;
}

async function callGemini(model: string, contents: unknown, useSearch: boolean) {
  const payload: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_LOW_AND_ABOVE" },
    ],
  };
  if (useSearch) payload.tools = [{ google_search: {} }];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message ?? `HTTP ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status });
  }
  const candidate = data?.candidates?.[0];
  const answer = (candidate?.content?.parts ?? [])
    .filter((p: Record<string, unknown>) => typeof p.text === "string" && !p.thought)
    .map((p: Record<string, unknown>) => p.text)
    .join("")
    .trim();
  const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map((c: { web?: { title?: string; uri?: string } }) => c.web)
    .filter(Boolean)
    .slice(0, 3)
    .map((w: { title?: string; uri?: string }) => ({ title: w.title ?? "", uri: w.uri ?? "" }));
  if (!answer) {
    const reason = candidate?.finishReason ?? data?.promptFeedback?.blockReason ?? "empty";
    throw Object.assign(new Error(`empty answer: ${reason}`), { status: 422, reason });
  }
  return { answer, sources };
}

// Проверяем ключ по-настоящему (запрос списка моделей), результат помним 10 минут.
// Если ключ неверный, сайт узнает об этом и будет работать без ИИ, а не показывать ошибки.
let keyCheck: { ok: boolean; at: number } | null = null;
async function keyWorks(): Promise<boolean> {
  if (!GEMINI_API_KEY) return false;
  if (keyCheck && Date.now() - keyCheck.at < 10 * 60_000) return keyCheck.ok;
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1", {
      headers: { "x-goog-api-key": GEMINI_API_KEY },
    });
    keyCheck = { ok: response.ok, at: Date.now() };
    if (!response.ok) console.error(`Gemini key check failed: HTTP ${response.status}`);
  } catch {
    keyCheck = { ok: false, at: Date.now() };
  }
  return keyCheck.ok;
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method === "GET") return json({ ok: true, ai: await keyWorks() }, 200, origin);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);
  if (!GEMINI_API_KEY) return json({ error: "ai_not_configured" }, 503, origin);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (tooManyRequests(ip)) return json({ error: "too_many_requests" }, 429, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400, origin);
  }
  const imageSize = String((body.image as { data?: string } | undefined)?.data ?? "").length;
  if (imageSize > MAX_IMAGE_BASE64) return json({ error: "image_too_large" }, 413, origin);
  if (!clean(body.question, MAX_QUESTION).trim() && !imageSize) return json({ error: "empty_question" }, 400, origin);

  const contents = buildContents(body);
  const errors: string[] = [];
  for (const model of MODELS) {
    for (const useSearch of USE_SEARCH ? [true, false] : [false]) {
      try {
        let result;
        try {
          result = await callGemini(model, contents, useSearch);
        } catch (error) {
          const status = (error as { status?: number }).status ?? 0;
          if (status !== 503 && status !== 500) throw error;
          // Модель перегружена — подождём и попробуем ещё раз.
          await new Promise((resolve) => setTimeout(resolve, 1500));
          result = await callGemini(model, contents, useSearch);
        }
        return json({ ...result, model, search: useSearch }, 200, origin);
      } catch (error) {
        const status = (error as { status?: number }).status ?? 0;
        errors.push(`${model}${useSearch ? "+search" : ""}: ${status} ${(error as Error).message}`.slice(0, 200));
        // Ответ заблокирован фильтром безопасности — не пробуем другие модели.
        if (status === 422 && /SAFETY|PROHIBITED|BLOCK/i.test(String((error as { reason?: string }).reason))) {
          return json({ error: "blocked" }, 422, origin);
        }
        // Неверный ключ — другие модели тоже не помогут.
        if (status === 400 && /API key/i.test((error as Error).message)) {
          console.error(errors.join(" | "));
          keyCheck = { ok: false, at: Date.now() };
          return json({ error: "bad_key" }, 502, origin);
        }
      }
    }
  }
  console.error(errors.join(" | "));
  const limited = errors.some((e) => / 429 /.test(e));
  return json({ error: limited ? "quota" : "ai_failed", details: errors }, limited ? 429 : 502, origin);
});
