-- Mama AI Knowledge Base schema
-- No fictional official Kazakhstan curriculum content is stored here.
-- Missing official records must be marked as awaiting_import.

CREATE TABLE languages (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE grades (
  id TEXT PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  code TEXT,
  title TEXT NOT NULL,
  language_id TEXT REFERENCES languages(id),
  grade_range TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT,
  checksum TEXT,
  source_url TEXT,
  license TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded_awaiting_mapping',
  imported_at TEXT
);

CREATE TABLE curriculum (
  id TEXT PRIMARY KEY,
  grade_id TEXT REFERENCES grades(id),
  subject_id TEXT REFERENCES subjects(id),
  academic_year TEXT,
  source_file_id TEXT REFERENCES files(id),
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE quarters (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT REFERENCES curriculum(id),
  number INTEGER NOT NULL,
  title TEXT
);

CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  quarter_id TEXT REFERENCES quarters(id),
  title TEXT NOT NULL,
  display_order INTEGER
);

CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  section_id TEXT REFERENCES sections(id),
  title TEXT NOT NULL,
  keywords TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES topics(id),
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE learning_objectives (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  code TEXT,
  description TEXT NOT NULL,
  language_id TEXT REFERENCES languages(id)
);

CREATE TABLE competencies (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  description TEXT NOT NULL,
  language_id TEXT REFERENCES languages(id)
);

CREATE TABLE textbooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  publisher TEXT,
  grade_id TEXT REFERENCES grades(id),
  language_id TEXT REFERENCES languages(id),
  subject_id TEXT REFERENCES subjects(id),
  edition TEXT,
  resource_file_id TEXT REFERENCES files(id),
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE textbook_chapters (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id),
  title TEXT NOT NULL,
  display_order INTEGER
);

CREATE TABLE textbook_pages (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id),
  chapter_id TEXT REFERENCES textbook_chapters(id),
  page_number INTEGER,
  text TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE workbooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  grade_id TEXT REFERENCES grades(id),
  language_id TEXT REFERENCES languages(id),
  subject_id TEXT REFERENCES subjects(id),
  edition TEXT,
  resource_file_id TEXT REFERENCES files(id),
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE workbook_exercises (
  id TEXT PRIMARY KEY,
  workbook_id TEXT REFERENCES workbooks(id),
  topic_id TEXT REFERENCES topics(id),
  task TEXT,
  answer TEXT,
  explanation TEXT,
  difficulty TEXT
);

CREATE TABLE teacher_materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject_id TEXT REFERENCES subjects(id),
  grade_id TEXT REFERENCES grades(id),
  language_id TEXT REFERENCES languages(id),
  file_id TEXT REFERENCES files(id),
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE sor (
  id TEXT PRIMARY KEY,
  grade_id TEXT REFERENCES grades(id),
  subject_id TEXT REFERENCES subjects(id),
  quarter_id TEXT REFERENCES quarters(id),
  section_id TEXT REFERENCES sections(id),
  topic_id TEXT REFERENCES topics(id),
  learning_objective_id TEXT REFERENCES learning_objectives(id),
  task TEXT,
  answer TEXT,
  explanation TEXT,
  assessment_criteria TEXT,
  difficulty_level TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE soch (
  id TEXT PRIMARY KEY,
  quarter_id TEXT REFERENCES quarters(id),
  subject_id TEXT REFERENCES subjects(id),
  topics_covered TEXT,
  question_bank_ids TEXT,
  correct_answers TEXT,
  explanations TEXT,
  assessment_criteria TEXT,
  scoring_system TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE unt (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES subjects(id),
  topic_id TEXT REFERENCES topics(id),
  difficulty TEXT,
  answers TEXT,
  correct_answer TEXT,
  explanation TEXT,
  statistics TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE question_bank (
  id TEXT PRIMARY KEY,
  source_type TEXT,
  source_id TEXT,
  question TEXT NOT NULL,
  answers TEXT,
  correct_answer TEXT,
  explanation TEXT,
  language_id TEXT REFERENCES languages(id),
  difficulty TEXT,
  tags TEXT
);

CREATE TABLE practice_exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  question_ids TEXT,
  duration_minutes INTEGER,
  scoring_system TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE illustrations (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  file_id TEXT REFERENCES files(id),
  alt_text TEXT,
  language_id TEXT REFERENCES languages(id),
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  lesson_id TEXT REFERENCES lessons(id),
  url TEXT,
  title TEXT,
  language_id TEXT REFERENCES languages(id),
  status TEXT NOT NULL DEFAULT 'awaiting_import'
);

CREATE TABLE student_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_id TEXT REFERENCES lessons(id),
  topic_id TEXT REFERENCES topics(id),
  score REAL,
  attempts INTEGER,
  last_activity_at TEXT
);

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  type TEXT,
  title TEXT,
  earned_at TEXT
);

CREATE TABLE chat_history (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_id TEXT REFERENCES lessons(id),
  message TEXT,
  language_id TEXT REFERENCES languages(id),
  created_at TEXT
);

-- Cloud application tables for Supabase.
-- These records are not official curriculum content; they are user/account analytics data.

CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  city TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  status TEXT NOT NULL DEFAULT 'active',
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_students_city ON students(city);
CREATE INDEX idx_students_last_seen_at ON students(last_seen_at DESC);

CREATE TABLE student_city_history (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_student_city_history_city ON student_city_history(city);
