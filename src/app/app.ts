import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResultLookup } from './result/result-lookup';
import { ResultView } from './result/result-view';
import { StudentResult } from './result/student-result';

@Component({
  selector: 'app-root',
  imports: [FormsModule, ResultView],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly resultLookup = inject(ResultLookup);

  verificationCode = '';
  readonly statusMessage = signal('');
  readonly searching = signal(false);
  readonly results = signal<StudentResult[]>([]);

  async verify(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const term = this.verificationCode.trim();
    if (!term) {
      this.statusMessage.set('Please enter a verification code or registration number.');
      return;
    }

    this.searching.set(true);
    this.statusMessage.set('');
    try {
      const results = await this.resultLookup.find(term);
      this.results.set(results);
      if (!results.length) this.statusMessage.set(`No record found for "${term}". Please check the code and try again.`);
    } catch (error) {
      console.error('Result lookup failed', error);
      this.statusMessage.set('Verification service is not available right now. Please try again later.');
    } finally {
      this.searching.set(false);
    }
  }

  backToSearch(): void {
    this.results.set([]);
  }
}
