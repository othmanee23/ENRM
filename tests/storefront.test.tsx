import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AddToCartButton } from '../src/components/storefront/AddToCartButton';
import { CartCount } from '../src/components/storefront/CartCount';
import { CartProvider } from '../src/components/storefront/CartProvider';
import {
  MobileMenu,
  ProductGallery,
  FilterToggle,
} from '../src/components/storefront/StorefrontControls';
import { AdviceMiniForm } from '../src/components/storefront/AdviceMiniForm';

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  localStorage.clear();
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    value: true,
  });
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  localStorage.clear();
});

describe('storefront React interactions', () => {
  it('keeps cart count and persistent cart state in sync when adding a product', async () => {
    await act(async () => {
      root.render(
        createElement(
          CartProvider,
          null,
          createElement(CartCount),
          createElement(AddToCartButton, { id: 'ENRM-HM-006', label: 'Add product' }),
        ),
      );
    });
    const add = host.querySelector('button[aria-label="Add product"]')!;
    await act(async () => add.click());
    expect(host.textContent).toContain('1');
    expect(JSON.parse(localStorage.getItem('enrm-demo-cart') || '[]')).toEqual([
      { id: 'ENRM-HM-006', qty: 1 },
    ]);
  });

  it('does not claim an item was added when browser storage rejects the write', async () => {
    await act(async () => {
      root.render(
        createElement(
          CartProvider,
          null,
          createElement(CartCount),
          createElement(AddToCartButton, { id: 'ENRM-HM-006', label: 'Add product' }),
        ),
      );
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded');
    });
    await act(async () =>
      host.querySelector<HTMLButtonElement>('button[aria-label="Add product"]')!.click(),
    );
    expect(host.textContent).toContain('Impossible de sauvegarder votre panier');
    expect(host.querySelector('[aria-live="polite"]')?.textContent).not.toContain('Ajouté');
    expect(host.firstChild?.textContent).toBe('0');
  });

  it('opens and closes the mobile menu from its React button', () => {
    act(() => root.render(createElement(MobileMenu)));
    const nav = host.querySelector('#mobile-nav')!;
    expect(nav.hasAttribute('hidden')).toBe(true);
    act(() => host.querySelector<HTMLButtonElement>('button')!.click());
    expect(nav.hasAttribute('hidden')).toBe(false);
    expect(host.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('changes the product gallery face with the matching selected state', () => {
    act(() =>
      root.render(
        createElement(ProductGallery, { recto: '/front.jpg', verso: '/back.jpg', alt: 'Oil' }),
      ),
    );
    act(() => host.querySelectorAll('button')[1].click());
    expect(host.querySelector<HTMLImageElement>('#detail-photo img')?.src).toContain('/back.jpg');
    expect(host.querySelectorAll('button')[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles the catalogue filter panel and reports its expanded state', () => {
    const panel = document.createElement('aside');
    panel.id = 'filters';
    document.body.append(panel);
    act(() => root.render(createElement(FilterToggle)));
    act(() => host.querySelector<HTMLButtonElement>('button')!.click());
    expect(panel.classList.contains('open')).toBe(true);
    expect(host.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
    panel.remove();
  });

  it('gives local confirmation when advice details are prepared without sending them', () => {
    act(() => root.render(createElement(AdviceMiniForm)));
    for (const [name, value] of [
      ['marque', 'Renault'],
      ['modele', 'Clio'],
      ['annee', '2020'],
    ]) {
      const input = host.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
      input.value = value;
      act(() => input.dispatchEvent(new Event('input', { bubbles: true })));
    }
    act(() =>
      host
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    );
    expect(host.textContent).toContain('cette démonstration n’envoie pas votre demande');
  });
});
