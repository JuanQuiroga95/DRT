import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const shift = searchParams.get('shift');

    let rows;
    if (shift) {
      rows = await sql`SELECT * FROM schedule WHERE shift = ${shift} ORDER BY day_name, hour_slot`;
    } else {
      rows = await sql`SELECT * FROM schedule ORDER BY shift, day_name, hour_slot`;
    }

    // Convert to structured format: { shift: { day: { hour: group } } }
    const structured = {};
    for (const row of rows) {
      if (!structured[row.shift]) structured[row.shift] = {};
      if (!structured[row.shift][row.day_name]) structured[row.shift][row.day_name] = {};
      structured[row.shift][row.day_name][row.hour_slot] = row.assigned_group;
    }

    return NextResponse.json({ rows, structured });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sql = getDb();
    const { shift, dayName, hourSlot, assignedGroup } = await request.json();

    if (!shift || !dayName || !hourSlot) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    await sql`
      INSERT INTO schedule (shift, day_name, hour_slot, assigned_group, updated_at)
      VALUES (${shift}, ${dayName}, ${hourSlot}, ${assignedGroup || ''}, NOW())
      ON CONFLICT (shift, day_name, hour_slot)
      DO UPDATE SET assigned_group = ${assignedGroup || ''}, updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
