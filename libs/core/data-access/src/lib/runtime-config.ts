import { InjectionToken } from '@angular/core';
import { RuntimeConfig } from '@shiftly/shared-models';

interface RuntimeGlobal {
  SHIFTLY_CONFIG?: RuntimeConfig;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('SHIFTLY_RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: () => {
    const candidate = (globalThis as typeof globalThis & RuntimeGlobal).SHIFTLY_CONFIG;
    return candidate ?? {};
  },
});

export function hasSupabaseConfig(config: RuntimeConfig): boolean {
  return Boolean(config.supabaseUrl?.trim() && config.supabaseAnonKey?.trim());
}
