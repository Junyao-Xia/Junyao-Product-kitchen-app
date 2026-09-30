const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date | null {
  if (!ISO_DATE.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseISODate(isoDate);
  if (!date) {
    throw new Error("Invalid ISO date");
  }
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function compareISODates(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isBeforeToday(reminderDate: string, today: string): boolean {
  return compareISODates(reminderDate, today) < 0;
}

export function isOnOrAfterToday(reminderDate: string, today: string): boolean {
  return compareISODates(reminderDate, today) >= 0;
}

export function dayOffset(from: string, to: string): number {
  const start = parseISODate(from);
  const end = parseISODate(to);
  if (!start || !end) {
    return 0;
  }
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatReminderLabel(
  reminderDate: string,
  today: string,
): string {
  const diff = dayOffset(today, reminderDate);

  if (diff < -1) {
    return `Reminder ${Math.abs(diff)} days ago`;
  }
  if (diff === -1) {
    return "Reminder yesterday";
  }
  if (diff === 0) {
    return "Reminder today";
  }
  if (diff === 1) {
    return "Reminder tomorrow";
  }
  return `Reminder in ${diff} days`;
}
