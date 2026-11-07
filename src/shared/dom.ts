type Forms =
  | '#product-form'
  | '#customer-form'
  | '#promo-form'
  | '#order-update'
  | '#new-order'
  | '#settings-form'
  | '#advice-mini'
  | '#advice-form'
  | '#checkout-form'
  | '#global-search';
type Selects = '#brand' | '#range' | '#viscosity' | '#volume' | '#sort' | '#period';
type Inputs = '#search' | '#local-query' | '#global-query' | '#detail-qty';
type Dialogs = '#editor' | '#flow-dialog' | '#cart-dialog';
type ElementFor<S extends string> = S extends Forms
  ? HTMLFormElement
  : S extends Selects
    ? HTMLSelectElement
    : S extends Inputs
      ? HTMLInputElement
      : S extends Dialogs
        ? HTMLDialogElement
        : HTMLElement;
/** Use only for elements owned by the current page; optional lookups use querySelector. */
export function $<S extends string>(selector: S): ElementFor<S> {
  return document.querySelector(selector) as ElementFor<S>;
}
export function formData(target: EventTarget | null): FormData {
  if (!(target instanceof HTMLFormElement)) throw new Error('Expected a form element');
  return new FormData(target);
}
export function formValues(data: FormData): Record<string, string> {
  return Object.fromEntries(
    [...data].map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  );
}
export function fieldValue(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}
