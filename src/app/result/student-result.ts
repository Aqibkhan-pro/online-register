export interface SubjectResult {
  name: string;
  creditHours: number;
  marks: number;
  grade: string;
  gradePoint: number;
}

/**
 * One semester result. Stored in the Firestore `results` collection with the verification code
 * as the document ID, so `verificationCode` comes from the ID rather than a stored field.
 */
export interface StudentResult {
  verificationCode: string;
  registrationNo: string;
  studentName: string;
  program: string;
  campus: string;
  semester: string;
  rollNo: string;
  subjects: SubjectResult[];
  gpa: number;
  status: string;
}

export function isPass(result: StudentResult): boolean {
  return result.status.toUpperCase() === 'PASS';
}
