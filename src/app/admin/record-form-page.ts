import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirestoreError } from 'firebase/firestore/lite';
import { gradePointFor, summarize } from '../result/grading';
import { ResultStore } from '../result/result-store';
import { SemesterResult, StudentResult, SubjectResult } from '../result/student-result';

@Component({
  selector: 'app-record-form-page',
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './record-form-page.html',
  styleUrl: './record-form-page.scss'
})
export class RecordFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(ResultStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    transcriptNo: ['', Validators.required], issueDate: ['', Validators.required], registrationNo: ['', Validators.required],
    studentName: ['', Validators.required], fatherName: ['', Validators.required], dateOfBirth: ['', Validators.required],
    dateOfAdmission: ['', Validators.required], dateOfGraduation: ['', Validators.required], session: ['', Validators.required],
    program: ['', Validators.required], department: ['', Validators.required], campus: ['', Validators.required], rollNo: ['', Validators.required],
    semesters: this.fb.array([this.newSemester('Semester First')])
  });
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly summary = computed(() => {
    const rows = (this.value().semesters ?? []).flatMap((semester) => semester.subjects ?? []).filter(isCompleteSubject);
    return rows.length ? summarize(rows.map(toSubjectResult)) : null;
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.error.set(''));
    const code = this.route.snapshot.paramMap.get('verificationCode');
    if (code) void this.loadForEdit(code);
  }

  get semesters() { return this.form.controls.semesters; }
  subjectsAt(semesterIndex: number): FormArray { return this.semesters.at(semesterIndex).controls.subjects; }
  gradeAt(semesterIndex: number, subjectIndex: number): number | null {
    return gradePointFor(String(this.subjectsAt(semesterIndex).at(subjectIndex).get('grade')?.value ?? ''));
  }
  addSemester(): void { this.semesters.push(this.newSemester(`Semester ${ordinal(this.semesters.length + 1)}`)); }
  removeSemester(index: number): void { if (this.semesters.length > 1) this.semesters.removeAt(index); }
  addSubject(semesterIndex: number): void { this.subjectsAt(semesterIndex).push(this.newSubject()); }
  removeSubject(semesterIndex: number, subjectIndex: number): void {
    const subjects = this.subjectsAt(semesterIndex);
    if (subjects.length > 1) subjects.removeAt(subjectIndex);
  }

  loadWisalKhanDetails(): void {
    this.form.patchValue({ transcriptNo: 'F5435638', issueDate: 'July 05, 2026', registrationNo: '3482552', studentName: 'Wisal Khan', fatherName: 'Purdal Khan', dateOfBirth: 'Aug 23, 2001', dateOfAdmission: 'February 04, 2021', dateOfGraduation: 'June, 2025', session: '2021-2025', program: 'Bachelor of Science in Computer Science', department: 'Department of Computer Science', campus: 'Lahore' });
  }

  loadDummySemesters(): void {
    this.loadWisalKhanDetails();
    this.form.patchValue({ rollNo: 'BCS-3482552' });
    this.semesters.clear();
    for (const [name, subjects] of DUMMY_SEMESTERS) this.semesters.push(this.newSemester(name, subjects));
  }

  async save(): Promise<void> {
    const details = this.form.controls;
    const detailControls = [details.transcriptNo, details.issueDate, details.registrationNo, details.studentName, details.fatherName, details.dateOfBirth, details.dateOfAdmission, details.dateOfGraduation, details.session, details.program, details.department, details.campus, details.rollNo];
    if (detailControls.some((control) => control.invalid)) { this.form.markAllAsTouched(); this.error.set('Please complete the Student Details section. Empty semester rows are allowed.'); return; }
    const value = this.form.getRawValue();
    const semesters: SemesterResult[] = value.semesters.map((semester) => ({
      name: semester.name.trim(),
      subjects: semester.subjects.filter(isCompleteSubject).map(toSubjectResult)
    })).filter((semester) => semester.name && semester.subjects.length);
    const subjects = semesters.flatMap((semester) => semester.subjects);
    if (!subjects.length) { this.error.set('Enter at least one complete subject row (Code, Subject, Cr.Hrs and Grade).'); return; }
    const result: StudentResult = {
      verificationCode: value.transcriptNo.trim().toUpperCase(), transcriptNo: value.transcriptNo.trim().toUpperCase(), issueDate: value.issueDate.trim(), registrationNo: value.registrationNo.trim().toUpperCase(), studentName: value.studentName.trim(), fatherName: value.fatherName.trim(), dateOfBirth: value.dateOfBirth.trim(), dateOfAdmission: value.dateOfAdmission.trim(), dateOfGraduation: value.dateOfGraduation.trim(), session: value.session.trim(), program: value.program.trim(), department: value.department.trim(), campus: value.campus.trim(), rollNo: value.rollNo.trim(), semester: `${semesters.length} Semesters`, semesters, subjects, ...summarize(subjects)
    };
    this.saving.set(true); this.error.set('');
    try {
      if (this.editing()) {
        await this.store.update(result);
        await this.router.navigate(['/admin'], { queryParams: { added: `${result.transcriptNo} updated` } });
      } else if (await this.store.add(result)) {
        await this.router.navigate(['/admin'], { queryParams: { added: result.transcriptNo } });
      } else this.error.set(`A record with transcript number ${result.transcriptNo} already exists.`);
    } catch (error) {
      console.error('Saving record failed', error);
      this.error.set(error instanceof FirestoreError && error.code === 'permission-denied' ? 'Firestore rules did not allow this account to add records.' : 'Could not save the record. Please try again.');
    } finally { this.saving.set(false); }
  }

  private async loadForEdit(code: string): Promise<void> {
    this.saving.set(true);
    try {
      const record = (await this.store.find(code))[0];
      if (!record) { this.error.set('Record was not found.'); return; }
      this.editing.set(true);
      this.form.patchValue({
        transcriptNo: record.transcriptNo ?? record.verificationCode,
        issueDate: record.issueDate ?? '', registrationNo: record.registrationNo, studentName: record.studentName,
        fatherName: record.fatherName ?? '', dateOfBirth: record.dateOfBirth ?? '', dateOfAdmission: record.dateOfAdmission ?? '',
        dateOfGraduation: record.dateOfGraduation ?? '', session: record.session ?? '', program: record.program,
        department: record.department ?? '', campus: record.campus, rollNo: record.rollNo
      });
      this.semesters.clear();
      const groups = record.semesters?.length ? record.semesters : [{ name: record.semester, subjects: record.subjects }];
      for (const semester of groups) this.semesters.push(this.newSemester(semester.name, semester.subjects));
    } catch (error) {
      console.error('Loading record failed', error);
      this.error.set('Could not load this record for editing.');
    } finally { this.saving.set(false); }
  }

  private newSemester(name: string, subjects: SubjectInput[] = [{}]) { return this.fb.group({ name: [name, Validators.required], subjects: this.fb.array(subjects.map((subject) => this.newSubject(subject))) }); }
  private newSubject(subject: SubjectInput = {}) { return this.fb.group({ code: [subject.code ?? '', Validators.required], name: [subject.name ?? '', Validators.required], creditHours: [subject.creditHours ?? 3, [Validators.required, Validators.min(1), Validators.max(6)]], grade: [subject.grade ?? '', Validators.required] }); }
}

function ordinal(value: number): string { return ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth'][value - 1] ?? `${value}th`; }
type SubjectInput = { code?: string; name?: string; creditHours?: number; grade?: string };
function isCompleteSubject(subject: SubjectInput): subject is Required<SubjectInput> { return Boolean(subject.code?.trim() && subject.name?.trim() && (subject.creditHours ?? 0) > 0 && gradePointFor(subject.grade ?? '') !== null); }
function toSubjectResult(subject: Required<SubjectInput>): SubjectResult { return { code: subject.code.trim().toUpperCase(), name: subject.name.trim(), creditHours: subject.creditHours, grade: subject.grade.trim().toUpperCase(), gradePoint: gradePointFor(subject.grade)! }; }
const DUMMY_SEMESTERS: [string, SubjectInput[]][] = [
  ['Semester First', [{ code: 'EN-101', name: 'English-I', creditHours: 3, grade: 'A1' }, { code: 'PS-101', name: 'Pakistan Studies', creditHours: 3, grade: 'A2' }, { code: 'MA-101', name: 'Calculus & Analytical Geometry-I', creditHours: 3, grade: 'A1' }, { code: 'PH-111', name: 'Introductory Mechanics & Waves', creditHours: 3, grade: 'A2' }, { code: 'CS-101', name: 'Introduction to Computing', creditHours: 3, grade: 'A1' }]],
  ['Semester Second', [{ code: 'CS-105', name: 'Problem Solving and Programming', creditHours: 3, grade: 'A1' }, { code: 'EN-102', name: 'English-II', creditHours: 3, grade: 'A2' }, { code: 'IS-101', name: 'Islamic Studies', creditHours: 3, grade: 'A2' }, { code: 'MA-102', name: 'Calculus & Analytical Geometry-II', creditHours: 3, grade: 'A1' }, { code: 'PH-112', name: 'Electricity, Magnetism and Thermal Physics', creditHours: 3, grade: 'A2' }]],
  ['Semester Third', [{ code: 'MA-203', name: 'Discrete Mathematics', creditHours: 3, grade: 'A1' }, { code: 'BST-202', name: 'Object Oriented Programming', creditHours: 3, grade: 'A1' }, { code: 'EN-201', name: 'English-III', creditHours: 3, grade: 'A2' }, { code: 'PY-101', name: 'Introduction to Psychology-III', creditHours: 3, grade: 'A2' }, { code: 'CS-211', name: 'Data Structures', creditHours: 3, grade: 'A1' }, { code: 'CS-212', name: 'Human Computer Interaction', creditHours: 3, grade: 'A2' }]],
  ['Semester Fourth', [{ code: 'CS-103', name: 'Introduction to Computer Organization', creditHours: 3, grade: 'A2' }, { code: 'CH-100', name: 'General Chemistry', creditHours: 3, grade: 'B1' }, { code: 'CS-225', name: 'Database System-I', creditHours: 3, grade: 'A2' }, { code: 'MA-205', name: 'Differential Equations & Linear Algebra', creditHours: 3, grade: 'A1' }, { code: 'CS-213', name: 'Computer Organization & Assembly Language', creditHours: 3, grade: 'A2' }, { code: 'CS-222', name: 'Analysis and Design of Software Systems', creditHours: 3, grade: 'A2' }]],
  ['Semester Fifth', [{ code: 'ST-101', name: 'Probability and Statistics', creditHours: 3, grade: 'A2' }, { code: 'BY-201', name: 'Introductory Biology', creditHours: 3, grade: 'A2' }, { code: 'CS-223', name: 'Operating Systems', creditHours: 3, grade: 'B1' }, { code: 'CS-311', name: 'Analysis & Design of Algorithms', creditHours: 3, grade: 'A1' }, { code: 'CS-413', name: 'Software Construction', creditHours: 3, grade: 'A2' }, { code: 'CS-414', name: 'Artificial Intelligence', creditHours: 3, grade: 'A2' }]],
  ['Semester Sixth', [{ code: 'EC-201', name: 'Principles of Economics', creditHours: 3, grade: 'A2' }, { code: 'CS-331', name: 'Theory of Automata', creditHours: 3, grade: 'A1' }, { code: 'CS-312', name: 'Computer Communications & Networks', creditHours: 3, grade: 'A2' }, { code: 'CS-423', name: 'Computer Graphics', creditHours: 3, grade: 'B1' }, { code: 'CS-269', name: 'Elective Course-I', creditHours: 3, grade: 'A2' }, { code: 'CS-230', name: 'Database System-II', creditHours: 3, grade: 'B1' }]],
  ['Semester Seventh', [{ code: 'CS-489', name: 'Project-I', creditHours: 3, grade: 'A1' }, { code: 'CS-332', name: 'Net Centric Programming', creditHours: 3, grade: 'A2' }, { code: 'CS-411', name: 'Compiler Construction', creditHours: 3, grade: 'A2' }, { code: 'CS-271', name: 'Elective Course-II', creditHours: 3, grade: 'A2' }, { code: 'CS-273', name: 'Elective Course-III', creditHours: 3, grade: 'A2' }, { code: 'CS-449', name: 'ICT and Society', creditHours: 3, grade: 'A2' }]],
  ['Semester Eighth', [{ code: 'CS-490', name: 'Project-II', creditHours: 3, grade: 'A1' }, { code: 'CS-413', name: 'Introduction to Information Security', creditHours: 3, grade: 'A2' }, { code: 'CS-286', name: 'Elective Course-IV', creditHours: 3, grade: 'A2' }, { code: 'CS-301', name: 'Elective Course-V', creditHours: 6, grade: 'A1' }]]
];
