import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DummyDataButton } from '../result/dummy-data-button';
import { ResultStore } from '../result/result-store';
import { StudentResult, isPass } from '../result/student-result';

const PAGE_SIZE = 10;

/**
 * Admin listing. All records are loaded once and searched/paged in the browser, which keeps search flexible
 * (any field, partial matches) and is fine for a few thousand records.
 */
@Component({
  selector: 'app-records-page',
  imports: [DecimalPipe, FormsModule, RouterLink, DummyDataButton],
  templateUrl: './records-page.html',
  styleUrl: './records-page.scss'
})
export class RecordsPage {
  private readonly store = inject(ResultStore);
  /** Set by the add-record page after a successful save. */
  private readonly addedCode = inject(ActivatedRoute).snapshot.queryParamMap.get('added');

  /** Hidden now that the dummy records are in Firestore; set to `true` to show it again. */
  protected readonly showDummyDataButton = false;
  protected readonly isPass = isPass;

  readonly records = signal<StudentResult[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal(this.addedCode ? `Record ${this.addedCode} was added.` : '');
  readonly search = signal('');
  readonly page = signal(1);
  readonly recordToDelete = signal<StudentResult | null>(null);
  readonly deleting = signal(false);

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.records();
    return this.records().filter((r) =>
      [r.transcriptNo ?? r.verificationCode, r.registrationNo, r.studentName, r.program, r.semester, r.rollNo].some((value) => value.toLowerCase().includes(term))
    );
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageRecords = computed(() => this.filtered().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE));
  readonly firstShown = computed(() => (this.filtered().length ? (this.page() - 1) * PAGE_SIZE + 1 : 0));
  readonly lastShown = computed(() => Math.min(this.page() * PAGE_SIZE, this.filtered().length));

  /** Page numbers to show: first, last, and the current page's neighbours, with gaps marked by null. */
  readonly pageLinks = computed(() => {
    const count = this.pageCount();
    const current = this.page();
    const shown = [...new Set([1, current - 1, current, current + 1, count])].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
    return shown.flatMap((p, i) => (i > 0 && p - shown[i - 1] > 1 ? [null, p] : [p]));
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.records.set(await this.store.listAll());
    } catch (error) {
      console.error('Loading records failed', error);
      this.error.set('Could not load records. Check that this account is an admin and the Firestore rules are published.');
    } finally {
      this.loading.set(false);
    }
  }

  setSearch(term: string): void {
    this.search.set(term);
    this.page.set(1);
  }

  goTo(page: number): void {
    this.page.set(Math.min(Math.max(page, 1), this.pageCount()));
  }

  dummyDataFinished(status: { text: string; error: boolean }): void {
    if (status.error) {
      this.error.set(status.text);
      return;
    }
    this.notice.set(status.text);
    void this.load();
  }

  openDeleteModal(record: StudentResult): void {
    this.recordToDelete.set(record);
  }

  closeDeleteModal(): void {
    if (!this.deleting()) this.recordToDelete.set(null);
  }

  async confirmDelete(): Promise<void> {
    const record = this.recordToDelete();
    if (!record) return;
    this.deleting.set(true);
    this.error.set('');
    try {
      await this.store.delete(record.verificationCode);
      this.notice.set(`Transcript ${record.transcriptNo ?? record.verificationCode} was deleted.`);
      this.recordToDelete.set(null);
      await this.load();
    } catch (error) {
      console.error('Deleting record failed', error);
      this.error.set('Could not delete this record. Check Firestore admin permissions.');
    } finally { this.deleting.set(false); }
  }
}
