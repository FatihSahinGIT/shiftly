import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CalendarDay, SHIFT_LABELS, ShiftEntry, ShiftType } from '@shiftly/shared-models';

@Component({
  selector: 'shiftly-calendar-grid',
  imports: [CdkDropList],
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGridComponent {
  readonly days = input.required<readonly CalendarDay[]>();
  readonly shifts = input.required<ReadonlyMap<string, ShiftEntry>>();
  readonly admin = input(false);
  readonly selectedType = input<ShiftType | null>(null);
  readonly daySelected = output<string>();
  readonly editShift = output<ShiftEntry>();
  readonly shiftDropped = output<{ date: string; type: ShiftType; element: HTMLElement }>();
  readonly weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  readonly labels = SHIFT_LABELS;
  readonly emptyTypes: ShiftType[] = [];

  drop(event: CdkDragDrop<ShiftType[]>, date: string, element: HTMLElement): void {
    const type = event.item.data as ShiftType;
    if (this.admin() && ['early', 'late', 'night'].includes(type)) {
      this.shiftDropped.emit({ date, type, element });
    }
  }

  activate(date: string, shift: ShiftEntry | undefined): void {
    if (shift && !(this.admin() && this.selectedType())) {
      this.editShift.emit(shift);
    } else {
      this.daySelected.emit(date);
    }
  }

  dropId(date: string): string {
    return `day-${date}`;
  }

  ariaLabel(day: CalendarDay, shift: ShiftEntry | undefined): string {
    const base = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' }).format(new Date(`${day.date}T12:00:00`));
    return shift ? `${base}, ${this.labels[shift.type]}${shift.note ? `, ${shift.note}` : ''}` : `${base}, keine Schicht`;
  }
}
