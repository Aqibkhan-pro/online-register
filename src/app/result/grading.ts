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

/** Credit-weighted GPA rounded to 2 decimals; a GPA of 2.00 or more is a pass. */
export function summarize(subjects: SubjectResult[]): Pick<StudentResult, 'gpa' | 'status'> {
  const credits = subjects.reduce((sum, s) => sum + s.creditHours, 0);
  const points = subjects.reduce((sum, s) => sum + s.creditHours * s.gradePoint, 0);
  const gpa = credits ? Math.round((points / credits) * 100) / 100 : 0;
  return { gpa, status: gpa >= 2 ? 'PASS' : 'FAIL' };
}
