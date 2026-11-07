import type { Product, AdminState } from '../shared/types';
import { requireProduct } from '../shared/catalogue';
export function createDemoState(baseProducts: Product[], today: Date): AdminState {
  const ago = (n: number) => new Date(today.getTime() - n * 864e5).toISOString();
  const names = [
    'Amine Démo',
    'Salma Démo',
    'Youssef Démo',
    'Atelier Atlas Démo',
    'Lina Démo',
    'Garage Nord Démo',
    'Omar Démo',
    'Nour Démo',
  ];
  const cities = [
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Tanger',
    'Agadir',
    'Fès',
    'Meknès',
    'Kénitra',
  ];
  const customers = names.map((name, i) => ({
    id: 'C' + (i + 1),
    name,
    city: cities[i],
    email: `client${i + 1}@example.com`,
    type: i === 3 || i === 5 ? 'Professionnel' : 'Particulier',
  }));
  const ids = [
    'ENRM-HM-006',
    'ENRM-HM-067',
    'ENRM-HM-031',
    'ENRM-HM-135',
    'ENRM-HM-155',
    'ENRM-HM-097',
  ];
  const products = baseProducts.map((p, i) => ({
    ...p,
    stock: i % 19 === 0 ? 0 : i % 13 === 0 ? 3 + (i % 5) : 18 + ((i * 7) % 81),
    status: 'Actif',
  }));
  const orders = Array.from({ length: 48 }, (_, i) => {
    const p = requireProduct(products, ids[i % 6]);
    let status =
      i < 3
        ? 'À préparer'
        : i < 6
          ? 'En préparation'
          : i < 10
            ? 'Expédiée'
            : i === 16
              ? 'Annulée'
              : 'Livrée';
    return {
      id: 'EN-' + (1048 - i),
      customerId: customers[i % 8].id,
      date: ago(Math.floor(i * 0.95)),
      status,
      payment: i % 5 === 0 ? 'À encaisser' : 'Payée',
      items: [
        {
          id: p.id,
          name: `${p.marque.replace('_', ' ')} ${p.sous_reference}`,
          volume: p.litrage,
          qty: 1 + (i % 4),
          price: p.price,
        },
      ],
      tracking: i >= 6 && i < 10 ? 'DEMO-' + (1048 - i) : '',
      note: '',
      history: [
        { label: 'Commande créée', date: ago(Math.floor(i * 0.95)) },
        ...(status !== 'À préparer'
          ? [{ label: status, date: ago(Math.max(0, Math.floor(i * 0.95) - 1)) }]
          : []),
      ],
    };
  });
  return {
    products,
    orders,
    customers,
    promotions: [
      {
        id: 'P1',
        code: 'BIENVENUE10',
        value: 10,
        type: 'Pourcentage',
        status: 'Actif',
        expiry: new Date(today.getTime() + 30 * 864e5).toISOString().slice(0, 10),
      },
      {
        id: 'P2',
        code: 'ATELIER50',
        value: 50,
        type: 'Montant fixe',
        status: 'Brouillon',
        expiry: new Date(today.getTime() + 45 * 864e5).toISOString().slice(0, 10),
      },
    ],
    activity: [],
    settings: { name: 'ENRM Maroc', email: 'demo@example.com', threshold: 10 },
  };
}
