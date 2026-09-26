import { Component, inject, output, signal } from '@angular/core';
import { FirestoreError } from 'firebase/firestore/lite';
import { DUMMY_RESULTS } from './dummy-results';
import { ResultStore } from './result-store';

/** Development helper that writes the dummy results to Firestore. */
@Component({
  selector: 'app-dummy-data-button',
  template: `
    <button type="button" (click)="save()" [disabled]="saving()">
      <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v6.5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V5.5M4.5 12v6.5c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V12"/></g></svg>
      {{ saving() ? 'Saving…' : 'Add Dummy Data' }}
    </button>
  `,
  styles: `
    :host { justify-self: end; }
    button { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid #237b3d; border-radius: 999px; background: #fff; color: #237b3d; font: 500 14px Poppins, Arial, sans-serif; white-space: nowrap; cursor: pointer; transition: background .2s; }
    button:hover { background: #edf6ef; }
    button:disabled { opacity: .6; cursor: progress; }
    svg { width: 18px; height: 18px; }
  `
})
export class DummyDataButton {
  private readonly resultStore = inject(ResultStore);

  readonly saving = signal(false);
  /** Emits the message to show once saving has finished or failed. */
  readonly finished = output<{ text: string; error: boolean }>();

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.resultStore.save(DUMMY_RESULTS);
      this.finished.emit({
        text: `${DUMMY_RESULTS.length} dummy records saved. Try transcript no. ${DUMMY_RESULTS[0].verificationCode}, or ${DUMMY_RESULTS[1].registrationNo} for two semesters.`,
        error: false
      });
    } catch (error) {
      console.error('Saving dummy records failed', error);
      const denied = error instanceof FirestoreError && error.code === 'permission-denied';
      this.finished.emit({
        text: denied ? 'Could not save dummy records: Firestore security rules do not allow writes.' : 'Could not save dummy records. Please try again.',
        error: true
      });
    } finally {
      this.saving.set(false);
    }
  }
}
