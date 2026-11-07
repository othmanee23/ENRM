const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => entities[c]);
export const norm = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
export const brandName = (name: string): string => (name === 'Liqui_Moly' ? 'LIQUI MOLY' : name);
export const money = (value: number): string =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value);
export const currency = (value: number): string => `${money(value)} MAD`;
