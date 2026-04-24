'use client';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SCHOOL = 'Esc. N°1-004 "Dr. Guillermo Rawson" — Godoy Cruz, Mendoza';
const PROJECT = 'Refuerzo de Aprendizajes en Lengua y Matemática mediante TIC — 2026';

function addHeader(doc, title) {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(SCHOOL, 14, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(PROJECT, 14, 21);
  doc.setDrawColor(26, 82, 118);
  doc.setLineWidth(0.5);
  doc.line(14, 24, doc.internal.pageSize.width - 14, 24);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 33);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, doc.internal.pageSize.width - 14, 33, { align: 'right' });
  return 38;
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 8, { align: 'center' });
    doc.text('Sistema DRT / AIE', 14, doc.internal.pageSize.height - 8);
    doc.setTextColor(0);
  }
}

export function exportStudentsPDF(students) {
  const doc = new jsPDF();
  const startY = addHeader(doc, 'Listado de Alumnos');

  doc.autoTable({
    startY,
    head: [['#', 'Apellido', 'Nombre', 'Grado', 'Turno']],
    body: students.map((s, i) => [i + 1, s.last_name, s.first_name, s.grade, s.shift]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 82, 118], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });

  doc.setFontSize(9);
  doc.text(`Total de alumnos: ${students.length}`, 14, doc.lastAutoTable.finalY + 10);
  addFooter(doc);
  doc.save('listado_alumnos.pdf');
}

export function exportEvalsPDF(evals, rubrics) {
  const doc = new jsPDF('l');
  const startY = addHeader(doc, 'Informe de Evaluaciones');

  const body = evals.map(ev => {
    const avg = ev.average ? parseFloat(ev.average).toFixed(1) : '—';
    const level = ev.level || '—';
    const dateStr = typeof ev.eval_date === 'string' ? ev.eval_date.slice(0, 10) : ev.eval_date;
    return [dateStr, `${ev.last_name}, ${ev.first_name}`, ev.grade, ev.program, avg, level];
  });

  doc.autoTable({
    startY,
    head: [['Fecha', 'Alumno', 'Grado', 'Programa', 'Promedio', 'Nivel']],
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 82, 118], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    columnStyles: {
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' },
    },
  });

  doc.setFontSize(9);
  doc.text(`Total de evaluaciones: ${evals.length}`, 14, doc.lastAutoTable.finalY + 10);
  addFooter(doc);
  doc.save('informe_evaluaciones.pdf');
}

export function exportEvalDetailPDF(ev, rubrics) {
  const doc = new jsPDF();
  const startY = addHeader(doc, 'Evaluación Individual');

  const dateStr = typeof ev.eval_date === 'string' ? ev.eval_date.slice(0, 10) : ev.eval_date;
  const avg = ev.average ? parseFloat(ev.average).toFixed(1) : '—';
  const level = ev.level || '—';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Alumno: ${ev.last_name}, ${ev.first_name}`, 14, startY + 2);
  doc.text(`Grado: ${ev.grade}`, 14, startY + 8);
  doc.text(`Programa: ${ev.program}`, 14, startY + 14);
  doc.text(`Fecha: ${dateStr}`, 120, startY + 2);
  doc.text(`Promedio: ${avg}`, 120, startY + 8);
  doc.text(`Nivel: ${level}`, 120, startY + 14);

  const programRubrics = rubrics.filter(r => r.program === ev.program);
  const scores = typeof ev.scores === 'string' ? JSON.parse(ev.scores) : (ev.scores || {});

  const body = programRubrics.map(r => {
    const score = scores[r.criterion_key] || '—';
    const lv = typeof score === 'number' ? (score >= 7 ? 'MS' : score >= 4 ? 'S' : 'PS') : '—';
    return [r.label, r.description, score, lv];
  });

  doc.autoTable({
    startY: startY + 22,
    head: [['Criterio', 'Descripción', 'Puntaje', 'Nivel']],
    body,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 82, 118], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
  });

  addFooter(doc);
  doc.save(`evaluacion_${ev.last_name}_${ev.first_name}_${dateStr}.pdf`);
}

export function exportAttendancePDF(students, attendanceMap, date) {
  const doc = new jsPDF();
  const startY = addHeader(doc, `Asistencia — ${date}`);

  const labels = { present: 'Presente', late: 'Tarde', absent: 'Ausente' };
  const body = students.map((s, i) => {
    const status = attendanceMap[`${date}__${s.id}`] || 'absent';
    return [i + 1, s.last_name, s.first_name, s.grade, s.shift, labels[status]];
  });

  doc.autoTable({
    startY,
    head: [['#', 'Apellido', 'Nombre', 'Grado', 'Turno', 'Estado']],
    body,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 82, 118], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'Presente') data.cell.styles.textColor = [39, 174, 96];
        else if (val === 'Tarde') data.cell.styles.textColor = [230, 126, 34];
        else if (val === 'Ausente') data.cell.styles.textColor = [192, 57, 43];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const presentes = body.filter(r => r[5] === 'Presente').length;
  const tardes = body.filter(r => r[5] === 'Tarde').length;
  const ausentes = body.filter(r => r[5] === 'Ausente').length;
  const y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(`Presentes: ${presentes}  |  Tardes: ${tardes}  |  Ausentes: ${ausentes}  |  Total: ${body.length}`, 14, y);

  addFooter(doc);
  doc.save(`asistencia_${date}.pdf`);
}

export function exportAIEPDF(students, aieData, categories) {
  const doc = new jsPDF('l');
  const startY = addHeader(doc, 'Planilla de Seguimiento AIE — Diagnóstico');

  const allSubs = [];
  const catEntries = Object.entries(categories);
  for (const [cat, subs] of catEntries) {
    if (subs[0] === '_level') {
      allSubs.push({ cat, sub: 'PS' }, { cat, sub: 'S' }, { cat, sub: 'MS' });
    } else {
      for (const s of subs) allSubs.push({ cat, sub: s });
    }
  }

  const head = [['Grado', 'Alumno', ...allSubs.map(s => s.sub)]];
  const body = students.map(st => {
    const row = [st.grade, `${st.last_name}, ${st.first_name}`];
    for (const { cat, sub } of allSubs) {
      if (['PS', 'S', 'MS'].includes(sub)) {
        const key = `${st.id}__${cat}__level`;
        row.push(aieData[key] === sub ? 'X' : '');
      } else {
        const key = `${st.id}__${cat}__${sub}`;
        row.push(aieData[key] === 'SI' ? 'SI' : '');
      }
    }
    return row;
  });

  doc.autoTable({
    startY,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
    headStyles: { fillColor: [26, 82, 118], textColor: 255, fontSize: 6 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    columnStyles: {
      0: { cellWidth: 18, halign: 'left' },
      1: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
    },
  });

  doc.setFontSize(8);
  const y = doc.lastAutoTable.finalY + 8;
  doc.text('PS = Poco Satisfactorio  |  S = Satisfactorio  |  MS = Muy Satisfactorio', 14, y);

  addFooter(doc);
  doc.save('seguimiento_aie.pdf');
}

export function exportRubricPDF(rubrics, program) {
  const doc = new jsPDF();
  const startY = addHeader(doc, `Rúbrica de Evaluación — ${program}`);

  const filtered = rubrics.filter(r => r.program === program);

  doc.autoTable({
    startY,
    head: [['Criterio', 'Descripción', 'PS (1-3)', 'S (4-6)', 'MS (7-10)']],
    body: filtered.map(r => [
      r.label,
      r.description,
      'No logra / Necesita asistencia constante',
      'Logra con ayuda parcial',
      'Logra de forma autónoma',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 82, 118], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 30, fontSize: 7 },
      3: { cellWidth: 30, fontSize: 7 },
      4: { cellWidth: 30, fontSize: 7 },
    },
  });

  addFooter(doc);
  doc.save(`rubrica_${program.replace(/[^a-zA-Z]/g, '_')}.pdf`);
}

export function exportSchedulePDF(scheduleData) {
  const doc = new jsPDF('l');
  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const HOURS = ['1°', '2°', '3°', '4°'];

  for (const shift of ['Mañana', 'Tarde']) {
    if (shift === 'Tarde') doc.addPage();
    const startY = addHeader(doc, `Cronograma Semanal — Turno ${shift}`);
    const sched = scheduleData[shift] || {};

    const body = HOURS.map(h => {
      const row = [h];
      for (const d of DAYS) {
        row.push(sched[d]?.[h] || '');
      }
      return row;
    });

    doc.autoTable({
      startY,
      head: [['Hora', ...DAYS]],
      body,
      styles: { fontSize: 10, cellPadding: 5, halign: 'center' },
      headStyles: { fillColor: [26, 82, 118], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 } },
    });
  }

  addFooter(doc);
  doc.save('cronograma_semanal.pdf');
}
