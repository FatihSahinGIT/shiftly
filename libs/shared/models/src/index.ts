export type UserRole = 'admin' | 'viewer';
export type ShiftType = 'early' | 'late' | 'night';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface ShiftEntry {
  id: string;
  date: string;
  type: ShiftType;
  note?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ShiftDraft {
  date: string;
  type: ShiftType;
  note?: string;
}

export interface RuntimeConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export const SHIFT_LABELS: Readonly<Record<ShiftType, string>> = {
  early: 'Frühdienst',
  late: 'Spätdienst',
  night: 'Nachtdienst',
};

export * from './lib/date-utils';
