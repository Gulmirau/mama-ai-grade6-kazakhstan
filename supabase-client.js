(function () {
  const storageKey = "mamaAiSupabaseSession";
  const config = window.MAMA_AI_CONFIG || {};

  function normalizeUrl(url) {
    return String(url || "").replace(/\/+$/, "");
  }

  function isConfigured() {
    return Boolean(normalizeUrl(config.SUPABASE_URL) && config.SUPABASE_ANON_KEY);
  }

  function getAdminEmail() {
    return String(config.ADMIN_EMAIL || "gulmirau1979@gmail.com").toLowerCase();
  }

  function getRedirectUrl() {
    const configured = String(config.APP_PUBLIC_URL || "").trim();
    if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/[#?].*$/, "");
    return `${window.location.origin}${window.location.pathname}`;
  }

  function getSession() {
    try {
      const session = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!session?.access_token) return null;
      if (session.expires_at && Number(session.expires_at) * 1000 < Date.now()) return null;
      return session;
    } catch {
      return null;
    }
  }

  function setSession(session) {
    if (!session?.access_token) return;
    localStorage.setItem(storageKey, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(storageKey);
  }

  function headers(session = getSession()) {
    const base = {
      apikey: config.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    };
    if (session?.access_token) base.Authorization = `Bearer ${session.access_token}`;
    return base;
  }

  async function request(path, options = {}) {
    if (!isConfigured()) throw new Error("supabase_not_configured");
    const response = await fetch(`${normalizeUrl(config.SUPABASE_URL)}${path}`, {
      ...options,
      headers: { ...headers(options.session), ...(options.headers || {}) }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const message = data?.msg || data?.message || data?.error_description || data?.error || `Supabase ${response.status}`;
      throw new Error(message);
    }
    return data;
  }

  async function getCurrentUser(session) {
    const data = await request("/auth/v1/user", { session });
    return data?.user || data;
  }

  async function consumeAuthRedirect() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (!hash.get("access_token")) return null;
    const session = {
      access_token: hash.get("access_token"),
      refresh_token: hash.get("refresh_token") || "",
      token_type: hash.get("token_type") || "bearer",
      expires_at: Math.floor(Date.now() / 1000) + Number(hash.get("expires_in") || 3600)
    };
    session.user = await getCurrentUser(session);
    setSession(session);
    window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}${window.location.search}`);
    return session;
  }

  function roleForEmail(selectedRole, email) {
    const cleanRole = ["student", "parent", "teacher"].includes(selectedRole) ? selectedRole : "student";
    return String(email || "").toLowerCase() === getAdminEmail() ? "admin" : cleanRole;
  }

  function makeStudentCode(name) {
    const prefix = String(name || "IMAMA").replace(/[^a-zа-яё0-9]/gi, "").slice(0, 4).toUpperCase() || "IMAM";
    return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function profilePayload(user, form) {
    const email = String(user.email || form.email || "").toLowerCase();
    return {
      id: user.id,
      email,
      first_name: form.name || "Ученик",
      last_name: form.lastName || "",
      role: roleForEmail(form.role, email),
      city: form.city || "",
      school: form.school || "",
      grade: Number(form.grade || 6),
      interface_language: form.interfaceLanguage || "ru",
      learning_language: form.learningLanguage || "ru",
      selected_subjects: form.selectedSubjects || [],
      student_code: form.studentCode || makeStudentCode(form.name),
      status: "active",
      last_active_at: new Date().toISOString()
    };
  }

  async function upsertProfile(user, form) {
    const payload = profilePayload(user, form);
    const rows = await request("/rest/v1/profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload)
    });
    return rows?.[0] || payload;
  }

  async function signUp(form) {
    const data = await request(`/auth/v1/signup?redirect_to=${encodeURIComponent(getRedirectUrl())}`, {
      method: "POST",
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        data: {
          role: roleForEmail(form.role, form.email),
          first_name: form.name,
          last_name: form.lastName || "",
          city: form.city,
          school: form.school || "",
          grade: form.grade,
          interface_language: form.interfaceLanguage || "ru",
          learning_language: form.learningLanguage || "ru",
          selected_subjects: form.selectedSubjects || []
        }
      })
    });
    if (data.session) setSession(data.session);
    if (!data.user || !data.session) return { needsEmailConfirmation: true, user: data.user || null, profile: null };
    const profile = await upsertProfile(data.user, form);
    await recordEvent("auth_signup", "Новая регистрация", profile);
    return { needsEmailConfirmation: false, user: data.user, profile };
  }

  async function signIn(email, password, form = {}) {
    const data = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setSession(data);
    const profile = await upsertProfile(data.user, { ...form, email, role: form.role || "student" });
    await recordEvent("auth_login", "Вход в кабинет", profile);
    return { user: data.user, profile };
  }

  async function signOut() {
    const session = getSession();
    if (session) {
      try {
        await request("/auth/v1/logout", { method: "POST", session });
      } catch {
        // Token cleanup still happens locally if the network is unavailable.
      }
    }
    clearSession();
  }

  async function restoreProfile() {
    const redirectSession = await consumeAuthRedirect();
    const session = redirectSession || getSession();
    if (!session?.user?.id) return null;
    const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=*`, { session });
    const profile = rows?.[0] || null;
    if (profile) await recordEvent("auth_restore", "Сессия восстановлена", profile);
    return profile;
  }

  async function recordEvent(type, detail, profile = null) {
    const session = getSession();
    if (!session?.user?.id || !isConfigured()) return null;
    return request("/rest/v1/user_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: session.user.id,
        event_type: type,
        detail,
        role: profile?.role || null,
        grade: profile?.grade || null,
        city: profile?.city || null
      })
    });
  }

  async function saveQuizAttempt(payload) {
    const session = getSession();
    if (!session?.user?.id || !isConfigured()) return null;
    const attempt = {
      user_id: session.user.id,
      grade: Number(payload.grade || 6),
      subject_key: payload.subject || payload.subjectKey || "math",
      topic: payload.topic || "",
      question: payload.question || "",
      selected_answer: payload.answer || "",
      correct_answer: payload.correctAnswer || "",
      is_correct: Boolean(payload.correct),
      points: Number(payload.points || 0),
      source_status: payload.sourceStatus || "app_generated"
    };
    const rows = await request("/rest/v1/test_attempts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(attempt)
    });
    await saveProgress({
      grade: attempt.grade,
      subject_key: attempt.subject_key,
      points_delta: attempt.points,
      correct_delta: attempt.is_correct ? 1 : 0,
      wrong_delta: attempt.is_correct ? 0 : 1
    });
    await recordEvent("quiz_attempt", attempt.is_correct ? "Правильный ответ" : "Неверный ответ");
    return rows?.[0] || attempt;
  }

  async function saveProgress(payload) {
    const session = getSession();
    if (!session?.user?.id || !isConfigured()) return null;
    const existing = await request(`/rest/v1/progress?user_id=eq.${session.user.id}&subject_key=eq.${encodeURIComponent(payload.subject_key)}&select=*`);
    const row = existing?.[0] || {
      user_id: session.user.id,
      grade: Number(payload.grade || 6),
      subject_key: payload.subject_key,
      points: 0,
      correct_answers: 0,
      wrong_answers: 0
    };
    row.points = Number(row.points || 0) + Number(payload.points_delta || 0);
    row.correct_answers = Number(row.correct_answers || 0) + Number(payload.correct_delta || 0);
    row.wrong_answers = Number(row.wrong_answers || 0) + Number(payload.wrong_delta || 0);
    row.updated_at = new Date().toISOString();
    const rows = await request("/rest/v1/progress?on_conflict=user_id,subject_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row)
    });
    return rows?.[0] || row;
  }

  async function saveFeedback(payload) {
    const session = getSession();
    if (!session?.user?.id || !isConfigured()) return null;
    await recordEvent("feedback", payload.helpful ? "Полезный ответ" : "Нужно улучшить");
    return request("/rest/v1/feedback", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: session.user.id,
        text: payload.text || "",
        helpful: Boolean(payload.helpful),
        grade: Number(payload.grade || 6),
        subject_key: payload.subject || payload.subjectKey || ""
      })
    });
  }

  async function getAnalytics() {
    const [profiles, events, attempts, feedbackRows] = await Promise.all([
      request("/rest/v1/profiles?select=id,role,grade,city,status,last_active_at,created_at"),
      request("/rest/v1/user_events?select=event_type,detail,city,grade,created_at&order=created_at.desc&limit=50"),
      request("/rest/v1/test_attempts?select=is_correct,grade,subject_key,created_at&order=created_at.desc&limit=200"),
      request("/rest/v1/feedback?select=helpful,grade,subject_key,created_at&order=created_at.desc&limit=200")
    ]);
    return { profiles, events, attempts, feedback: feedbackRows };
  }

  window.MamaAiSupabase = {
    config,
    isConfigured,
    getAdminEmail,
    getSession,
    getRedirectUrl,
    signUp,
    signIn,
    signOut,
    restoreProfile,
    recordEvent,
    saveQuizAttempt,
    saveProgress,
    saveFeedback,
    getAnalytics
  };
})();
