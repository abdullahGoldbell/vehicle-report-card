/**
 * Singapore Public Holidays (gazetted dates + observed substitutes).
 * Source: https://www.mom.gov.sg/employment-practices/public-holidays
 *
 * When a PH falls on Sunday, the next Monday is the observed holiday.
 * Both the actual and observed dates are included.
 */
const HOLIDAYS: string[] = [
  // 2025
  '2025-01-01', // New Year's Day
  '2025-01-29', // Chinese New Year
  '2025-01-30', // Chinese New Year
  '2025-03-31', // Hari Raya Puasa
  '2025-04-18', // Good Friday
  '2025-05-01', // Labour Day
  '2025-05-12', // Vesak Day
  '2025-06-07', // Hari Raya Haji (Saturday)
  '2025-08-09', // National Day (Saturday)
  '2025-10-20', // Deepavali
  '2025-12-25', // Christmas Day

  // 2026
  '2026-01-01', // New Year's Day
  '2026-02-17', // Chinese New Year
  '2026-02-18', // Chinese New Year
  '2026-03-21', // Hari Raya Puasa (Saturday)
  '2026-04-03', // Good Friday
  '2026-05-01', // Labour Day
  '2026-05-27', // Hari Raya Haji
  '2026-06-01', // Vesak Day (observed, actual 31 May Sunday)
  '2026-08-10', // National Day (observed, actual 9 Aug Sunday)
  '2026-11-09', // Deepavali (observed, actual 8 Nov Sunday)
  '2026-12-25', // Christmas Day

  // 2027 (tentative, subject to gazette)
  '2027-01-01', // New Year's Day
  '2027-02-06', // Chinese New Year (approx)
  '2027-02-07', // Chinese New Year (approx)
  '2027-03-10', // Hari Raya Puasa (approx)
  '2027-03-26', // Good Friday
  '2027-05-01', // Labour Day
  '2027-05-17', // Hari Raya Haji (approx)
  '2027-05-20', // Vesak Day (approx)
  '2027-08-09', // National Day
  '2027-11-07', // Deepavali (approx)
  '2027-12-25', // Christmas Day (Saturday)
  '2027-12-27', // Christmas Day (observed)
];

const holidaySet = new Set(HOLIDAYS);

/**
 * Check if a date (YYYY-MM-DD) is a Singapore public holiday.
 */
export function isPublicHoliday(date: Date): boolean {
  const key = date.toISOString().split('T')[0];
  return holidaySet.has(key);
}

/**
 * Count Sundays, Saturdays, and public holidays within a date range (inclusive).
 * Returns deduction in days: Sunday = 1, Saturday = 0.5, PH = 1.
 * If a PH falls on a Saturday, it counts as 1 (not 0.5).
 * If a PH falls on a Sunday, it counts as 1 (same as Sunday).
 */
export function getDeductionDays(start: Date, end: Date): number {
  let deduction = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
    const isPH = isPublicHoliday(current);

    if (dayOfWeek === 0) {
      // Sunday: deduct 1 day (PH on Sunday doesn't add extra)
      deduction += 1;
    } else if (isPH) {
      // Public holiday on a weekday or Saturday: deduct 1 full day
      deduction += 1;
    } else if (dayOfWeek === 6) {
      // Saturday (non-PH): deduct 0.5 day
      deduction += 0.5;
    }

    current.setDate(current.getDate() + 1);
  }

  return deduction;
}
