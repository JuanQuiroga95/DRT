export const metadata = {
  title: 'Sistema DRT / AIE — Esc. Guillermo Rawson',
  description: 'Refuerzo de Aprendizajes en Lengua y Matemática mediante TIC',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
