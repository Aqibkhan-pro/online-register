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
    added = [];
    codeIsFree = true;
    await TestBed.configureTestingModule({
      imports: [RecordFormPage],
      // Stand-in for Firestore so tests never touch the network.
      providers: [provideRouter([]), { provide: ResultStore, useValue: { add: async (r: StudentResult) => (added.push(r), codeIsFree) } }]
    }).compileComponents();
    fixture = TestBed.createComponent(RecordFormPage);
    await fixture.whenStable();
  });

  function fillValidForm(): void {
    const form = fixture.componentInstance.form;
    form.patchValue({
      verificationCode: ' uol-2026-00500 ', registrationNo: '2026-bcs-00500', studentName: 'Sara Ali',
      program: 'BS Computer Science', campus: 'Lahore', semester: 'Spring 2026', rollNo: 'CS-500'
    });
    form.controls.subjects.at(0).setValue({ name: 'Programming Fundamentals', creditHours: 3, marks: 86 });
    fixture.componentInstance.addSubject();
    form.controls.subjects.at(1).setValue({ name: 'Calculus', creditHours: 3, marks: 72 });
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
    expect(element.querySelector('.form-error')?.textContent).toContain('highlighted fields');
  });

  it('should save a normalized record with calculated grades and GPA', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fillValidForm();
    await submit();

    expect(added.length).toBe(1);
    expect(added[0]).toMatchObject({
      verificationCode: 'UOL-2026-00500',
      registrationNo: '2026-BCS-00500',
      subjects: [
        { name: 'Programming Fundamentals', creditHours: 3, marks: 86, grade: 'A', gradePoint: 4 },
        { name: 'Calculus', creditHours: 3, marks: 72, grade: 'B', gradePoint: 3 }
      ],
      gpa: 3.5,
      status: 'PASS'
    });
    expect(navigate).toHaveBeenCalledWith(['/admin'], { queryParams: { added: 'UOL-2026-00500' } });
  });

  it('should refuse a verification code that already exists', async () => {
    codeIsFree = false;
    fillValidForm();
    const element = await submit();
    expect(element.querySelector('.form-error')?.textContent).toContain('UOL-2026-00500 already exists');
  });
});
