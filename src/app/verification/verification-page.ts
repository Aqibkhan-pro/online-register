import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResultStore } from '../result/result-store';
import { ResultView } from '../result/result-view';
import { StudentResult } from '../result/student-result';

@Component({
  selector: 'app-verification-page',
  imports: [FormsModule, ResultView],
  templateUrl: './verification-page.html',
  styleUrl: './verification-page.scss'
})
export class VerificationPage {
  private readonly resultStore = inject(ResultStore);

  verificationCode = '';
  readonly status = signal<{ text: string; error: boolean } | null>(null);
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

  backToSearch(): void {
    this.results.set([]);
  }
}
