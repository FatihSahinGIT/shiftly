import { inject, InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseConfig, RUNTIME_CONFIG } from './runtime-config';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient | null>('SHIFTLY_SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () => {
    const config = inject(RUNTIME_CONFIG);
    if (!hasSupabaseConfig(config)) {
      return null;
    }
    return createClient(config.supabaseUrl as string, config.supabaseAnonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  },
});
