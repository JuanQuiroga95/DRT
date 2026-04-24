import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const program = searchParams.get('program');

    let rows;
    if (studentId && program) {
      rows = await sql`
        SELECT e.*, s.first_name, s.last_name, s.grade
        FROM evaluations e JOIN students s ON e.student_id = s.id
        WHERE e.student_id = ${studentId} AND e.program = ${program}
        ORDER BY e.eval_date DESC
      `;
    } else if (studentId) {
      rows = await sql`
        SELECT e.*, s.first_name, s.last_name, s.grade
        FROM evaluations e JOIN students s ON e.student_id = s.id
        WHERE e.student_id = ${studentId}
        ORDER BY e.eval_date DESC
      `;
    } else if (program) {
      rows = await sql`
        SELECT e.*, s.first_name, s.last_name, s.grade
        FROM evaluations e JOIN students s ON e.student_id = s.id
        WHERE e.program = ${program}
        ORDER BY e.eval_date DESC
      `;
    } else {
      rows = await sql`
        SELECT e.*, s.first_name, s.last_name, s.grade
        FROM evaluations e JOIN students s ON e.student_id = s.id
        ORDER BY e.eval_date DESC
      `;
    }

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getDb();
    const { studentId, program, evalDate, scores, notes } = await request.json();

    if (!studentId || !program) {
      return NextResponse.json({ error: 'Alumno y programa requeridos' }, { status: 400 });
    }

    // Calculate average
    const vals = Object.values(scores || {}).filter(v => v > 0);
    const average = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const level = average >= 7 ? 'MS' : average >= 4 ? 'S' : average > 0 ? 'PS' : null;

    const rows = await sql`
      INSERT INTO evaluations (student_id, program, eval_date, scores, average, level, notes)
      VALUES (${studentId}, ${program}, ${evalDate || new Date().toISOString().slice(0,10)}, ${JSON.stringify(scores || {})}, ${average.toFixed(1)}, ${level}, ${notes || ''})
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await sql`DELETE FROM evaluations WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
