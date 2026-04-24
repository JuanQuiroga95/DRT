-- ============================================
-- SISTEMA DRT / AIE — Esc. N°1-004 Dr. Guillermo Rawson
-- Schema para Neon PostgreSQL
-- ============================================

-- Usuarios (docentes / admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'docente',  -- admin, docente
  shift VARCHAR(10),  -- Mañana, Tarde
  position VARCHAR(10),  -- DRT, AIE
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alumnos
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  grade VARCHAR(20) NOT NULL,
  shift VARCHAR(10) NOT NULL,  -- Mañana, Tarde
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cronograma semanal
CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  shift VARCHAR(10) NOT NULL,       -- Mañana, Tarde
  day_name VARCHAR(15) NOT NULL,    -- Lunes..Viernes
  hour_slot VARCHAR(5) NOT NULL,    -- 1°, 2°, 3°, 4°
  assigned_group VARCHAR(50) NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seguimiento AIE (diagnóstico digital)
CREATE TABLE IF NOT EXISTS aie_tracking (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  category VARCHAR(60) NOT NULL,     -- ej: "Identifica partes de la computadora"
  sub_item VARCHAR(30) NOT NULL,     -- ej: "Teclado", "level"
  value VARCHAR(10) NOT NULL DEFAULT '',  -- "SI", "PS", "S", "MS"
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, category, sub_item)
);

-- Evaluaciones con rúbricas
CREATE TABLE IF NOT EXISTS evaluations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  program VARCHAR(30) NOT NULL,      -- G-Compris, Propuesta DALE!
  eval_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scores JSONB NOT NULL DEFAULT '{}',  -- {"nav":7,"mouse":8,...}
  average NUMERIC(3,1),
  level VARCHAR(5),                  -- PS, S, MS
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  att_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'absent',  -- present, late, absent
  UNIQUE(student_id, att_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_shift ON students(shift);
CREATE INDEX IF NOT EXISTS idx_aie_student ON aie_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_eval_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_eval_program ON evaluations(program);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(att_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
