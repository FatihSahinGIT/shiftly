import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SHIFT_LABELS, ShiftType } from '@shiftly/shared-models';

@Component({
  selector: 'shiftly-shift-palette',
  imports: [CdkDrag, CdkDropList],
  template: `
    <section class="palette" aria-labelledby="palette-title">
      <div class="palette-copy">
        <p class="eyebrow">Schicht planen</p>
        <h2 id="palette-title">Welche Schicht steht an?</h2>
        <p>Ziehen oder auswählen und danach einen Tag anklicken.</p>
      </div>
      <div
        class="shift-options"
        id="shift-palette"
        cdkDropList
        cdkDropListOrientation="horizontal"
        [cdkDropListData]="types"
        [cdkDropListConnectedTo]="connectedTo()"
        cdkDropListSortingDisabled
      >
        @for (type of types; track type) {
          <button
            type="button"
            class="shift-card shift-card--{{ type }}"
            cdkDrag
            [cdkDragData]="type"
            [class.is-selected]="selected() === type"
            [attr.aria-pressed]="selected() === type"
            (click)="selectedChange.emit(type)"
          >
            <span class="shift-icon" aria-hidden="true">{{ icons[type] }}</span>
            <span><strong>{{ labels[type] }}</strong><small>{{ times[type] }}</small></span>
            <span class="drag-handle" aria-hidden="true">⋮⋮</span>
          </button>
        }
      </div>
    </section>
  `,
  styleUrl: './shift-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftPaletteComponent {
  readonly connectedTo = input<string[]>([]);
  readonly selected = input<ShiftType | null>(null);
  readonly selectedChange = output<ShiftType>();
  readonly types: ShiftType[] = ['early', 'late', 'night'];
  readonly labels = SHIFT_LABELS;
  readonly icons: Readonly<Record<ShiftType, string>> = { early: '☀', late: '◐', night: '☾' };
  readonly times: Readonly<Record<ShiftType, string>> = { early: 'Früh starten', late: 'Später Dienst', night: 'Über Nacht' };
}
