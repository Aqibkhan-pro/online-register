import { TestBed } from '@angular/core/testing';
import { ResultStore } from '../result/result-store';
import { StudentResult } from '../result/student-result';
import { VerificationPage } from './verification-page';

const sampleResult: StudentResult = {
  verificationCode: 'UOL-2026-00125',
  registrationNo: '2026-BCS-00125',
  studentName: 'Muhammad Ahmed',
  program: 'BS Computer Science',
  campus: 'Lahore',
  semester: 'Spring 2026',
  rollNo: 'CS-125',
  subjects: [{ name: 'Programming Fundamentals', creditHours: 3, marks: 85, grade: 'A', gradePoint: 4 }],
  gpa: 4,
  status: 'PASS'
};

describe('VerificationPage', () => {
  let found: StudentResult[];

  beforeEach(async () => {
    found = [];
    await TestBed.configureTestingModule({
      imports: [VerificationPage],
      // Stand-in for Firestore so tests never touch the network.
      providers: [{ provide: ResultStore, useValue: { find: async () => found } }]
    }).compileComponents();
  });

  async function search(term: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(VerificationPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#verification-code')!;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLButtonElement>('.search-field button')!.click();
    await fixture.whenStable();
    return element;
  }

  it('should render title', async () => {
    const fixture = TestBed.createComponent(VerificationPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Online Verification');
  });

  it('should show the result when a record is found', async () => {
    found = [sampleResult];
    const element = await search('uol-2026-00125');
    expect(element.querySelector('app-result-view')?.textContent).toContain('Muhammad Ahmed');
  });

  it('should show a message when no record is found', async () => {
    const element = await search('unknown-code');
    expect(element.querySelector('.status-message')?.textContent).toContain('No record found for this Registration No.');
  });
});
