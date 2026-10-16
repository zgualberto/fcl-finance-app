/**
 * Returns the last calendar day of the given month as a local `YYYY-MM-DD` string.
 *
 * @param year full year (e.g. 2026)
 * @param monthIndex zero-based month (0 = January, 11 = December)
 */
export function getMonthEndDateString(year: number, monthIndex: number): string {
  const monthEnd = new Date(year, monthIndex + 1, 0);
  const month = `${monthEnd.getMonth() + 1}`.padStart(2, '0');
  const day = `${monthEnd.getDate()}`.padStart(2, '0');
  return `${monthEnd.getFullYear()}-${month}-${day}`;
}
