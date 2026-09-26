import { StudentResult, isPass } from './student-result';

const GREEN: [number, number, number] = [23, 76, 38];
const RED: [number, number, number] = [179, 38, 30];

/** Builds and downloads an A4 PDF of one result. jsPDF is imported on demand so it stays out of the initial bundle. */
export async function downloadResultPdf(result: StudentResult): Promise<void> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  // autoTable records where the last table ended on the document, but its typings don't expose it.
  const lastTableEnd = () => (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  pdf.setFillColor(...GREEN).rect(0, 0, 210, 26, 'F');
  pdf.setFont('helvetica', 'bold').setFontSize(18).setTextColor(255).text('Online Result Verification', 15, 16.5);
  pdf.setFontSize(14).setTextColor(...GREEN).text('Result Verified', 15, 40);
  pdf.setFont('helvetica', 'normal').setFontSize(10).setTextColor(80).text('This result has been successfully verified.', 15, 46);

  autoTable(pdf, {
    startY: 52,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.4 },
    columnStyles: { 0: { cellWidth: 45, textColor: 90 }, 1: { fontStyle: 'bold', textColor: 20 } },
    body: [
      ['Verification Code', result.verificationCode],
      ['Registration No', result.registrationNo],
      ['Student Name', result.studentName],
      ['Program', result.program],
      ['Campus', result.campus],
      ['Semester', result.semester],
      ['Roll No', result.rollNo]
    ]
  });

  autoTable(pdf, {
    startY: lastTableEnd() + 6,
    theme: 'grid',
    head: [['Subject', 'Credit Hours', 'Marks', 'Grade', 'Grade Point']],
    body: result.subjects.map((s) => [s.name, s.creditHours, s.marks, s.grade, s.gradePoint.toFixed(2)]),
    styles: { fontSize: 10, cellPadding: 2.5, halign: 'center', lineColor: 220 },
    headStyles: { fillColor: GREEN, textColor: 255 },
    // columnStyles only reach body cells, so align the Subject header here too.
    didParseCell: ({ column, cell }) => { if (column.index === 0) cell.styles.halign = 'left'; }
  });

  const summaryY = lastTableEnd() + 12;
  pdf.setFontSize(11).setTextColor(80).text('Semester GPA', 15, summaryY).text('Status', 110, summaryY);
  pdf.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...GREEN).text(result.gpa.toFixed(2), 15, summaryY + 8);
  pdf.setTextColor(...(isPass(result) ? GREEN : RED)).text(result.status, 110, summaryY + 8);
  pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110)
    .text(['This result is electronically verified.', 'For official verification, contact the university.'], 15, summaryY + 24);

  pdf.save(`result-${result.verificationCode}.pdf`);
}
