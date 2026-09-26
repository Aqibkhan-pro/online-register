import { DecimalPipe } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { downloadResultPdf } from './result-pdf';
import { StudentResult, isPass } from './student-result';

@Component({
  selector: 'app-result-view',
  imports: [DecimalPipe],
  templateUrl: './result-view.html',
  styleUrl: './result-view.scss'
})
export class ResultView {
  readonly results = input.required<StudentResult[]>();
  readonly back = output<void>();

  /** Verification code of the result whose PDF is being generated. */
  readonly downloading = signal<string | null>(null);
  protected readonly isPass = isPass;

  totalCreditHours(result: StudentResult): number {
    return result.subjects.reduce((total, subject) => total + subject.creditHours, 0);
  }

  print(): void {
    window.print();
  }

  async downloadPdf(result: StudentResult): Promise<void> {
    this.downloading.set(result.verificationCode);
    try {
      await downloadResultPdf(result);
    } finally {
      this.downloading.set(null);
    }
  }
}
