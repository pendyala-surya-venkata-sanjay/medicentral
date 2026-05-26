/** Parse duration text into whole days (e.g. "7 days", "2 weeks", "5"). */
export const parseDurationDays = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && !Number.isNaN(value) && value > 0) return Math.round(value);
  const s = String(value).toLowerCase().trim();
  const num = parseFloat(s);
  if (Number.isNaN(num) || num <= 0) return null;
  if (/week/.test(s)) return Math.round(num * 7);
  if (/month/.test(s)) return Math.round(num * 30);
  return Math.round(num);
};

export default { parseDurationDays };
