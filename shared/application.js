export const statuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
export const isDue = (item, today) => Boolean(item.followUp && item.followUp <= today && !['Offer', 'Rejected'].includes(item.status));
export function validateApplication(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Provide an application object.');
  const out = {};
  for (const [key, limit] of Object.entries({company:120, role:160, url:2000, notes:5000, followUp:10, status:20})) {
    const value = body[key] ?? (key === 'status' ? 'Saved' : '');
    if (typeof value !== 'string' || value.length > limit) throw new Error(`${key} must be text with at most ${limit} characters.`);
    out[key] = value.trim();
  }
  if (!out.company || !out.role) throw new Error('Company and role are required.');
  if (!statuses.includes(out.status)) throw new Error('Choose a valid status.');
  if (out.url) {
    let url;
    try { url = new URL(out.url); } catch { throw new Error('Enter a complete http or https URL.'); }
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Only http and https links are allowed.');
  }
  if (out.followUp && (!/^\d{4}-\d{2}-\d{2}$/.test(out.followUp) || !Number.isFinite(Date.parse(out.followUp)) || new Date(out.followUp).toISOString().slice(0,10) !== out.followUp)) throw new Error('Enter a valid follow-up date.');
  return out;
}
