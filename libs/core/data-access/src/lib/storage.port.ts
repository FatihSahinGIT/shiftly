import { InjectionToken } from '@angular/core';

export interface StoragePort {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class BrowserStorageAdapter implements StoragePort {
  private readonly fallback = new Map<string, string>();

  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? this.fallback.get(key) ?? null;
    } catch {
      return this.fallback.get(key) ?? null;
    }
  }

  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      this.fallback.set(key, value);
    }
  }

  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      this.fallback.delete(key);
    }
  }
}

export class MemoryStorageAdapter implements StoragePort {
  private readonly values = new Map<string, string>();

  get(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.values.set(key, value);
  }

  remove(key: string): void {
    this.values.delete(key);
  }
}

export const STORAGE = new InjectionToken<StoragePort>('SHIFTLY_STORAGE', {
  providedIn: 'root',
  factory: () => new BrowserStorageAdapter(),
});
