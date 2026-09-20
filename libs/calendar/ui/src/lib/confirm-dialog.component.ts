import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'shiftly-confirm-dialog',
  template: `
    @if (open()) {
      <div class="backdrop" aria-hidden="true"></div>
      <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-copy">
        <p class="eyebrow">Bestätigung</p>
        <h2 id="confirm-title">Schicht ersetzen?</h2>
        <p id="confirm-copy">An diesem Tag ist bereits eine Schicht eingetragen. Soll sie durch die neue Schicht ersetzt werden?</p>
        <div><button type="button" class="cancel" (click)="dismissed.emit()">Abbrechen</button><button type="button" class="confirm" (click)="accepted.emit()">Ersetzen</button></div>
      </section>
    }
  `,
  styles: [`.backdrop{position:fixed;inset:0;z-index:30;background:rgba(28,25,22,.48)}section{position:fixed;z-index:31;left:50%;top:50%;width:min(calc(100% - 2rem),26rem);transform:translate(-50%,-50%);padding:1.5rem;border-radius:1.2rem;background:#fff;box-shadow:0 2rem 5rem rgba(0,0,0,.25)}.eyebrow{margin:0;color:#9a651d;font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}h2{margin:.3rem 0 .7rem}p{color:#666057;line-height:1.5}div{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1.2rem}button{min-height:2.7rem;padding:0 1rem;border-radius:.7rem;font:inherit;font-weight:700;cursor:pointer}.cancel{border:1px solid #d7d1c8;background:#fff}.confirm{border:0;background:#8c3c2f;color:#fff}button:focus-visible{outline:3px solid #1d59bd;outline-offset:2px}`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly accepted = output<void>();
  readonly dismissed = output<void>();
}
