import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RUNTIME_CONFIG, hasSupabaseConfig } from '@shiftly/core-data-access';
import { MotionService } from '@shiftly/shared-ui';
import { AuthService } from './auth.service';

@Component({
  selector: 'shiftly-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly motion = inject(MotionService);
  private readonly config = inject(RUNTIME_CONFIG);
  private readonly card = viewChild<ElementRef<HTMLElement>>('card');

  readonly isDemo = !hasSupabaseConfig(this.config);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    identifier: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set('');
    this.busy.set(true);
    try {
      const { identifier, password } = this.form.getRawValue();
      await this.auth.login(identifier, password);
      await this.motion.exit(this.card()?.nativeElement);
      await this.router.navigate(['/calendar']);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen.');
    } finally {
      this.busy.set(false);
    }
  }
}
