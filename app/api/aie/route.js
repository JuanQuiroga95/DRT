import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let rows;
    if (studentId) {
      rows = await sql`SELECT * FROM aie_tracking WHERE student_id = ${studentId}`;
    } else {
      rows = await sql`SELECT * FROM aie_tracking ORDER BY student_id, category, sub_item`;
    }

    // Convert to map format: { "studentId__category__subItem": "value" }
    const map = {};
    for (const row of rows) {
      map[`${row.student_id}__${row.category}__${row.sub_item}`] = row.value;
    }

    return NextResponse.json({ rows, map });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sql = getDb();
    const { studentId, category, subItem, value } = await request.json();

    if (!studentId || !category || !subItem) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (value === '' || value === null) {
      // Delete entry
      await sql`
        DELETE FROM aie_tracking
        WHERE student_id = ${studentId} AND category = ${category} AND sub_item = ${subItem}
      `;
    } else {
      await sql`
        INSERT INTO aie_tracking (student_id, category, sub_item, value, updated_at)
        VALUES (${studentId}, ${category}, ${subItem}, ${value}, NOW())
        ON CONFLICT (student_id, category, sub_item)
        DO UPDATE SET value = ${value}, updated_at = NOW()
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
