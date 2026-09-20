import { computed, Inject, Injectable, signal } from '@angular/core';
import { AppUser } from '@shiftly/shared-models';
import { AUTH_REPOSITORY, AuthRepository } from './auth.repository';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserState = signal<AppUser | null>(null);
  private initialization: Promise<void> | null = null;

  // Tests pass an in-memory repository; production resolves the configured adapter.
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(@Inject(AUTH_REPOSITORY) private readonly repository: AuthRepository) {}

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);
  readonly isAdmin = computed(() => this.currentUserState()?.role === 'admin');

  initialize(): Promise<void> {
    this.initialization ??= this.repository.restoreSession().then((user) => {
      this.currentUserState.set(user);
    });
    return this.initialization;
  }

  async login(identifier: string, password: string): Promise<AppUser> {
    const user = await this.repository.login(identifier, password);
    this.currentUserState.set(user);
    return user;
  }

  async logout(): Promise<void> {
    await this.repository.logout();
    this.currentUserState.set(null);
  }

  requireAdmin(): AppUser {
    const user = this.currentUserState();
    if (!user || user.role !== 'admin') {
      throw new Error('Nur Administratoren dürfen Schichten verändern.');
    }
    return user;
  }
}
