import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me-1234567890');

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('drt-session')?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const result = await jwtVerify(token, SECRET);
    if (!result || !result.payload) {
      throw new Error('Token inválido');
    }
    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('drt-session');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/students/:path*', '/api/schedule/:path*', '/api/aie/:path*', '/api/evaluations/:path*', '/api/attendance/:path*', '/api/rubrics/:path*'],
};
