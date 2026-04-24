'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #27ae60 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏫</div>
          <h1 style={{ margin: 0, fontSize: 20, color: '#1a5276', fontWeight: 800 }}>
            Esc. N°1-004
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7f8c8d' }}>
            "Dr. Guillermo Rawson" — Godoy Cruz
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#2c3e50', fontWeight: 600 }}>
            Sistema DRT / AIE
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#7f8c8d' }}>
              Usuario
            </label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Ingresá tu usuario"
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #dce6f0',
                borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#7f8c8d' }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #dce6f0',
                borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fdedec', color: '#c0392b', padding: '8px 12px',
              borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: loading ? '#95a5a6' : '#1a5276',
            color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
            fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'background .2s',
          }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bdc3c7', marginTop: 20 }}>
          Refuerzo de Aprendizajes en Lengua y Matemática mediante TIC — 2026
        </p>
      </div>
    </div>
  );
}
