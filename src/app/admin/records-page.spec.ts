import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ResultStore } from '../result/result-store';
import { StudentResult } from '../result/student-result';
import { RecordsPage } from './records-page';

function record(n: number, studentName = `Student ${n}`): StudentResult {
  const id = String(n).padStart(5, '0');
  return {
    verificationCode: `UOL-2026-${id}`, registrationNo: `2026-BCS-${id}`, studentName, program: 'BS Computer Science',
    campus: 'Lahore', semester: 'Spring 2026', rollNo: `CS-${n}`, subjects: [], gpa: 3.5, status: 'PASS'
  };
}

describe('RecordsPage', () => {
  const records = [...Array.from({ length: 11 }, (_, i) => record(i + 1)), record(12, 'Ayesha Khan')];

  async function render(): Promise<{ element: HTMLElement; update: () => Promise<void> }> {
    await TestBed.configureTestingModule({
      imports: [RecordsPage],
      // Stand-in for Firestore so tests never touch the network.
      providers: [provideRouter([]), { provide: ResultStore, useValue: { listAll: async () => records } }]
    }).compileComponents();
    const fixture = TestBed.createComponent(RecordsPage);
    await fixture.whenStable();
    return { element: fixture.nativeElement as HTMLElement, update: () => fixture.whenStable() };
  }

  it('should show ten records per page', async () => {
    const { element, update } = await render();
    expect(element.querySelectorAll('tbody tr').length).toBe(10);
    expect(element.querySelector('.pagination')?.textContent).toContain('Showing 1–10 of 12');

    element.querySelector<HTMLButtonElement>('[aria-label="Next page"]')!.click();
    await update();
    expect(element.querySelectorAll('tbody tr').length).toBe(2);
    expect(element.querySelector('.pagination')?.textContent).toContain('Showing 11–12 of 12');
  });

  it('should filter records by search term', async () => {
    const { element, update } = await render();
    const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'ayesha';
    search.dispatchEvent(new Event('input'));
    await update();
    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('UOL-2026-00012');
  });

  it('should keep the dummy data button hidden', async () => {
    const { element } = await render();
    expect(element.querySelector('app-dummy-data-button')).toBeNull();
  });
});
