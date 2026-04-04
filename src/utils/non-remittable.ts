function toLocalDateString(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateInput(value: string | Date): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return toLocalDateString(value);
  }

  const normalized = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function isNonRemittableActive(
  effectiveDate?: string | Date | null,
  referenceDate?: string | Date | null,
): boolean {
  if (effectiveDate == null) {
    return true;
  }

  const normalizedEffectiveDate = normalizeDateInput(effectiveDate);
  if (!normalizedEffectiveDate) {
    return false;
  }

  const normalizedReferenceDate =
    referenceDate == null ? toLocalDateString(new Date()) : normalizeDateInput(referenceDate);
  if (!normalizedReferenceDate) {
    return false;
  }

  return normalizedEffectiveDate <= normalizedReferenceDate;
}
