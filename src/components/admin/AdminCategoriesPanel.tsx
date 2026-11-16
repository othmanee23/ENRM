'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import type { Category } from '../../shared/types';
import { supabase } from '../../shared/supabase';

type CategoryRow = Category & { products?: { count: number }[] };

function descendantIds(categories: CategoryRow[], id: string) {
  const descendants = new Set<string>();
  const pending = [id];
  while (pending.length) {
    const current = pending.pop()!;
    for (const category of categories) {
      if (category.parent_id === current && !descendants.has(category.id)) {
        descendants.add(category.id);
        pending.push(category.id);
      }
    }
  }
  return descendants;
}

function categoryPath(categories: CategoryRow[], category: CategoryRow) {
  const labels = [category.name];
  let parentId = category.parent_id;
  const visited = new Set([category.id]);
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = categories.find((item) => item.id === parentId);
    if (!parent) break;
    labels.unshift(parent.name);
    parentId = parent.parent_id;
  }
  return labels.join(' / ');
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function AdminCategoriesPanel() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentId, setParentId] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [view, setView] = useState('overview');
  const [restricted, setRestricted] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('id,parent_id,name,slug,sort_order,is_active,products(count)')
      .order('sort_order')
      .order('name');
    if (error) setMessage('Catégories inaccessibles. Vérifiez les droits puis réessayez.');
    else {
      setCategories((data || []) as CategoryRow[]);
      setMessage('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const onNavigation = (event: Event) => {
      const detail = (event as CustomEvent<{ view: string; restricted: boolean }>).detail;
      setView(detail.view);
      setRestricted(detail.restricted);
      if (detail.view === 'categories' && !detail.restricted) void load();
    };
    window.addEventListener('enrm-admin-navigation', onNavigation);
    return () => window.removeEventListener('enrm-admin-navigation', onNavigation);
  }, [load]);

  function resetForm() {
    setEditingId('');
    setName('');
    setSlug('');
    setSlugTouched(false);
    setParentId('');
    setSortOrder('0');
    setActive(true);
  }

  function edit(category: CategoryRow) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setSlugTouched(true);
    setParentId(category.parent_id || '');
    setSortOrder(String(category.sort_order));
    setActive(category.is_active);
    document
      .getElementById('category-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const normalizedName = name.trim();
    const normalizedSlug = slugify(slug);
    const numericOrder = Number(sortOrder);
    const parent = categories.find((category) => category.id === parentId);
    const descendants = editingId ? descendantIds(categories, editingId) : new Set<string>();
    if (!normalizedName || !normalizedSlug || !Number.isInteger(numericOrder) || numericOrder < 0) {
      setMessage('Vérifiez le nom, l’identifiant URL et l’ordre d’affichage.');
      return;
    }
    if ((parentId && !parent) || parentId === editingId || descendants.has(parentId)) {
      setMessage('Choisissez une catégorie parente valide, sans créer de boucle.');
      return;
    }
    setSaving(true);
    setMessage('');
    const payload = {
      parent_id: parentId || null,
      name: normalizedName,
      slug: normalizedSlug,
      sort_order: numericOrder,
      is_active: active,
    };
    const result = editingId
      ? await supabase.from('categories').update(payload).eq('id', editingId)
      : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (result.error) {
      setMessage('Catégorie non enregistrée. Vérifiez que son identifiant URL est unique.');
      return;
    }
    resetForm();
    setMessage('Catégorie enregistrée.');
    await load();
  }

  async function toggle(category: CategoryRow) {
    if (!supabase) return;
    setMessage('');
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !category.is_active })
      .eq('id', category.id);
    if (error) setMessage('Visibilité non modifiée. Vérifiez les droits puis réessayez.');
    else await load();
  }

  const descendants = editingId ? descendantIds(categories, editingId) : new Set<string>();

  if (view !== 'categories') return null;

  if (restricted) {
    return (
      <main id="react-admin-categories">
        <div className="page-heading">
          <div>
            <p className="eyebrow">STRUCTURE DU CATALOGUE</p>
            <h1>Catégories</h1>
          </div>
        </div>
        <section className="panel settings-body" role="status">
          <h2>Accès administrateur requis</h2>
          <p>Vérification de la session et des droits en cours.</p>
        </section>
      </main>
    );
  }

  return (
    <main id="react-admin-categories">
      <div className="page-heading">
        <div>
          <p className="eyebrow">STRUCTURE DU CATALOGUE</p>
          <h1>Catégories</h1>
          <p>Organisez les familles de produits de votre boutique.</p>
        </div>
      </div>
      {!supabase ? (
        <section className="panel settings-body">
          <h2>Connexion Supabase nécessaire</h2>
          <p>
            Configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY pour gérer les
            catégories partagées.
          </p>
          <p>Sans ces variables, la boutique reste en mode catalogue statique.</p>
        </section>
      ) : (
        <>
          <section className="panel settings-body">
            <div className="panel-head">
              <div>
                <h2>{editingId ? 'Modifier une catégorie' : 'Ajouter une catégorie'}</h2>
                <p className="panel-sub">
                  Les produits restent rattachés à leur identifiant de catégorie.
                </p>
              </div>
            </div>
            <form id="category-form" className="form-grid" onSubmit={save}>
              <label className="field">
                Catégorie parente
                <select
                  name="parent_id"
                  value={parentId}
                  onChange={(event) => setParentId(event.currentTarget.value)}
                >
                  <option value="">Aucune (catégorie principale)</option>
                  {categories
                    .filter(
                      (category) => category.id !== editingId && !descendants.has(category.id),
                    )
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {categoryPath(categories, category)}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Nom
                <input
                  name="name"
                  value={name}
                  maxLength={80}
                  required
                  placeholder="Ex. Filtres à huile"
                  onChange={(event) => {
                    const nextName = event.currentTarget.value;
                    setName(nextName);
                    if (!slugTouched) setSlug(slugify(nextName));
                  }}
                />
              </label>
              <label className="field">
                Identifiant URL
                <input
                  name="slug"
                  value={slug}
                  maxLength={80}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  required
                  placeholder="filtres-a-huile"
                  onChange={(event) => {
                    setSlug(event.currentTarget.value);
                    setSlugTouched(true);
                  }}
                />
              </label>
              <label className="field">
                Ordre d’affichage
                <input
                  name="sort_order"
                  type="number"
                  min={0}
                  max={9999}
                  value={sortOrder}
                  required
                  onChange={(event) => setSortOrder(event.currentTarget.value)}
                />
              </label>
              <label className="field category-checkbox">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.currentTarget.checked)}
                />
                Afficher sur la boutique
              </label>
              <div className="form-actions full">
                {editingId && (
                  <button className="btn" type="button" onClick={resetForm}>
                    Annuler
                  </button>
                )}
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer la catégorie'}
                </button>
              </div>
            </form>
            {message && (
              <p className="form-note" role="status">
                {message}
              </p>
            )}
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Catégories de la boutique</h2>
                <p className="panel-sub">
                  {categories.length} catégorie{categories.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            {loading ? (
              <p className="settings-body" role="status">
                Chargement des catégories…
              </p>
            ) : categories.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Identifiant URL</th>
                      <th>Produits</th>
                      <th>Visibilité</th>
                      <th>Ordre</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <strong>{categoryPath(categories, category)}</strong>
                        </td>
                        <td>
                          <code>{category.slug}</code>
                        </td>
                        <td>{category.products?.[0]?.count ?? 0}</td>
                        <td>
                          <span className={`badge ${category.is_active ? 'green' : ''}`}>
                            {category.is_active ? 'Visible' : 'Masquée'}
                          </span>
                        </td>
                        <td>{category.sort_order}</td>
                        <td>
                          <button
                            className="text-action"
                            type="button"
                            onClick={() => edit(category)}
                            aria-label={`Modifier ${category.name}`}
                          >
                            <Pencil size={14} aria-hidden="true" /> Modifier
                          </button>{' '}
                          <button
                            className="text-action"
                            type="button"
                            onClick={() => void toggle(category)}
                          >
                            {category.is_active ? 'Masquer' : 'Afficher'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Aucune catégorie</h3>
                <p>Ajoutez votre première catégorie ci-dessus.</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
