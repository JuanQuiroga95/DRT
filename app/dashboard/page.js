'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Constants ──
const GRADES = ['1ro A','1ro B','2do A','2do B','2do C','3ro','3ro C','4to C','4to D','4to E','5to D','5to E','6to','7mo'];
const SHIFTS = ['Mañana','Tarde'];
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
const HOURS = ['1°','2°','3°','4°'];

const AIE_CATEGORIES = {
  'Identifica partes de la computadora': ['Teclado','Pantalla','Touchpad'],
  'Encendido / Apagado': ['Encender','Apagar'],
  'Manejo de touchpad': ['_level'],
  'Manejo de teclado': ['_level'],
};

const STAFF = [
  { name:'Pamela Pastrán', role:'DRT', shift:'Mañana' },
  { name:'Julieta Pezantes', role:'DRT', shift:'Tarde' },
  { name:'Miriam Solari', role:'AIE', shift:'Mañana' },
  { name:'Cecilia Lucero', role:'AIE', shift:'Tarde' },
  { name:'Juan Quiroga', role:'AIE', shift:'Tarde' },
];

const P = {
  bg:'#f0f4f8', card:'#ffffff', primary:'#1a5276', primaryLight:'#2980b9',
  accent:'#27ae60', accentWarm:'#e67e22', danger:'#c0392b',
  text:'#2c3e50', textLight:'#7f8c8d', border:'#dce6f0',
  headerGrad:'linear-gradient(135deg, #1a5276 0%, #2980b9 100%)',
  rowAlt:'#f8fbff', ps:'#e74c3c', s:'#f39c12', ms:'#27ae60',
};

const todayStr = () => new Date().toISOString().slice(0,10);

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) { window.location.href = '/'; return null; }
  return res.json();
}

// ── PDF loader (dynamic import to avoid SSR issues) ──
let pdfLib = null;
async function getPDF() {
  if (!pdfLib) pdfLib = await import('@/lib/pdf');
  return pdfLib;
}

// ── Shared components ──
function Card({ title, icon, children, actions, style: extra }) {
  return (
    <div style={{ background: P.card, borderRadius: 12, border: `1px solid ${P.border}`, marginBottom: 20, overflow: 'hidden', ...extra }}>
      {title && (
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon && <span>{icon}</span>}{title}
          </h2>
          {actions}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', small, disabled, style: extra }) {
  const bgMap = { primary: P.primary, accent: P.accent, danger: P.danger, warn: P.accentWarm, ghost: '#ecf0f1' };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? '#bdc3c7' : (bgMap[variant] || '#ecf0f1'),
      color: variant === 'ghost' ? P.text : '#fff', border: 'none', borderRadius: 8,
      padding: small ? '6px 12px' : '10px 18px', fontSize: small ? 12 : 14,
      fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, ...extra,
    }}>{children}</button>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: P.textLight }}>{label}</label>}
      <input {...props} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', ...(props.style || {}) }} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: P.textLight }}>{label}</label>}
      <select {...props} style={{ width: '100%', padding: '8px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 14, background: '#fff', boxSizing: 'border-box', ...(props.style || {}) }}>
        <option value="">— Seleccionar —</option>
        {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? o : o.label}</option>)}
      </select>
    </div>
  );
}

function PdfBtn({ onClick, label }) {
  return <Btn variant="danger" small onClick={onClick} style={{ background: '#c0392b' }}>📄 {label || 'Exportar PDF'}</Btn>;
}

// ━━━━━━━━━━━━━━━━━━━━━ MAIN APP ━━━━━━━━━━━━━━━━━━━━━
export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [scheduleData, setScheduleData] = useState({});
  const [aieData, setAieData] = useState({});
  const [evals, setEvals] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [stu, sch, aie, ev, rub] = await Promise.all([
      api('/api/students'), api('/api/schedule'), api('/api/aie'),
      api('/api/evaluations'), api('/api/rubrics'),
    ]);
    if (stu) setStudents(stu);
    if (sch) setScheduleData(sch.structured || {});
    if (aie) setAieData(aie.map || {});
    if (ev) setEvals(ev);
    if (rub) setRubrics(rub);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleLogout = () => { document.cookie = 'drt-session=; Path=/; Max-Age=0'; router.push('/'); };

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Inicio' },
    { id: 'students', icon: '👨‍🎓', label: 'Alumnos' },
    { id: 'schedule', icon: '📅', label: 'Cronograma' },
    { id: 'aie', icon: '🖥️', label: 'Seguim. AIE' },
    { id: 'rubrics', icon: '📋', label: 'Rúbricas' },
    { id: 'evals', icon: '✅', label: 'Evaluaciones' },
    { id: 'attendance', icon: '📝', label: 'Asistencia' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: P.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
        <div style={{ color: P.primary, fontSize: 18, fontWeight: 600 }}>Cargando...</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: P.bg, color: P.text }}>
      <header style={{ background: P.headerGrad, color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 28 }}>🏫</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Esc. N°1-004 "Dr. Guillermo Rawson"</h1>
          <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>Sistema DRT / AIE — Lengua y Matemática con TIC — 2026</p>
        </div>
        <Btn variant="ghost" small onClick={handleLogout} style={{ color: '#fff', background: 'rgba(255,255,255,.15)' }}>🚪 Salir</Btn>
      </header>

      <nav style={{ display: 'flex', gap: 2, padding: '0 8px', background: '#fff', borderBottom: `2px solid ${P.border}`, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 14px', border: 'none', background: tab === t.id ? P.primary : 'transparent',
            color: tab === t.id ? '#fff' : P.textLight, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            borderRadius: '8px 8px 0 0', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
          }}><span>{t.icon}</span>{t.label}</button>
        ))}
      </nav>

      <main style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'dashboard' && <DashboardTab students={students} evals={evals} scheduleData={scheduleData} />}
        {tab === 'students' && <StudentsTab students={students} reload={loadAll} />}
        {tab === 'schedule' && <ScheduleTab scheduleData={scheduleData} reload={loadAll} />}
        {tab === 'aie' && <AIETab students={students} aieData={aieData} setAieData={setAieData} />}
        {tab === 'rubrics' && <RubricsTab rubrics={rubrics} reload={loadAll} />}
        {tab === 'evals' && <EvalsTab students={students} evals={evals} rubrics={rubrics} reload={loadAll} />}
        {tab === 'attendance' && <AttendanceTab students={students} attendanceMap={attendanceMap} setAttendanceMap={setAttendanceMap} />}
      </main>
    </div>
  );
}

// ━━━━━ DASHBOARD TAB ━━━━━
function DashboardTab({ students, evals, scheduleData }) {
  const dayIdx = new Date().getDay();
  const todayName = DAYS[dayIdx - 1] || null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '👨‍🎓', label: 'Alumnos', val: students.length, color: P.primary },
          { icon: '✅', label: 'Evaluaciones', val: evals.length, color: P.accent },
          { icon: '👩‍🏫', label: 'Equipo', val: STAFF.length, color: P.primaryLight },
        ].map((c, i) => (
          <div key={i} style={{ background: P.card, borderRadius: 12, padding: 20, border: `1px solid ${P.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 32 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 12, color: P.textLight }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
        <Card title="Equipo Docente" icon="👩‍🏫">
          {STAFF.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < STAFF.length - 1 ? `1px solid ${P.border}` : 'none' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{s.name}</span>
              <span style={{ background: s.role === 'DRT' ? P.primary : P.accent, color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{s.role}</span>
              <span style={{ fontSize: 12, color: P.textLight }}>{s.shift}</span>
            </div>
          ))}
        </Card>
        <Card title={todayName ? `Hoy: ${todayName}` : 'Fin de semana'} icon="📅">
          {todayName && scheduleData ? ['Mañana', 'Tarde'].map(shift => {
            const dayData = scheduleData[shift]?.[todayName];
            if (!dayData) return null;
            return (
              <div key={shift} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: shift === 'Mañana' ? P.primary : P.accent, marginBottom: 6 }}>Turno {shift}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {HOURS.map(h => {
                    const val = dayData[h] || '';
                    const isDIP = val === 'DIP';
                    return <span key={h} style={{ background: isDIP ? '#fef9e7' : '#ebf5fb', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: isDIP ? P.accentWarm : P.primary }}>{h}: {isDIP ? 'DIP' : val}</span>;
                  })}
                </div>
              </div>
            );
          }) : <p style={{ color: P.textLight, textAlign: 'center', padding: 20 }}>No hay actividades hoy.</p>}
        </Card>
      </div>
    </>
  );
}

// ━━━━━ STUDENTS TAB ━━━━━
function StudentsTab({ students, reload }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', grade: '', shift: '' });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.grade || !form.shift) return;
    setSaving(true);
    if (editing) {
      await api('/api/students', { method: 'PUT', body: { id: editing, ...form } });
      setEditing(null);
    } else {
      await api('/api/students', { method: 'POST', body: form });
    }
    setForm({ firstName: '', lastName: '', grade: '', shift: '' });
    await reload();
    setSaving(false);
  };

  const handleDelete = async (id) => { if (confirm('¿Eliminar este alumno?')) { await api(`/api/students?id=${id}`, { method: 'DELETE' }); await reload(); } };
  const filtered = students.filter(s => `${s.first_name} ${s.last_name} ${s.grade} ${s.shift}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Card title={editing ? 'Editar alumno' : 'Agregar alumno'} icon="➕">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          <Input label="Nombre" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
          <Input label="Apellido" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          <Select label="Grado" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} options={GRADES} />
          <Select label="Turno" value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} options={SHIFTS} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn onClick={handleSave} disabled={saving}>{editing ? '💾 Guardar' : '➕ Agregar'}</Btn>
          {editing && <Btn variant="ghost" onClick={() => { setEditing(null); setForm({ firstName: '', lastName: '', grade: '', shift: '' }); }}>Cancelar</Btn>}
        </div>
      </Card>
      <Card title={`Alumnos (${filtered.length})`} icon="👨‍🎓" actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{ padding: '6px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 13 }} />
          <PdfBtn onClick={async () => { const pdf = await getPDF(); pdf.exportStudentsPDF(filtered); }} label="PDF" />
        </div>
      }>
        {filtered.length === 0 ? <p style={{ textAlign: 'center', color: P.textLight, padding: 20 }}>No hay alumnos.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: P.bg }}>
                {['#','Apellido','Nombre','Grado','Turno','Acciones'].map(h => <th key={h} style={{ padding: 10, textAlign: h === 'Acciones' ? 'center' : 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${P.border}`, background: i % 2 ? P.rowAlt : '#fff' }}>
                    <td style={{ padding: 10, color: P.textLight }}>{i + 1}</td>
                    <td style={{ padding: 10, fontWeight: 600 }}>{s.last_name}</td>
                    <td style={{ padding: 10 }}>{s.first_name}</td>
                    <td style={{ padding: 10 }}><span style={{ background: '#ebf5fb', padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: P.primary }}>{s.grade}</span></td>
                    <td style={{ padding: 10 }}>{s.shift}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button onClick={() => { setEditing(s.id); setForm({ firstName: s.first_name, lastName: s.last_name, grade: s.grade, shift: s.shift }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginRight: 8 }}>✏️</button>
                      <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ━━━━━ SCHEDULE TAB ━━━━━
function ScheduleTab({ scheduleData, reload }) {
  const [editShift, setEditShift] = useState('Mañana');
  const schedule = scheduleData[editShift] || {};
  const updateCell = async (day, hour, val) => { await api('/api/schedule', { method: 'PUT', body: { shift: editShift, dayName: day, hourSlot: hour, assignedGroup: val } }); await reload(); };

  return (
    <Card title="Cronograma Semanal" icon="📅" actions={
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {SHIFTS.map(s => <Btn key={s} variant={editShift === s ? 'primary' : 'ghost'} small onClick={() => setEditShift(s)}>{s}</Btn>)}
        <PdfBtn onClick={async () => { const pdf = await getPDF(); pdf.exportSchedulePDF(scheduleData); }} label="PDF" />
      </div>
    }>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: P.headerGrad, color: '#fff' }}>
            <th style={{ padding: 10, textAlign: 'center', width: 60 }}>Hora</th>
            {DAYS.map(d => <th key={d} style={{ padding: 10, textAlign: 'center' }}>{d}</th>)}
          </tr></thead>
          <tbody>
            {HOURS.map((h, hi) => (
              <tr key={hi} style={{ borderBottom: `1px solid ${P.border}` }}>
                <td style={{ padding: 10, textAlign: 'center', fontWeight: 700, background: P.bg }}>{h}</td>
                {DAYS.map(d => {
                  const val = schedule[d]?.[h] || '';
                  return (
                    <td key={d} style={{ padding: 6, textAlign: 'center', background: val === 'DIP' ? '#fef9e7' : '#fff' }}>
                      <input defaultValue={val} onBlur={e => { if (e.target.value !== val) updateCell(d, h, e.target.value); }}
                        style={{ width: '100%', textAlign: 'center', border: `1px solid ${P.border}`, borderRadius: 6, padding: '6px 4px', fontSize: 12, fontWeight: 600, color: val === 'DIP' ? P.accentWarm : P.primary, background: 'transparent', boxSizing: 'border-box' }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ━━━━━ AIE TRACKING TAB ━━━━━
function AIETab({ students, aieData, setAieData }) {
  const [filterGrade, setFilterGrade] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const filtered = students.filter(s => (!filterGrade || s.grade === filterGrade) && (!filterShift || s.shift === filterShift));
  const categories = Object.entries(AIE_CATEGORIES);

  const toggleCheck = async (sid, cat, sub) => {
    const key = `${sid}__${cat}__${sub}`;
    const nv = aieData[key] === 'SI' ? '' : 'SI';
    setAieData(prev => ({ ...prev, [key]: nv }));
    await api('/api/aie', { method: 'PUT', body: { studentId: sid, category: cat, subItem: sub, value: nv } });
  };
  const setLevel = async (sid, cat, level) => {
    const key = `${sid}__${cat}__level`;
    const nv = aieData[key] === level ? '' : level;
    setAieData(prev => ({ ...prev, [key]: nv }));
    await api('/api/aie', { method: 'PUT', body: { studentId: sid, category: cat, subItem: 'level', value: nv } });
  };

  return (
    <Card title="Seguimiento AIE — Diagnóstico" icon="🖥️" actions={
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value="">Todos</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterShift} onChange={e => setFilterShift(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value="">Ambos</option>{SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <PdfBtn onClick={async () => { const pdf = await getPDF(); pdf.exportAIEPDF(filtered, aieData, AIE_CATEGORIES); }} label="PDF" />
      </div>
    }>
      {filtered.length === 0 ? <p style={{ textAlign: 'center', color: P.textLight, padding: 20 }}>No hay alumnos.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: P.primary, color: '#fff' }}>
                <th rowSpan={2} style={{ padding: 8, textAlign: 'left', minWidth: 50 }}>Grado</th>
                <th rowSpan={2} style={{ padding: 8, textAlign: 'left', minWidth: 120 }}>Alumno</th>
                {categories.map(([cat, subs]) => (
                  <th key={cat} colSpan={subs[0] === '_level' ? 3 : subs.length} style={{ padding: 6, textAlign: 'center', borderLeft: '2px solid rgba(255,255,255,.3)', fontSize: 10 }}>{cat}</th>
                ))}
              </tr>
              <tr style={{ background: P.primaryLight, color: '#fff' }}>
                {categories.map(([cat, subs]) => (
                  subs[0] === '_level'
                    ? ['PS', 'S', 'MS'].map(l => <th key={`${cat}-${l}`} style={{ padding: 4, textAlign: 'center', fontSize: 10 }}>{l}</th>)
                    : subs.map(s => <th key={`${cat}-${s}`} style={{ padding: 4, textAlign: 'center', fontSize: 10 }}>{s}</th>)
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((st, si) => (
                <tr key={st.id} style={{ borderBottom: `1px solid ${P.border}`, background: si % 2 ? P.rowAlt : '#fff' }}>
                  <td style={{ padding: 6, fontWeight: 600, fontSize: 11 }}>{st.grade}</td>
                  <td style={{ padding: 6, fontSize: 12 }}>{st.last_name}, {st.first_name}</td>
                  {categories.map(([cat, subs]) => (
                    subs[0] === '_level'
                      ? ['PS', 'S', 'MS'].map(l => {
                        const active = aieData[`${st.id}__${cat}__level`] === l;
                        const color = l === 'PS' ? P.ps : l === 'S' ? P.s : P.ms;
                        return <td key={`${cat}-${l}-${st.id}`} style={{ padding: 4, textAlign: 'center' }}>
                          <button onClick={() => setLevel(st.id, cat, l)} style={{ width: 24, height: 24, border: `2px solid ${color}`, borderRadius: 6, background: active ? color : '#fff', color: active ? '#fff' : color, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>{active ? '✓' : ''}</button>
                        </td>;
                      })
                      : subs.map(sub => {
                        const checked = aieData[`${st.id}__${cat}__${sub}`] === 'SI';
                        return <td key={`${cat}-${sub}-${st.id}`} style={{ padding: 4, textAlign: 'center' }}>
                          <button onClick={() => toggleCheck(st.id, cat, sub)} style={{ width: 24, height: 24, border: `2px solid ${checked ? P.accent : P.border}`, borderRadius: 6, background: checked ? P.accent : '#fff', color: '#fff', fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>{checked ? '✓' : ''}</button>
                        </td>;
                      })
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 11, color: P.textLight }}><strong>Ref:</strong> PS = Poco Satisfactorio | S = Satisfactorio | MS = Muy Satisfactorio</div>
        </div>
      )}
    </Card>
  );
}

// ━━━━━ RUBRICS TAB (CRUD + PDF) ━━━━━
function RubricsTab({ rubrics, reload }) {
  const [active, setActive] = useState('G-Compris');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: '', description: '', sortOrder: 0 });
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');

  const programs = [...new Set(rubrics.map(r => r.program))];
  if (!programs.includes('G-Compris')) programs.unshift('G-Compris');
  if (!programs.includes('Propuesta DALE!') && !programs.some(p => p === 'Propuesta DALE!')) programs.push('Propuesta DALE!');

  const filtered = rubrics.filter(r => r.program === active);

  const handleSave = async () => {
    if (!form.label) return;
    if (editingId) {
      await api('/api/rubrics', { method: 'PUT', body: { id: editingId, label: form.label, description: form.description, sortOrder: form.sortOrder } });
    } else {
      await api('/api/rubrics', { method: 'POST', body: { program: active, label: form.label, description: form.description, sortOrder: form.sortOrder || filtered.length + 1 } });
    }
    setForm({ label: '', description: '', sortOrder: 0 });
    setEditingId(null);
    setShowForm(false);
    await reload();
  };

  const handleAddProgram = async () => {
    const name = newProgramName.trim();
    if (!name) return;
    if (programs.includes(name)) { alert('Ese programa ya existe'); return; }
    // Create the program by adding a placeholder rubric
    await api('/api/rubrics', { method: 'POST', body: { program: name, label: 'Primer criterio', description: 'Editá este criterio o agregá más', sortOrder: 1 } });
    setNewProgramName('');
    setShowNewProgram(false);
    await reload();
    setActive(name);
  };

  const handleDelete = async (id) => { if (confirm('¿Eliminar este criterio?')) { await api(`/api/rubrics?id=${id}`, { method: 'DELETE' }); await reload(); } };

  const startEdit = (r) => { setEditingId(r.id); setForm({ label: r.label, description: r.description, sortOrder: r.sort_order }); setShowForm(true); };

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {programs.map(p => <Btn key={p} variant={active === p ? 'primary' : 'ghost'} onClick={() => { setActive(p); setShowForm(false); setEditingId(null); }}>{p}</Btn>)}
        <Btn variant="warn" small onClick={() => setShowNewProgram(!showNewProgram)}>➕ Nuevo programa</Btn>
        <div style={{ flex: 1 }} />
        <PdfBtn onClick={async () => { const pdf = await getPDF(); pdf.exportRubricPDF(rubrics, active); }} label="PDF Rúbrica" />
      </div>

      {showNewProgram && (
        <Card title="Agregar nuevo programa" icon="📦">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input label="Nombre del programa" value={newProgramName} onChange={e => setNewProgramName(e.target.value)} placeholder="Ej: Wordwall, Sebran, etc." />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Btn onClick={handleAddProgram}>✅ Crear programa</Btn>
              <Btn variant="ghost" onClick={() => { setShowNewProgram(false); setNewProgramName(''); }}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {showForm && (
        <Card title={editingId ? 'Editar criterio' : 'Agregar criterio'} icon="✏️">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            <Input label="Nombre del criterio" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ej: Manejo del mouse" />
            <Input label="Orden" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: P.textLight }}>Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${P.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={handleSave}>💾 Guardar</Btn>
            <Btn variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setForm({ label: '', description: '', sortOrder: 0 }); }}>Cancelar</Btn>
          </div>
        </Card>
      )}

      <Card title={`Rúbrica — ${active} (${filtered.length} criterios)`} icon="📋" actions={
        !showForm && <Btn variant="accent" small onClick={() => { setShowForm(true); setEditingId(null); setForm({ label: '', description: '', sortOrder: filtered.length + 1 }); }}>➕ Agregar criterio</Btn>
      }>
        {filtered.length === 0 ? <p style={{ textAlign: 'center', color: P.textLight, padding: 20 }}>No hay criterios definidos para este programa.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: P.primary, color: '#fff' }}>
                <th style={{ padding: 10, textAlign: 'center', width: 40 }}>#</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Criterio</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Descripción</th>
                <th style={{ padding: 10, textAlign: 'center', width: 100, background: P.ps }}>PS (1-3)</th>
                <th style={{ padding: 10, textAlign: 'center', width: 100, background: P.s }}>S (4-6)</th>
                <th style={{ padding: 10, textAlign: 'center', width: 100, background: P.ms }}>MS (7-10)</th>
                <th style={{ padding: 10, textAlign: 'center', width: 80 }}>Acciones</th>
              </tr></thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${P.border}`, background: i % 2 ? P.rowAlt : '#fff' }}>
                    <td style={{ padding: 10, textAlign: 'center', color: P.textLight }}>{r.sort_order || i + 1}</td>
                    <td style={{ padding: 10, fontWeight: 700 }}>{r.label}</td>
                    <td style={{ padding: 10, color: P.textLight, fontSize: 12 }}>{r.description}</td>
                    <td style={{ padding: 10, textAlign: 'center', fontSize: 10, color: P.ps }}>No logra</td>
                    <td style={{ padding: 10, textAlign: 'center', fontSize: 10, color: P.s }}>Con ayuda</td>
                    <td style={{ padding: 10, textAlign: 'center', fontSize: 10, color: P.ms }}>Autónomo</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button onClick={() => startEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginRight: 4 }}>✏️</button>
                      <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ━━━━━ EVALUATIONS TAB ━━━━━
function EvalsTab({ students, evals, rubrics, reload }) {
  const [form, setForm] = useState({ studentId: '', program: '', date: todayStr(), scores: {} });
  const [viewStudent, setViewStudent] = useState('');
  const [viewProgram, setViewProgram] = useState('');
  const [saving, setSaving] = useState(false);

  const programs = [...new Set(rubrics.map(r => r.program))];
  const programRubrics = rubrics.filter(r => r.program === form.program);

  const submitEval = async () => {
    if (!form.studentId || !form.program) return;
    setSaving(true);
    await api('/api/evaluations', { method: 'POST', body: { studentId: parseInt(form.studentId), program: form.program, evalDate: form.date, scores: form.scores } });
    setForm({ studentId: '', program: '', date: todayStr(), scores: {} });
    await reload();
    setSaving(false);
  };

  const deleteEval = async (id) => { if (confirm('¿Eliminar?')) { await api(`/api/evaluations?id=${id}`, { method: 'DELETE' }); await reload(); } };
  const filteredEvals = evals.filter(e => (!viewStudent || String(e.student_id) === viewStudent) && (!viewProgram || e.program === viewProgram));

  return (
    <>
      <Card title="Registrar evaluación" icon="✏️">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          <Select label="Alumno" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
            options={students.map(s => ({ value: String(s.id), label: `${s.last_name}, ${s.first_name} (${s.grade})` }))} />
          <Select label="Programa" value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value, scores: {} }))}
            options={programs} />
          <Input label="Fecha" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
        {programRubrics.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: P.primary }}>Puntaje por criterio (1 a 10):</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 8 }}>
              {programRubrics.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: P.bg, borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{r.label}</span>
                  <input type="number" min={0} max={10} value={form.scores[r.criterion_key] || ''} onChange={e => setForm(f => ({ ...f, scores: { ...f.scores, [r.criterion_key]: parseInt(e.target.value) || 0 } }))}
                    style={{ width: 50, textAlign: 'center', padding: '4px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 13, fontWeight: 700 }} />
                </div>
              ))}
            </div>
          </div>
        )}
        <Btn onClick={submitEval} disabled={saving} style={{ marginTop: 16 }}>✅ Guardar evaluación</Btn>
      </Card>

      <Card title={`Evaluaciones (${filteredEvals.length})`} icon="📋" actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={viewStudent} onChange={e => setViewStudent(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="">Todos</option>{students.map(s => <option key={s.id} value={String(s.id)}>{s.last_name}, {s.first_name}</option>)}
          </select>
          <select value={viewProgram} onChange={e => setViewProgram(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="">Todos</option>{programs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <PdfBtn onClick={async () => { const pdf = await getPDF(); pdf.exportEvalsPDF(filteredEvals, rubrics); }} label="PDF General" />
        </div>
      }>
        {filteredEvals.length === 0 ? <p style={{ textAlign: 'center', color: P.textLight, padding: 20 }}>No hay evaluaciones.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ background: P.bg }}>
                {['Fecha','Alumno','Grado','Programa','Prom.','Nivel',''].map(h => <th key={h} style={{ padding: 8, textAlign: h === '' ? 'center' : 'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredEvals.map((ev, i) => {
                  const avg = ev.average ? parseFloat(ev.average) : 0;
                  const level = ev.level || '—';
                  const levelColor = level === 'MS' ? P.ms : level === 'S' ? P.s : level === 'PS' ? P.ps : P.textLight;
                  const dateStr = typeof ev.eval_date === 'string' ? ev.eval_date.slice(0, 10) : ev.eval_date;
                  return (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${P.border}`, background: i % 2 ? P.rowAlt : '#fff' }}>
                      <td style={{ padding: 8 }}>{dateStr}</td>
                      <td style={{ padding: 8, fontWeight: 600 }}>{ev.last_name}, {ev.first_name}</td>
                      <td style={{ padding: 8 }}>{ev.grade}</td>
                      <td style={{ padding: 8 }}>{ev.program}</td>
                      <td style={{ padding: 8, fontWeight: 700, color: levelColor }}>{avg.toFixed(1)}</td>
                      <td style={{ padding: 8 }}><span style={{ background: levelColor, color: '#fff', padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{level}</span></td>
                      <td style={{ padding: 8, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={async () => { const pdf = await getPDF(); pdf.exportEvalDetailPDF(ev, rubrics); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginRight: 4 }} title="PDF individual">📄</button>
                        <button onClick={() => deleteEval(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

// ━━━━━ ATTENDANCE TAB ━━━━━
function AttendanceTab({ students, attendanceMap, setAttendanceMap }) {
  const [selDate, setSelDate] = useState(todayStr());
  const [filterGrade, setFilterGrade] = useState('');
  const [filterShift, setFilterShift] = useState('');

  const loadAtt = useCallback(async () => {
    const data = await api(`/api/attendance?date=${selDate}`);
    if (data) setAttendanceMap(data.map || {});
  }, [selDate, setAttendanceMap]);

  useEffect(() => { loadAtt(); }, [loadAtt]);

  const filtered = students.filter(s => (!filterGrade || s.grade === filterGrade) && (!filterShift || s.shift === filterShift));

  const toggleAttendance = async (sid) => {
    const key = `${selDate}__${sid}`;
    const cur = attendanceMap[key] || 'absent';
    const next = cur === 'absent' ? 'present' : cur === 'present' ? 'late' : 'absent';
    setAttendanceMap(prev => ({ ...prev, [key]: next }));
    await api('/api/attendance', { method: 'PUT', body: { studentId: sid, date: selDate, status: next } });
  };

  const getStatus = (id) => attendanceMap[`${selDate}__${id}`] || 'absent';
  const cfg = {
    present: { label: 'Presente', bg: '#eafaf1', color: P.accent, icon: '✅' },
    late: { label: 'Tarde', bg: '#fef9e7', color: P.accentWarm, icon: '⏰' },
    absent: { label: 'Ausente', bg: '#fdedec', color: P.danger, icon: '❌' },
  };
  const stats = { present: filtered.filter(s => getStatus(s.id) === 'present').length, late: filtered.filter(s => getStatus(s.id) === 'late').length, absent: filtered.filter(s => getStatus(s.id) === 'absent').length };

  return (
    <Card title="Control de Asistencia" icon="📝" actions={
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }} />
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value="">Todos</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterShift} onChange={e => setFilterShift(e.target.value)} style={{ padding: '4px 8px', border: `1px solid ${P.border}`, borderRadius: 6, fontSize: 12 }}>
          <option value="">Ambos</option>{SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <PdfBtn onClick={async () => { const pdf = await getPDF(); pdf.exportAttendancePDF(filtered, attendanceMap, selDate); }} label="PDF" />
      </div>
    }>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(cfg).map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: c.bg, borderRadius: 8 }}>
            <span>{c.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{stats[k]}</span>
            <span style={{ fontSize: 12, color: P.textLight }}>{c.label}</span>
          </div>
        ))}
      </div>
      {filtered.length === 0 ? <p style={{ textAlign: 'center', color: P.textLight, padding: 20 }}>No hay alumnos.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 8 }}>
          {filtered.map(s => {
            const status = getStatus(s.id);
            const c = cfg[status];
            return (
              <button key={s.id} onClick={() => toggleAttendance(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: c.bg, border: `2px solid ${c.color}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P.text }}>{s.last_name}, {s.first_name}</div>
                  <div style={{ fontSize: 11, color: P.textLight }}>{s.grade} — {s.shift}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.color, padding: '2px 8px', background: 'rgba(255,255,255,.6)', borderRadius: 6 }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 11, color: P.textLight, marginTop: 12 }}>Click para alternar: Ausente → Presente → Tarde → Ausente</p>
    </Card>
  );
}
