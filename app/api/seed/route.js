import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

const DEFAULT_SCHEDULE_AM = {
  Lunes:     ['3ro','3ro','DIP','DIP'],
  Martes:    ['2do A','2do A','2do B','2do B'],
  Miércoles: ['2do B','2do B','2do A','2do A'],
  Jueves:    ['3ro','3ro','DIP','DIP'],
  Viernes:   ['2do B','2do B','2do A','2do A'],
};

const DEFAULT_SCHEDULE_PM = {
  Lunes:     ['4to D/C','3ro C','DIP','DIP'],
  Martes:    ['4to E','3ro C','5to E','2do C'],
  Miércoles: ['4to D/C','3ro C','2do C','DIP'],
  Jueves:    ['3ro C','2do C','4to E','3ro C'],
  Viernes:   ['5to D','5to D','3ro C','5to E'],
};

const HOURS = ['1°','2°','3°','4°'];

export async function POST(request) {
  try {
    const sql = getDb();

    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'docente',
        shift VARCHAR(10),
        position VARCHAR(10),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(80) NOT NULL,
        last_name VARCHAR(80) NOT NULL,
        grade VARCHAR(20) NOT NULL,
        shift VARCHAR(10) NOT NULL,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS schedule (
        id SERIAL PRIMARY KEY,
        shift VARCHAR(10) NOT NULL,
        day_name VARCHAR(15) NOT NULL,
        hour_slot VARCHAR(5) NOT NULL,
        assigned_group VARCHAR(50) NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(shift, day_name, hour_slot)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS aie_tracking (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        category VARCHAR(60) NOT NULL,
        sub_item VARCHAR(30) NOT NULL,
        value VARCHAR(10) NOT NULL DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(student_id, category, sub_item)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        program VARCHAR(30) NOT NULL,
        eval_date DATE NOT NULL DEFAULT CURRENT_DATE,
        scores JSONB NOT NULL DEFAULT '{}',
        average NUMERIC(3,1),
        level VARCHAR(5),
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        att_date DATE NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'absent',
        UNIQUE(student_id, att_date)
      )
    `;

    // Create or update default admin user
    const adminHash = await bcrypt.hash('rawson2026', 10);
    await sql`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES ('admin', ${adminHash}, 'Administrador', 'admin')
      ON CONFLICT (username) DO UPDATE SET password_hash = ${adminHash}
    `;

    // Create or update default staff users
    const staff = [
      { username: 'pamela', name: 'Pamela Pastrán', role: 'docente', shift: 'Mañana', position: 'DRT' },
      { username: 'julieta', name: 'Julieta Pezantes', role: 'docente', shift: 'Tarde', position: 'DRT' },
      { username: 'miriam', name: 'Miriam Solari', role: 'docente', shift: 'Mañana', position: 'AIE' },
      { username: 'cecilia', name: 'Cecilia Lucero', role: 'docente', shift: 'Tarde', position: 'AIE' },
      { username: 'juanq', name: 'Juan Quiroga', role: 'docente', shift: 'Tarde', position: 'AIE' },
    ];

    for (const s of staff) {
      const hash = await bcrypt.hash('rawson2026', 10);
      await sql`
        INSERT INTO users (username, password_hash, full_name, role, shift, position)
        VALUES (${s.username}, ${hash}, ${s.name}, ${s.role}, ${s.shift}, ${s.position})
        ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
      `;
    }

    // Seed default schedule
    const existingSchedule = await sql`SELECT COUNT(*) as cnt FROM schedule`;
    if (parseInt(existingSchedule[0].cnt) === 0) {
      for (const [day, groups] of Object.entries(DEFAULT_SCHEDULE_AM)) {
        for (let i = 0; i < groups.length; i++) {
          await sql`
            INSERT INTO schedule (shift, day_name, hour_slot, assigned_group)
            VALUES ('Mañana', ${day}, ${HOURS[i]}, ${groups[i]})
            ON CONFLICT (shift, day_name, hour_slot) DO NOTHING
          `;
        }
      }
      for (const [day, groups] of Object.entries(DEFAULT_SCHEDULE_PM)) {
        for (let i = 0; i < groups.length; i++) {
          await sql`
            INSERT INTO schedule (shift, day_name, hour_slot, assigned_group)
            VALUES ('Tarde', ${day}, ${HOURS[i]}, ${groups[i]})
            ON CONFLICT (shift, day_name, hour_slot) DO NOTHING
          `;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Base de datos inicializada correctamente. Usuario admin: admin / rawson2026. Staff creado con contraseña: rawson2026',
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
