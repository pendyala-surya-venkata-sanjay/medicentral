/** Extract MC-PT-#### from free-text search (e.g. "Priya (MC-PT-1001)"). */
export const extractPatientId = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return '';

  const match = s.match(/MC-PT-\d{4,}/i);
  if (match) return match[0].toUpperCase();

  if (/^\d{4,}$/.test(s)) return `MC-PT-${s}`;

  if (/^MC-PT-/i.test(s)) return s.toUpperCase();

  return s.toUpperCase();
};
