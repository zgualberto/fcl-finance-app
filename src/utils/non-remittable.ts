import { date as DateUtils } from 'quasar';

function toLocalDateString(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeEffectiveDate(effectiveDate: string | Date): string | null {
  if (effectiveDate instanceof Date) {
    if (Number.isNaN(effectiveDate.getTime())) {
      return null;
    }
    return toLocalDateString(effectiveDate);
  }

  const normalized = effectiveDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function isNonRemittableActive(effectiveDate?: string | Date | null): boolean {
  if (effectiveDate == null) {
    return true;
  }

  const normalizedEffectiveDate = normalizeEffectiveDate(effectiveDate);
  if (!normalizedEffectiveDate) {
    return false;
  }

  const today = toLocalDateString(new Date());
  return DateUtils.getDateDiff(today, normalizedEffectiveDate, 'days') >= 0;
}
