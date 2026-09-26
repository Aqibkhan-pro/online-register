import { StudentResult, SubjectResult } from './student-result';

// HEC grading scale: minimum marks, grade, grade point.
const GRADE_SCALE: [number, string, number][] = [
  [85, 'A', 4], [80, 'A-', 3.67], [75, 'B+', 3.33], [71, 'B', 3], [68, 'B-', 2.67], [64, 'C+', 2.33],
  [61, 'C', 2], [58, 'C-', 1.67], [54, 'D+', 1.33], [50, 'D', 1], [0, 'F', 0]
];

export function gradeFor(marks: number): Pick<SubjectResult, 'grade' | 'gradePoint'> {
  const [, grade, gradePoint] = GRADE_SCALE.find(([minMarks]) => marks >= minMarks) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { grade, gradePoint };
}

/** Grade-point lookup for manual transcript entry (A1/A2 and common HEC letter grades). */
export function gradePointFor(grade: string): number | null {
  const points: Record<string, number> = {
    A1: 4, A2: 3.67, A3: 3.33, B1: 3, B2: 2.67, B3: 2.33,
    C1: 2, C2: 1.67, C3: 1.33, D: 1, F: 0,
    A: 4, 'A-': 3.67, 'B+': 3.33, B: 3, 'B-': 2.67,
    'C+': 2.33, C: 2, 'C-': 1.67, 'D+': 1.33
  };
  return points[grade.trim().toUpperCase()] ?? null;
}

/** Credit-weighted GPA rounded to 2 decimals; a GPA of 2.00 or more is a pass. */
export function summarize(subjects: SubjectResult[]): Pick<StudentResult, 'gpa' | 'status'> {
  const credits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
  const points = subjects.reduce((sum, s) => sum + s.creditHours * s.gradePoint, 0);
  const gpa = credits ? Math.round((points / credits) * 100) / 100 : 0;
  return { gpa, status: gpa >= 2 ? 'PASS' : 'FAIL' };
}
