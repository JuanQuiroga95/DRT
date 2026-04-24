import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const studentId = searchParams.get('studentId');

    let rows;
    if (date && studentId) {
      rows = await sql`
        SELECT a.*, s.first_name, s.last_name, s.grade, s.shift
        FROM attendance a JOIN students s ON a.student_id = s.id
        WHERE a.att_date = ${date} AND a.student_id = ${studentId}
      `;
    } else if (date) {
      rows = await sql`
        SELECT a.*, s.first_name, s.last_name, s.grade, s.shift
        FROM attendance a JOIN students s ON a.student_id = s.id
        WHERE a.att_date = ${date}
        ORDER BY s.last_name, s.first_name
      `;
    } else if (studentId) {
      rows = await sql`
        SELECT * FROM attendance WHERE student_id = ${studentId}
        ORDER BY att_date DESC
      `;
    } else {
      rows = await sql`
        SELECT a.*, s.first_name, s.last_name, s.grade, s.shift
        FROM attendance a JOIN students s ON a.student_id = s.id
        ORDER BY a.att_date DESC LIMIT 500
      `;
    }

    // Also return as map { "date__studentId": "status" }
    const map = {};
    for (const r of rows) {
      const d = typeof r.att_date === 'string' ? r.att_date : r.att_date?.toISOString?.()?.slice(0,10);
      map[`${d}__${r.student_id}`] = r.status;
    }

    return NextResponse.json({ rows, map });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sql = getDb();
    const { studentId, date, status } = await request.json();

    if (!studentId || !date || !status) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    await sql`
      INSERT INTO attendance (student_id, att_date, status)
      VALUES (${studentId}, ${date}, ${status})
      ON CONFLICT (student_id, att_date)
      DO UPDATE SET status = ${status}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
