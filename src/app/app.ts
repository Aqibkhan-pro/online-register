import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DummyDataButton } from './result/dummy-data-button';
import { ResultStore } from './result/result-store';
import { ResultView } from './result/result-view';
import { StudentResult } from './result/student-result';

type Status = { text: string; error: boolean };

@Component({
  selector: 'app-root',
  imports: [FormsModule, ResultView, DummyDataButton],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly resultStore = inject(ResultStore);

  /** Hidden now that the dummy records are in Firestore; set to `isDevMode()` to show it again during `ng serve`. */
  protected readonly showDummyDataButton = false;

  verificationCode = '';
  readonly status = signal<Status | null>(null);
  readonly searching = signal(false);
  readonly results = signal<StudentResult[]>([]);

  async verify(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const term = this.verificationCode.trim();
    if (!term) {
      this.status.set({ text: 'Please enter a verification code or registration number.', error: true });
      return;
    }

    this.searching.set(true);
    this.status.set(null);
    try {
      const results = await this.resultStore.find(term);
      this.results.set(results);
      if (!results.length) this.status.set({ text: 'No record found for this Registration No.', error: true });
    } catch (error) {
      console.error('Result lookup failed', error);
      this.status.set({ text: 'Verification service is not available right now. Please try again later.', error: true });
    } finally {
      this.searching.set(false);
    }
  }

  /** Shows the dummy-data outcome under the search box, closing any open result so the message is visible. */
  dummyDataFinished(status: Status): void {
    this.results.set([]);
    this.status.set(status);
  }

  backToSearch(): void {
    this.results.set([]);
  }
}
