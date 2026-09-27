import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ResultStore } from '../result/result-store';
import { StudentResult } from '../result/student-result';
import { RecordFormPage } from './record-form-page';

describe('RecordFormPage', () => {
  let added: StudentResult[];
  let codeIsFree: boolean;
  let fixture: ComponentFixture<RecordFormPage>;

  beforeEach(async () => {
    added = []; codeIsFree = true;
    await TestBed.configureTestingModule({
      imports: [RecordFormPage],
      providers: [provideRouter([]), { provide: ResultStore, useValue: { add: async (record: StudentResult) => (added.push(record), codeIsFree) } }]
    }).compileComponents();
    fixture = TestBed.createComponent(RecordFormPage);
    await fixture.whenStable();
  });

  function fillValidForm(): void {
    fixture.componentInstance.form.patchValue({
      transcriptNo: ' uol-2026-00500 ', issueDate: 'July 05, 2026', registrationNo: '2026-bcs-00500', studentName: 'Sara Ali', fatherName: 'Ali Ahmad',
      dateOfBirth: 'January 01, 2004', dateOfAdmission: 'September 01, 2022', dateOfGraduation: 'June 2026', session: '2022-2026',
      program: 'BS Computer Science', department: 'Computer Science', campus: 'Lahore', rollNo: 'CS-500', cgpa: 3.5
    });
  }

  async function submit(): Promise<HTMLElement> {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    return element;
  }

  it('should not save an incomplete form', async () => {
    const element = await submit();
    expect(added).toEqual([]);
    expect(element.querySelector('.form-error')?.textContent).toContain('complete all student details');
  });

  it('should save a normalized final CGPA record without subjects or semesters', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fillValidForm();
    await submit();
    expect(added).toEqual([expect.objectContaining({ verificationCode: 'UOL-2026-00500', registrationNo: '2026-BCS-00500', gpa: 3.5, status: 'PASS' })]);
    expect(added[0].subjects).toBeUndefined();
    expect(added[0].semesters).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith(['/admin'], { queryParams: { added: 'UOL-2026-00500' } });
  });

  it('should refuse a transcript number that already exists', async () => {
    codeIsFree = false; fillValidForm();
    const element = await submit();
    expect(element.querySelector('.form-error')?.textContent).toContain('UOL-2026-00500 already exists');
  });
});
