import { inject, InjectionToken } from '@angular/core';
import { SUPABASE_CLIENT, STORAGE, StoragePort } from '@shiftly/core-data-access';
import { AppUser } from '@shiftly/shared-models';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AuthRepository {
  restoreSession(): Promise<AppUser | null>;
  login(identifier: string, password: string): Promise<AppUser>;
  logout(): Promise<void>;
}

interface DemoAccount {
  password: string;
  user: AppUser;
}

const DEMO_ACCOUNTS: Readonly<Record<string, DemoAccount>> = {
  mama: {
    password: 'mama123',
    user: { id: 'demo-mama', username: 'mama', displayName: 'Mama', role: 'admin' },
  },
  familie: {
    password: 'familie123',
    user: { id: 'demo-familie', username: 'familie', displayName: 'Familie', role: 'viewer' },
  },
};

const SESSION_KEY = 'shiftly.demo.session.v1';

export class LocalAuthRepository implements AuthRepository {
  constructor(private readonly storage: StoragePort) {}

  async restoreSession(): Promise<AppUser | null> {
    const value = this.storage.get(SESSION_KEY);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as AppUser;
      return parsed.role === 'admin' || parsed.role === 'viewer' ? parsed : null;
    } catch {
      this.storage.remove(SESSION_KEY);
      return null;
    }
  }

  async login(identifier: string, password: string): Promise<AppUser> {
    const account = DEMO_ACCOUNTS[identifier.trim().toLowerCase()];
    if (!account || account.password !== password) {
      throw new Error('Benutzername oder Passwort ist nicht korrekt.');
    }
    this.storage.set(SESSION_KEY, JSON.stringify(account.user));
    return account.user;
  }

  async logout(): Promise<void> {
    this.storage.remove(SESSION_KEY);
  }
}

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'viewer';
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async restoreSession(): Promise<AppUser | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session ? this.loadProfile(data.session.user.id) : null;
  }

  async login(identifier: string, password: string): Promise<AppUser> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: identifier.trim(),
      password,
    });
    if (error || !data.user) {
      throw new Error('Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.');
    }
    return this.loadProfile(data.user.id);
  }

  async logout(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(error.message);
  }

  private async loadProfile(userId: string): Promise<AppUser> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, username, display_name, role')
      .eq('id', userId)
      .single<ProfileRow>();
    if (error || !data) throw new Error('Für dieses Konto fehlt ein gültiges Profil.');
    return {
      id: data.id,
      username: data.username,
      displayName: data.display_name,
      role: data.role,
    };
  }
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('SHIFTLY_AUTH_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    const client = inject(SUPABASE_CLIENT);
    return client ? new SupabaseAuthRepository(client) : new LocalAuthRepository(inject(STORAGE));
  },
});
