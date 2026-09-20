export interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromLocalIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function calendarDays(month: Date, today = new Date()): CalendarDay[] {
  const first = startOfMonth(month);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
  const todayKey = toLocalIsoDate(today);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const key = toLocalIsoDate(date);
    return {
      date: key,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === first.getMonth(),
      isToday: key === todayKey,
    };
  });
}

export function monthLabel(month: Date): string {
  const value = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(month);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function longDateLabel(date: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fromLocalIsoDate(date));
}
