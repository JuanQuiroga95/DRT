import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE username = ${username} AND active = true`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    });

    const headers = setSessionCookie(token);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role },
    }, { headers });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
