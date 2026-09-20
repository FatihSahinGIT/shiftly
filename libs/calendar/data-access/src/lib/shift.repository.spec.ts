import { MemoryStorageAdapter } from '@shiftly/core-data-access';
import { describe, expect, it } from 'vitest';
import { LocalShiftRepository } from './shift.repository';

describe('LocalShiftRepository', () => {
  it('legt eine Schicht an und persistiert sie über Instanzen hinweg', async () => {
    const storage = new MemoryStorageAdapter();
    const first = new LocalShiftRepository(storage);
    await first.create({ date: '2026-09-20', type: 'early' }, 'admin');
    const restored = await new LocalShiftRepository(storage).list();
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({ date: '2026-09-20', type: 'early' });
  });

  it('ersetzt die Schicht eines bereits belegten Tages', async () => {
    const repository = new LocalShiftRepository(new MemoryStorageAdapter());
    const original = await repository.create({ date: '2026-09-20', type: 'early' }, 'admin');
    const replaced = await repository.create({ date: '2026-09-20', type: 'night', note: 'Tausch' }, 'admin');
    expect((await repository.list())).toHaveLength(1);
    expect(replaced.id).toBe(original.id);
    expect(replaced.type).toBe('night');
  });

  it('löscht eine Schicht', async () => {
    const repository = new LocalShiftRepository(new MemoryStorageAdapter());
    const entry = await repository.create({ date: '2026-09-20', type: 'late' }, 'admin');
    await repository.delete(entry.id);
    expect(await repository.list()).toEqual([]);
  });
});
