import { StudentResult } from './student-result';

const GREEN: [number, number, number] = [18, 101, 53];

/** Produces a one-page verification certificate containing the final CGPA only. */
export async function downloadResultPdf(result: StudentResult): Promise<void> {
  const [{ jsPDF }] = await Promise.all([import('jspdf')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  pdf.setFillColor(250, 253, 251).rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...GREEN).rect(0, 0, 210, 42, 'F');
  pdf.setTextColor(255).setFont('helvetica', 'bold').setFontSize(20).text('ONLINE RESULT VERIFICATION', 105, 19, { align: 'center' });
  pdf.setFont('helvetica', 'normal').setFontSize(10).text('THE UNIVERSITY OF LAHORE', 105, 28, { align: 'center' });

  pdf.setFillColor(237, 248, 240).roundedRect(18, 54, 174, 28, 3, 3, 'F');
  pdf.setTextColor(...GREEN).setFont('helvetica', 'bold').setFontSize(17).text('RESULT VERIFIED', 45, 66);
  pdf.setFont('helvetica', 'normal').setFontSize(10).text('This result has been successfully verified.', 45, 74);
  pdf.setFillColor(27, 166, 75).circle(31, 68, 8, 'F');
  pdf.setTextColor(255).setFont('helvetica', 'bold').setFontSize(14).text('✓', 31, 72, { align: 'center' });

  const details: [string, string][] = [
    ['Verification Code', result.verificationCode], ['Transcript No', result.transcriptNo ?? result.verificationCode], ['Registration No', result.registrationNo], ['Student Name', result.studentName], ['Program', result.program], ['Campus', result.campus], ['Roll No', result.rollNo], ['Session', result.session ?? '-'], ['Date of Graduation', result.dateOfGraduation ?? '-']
  ];
  pdf.setTextColor(31, 52, 38).setFontSize(10);
  details.forEach(([label, value], index) => {
    const y = 98 + index * 10;
    pdf.setFont('helvetica', 'bold').text(`${label}:`, 28, y);
    pdf.setFont('helvetica', 'normal').text(value, 85, y);
    pdf.setDrawColor(224, 234, 227).line(28, y + 4, 182, y + 4);
  });

  pdf.setFillColor(237, 248, 240).roundedRect(28, 197, 154, 36, 3, 3, 'F');
  pdf.setTextColor(71, 99, 82).setFont('helvetica', 'bold').setFontSize(11).text('FINAL CGPA', 43, 210);
  pdf.setTextColor(...GREEN).setFontSize(28).text(result.gpa.toFixed(2), 43, 225);
  pdf.setTextColor(71, 99, 82).setFont('helvetica', 'normal').setFontSize(9).text('out of 4.00', 75, 225);
  pdf.setFont('helvetica', 'bold').setFontSize(11).text('STATUS', 125, 210);
  pdf.setTextColor(result.status.toUpperCase() === 'PASS' ? 18 : 179, result.status.toUpperCase() === 'PASS' ? 101 : 38, result.status.toUpperCase() === 'PASS' ? 53 : 30).setFontSize(23).text(result.status, 125, 225);
  pdf.setTextColor(87, 112, 96).setFont('helvetica', 'normal').setFontSize(8).text('This result is electronically verified. For official verification, contact the university.', 105, 251, { align: 'center' });
  pdf.save(`result-${result.transcriptNo ?? result.verificationCode}.pdf`);
}
