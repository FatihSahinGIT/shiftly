import { inject, InjectionToken } from '@angular/core';
import { STORAGE, StoragePort, SUPABASE_CLIENT } from '@shiftly/core-data-access';
import { ShiftDraft, ShiftEntry, ShiftType } from '@shiftly/shared-models';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ShiftRepository {
  list(): Promise<ShiftEntry[]>;
  create(draft: ShiftDraft, userId: string): Promise<ShiftEntry>;
  update(id: string, draft: ShiftDraft): Promise<ShiftEntry>;
  delete(id: string): Promise<void>;
}

const SHIFTS_KEY = 'shiftly.demo.shifts.v1';

export class LocalShiftRepository implements ShiftRepository {
  constructor(private readonly storage: StoragePort) {}

  async list(): Promise<ShiftEntry[]> {
    const value = this.storage.get(SHIFTS_KEY);
    if (!value) return [];
    try {
      return (JSON.parse(value) as ShiftEntry[]).sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      this.storage.remove(SHIFTS_KEY);
      return [];
    }
  }

  async create(draft: ShiftDraft, userId: string): Promise<ShiftEntry> {
    const shifts = await this.list();
    const occupied = shifts.find((shift) => shift.date === draft.date);
    const now = new Date().toISOString();
    const entry: ShiftEntry = {
      id: occupied?.id ?? createId(),
      ...draft,
      note: normalizeNote(draft.note),
      createdAt: occupied?.createdAt ?? now,
      updatedAt: now,
      createdBy: occupied?.createdBy ?? userId,
    };
    this.write([...shifts.filter((shift) => shift.date !== draft.date), entry]);
    return entry;
  }

  async update(id: string, draft: ShiftDraft): Promise<ShiftEntry> {
    const shifts = await this.list();
    const current = shifts.find((shift) => shift.id === id);
    if (!current) throw new Error('Die Schicht wurde nicht gefunden.');
    const conflict = shifts.find((shift) => shift.date === draft.date && shift.id !== id);
    const updated: ShiftEntry = {
      ...current,
      ...draft,
      note: normalizeNote(draft.note),
      updatedAt: new Date().toISOString(),
    };
    this.write([...shifts.filter((shift) => shift.id !== id && shift.id !== conflict?.id), updated]);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const shifts = await this.list();
    this.write(shifts.filter((shift) => shift.id !== id));
  }

  private write(shifts: ShiftEntry[]): void {
    this.storage.set(SHIFTS_KEY, JSON.stringify(shifts.sort((a, b) => a.date.localeCompare(b.date))));
  }
}

interface ShiftRow {
  id: string;
  date: string;
  type: ShiftType;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const toEntry = (row: ShiftRow): ShiftEntry => ({
  id: row.id,
  date: row.date,
  type: row.type,
  ...(row.note ? { note: row.note } : {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

export class SupabaseShiftRepository implements ShiftRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(): Promise<ShiftEntry[]> {
    const { data, error } = await this.client.from('shifts').select('*').order('date');
    if (error) throw new Error(error.message);
    return (data as ShiftRow[]).map(toEntry);
  }

  async create(draft: ShiftDraft, userId: string): Promise<ShiftEntry> {
    const { data, error } = await this.client
      .from('shifts')
      .upsert({ date: draft.date, type: draft.type, note: normalizeNote(draft.note), created_by: userId }, { onConflict: 'date' })
      .select()
      .single<ShiftRow>();
    if (error || !data) throw new Error(error?.message ?? 'Schicht konnte nicht gespeichert werden.');
    return toEntry(data);
  }

  async update(id: string, draft: ShiftDraft): Promise<ShiftEntry> {
    const { data, error } = await this.client
      .from('shifts')
      .update({ date: draft.date, type: draft.type, note: normalizeNote(draft.note) })
      .eq('id', id)
      .select()
      .single<ShiftRow>();
    if (error || !data) throw new Error(error?.message ?? 'Schicht konnte nicht aktualisiert werden.');
    return toEntry(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('shifts').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const SHIFT_REPOSITORY = new InjectionToken<ShiftRepository>('SHIFTLY_SHIFT_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    const client = inject(SUPABASE_CLIENT);
    return client ? new SupabaseShiftRepository(client) : new LocalShiftRepository(inject(STORAGE));
  },
});

function normalizeNote(note: string | undefined): string | undefined {
  const value = note?.trim();
  return value ? value : undefined;
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `shift-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
