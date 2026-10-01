/**
 * Yearbook batch rules.
 *
 * The academic reference year changes every 1 August:
 * - On/after 1 August 2026: 2026 = Freshers, 2025 = Graduating, 2024 = Graduated
 * - Before 1 August 2026: 2025 = Freshers, 2024 = Graduating, 2023 = Graduated
 */
export function getAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  const augustFirst = new Date(year, 7, 1);
  return date >= augustFirst ? year : year - 1;
}

export function getBatchStatus(batchYear, date = new Date()) {
  const academicYear = getAcademicYear(date);

  if (batchYear === academicYear) return "Fresher";
  if (batchYear === academicYear - 1) return "Graduating";
  if (batchYear === academicYear - 2) return "Graduated";
  return String(batchYear);
}

export function getDefaultBatchYear(availableYears, date = new Date()) {
  if (!availableYears.length) return null;

  const academicYear = getAcademicYear(date);
  const preferred = academicYear - 1;
  if (availableYears.includes(preferred)) return preferred;

  return Math.max(...availableYears);
}
