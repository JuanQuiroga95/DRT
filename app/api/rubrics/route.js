import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program');

    let rows;
    if (program) {
      rows = await sql`SELECT * FROM rubrics WHERE program = ${program} AND active = true ORDER BY sort_order, id`;
    } else {
      rows = await sql`SELECT * FROM rubrics WHERE active = true ORDER BY program, sort_order, id`;
    }
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getDb();
    const { program, criterionKey, label, description, sortOrder } = await request.json();
    if (!program || !label) {
      return NextResponse.json({ error: 'Programa y nombre del criterio requeridos' }, { status: 400 });
    }
    const key = criterionKey || label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    const rows = await sql`
      INSERT INTO rubrics (program, criterion_key, label, description, sort_order)
      VALUES (${program}, ${key}, ${label}, ${description || ''}, ${sortOrder || 0})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sql = getDb();
    const { id, label, description, sortOrder } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const rows = await sql`
      UPDATE rubrics SET
        label = COALESCE(${label}, label),
        description = COALESCE(${description}, description),
        sort_order = COALESCE(${sortOrder}, sort_order)
      WHERE id = ${id} AND active = true
      RETURNING *
    `;
    if (rows.length === 0) return NextResponse.json({ error: 'Rúbrica no encontrada' }, { status: 404 });
    return NextResponse.json(rows[0]);
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
    await sql`UPDATE rubrics SET active = false WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
