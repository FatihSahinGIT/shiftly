import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { longDateLabel, SHIFT_LABELS, ShiftEntry, ShiftType } from '@shiftly/shared-models';

export interface ShiftEditorModel {
  date: string;
  entry?: ShiftEntry;
  initialType: ShiftType;
}

@Component({
  selector: 'shiftly-shift-editor',
  templateUrl: './shift-editor.component.html',
  styleUrl: './shift-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftEditorComponent {
  readonly model = input<ShiftEditorModel | null>(null);
  readonly busy = input(false);
  readonly readonly = input(false);
  readonly dismissed = output<void>();
  readonly save = output<{ type: ShiftType; note?: string }>();
  readonly remove = output<void>();
  readonly selectedType = signal<ShiftType>('early');
  readonly note = signal('');
  readonly types: readonly ShiftType[] = ['early', 'late', 'night'];
  readonly labels = SHIFT_LABELS;

  constructor() {
    effect(() => {
      const model = this.model();
      if (model) {
        this.selectedType.set(model.entry?.type ?? model.initialType);
        this.note.set(model.entry?.note ?? '');
      }
    });
  }

  dateLabel(): string {
    const model = this.model();
    return model ? longDateLabel(model.date) : '';
  }

  updateNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  submit(): void {
    const note = this.note().trim();
    this.save.emit({ type: this.selectedType(), ...(note ? { note } : {}) });
  }
}
