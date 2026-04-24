import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me-1234567890');

export async function POST(request) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE username = ${username} AND active = true`;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const user = rows[0];

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptErr) {
      console.error('bcrypt error:', bcryptErr);
      return NextResponse.json({ error: 'Error verificando contraseña' }, { status: 500 });
    }

    if (!valid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Create JWT directly here
    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET);

    // Set cookie using response.cookies
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set('drt-session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    return NextResponse.json({ error: 'Error interno: ' + err.message }, { status: 500 });
  }
}
