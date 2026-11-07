export const statuses = ['À préparer', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'];
export const fmt = (d: string | Date | number) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
export const initials = (s: string) =>
  s
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
