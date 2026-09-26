import { gradeFor, summarize } from './grading';
import { StudentResult } from './student-result';

type Student = Pick<StudentResult, 'registrationNo' | 'studentName' | 'program' | 'campus' | 'rollNo'>;

/** Builds a result from [subject, credit hours, marks] rows, deriving grades, GPA and status so the dummy data stays consistent. */
function dummyResult(verificationCode: string, student: Student, semester: string, rows: [string, number, number][]): StudentResult {
  const subjects = rows.map(([name, creditHours, marks]) => ({ name, creditHours, marks, ...gradeFor(marks) }));
  return { verificationCode, ...student, semester, subjects, ...summarize(subjects) };
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
