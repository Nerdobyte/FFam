/** UK wall-clock helpers for seed scripts (mirrors lib/datetime.ts). */

export const UK_TIME_ZONE = 'Europe/London';

function getUkDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function datetimeLocalToMinutes(local) {
  const [datePart, timePart] = local.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  const dayNum = Date.UTC(y, mo - 1, d) / (24 * 60 * 60 * 1000);
  return dayNum * 24 * 60 + h * 60 + min;
}

export function toUkDatetimeLocal(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const { year, month, day, hour, minute } = getUkDateParts(d);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** Parse YYYY-MM-DDTHH:mm as UK local time → UTC Date. */
export function ukDatetimeLocalToDate(local) {
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

/** Build a kickoff Date from UK wall-clock parts. Month is 1–12. */
export function ukKickoff(year, month, day, hour, minute = 0) {
  const pad = (n) => String(n).padStart(2, '0');
  const local = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
  return ukDatetimeLocalToDate(local);
}

export function formatUkDateTime(date) {
  return date.toLocaleString('en-GB', {
    timeZone: UK_TIME_ZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    hour12: false,
  });
}
