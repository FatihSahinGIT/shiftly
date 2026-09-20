import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@shiftly/core-auth';
import { CalendarStore } from '@shiftly/calendar-data-access';
import { CalendarGridComponent, ConfirmDialogComponent, ShiftEditorComponent, ShiftEditorModel, ShiftPaletteComponent } from '@shiftly/calendar-ui';
import { addMonths, calendarDays, monthLabel, SHIFT_LABELS, ShiftEntry, ShiftType, startOfMonth } from '@shiftly/shared-models';
import { MotionService } from '@shiftly/shared-ui';

interface PendingShift {
  date: string;
  type: ShiftType;
  element?: HTMLElement;
}

@Component({
  selector: 'shiftly-calendar-page',
  imports: [CalendarGridComponent, ShiftPaletteComponent, ShiftEditorComponent, ConfirmDialogComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPageComponent {
  readonly auth = inject(AuthService);
  readonly store = inject(CalendarStore);
  private readonly router = inject(Router);
  private readonly motion = inject(MotionService);
  private readonly page = viewChild<ElementRef<HTMLElement>>('page');
  private readonly grid = viewChild<ElementRef<HTMLElement>>('grid');

  readonly month = signal(startOfMonth(new Date()));
  readonly days = computed(() => calendarDays(this.month()));
  readonly monthName = computed(() => monthLabel(this.month()));
  readonly selectedType = signal<ShiftType | null>(null);
  readonly editor = signal<ShiftEditorModel | null>(null);
  readonly pending = signal<PendingShift | null>(null);
  readonly status = signal('');
  readonly dropListIds = computed(() => this.days().map((day) => `day-${day.date}`));
  readonly labels = SHIFT_LABELS;

  constructor() {
    void this.store.load();
    queueMicrotask(() => this.motion.enter(this.page()?.nativeElement));
  }

  changeMonth(direction: number): void {
    this.month.update((value) => addMonths(value, direction));
    this.motion.month(this.grid()?.nativeElement, direction);
  }

  today(): void {
    const direction = this.month() < startOfMonth(new Date()) ? 1 : -1;
    this.month.set(startOfMonth(new Date()));
    this.motion.month(this.grid()?.nativeElement, direction);
  }

  selectType(type: ShiftType): void {
    this.selectedType.update((current) => (current === type ? null : type));
  }

  selectDay(date: string): void {
    if (!this.auth.isAdmin()) return;
    const type = this.selectedType();
    if (!type) {
      this.editor.set({ date, initialType: 'early' });
      return;
    }
    this.requestSave({ date, type });
  }

  edit(entry: ShiftEntry): void {
    this.editor.set({ date: entry.date, entry, initialType: entry.type });
  }

  drop(event: PendingShift): void {
    if (!this.auth.isAdmin()) return;
    this.requestSave(event);
  }

  confirmReplacement(): void {
    const pending = this.pending();
    this.pending.set(null);
    if (pending) void this.create(pending);
  }

  async saveEditor(value: { type: ShiftType; note?: string }): Promise<void> {
    const model = this.editor();
    if (!model || !this.auth.isAdmin()) return;
    try {
      if (model.entry) {
        await this.store.update(model.entry.id, { date: model.date, ...value });
      } else {
        await this.store.create({ date: model.date, ...value });
      }
      this.editor.set(null);
      this.announce('Schicht wurde gespeichert.');
    } catch {
      // CalendarStore exposes the user-facing error.
    }
  }

  async deleteEditor(): Promise<void> {
    const entry = this.editor()?.entry;
    if (!entry || !this.auth.isAdmin()) return;
    try {
      await this.store.delete(entry.id);
      this.editor.set(null);
      this.announce('Schicht wurde gelöscht.');
    } catch {
      // CalendarStore exposes the user-facing error.
    }
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }

  private requestSave(request: PendingShift): void {
    if (this.store.byDate().has(request.date)) {
      this.pending.set(request);
    } else {
      void this.create(request);
    }
  }

  private async create(request: PendingShift): Promise<void> {
    try {
      await this.store.create({ date: request.date, type: request.type });
      this.selectedType.set(null);
      this.motion.drop(request.element);
      this.announce(`${this.labels[request.type]} wurde eingetragen.`);
    } catch {
      // CalendarStore exposes the user-facing error.
    }
  }

  private announce(message: string): void {
    this.status.set(message);
    globalThis.setTimeout(() => this.status.set(''), 3500);
  }
}
