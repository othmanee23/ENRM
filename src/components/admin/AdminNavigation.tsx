'use client';

import { useEffect, useState } from 'react';
import {
  ChartColumnIncreasing,
  ClipboardList,
  Layers3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  TicketPercent,
  UsersRound,
} from 'lucide-react';

const routes = [
  { id: 'overview', label: 'Vue d’ensemble', Icon: LayoutDashboard },
  { id: 'orders', label: 'Commandes', Icon: ShoppingBag },
  { id: 'products', label: 'Produits', Icon: Package },
  { id: 'categories', label: 'Catégories', Icon: Tags },
  { id: 'inventory', label: 'Stock & inventaire', Icon: Layers3 },
  { id: 'customers', label: 'Clients', Icon: UsersRound },
  { id: 'analytics', label: 'Statistiques', Icon: ChartColumnIncreasing },
  { id: 'promotions', label: 'Promotions', Icon: TicketPercent },
  { id: 'settings', label: 'Paramètres', Icon: Settings },
  { id: 'search', label: 'Recherche', Icon: ClipboardList, hidden: true },
];

type NavigationEvent = CustomEvent<{
  view: string;
  restricted: boolean;
  actionableOrders: number | null;
}>;

export function AdminNavigation() {
  const [state, setState] = useState({
    view: 'overview',
    restricted: false,
    actionableOrders: null as number | null,
  });

  useEffect(() => {
    const update = (event: Event) => {
      setState((event as NavigationEvent).detail);
    };
    window.addEventListener('enrm-admin-navigation', update);
    return () => window.removeEventListener('enrm-admin-navigation', update);
  }, []);

  if (state.restricted) return null;
  return (
    <>
      {routes
        .filter((route) => !route.hidden)
        .map(({ id, label, Icon }) => (
          <a
            href={`#${id}`}
            className={state.view === id ? 'active' : undefined}
            aria-current={state.view === id ? 'page' : undefined}
            key={id}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {id === 'orders' && <span className="nav-count">{state.actionableOrders ?? '—'}</span>}
          </a>
        ))}
    </>
  );
}
