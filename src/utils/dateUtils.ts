/**
 * Date formatting helper utilities
 * Standard format: dd/mm/yyyy (e.g. 23/07/2026)
 */

export function formatDateDDMMYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(dateInput).trim();

  // If already in dd/mm/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Handle YYYY-MM-DD
  const parts = str.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Handle ISO string
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }

  return str;
}
