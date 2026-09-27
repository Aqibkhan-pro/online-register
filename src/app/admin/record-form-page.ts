import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FirestoreError } from 'firebase/firestore/lite';
import { ResultStore } from '../result/result-store';
import { StudentResult } from '../result/student-result';

@Component({ selector: 'app-record-form-page', imports: [ReactiveFormsModule, RouterLink], templateUrl: './record-form-page.html', styleUrl: './record-form-page.scss' })
export class RecordFormPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(ResultStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.fb.group({
    transcriptNo: ['', Validators.required], issueDate: ['', Validators.required], registrationNo: ['', Validators.required],
    studentName: ['', Validators.required], fatherName: ['', Validators.required], dateOfBirth: ['', Validators.required], dateOfAdmission: ['', Validators.required], dateOfGraduation: ['', Validators.required], session: ['', Validators.required],
    program: ['', Validators.required], department: ['', Validators.required], campus: ['', Validators.required], rollNo: ['', Validators.required],
    cgpa: [0, [Validators.required, Validators.min(0), Validators.max(4)]]
  });
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');

  constructor() {
    this.form.valueChanges.subscribe(() => this.error.set(''));
    const code = this.route.snapshot.paramMap.get('verificationCode');
    if (code) void this.loadForEdit(code);
  }

  loadWisalKhanDetails(): void {
    this.form.patchValue({ transcriptNo: 'F5435638', issueDate: 'July 05, 2026', registrationNo: '3482552', studentName: 'Wisal Khan', fatherName: 'Purdal Khan', dateOfBirth: 'Aug 23, 2001', dateOfAdmission: 'February 04, 2021', dateOfGraduation: 'June, 2025', session: '2021-2025', program: 'Bachelor of Science in Computer Science', department: 'Department of Computer Science', campus: 'Lahore', rollNo: 'BCS-3482552', cgpa: 3.72 });
  }

  async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Please complete all student details and enter a CGPA between 0.00 and 4.00.'); return; }
    const value = this.form.getRawValue();
    const cgpa = Math.round(value.cgpa * 100) / 100;
    const result: StudentResult = {
      verificationCode: value.transcriptNo.trim().toUpperCase(), transcriptNo: value.transcriptNo.trim().toUpperCase(), issueDate: value.issueDate.trim(), registrationNo: value.registrationNo.trim().toUpperCase(), studentName: value.studentName.trim(), fatherName: value.fatherName.trim(), dateOfBirth: value.dateOfBirth.trim(), dateOfAdmission: value.dateOfAdmission.trim(), dateOfGraduation: value.dateOfGraduation.trim(), session: value.session.trim(), program: value.program.trim(), department: value.department.trim(), campus: value.campus.trim(), rollNo: value.rollNo.trim(), gpa: cgpa, status: cgpa >= 2 ? 'PASS' : 'FAIL'
    };
    this.saving.set(true); this.error.set('');
    try {
      if (this.editing()) { await this.store.update(result); await this.router.navigate(['/admin'], { queryParams: { added: `${result.transcriptNo} updated` } }); }
      else if (await this.store.add(result)) await this.router.navigate(['/admin'], { queryParams: { added: result.transcriptNo } });
      else this.error.set(`A record with transcript number ${result.transcriptNo} already exists.`);
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
      this.form.patchValue({ transcriptNo: record.transcriptNo ?? record.verificationCode, issueDate: record.issueDate ?? '', registrationNo: record.registrationNo, studentName: record.studentName, fatherName: record.fatherName ?? '', dateOfBirth: record.dateOfBirth ?? '', dateOfAdmission: record.dateOfAdmission ?? '', dateOfGraduation: record.dateOfGraduation ?? '', session: record.session ?? '', program: record.program, department: record.department ?? '', campus: record.campus, rollNo: record.rollNo, cgpa: record.gpa });
    } catch (error) {
      console.error('Loading record failed', error); this.error.set('Could not load this record for editing.');
    } finally { this.saving.set(false); }
  }
}
