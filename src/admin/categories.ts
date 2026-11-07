import type { Category } from '../shared/types';
import { supabase } from '../shared/supabase';
import { esc } from '../shared/format';

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function heading() {
  return `<div class="page-heading"><div><p class="eyebrow">STRUCTURE DU CATALOGUE</p><h1>Catégories</h1><p>Organisez les familles de produits de votre boutique.</p></div></div>`;
}

export function mountCategoryManager(container: HTMLElement) {
  if (!supabase) {
    container.innerHTML =
      heading() +
      `<section class="panel settings-body"><h2>Connexion Supabase nécessaire</h2><p>Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY pour gérer les catégories partagées.</p><p>Sans ces variables, la boutique reste en mode catalogue statique.</p></section>`;
    return;
  }

  const show = (html: string) => {
    container.innerHTML = heading() + html;
  };

  async function render() {
    const { data: sessionData, error: sessionError } = await supabase!.auth.getSession();
    if (sessionError) {
      show(
        `<section class="panel settings-body"><h2>Connexion indisponible</h2><p>${esc(sessionError.message)}</p></section>`,
      );
      return;
    }
    const session = sessionData.session;
    if (!session) {
      show(
        `<section class="panel settings-body category-auth"><h2>Connexion administrateur</h2><p>Connectez-vous avec un compte ENRM administrateur pour gérer le catalogue.</p><form id="category-login" class="form-grid"><label class="field full">Adresse e-mail<input name="email" type="email" autocomplete="username" required></label><label class="field full">Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><div class="form-actions full"><button class="btn primary" type="submit">Se connecter</button></div></form><p class="form-note">Les comptes et rôles sont provisionnés par l’administrateur du projet.</p></section>`,
      );
      return;
    }

    const { data: profile, error: profileError } = await supabase!
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();
    if (profileError || profile?.role !== 'admin') {
      show(
        `<section class="panel settings-body"><h2>Accès administrateur requis</h2><p>Ce compte n’a pas le rôle ENRM administrateur.</p><button class="btn" id="category-sign-out" type="button">Se déconnecter</button></section>`,
      );
      return;
    }

    const { data, error } = await supabase!
      .from('categories')
      .select('id,parent_id,name,slug,sort_order,is_active,products(count)')
      .order('sort_order')
      .order('name');
    if (error) {
      show(
        `<section class="panel settings-body"><h2>Catégories inaccessibles</h2><p>${esc(error.message)}</p></section>`,
      );
      return;
    }

    const categories = (data || []) as (Category & { products: { count: number }[] })[];
    show(
      `<section class="panel settings-body"><div class="panel-head"><div><h2>Ajouter une catégorie</h2><p class="panel-sub">Les produits restent rattachés à leur identifiant de catégorie.</p></div></div><form id="category-form" class="form-grid"><input name="id" type="hidden"><label class="field">Nom<input name="name" maxlength="80" required placeholder="Ex. Filtres à huile"></label><label class="field">Identifiant URL<input name="slug" maxlength="80" pattern="[a-z0-9]+(-[a-z0-9]+)*" required placeholder="filtres-a-huile"></label><label class="field">Ordre d’affichage<input name="sort_order" type="number" min="0" max="9999" value="0" required></label><label class="field category-checkbox"><input name="is_active" type="checkbox" checked> Afficher sur la boutique</label><div class="form-actions full"><button class="btn" id="category-cancel" type="button" hidden>Annuler</button><button class="btn primary" type="submit">Enregistrer la catégorie</button></div></form></section><section class="panel"><div class="panel-head"><div><h2>Catégories de la boutique</h2><p class="panel-sub">${categories.length} catégorie${categories.length === 1 ? '' : 's'}</p></div><button class="btn" id="category-sign-out" type="button">Se déconnecter</button></div>${
        categories.length
          ? `<div class="table-wrap"><table><thead><tr><th>Nom</th><th>Identifiant URL</th><th>Produits</th><th>Visibilité</th><th>Ordre</th><th></th></tr></thead><tbody>${categories
              .map(
                (category) =>
                  `<tr><td><strong>${esc(category.name)}</strong></td><td><code>${esc(category.slug)}</code></td><td>${category.products?.[0]?.count ?? 0}</td><td><span class="badge ${category.is_active ? 'green' : ''}">${category.is_active ? 'Visible' : 'Masquée'}</span></td><td>${category.sort_order}</td><td><button class="text-action" type="button" data-edit-category="${esc(category.id)}">Modifier</button> <button class="text-action" type="button" data-toggle-category="${esc(category.id)}">${category.is_active ? 'Masquer' : 'Afficher'}</button></td></tr>`,
              )
              .join('')}</tbody></table></div>`
          : '<div class="empty-state"><h3>Aucune catégorie</h3><p>Ajoutez votre première catégorie ci-dessus.</p></div>'
      }</section>`,
    );

    const form = container.querySelector<HTMLFormElement>('#category-form')!;
    const name = form.elements.namedItem('name') as HTMLInputElement;
    const slug = form.elements.namedItem('slug') as HTMLInputElement;
    name.oninput = () => {
      if (!slug.dataset.touched) slug.value = slugify(name.value);
    };
    slug.oninput = () => {
      slug.dataset.touched = 'true';
    };
    container.querySelector<HTMLButtonElement>('#category-cancel')!.onclick = () => void render();
    container.querySelector<HTMLButtonElement>('#category-sign-out')!.onclick = async () => {
      await supabase!.auth.signOut();
      window.dispatchEvent(new CustomEvent('enrm-sign-out'));
      await render();
    };
    container.querySelectorAll<HTMLButtonElement>('[data-edit-category]').forEach((button) => {
      button.onclick = () => {
        const category = categories.find((item) => item.id === button.dataset.editCategory);
        if (!category) return;
        (form.elements.namedItem('id') as HTMLInputElement).value = category.id;
        name.value = category.name;
        slug.value = category.slug;
        slug.dataset.touched = 'true';
        (form.elements.namedItem('sort_order') as HTMLInputElement).value = String(
          category.sort_order,
        );
        (form.elements.namedItem('is_active') as HTMLInputElement).checked = category.is_active;
        (form.querySelector('button[type="submit"]') as HTMLButtonElement).textContent =
          'Enregistrer les modifications';
        container.querySelector<HTMLButtonElement>('#category-cancel')!.hidden = false;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
    container.querySelectorAll<HTMLButtonElement>('[data-toggle-category]').forEach((button) => {
      button.onclick = async () => {
        const category = categories.find((item) => item.id === button.dataset.toggleCategory);
        if (!category) return;
        const { error: updateError } = await supabase!
          .from('categories')
          .update({ is_active: !category.is_active })
          .eq('id', category.id);
        if (updateError) {
          window.alert(`La catégorie n’a pas été modifiée : ${updateError.message}`);
          return;
        }
        await render();
      };
    });
    form.onsubmit = async (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const id = String(values.get('id') || '');
      const payload = {
        name: String(values.get('name') || '').trim(),
        slug: slugify(String(values.get('slug') || '')),
        sort_order: Number(values.get('sort_order')),
        is_active: values.get('is_active') === 'on',
      };
      const result = id
        ? await supabase!.from('categories').update(payload).eq('id', id)
        : await supabase!.from('categories').insert(payload);
      if (result.error) {
        window.alert(`La catégorie n’a pas été enregistrée : ${result.error.message}`);
        return;
      }
      await render();
    };
  }

  container.onsubmit = async (event) => {
    if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'category-login') return;
    event.preventDefault();
    const values = new FormData(event.target);
    const { error } = await supabase!.auth.signInWithPassword({
      email: String(values.get('email')),
      password: String(values.get('password')),
    });
    if (error) {
      show(
        `<section class="panel settings-body category-auth"><h2>Connexion refusée</h2><p>${esc(error.message)}</p><button class="btn" id="category-retry" type="button">Réessayer</button></section>`,
      );
      container.querySelector<HTMLButtonElement>('#category-retry')!.onclick = () => void render();
      return;
    }
    await render();
  };

  void render();
}
