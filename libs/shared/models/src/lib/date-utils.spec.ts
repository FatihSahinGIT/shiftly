import { describe, expect, it } from 'vitest';
import { addMonths, calendarDays, toLocalIsoDate } from './date-utils';

describe('date utilities', () => {
  it('wechselt korrekt zwischen Monaten', () => {
    expect(toLocalIsoDate(addMonths(new Date(2026, 0, 1), 1))).toBe('2026-02-01');
    expect(toLocalIsoDate(addMonths(new Date(2026, 0, 1), -1))).toBe('2025-12-01');
  });

  it('erzeugt sechs vollständige Kalenderwochen ab Montag', () => {
    const days = calendarDays(new Date(2026, 8, 1), new Date(2026, 8, 20));
    expect(days).toHaveLength(42);
    expect(days[0].date).toBe('2026-08-31');
    expect(days.find((day) => day.date === '2026-09-20')?.isToday).toBe(true);
  });
});
