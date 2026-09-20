import { computed, Inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@shiftly/core-auth';
import { ShiftDraft, ShiftEntry } from '@shiftly/shared-models';
import { SHIFT_REPOSITORY, ShiftRepository } from './shift.repository';

@Injectable({ providedIn: 'root' })
export class CalendarStore {
  private readonly entriesState = signal<ShiftEntry[]>([]);

  constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject
    @Inject(SHIFT_REPOSITORY) private readonly repository: ShiftRepository,
    // eslint-disable-next-line @angular-eslint/prefer-inject
    @Inject(AuthService) private readonly auth: AdminAuthorizer,
  ) {}

  readonly entries = this.entriesState.asReadonly();
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly byDate = computed(() => new Map(this.entriesState().map((entry) => [entry.date, entry])));

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.entriesState.set(await this.repository.list());
    } catch (error: unknown) {
      this.error.set(errorMessage(error, 'Schichten konnten nicht geladen werden.'));
    } finally {
      this.loading.set(false);
    }
  }

  async create(draft: ShiftDraft): Promise<ShiftEntry> {
    const user = this.auth.requireAdmin();
    return this.save(() => this.repository.create(draft, user.id));
  }

  async update(id: string, draft: ShiftDraft): Promise<ShiftEntry> {
    this.auth.requireAdmin();
    return this.save(() => this.repository.update(id, draft));
  }

  async delete(id: string): Promise<void> {
    this.auth.requireAdmin();
    this.saving.set(true);
    this.error.set('');
    try {
      await this.repository.delete(id);
      this.entriesState.update((entries) => entries.filter((entry) => entry.id !== id));
    } catch (error: unknown) {
      const message = errorMessage(error, 'Schicht konnte nicht gelöscht werden.');
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.saving.set(false);
    }
  }

  private async save(operation: () => Promise<ShiftEntry>): Promise<ShiftEntry> {
    this.saving.set(true);
    this.error.set('');
    try {
      const saved = await operation();
      this.entriesState.update((entries) =>
        [...entries.filter((entry) => entry.id !== saved.id && entry.date !== saved.date), saved].sort((a, b) => a.date.localeCompare(b.date)),
      );
      return saved;
    } catch (error: unknown) {
      const message = errorMessage(error, 'Schicht konnte nicht gespeichert werden.');
      this.error.set(message);
      throw new Error(message);
    } finally {
      this.saving.set(false);
    }
  }
}

export interface AdminAuthorizer {
  requireAdmin(): { id: string };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
