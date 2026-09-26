import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirestoreError } from 'firebase/firestore/lite';
import { gradeFor, summarize } from '../result/grading';
import { ResultStore } from '../result/result-store';
import { StudentResult, SubjectResult } from '../result/student-result';

/** Admin form for a new result. Grades, GPA and status are derived from the marks, so only raw data is typed in. */
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

  readonly form = this.fb.group({
    // Becomes the Firestore document ID, which cannot contain "/".
    verificationCode: ['', [Validators.required, Validators.pattern(/^\s*[A-Za-z0-9-]+\s*$/)]],
    registrationNo: ['', Validators.required],
    studentName: ['', Validators.required],
    program: ['', Validators.required],
    campus: ['', Validators.required],
    semester: ['', Validators.required],
    rollNo: ['', Validators.required],
    subjects: this.fb.array([this.newSubject()])
  });
  readonly saving = signal(false);
  readonly error = signal('');

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  /** Grade for each subject row, or null while its marks are missing or out of range. */
  readonly grades = computed(() => (this.value().subjects ?? []).map((s) => (isValidMarks(s.marks) ? gradeFor(s.marks) : null)));
  /** GPA and status once every row has usable credit hours and marks. */
  readonly summary = computed(() => {
    const rows = this.value().subjects ?? [];
    const complete = rows.every((s) => (s.creditHours ?? 0) > 0 && isValidMarks(s.marks));
    return complete ? summarize(rows.map((s) => ({ creditHours: s.creditHours!, ...gradeFor(s.marks!) }) as SubjectResult)) : null;
  });

  constructor() {
    // An error message describes the last submit; drop it once the admin edits the form.
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.error.set(''));
  }

  get subjects() {
    return this.form.controls.subjects;
  }

  addSubject(): void {
    this.subjects.push(this.newSubject());
  }

  removeSubject(index: number): void {
    this.subjects.removeAt(index);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please fill in the highlighted fields.');
      return;
    }

    const v = this.form.getRawValue();
    const subjects = v.subjects.map(({ name, creditHours, marks }) => ({ name: name.trim(), creditHours, marks: marks!, ...gradeFor(marks!) }));
    const result: StudentResult = {
      verificationCode: v.verificationCode.trim().toUpperCase(),
      registrationNo: v.registrationNo.trim().toUpperCase(),
      studentName: v.studentName.trim(),
      program: v.program.trim(),
      campus: v.campus.trim(),
      semester: v.semester.trim(),
      rollNo: v.rollNo.trim(),
      subjects,
      ...summarize(subjects)
    };

    this.saving.set(true);
    this.error.set('');
    try {
      if (await this.store.add(result)) {
        await this.router.navigate(['/admin'], { queryParams: { added: result.verificationCode } });
      } else {
        this.error.set(`A record with verification code ${result.verificationCode} already exists.`);
      }
    } catch (error) {
      console.error('Saving record failed', error);
      const denied = error instanceof FirestoreError && error.code === 'permission-denied';
      this.error.set(denied ? 'Firestore rules did not allow this account to add records.' : 'Could not save the record. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private newSubject() {
    return this.fb.group({
      name: ['', Validators.required],
      creditHours: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
      marks: this.fb.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(100)])
    });
  }
}

function isValidMarks(marks: number | null | undefined): marks is number {
  return typeof marks === 'number' && marks >= 0 && marks <= 100;
}
