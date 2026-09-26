import { TestBed } from '@angular/core/testing';
import { DummyDataButton } from './dummy-data-button';
import { DUMMY_RESULTS } from './dummy-results';
import { ResultStore } from './result-store';
import { StudentResult } from './student-result';

describe('DummyDataButton', () => {
  it('should save the dummy records and report success', async () => {
    let saved: StudentResult[] | undefined;
    await TestBed.configureTestingModule({
      imports: [DummyDataButton],
      // Stand-in for Firestore so tests never touch the network.
      providers: [{ provide: ResultStore, useValue: { save: async (results: StudentResult[]) => { saved = results; } } }]
    }).compileComponents();

    const fixture = TestBed.createComponent(DummyDataButton);
    let message: { text: string; error: boolean } | undefined;
    fixture.componentInstance.finished.subscribe((status) => (message = status));
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();

    expect(saved).toBe(DUMMY_RESULTS);
    expect(message?.error).toBe(false);
    expect(message?.text).toContain('dummy records saved');
  });
});
