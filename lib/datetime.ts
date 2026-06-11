export const UK_TIME_ZONE = 'Europe/London';
export const UK_LOCALE = 'en-GB';

const ukDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: UK_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getUkDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function datetimeLocalToMinutes(local: string): number {
  const [datePart, timePart] = local.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  const dayNum = Date.UTC(y, mo - 1, d) / (24 * 60 * 60 * 1000);
  return dayNum * 24 * 60 + h * 60 + min;
}

export function isSameUkCalendarDay(a: Date, b: Date): boolean {
  return ukDateKeyFormatter.format(a) === ukDateKeyFormatter.format(b);
}

export function formatUkTime(date: Date): string {
  return date.toLocaleTimeString(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    hour12: false,
  });
}

export function formatUkDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return date.toLocaleDateString(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    ...options,
  });
}

export function formatUkDateTime(date: Date): string {
  return date.toLocaleString(UK_LOCALE, {
    timeZone: UK_TIME_ZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    hour12: false,
  });
}

/** Value for `<input type="datetime-local">` shown in UK time. */
export function toUkDatetimeLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { year, month, day, hour, minute } = getUkDateParts(d);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** Parse a datetime-local string as UK time. */
export function ukDatetimeLocalToDate(local: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) {
    throw new Error('Invalid datetime-local value');
  }

  const targetMin = datetimeLocalToMinutes(local);
  let guess = new Date(`${local}:00.000Z`);

  for (let i = 0; i < 6; i++) {
    const current = toUkDatetimeLocal(guess);
    const diffMin = targetMin - datetimeLocalToMinutes(current);
    if (diffMin === 0) return guess;
    guess = new Date(guess.getTime() + diffMin * 60 * 1000);
  }

  return guess;
}

export function ukDatetimeLocalToIso(local: string): string {
  return ukDatetimeLocalToDate(local).toISOString();
}
