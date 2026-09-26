import { StudentResult } from './student-result';

const GREEN: [number, number, number] = [37, 119, 60];
const PAPER: [number, number, number] = [255, 241, 190];

/** Produces a compact, one-page official-transcript layout. */
export async function downloadResultPdf(result: StudentResult): Promise<void> {
  const [{ jsPDF }] = await Promise.all([import('jspdf')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const semesters = result.semesters?.length ? result.semesters : [{ name: result.semester, subjects: result.subjects }];
  const left = semesters.filter((_, index) => index % 2 === 0);
  const right = semesters.filter((_, index) => index % 2 === 1);
  const totalCredits = result.subjects.reduce((total, subject) => total + subject.creditHours, 0);

  pdf.setFillColor(...PAPER).rect(0, 0, 210, 297, 'F');
  pdf.setTextColor(38, 34, 29);
  drawDetails(pdf, result);
  drawBrand(pdf);

  const top = 76;
  const leftBottom = drawSemesterColumn(pdf, left, 10, 102, top);
  const rightBottom = drawSemesterColumn(pdf, right, 102, 200, top);
  const tableBottom = Math.max(leftBottom, rightBottom) + 2;
  pdf.setDrawColor(60).setLineWidth(.3).rect(8, top - 5, 194, tableBottom - top + 7);
  pdf.line(102, top - 5, 102, tableBottom + 2);

  const summaryY = tableBottom + 8;
  pdf.setFont('helvetica', 'bold').setFontSize(8.8).setTextColor(35);
  pdf.text(`TOTAL CREDIT HOURS = ${totalCredits}`, 12, summaryY);
  pdf.text(`CUMULATIVE GRADE POINT AVERAGE (CGPA) = ${result.gpa.toFixed(2)} / 4.00`, 12, summaryY + 4.4);
  pdf.text(`SESSION: ${result.session ?? '-'}`, 12, summaryY + 8.8);
  pdf.text(`STATUS: ${result.status === 'PASS' ? 'COMPLETED' : result.status}`, 12, summaryY + 13.2);
  pdf.setFont('helvetica', 'italic').setFontSize(15).setTextColor(35).text('________________', 149, summaryY + 12);
  pdf.setFont('helvetica', 'bold').setFontSize(8.5).text('Controller of Examinations', 144, summaryY + 16.5);
  pdf.setFont('helvetica', 'normal').setFontSize(5.8).setTextColor(55).text('Note: This Transcript is issued without alterations, overwriting or erasure. Errors & Omissions are subject to revision.', 12, 268);
  pdf.text('Grade Point Matrix and other details on reverse side', 20, 271);
  pdf.setFillColor(...GREEN).rect(0, 278, 210, 19, 'F');
  pdf.setFont('helvetica', 'bold').setFontSize(10).setTextColor(255).text('uoledu.com', 13, 289);
  pdf.setLineWidth(.8).line(35, 281, 35, 295);
  pdf.setFontSize(7.5).text('1-KM Defence Road Off Bhobtian Chowk, Lahore, Pakistan', 40, 286.5);
  pdf.text('Tel: +92 42 32300865   Fax: +92 42 35321761', 40, 291.5);
  pdf.setLineWidth(.8).line(143, 281, 143, 295);
  pdf.setFontSize(9).text('UAN: +92 42 111865 865', 147, 289);
  pdf.save(`transcript-${result.transcriptNo ?? result.verificationCode}.pdf`);
}

function drawDetails(pdf: import('jspdf').jsPDF, result: StudentResult): void {
  const details: [string, string][] = [
    ['DATE OF ISSUE:', result.issueDate ?? '-'], ['TRANSCRIPT NO:', result.transcriptNo ?? result.verificationCode], ['REGISTRATION NO:', result.registrationNo], ['NAME:', result.studentName], ['FATHER’S NAME:', result.fatherName ?? '-'], ['DATE OF BIRTH:', result.dateOfBirth ?? '-'], ['DATE OF ADMISSION:', result.dateOfAdmission ?? '-'], ['DATE OF GRADUATION:', result.dateOfGraduation ?? '-'], ['SESSION:', result.session ?? '-'], ['PROGRAM:', result.program], ['DEPARTMENT:', result.department ?? '-'], ['CAMPUS:', result.campus]
  ];
  pdf.setFont('helvetica', 'normal').setFontSize(7.2);
  details.forEach(([label, value], index) => { const y = 16 + index * 4.1; pdf.text(label, 11, y); pdf.text(value, 45, y); });
}

function drawBrand(pdf: import('jspdf').jsPDF): void {
  pdf.setDrawColor(...GREEN).setLineWidth(.45).circle(139, 22, 13);
  pdf.line(139, 11, 139, 31).line(135, 31, 143, 31).line(137, 28, 141, 28).line(137, 15, 141, 15);
  pdf.setTextColor(...GREEN).setFont('helvetica', 'bold');
  pdf.setFontSize(11).text('THE', 155, 14);
  pdf.setFontSize(15).text('UNIVERSITY OF', 155, 21);
  pdf.setFontSize(19).text('LAHORE', 155, 29);
  pdf.setFont('helvetica', 'normal').setFontSize(7.8).text('OFFICIAL TRANSCRIPT', 155, 36);
  pdf.setTextColor(38, 34, 29);
}

function drawSemesterColumn(pdf: import('jspdf').jsPDF, semesters: { name: string; subjects: StudentResult['subjects'] }[], x1: number, x2: number, startY: number): number {
  let y = startY;
  const codeX = x1 + 4; const subjectX = x1 + 17; const creditX = x2 - 20; const gradeX = x2 - 5;
  for (const semester of semesters) {
    pdf.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(35).text(semester.name.toUpperCase(), x1 + 4, y);
    y += 5;
    pdf.setFontSize(6.7).text('Code', codeX, y).text('Subject', subjectX, y).text('Cr.Hrs', creditX - 4, y).text('Grades', gradeX - 7, y);
    y += 4.2;
    pdf.setFont('helvetica', 'normal').setFontSize(6.6);
    for (const subject of semester.subjects) {
      pdf.text(subject.code ?? '-', codeX, y);
      const name = pdf.splitTextToSize(subject.name, creditX - subjectX - 4) as string[];
      pdf.text(name[0] ?? '', subjectX, y);
      pdf.text(String(subject.creditHours), creditX, y, { align: 'right' });
      pdf.text(subject.grade, gradeX, y, { align: 'right' });
      y += 4.1;
    }
    y += 4.4;
  }
  return y;
}
