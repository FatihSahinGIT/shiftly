import { MemoryStorageAdapter } from '@shiftly/core-data-access';
import { describe, expect, it } from 'vitest';
import { CalendarStore } from './calendar.store';
import { LocalShiftRepository } from './shift.repository';

describe('CalendarStore Berechtigungen', () => {
  it('erlaubt dem Admin CRUD', async () => {
    const store = new CalendarStore(new LocalShiftRepository(new MemoryStorageAdapter()), {
      requireAdmin: () => ({ id: 'admin' }),
    });
    const created = await store.create({ date: '2026-09-20', type: 'early' });
    const updated = await store.update(created.id, { date: created.date, type: 'late', note: 'Geändert' });
    expect(updated.type).toBe('late');
    await store.delete(created.id);
    expect(store.entries()).toEqual([]);
  });

  it('erlaubt einem Viewer keine Schreiboperation', async () => {
    const store = new CalendarStore(new LocalShiftRepository(new MemoryStorageAdapter()), {
      requireAdmin: () => {
        throw new Error('Nur Administratoren dürfen Schichten verändern.');
      },
    });
    await expect(store.create({ date: '2026-09-20', type: 'night' })).rejects.toThrow('Nur Administratoren');
  });
});
