/** Deterministic vitals parsing — no ML claims */

export const parseBp = (bp) => {
  if (!bp || typeof bp !== 'string') return null;
  const m = bp.match(/(\d+)\s*[/\\]\s*(\d+)/);
  if (!m) return null;
  return { systolic: Number(m[1]), diastolic: Number(m[2]) };
};

export const evaluateVitals = (vitals = {}) => {
  const flags = [];
  const bp = parseBp(vitals.bp);
  if (bp && (bp.systolic >= 140 || bp.diastolic >= 90)) {
    flags.push({ code: 'hypertension_range', message: `BP ${vitals.bp} — elevated range`, severity: 'warning' });
  }
  if (bp && (bp.systolic >= 180 || bp.diastolic >= 120)) {
    flags.push({ code: 'hypertension_critical', message: `BP ${vitals.bp} — critically elevated`, severity: 'critical' });
  }
  const pulse = Number(vitals.pulse);
  if (pulse && (pulse < 50 || pulse > 120)) {
    flags.push({ code: 'pulse_abnormal', message: `Pulse ${vitals.pulse} — outside typical range`, severity: 'warning' });
  }
  const spo2 = Number(String(vitals.spo2).replace(/%/g, ''));
  if (spo2 && spo2 < 92) {
    flags.push({ code: 'spo2_low', message: `SpO₂ ${vitals.spo2} — low`, severity: 'critical' });
  }
  const temp = Number(vitals.temperature);
  if (temp && temp >= 38.5) {
    flags.push({ code: 'fever', message: `Temperature ${vitals.temperature} — fever range`, severity: 'warning' });
  }
  const glucose = Number(vitals.glucose);
  if (glucose && glucose >= 200) {
    flags.push({ code: 'glucose_high', message: `Blood sugar ${vitals.glucose} — elevated`, severity: 'warning' });
  }
  return flags;
};

export default { parseBp, evaluateVitals };
