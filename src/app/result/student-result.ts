export interface SubjectResult {
  /** University course code, for example EN-101. */
  code?: string;
  name: string;
  creditHours: number;
  /** Kept optional so records imported from the old marks-based format remain readable. */
  marks?: number;
  grade: string;
  gradePoint: number;
}

/** A named semester and every course recorded under it in one transcript. */
export interface SemesterResult {
  name: string;
  subjects: SubjectResult[];
}

/**
 * One verified final result. Stored in the Firestore `results` collection with the verification code
 * as the document ID, so `verificationCode` comes from the ID rather than a stored field.
 */
export interface StudentResult {
  verificationCode: string;
  registrationNo: string;
  studentName: string;
  program: string;
  campus: string;
  /** Legacy course-record field. New records store only the final CGPA. */
  semester?: string;
  rollNo: string;
  transcriptNo?: string;
  issueDate?: string;
  fatherName?: string;
  dateOfBirth?: string;
  dateOfAdmission?: string;
  dateOfGraduation?: string;
  session?: string;
  department?: string;
  /** Legacy course-record fields retained so existing Firestore documents can still be read. */
  semesters?: SemesterResult[];
  subjects?: SubjectResult[];
  gpa: number;
  status: string;
}

export function isPass(result: StudentResult): boolean {
  return result.status.toUpperCase() === 'PASS';
}
