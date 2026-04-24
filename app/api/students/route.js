import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const shift = searchParams.get('shift');

    let rows;
    if (grade && shift) {
      rows = await sql`SELECT * FROM students WHERE active = true AND grade = ${grade} AND shift = ${shift} ORDER BY last_name, first_name`;
    } else if (grade) {
      rows = await sql`SELECT * FROM students WHERE active = true AND grade = ${grade} ORDER BY last_name, first_name`;
    } else if (shift) {
      rows = await sql`SELECT * FROM students WHERE active = true AND shift = ${shift} ORDER BY last_name, first_name`;
    } else {
      rows = await sql`SELECT * FROM students WHERE active = true ORDER BY last_name, first_name`;
    }

    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getDb();
    const { firstName, lastName, grade, shift } = await request.json();

    if (!firstName || !lastName || !grade || !shift) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO students (first_name, last_name, grade, shift)
      VALUES (${firstName}, ${lastName}, ${grade}, ${shift})
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
    const { id, firstName, lastName, grade, shift } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const rows = await sql`
      UPDATE students SET
        first_name = COALESCE(${firstName}, first_name),
        last_name = COALESCE(${lastName}, last_name),
        grade = COALESCE(${grade}, grade),
        shift = COALESCE(${shift}, shift)
      WHERE id = ${id} AND active = true
      RETURNING *
    `;

    if (rows.length === 0) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
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

    await sql`UPDATE students SET active = false WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
