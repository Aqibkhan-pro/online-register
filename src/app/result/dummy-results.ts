import { StudentResult, SubjectResult } from './student-result';

type Student = Pick<StudentResult, 'registrationNo' | 'studentName' | 'program' | 'campus' | 'rollNo'>;

// HEC grading scale: minimum marks, grade, grade point.
const GRADE_SCALE: [number, string, number][] = [
  [85, 'A', 4], [80, 'A-', 3.67], [75, 'B+', 3.33], [71, 'B', 3], [68, 'B-', 2.67], [64, 'C+', 2.33],
  [61, 'C', 2], [58, 'C-', 1.67], [54, 'D+', 1.33], [50, 'D', 1], [0, 'F', 0]
];

/** Builds a result from [subject, credit hours, marks] rows, deriving grades, GPA and status so the dummy data stays consistent. */
function dummyResult(verificationCode: string, student: Student, semester: string, rows: [string, number, number][]): StudentResult {
  const subjects: SubjectResult[] = rows.map(([name, creditHours, marks]) => {
    const [, grade, gradePoint] = GRADE_SCALE.find(([minMarks]) => marks >= minMarks)!;
    return { name, creditHours, marks, grade, gradePoint };
  });
  const totalCredits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
  const gpa = Math.round((subjects.reduce((sum, s) => sum + s.creditHours * s.gradePoint, 0) / totalCredits) * 100) / 100;
  return { verificationCode, ...student, semester, subjects, gpa, status: gpa >= 2 ? 'PASS' : 'FAIL' };
}

const ahmed: Student = { registrationNo: '2026-BCS-00125', studentName: 'Muhammad Ahmed', program: 'BS Computer Science', campus: 'Lahore', rollNo: 'CS-125' };
const ayesha: Student = { registrationNo: '2025-BBA-00342', studentName: 'Ayesha Khan', program: 'BBA (Hons)', campus: 'Sargodha', rollNo: 'BBA-342' };
const ali: Student = { registrationNo: '2025-BSE-00410', studentName: 'Ali Raza', program: 'BS Software Engineering', campus: 'Lahore', rollNo: 'SE-410' };
const fatima: Student = { registrationNo: '2024-BSEE-00077', studentName: 'Fatima Noor', program: 'BS Electrical Engineering', campus: 'Lahore', rollNo: 'EE-077' };

export const DUMMY_RESULTS: StudentResult[] = [
  dummyResult('UOL-2026-00125', ahmed, 'Spring 2026', [
    ['Programming Fundamentals', 3, 85], ['Data Structures & Algorithms', 3, 78], ['Database Systems', 3, 82],
    ['Computer Networks', 3, 76], ['Software Engineering', 3, 88], ['Mathematics for Computing', 3, 75]
  ]),
  dummyResult('UOL-2025-00342', ayesha, 'Fall 2025', [
    ['Principles of Management', 3, 81], ['Financial Accounting', 3, 74], ['Business Mathematics', 3, 69],
    ['Microeconomics', 3, 77], ['English Composition', 3, 86], ['Introduction to Computing', 3, 90]
  ]),
  dummyResult('UOL-2026-00342', ayesha, 'Spring 2026', [
    ['Principles of Marketing', 3, 84], ['Cost Accounting', 3, 72], ['Business Statistics', 3, 66],
    ['Macroeconomics', 3, 79], ['Business Communication', 3, 88], ['Organizational Behavior', 3, 81]
  ]),
  dummyResult('UOL-2026-00410', ali, 'Spring 2026', [
    ['Object Oriented Programming', 4, 47], ['Discrete Structures', 3, 52], ['Digital Logic Design', 3, 44],
    ['Calculus and Analytical Geometry', 3, 58], ['Technical Writing', 3, 63]
  ]),
  dummyResult('UOL-2026-00077', fatima, 'Spring 2026', [
    ['Circuit Analysis', 3, 88], ['Signals and Systems', 3, 83], ['Electronic Devices', 3, 79],
    ['Linear Algebra', 3, 91], ['Electromagnetic Theory', 3, 76], ['Circuit Analysis Lab', 1, 94]
  ])
];
