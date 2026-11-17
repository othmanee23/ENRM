'use client';

import { useState, type FormEvent } from 'react';

export function AdviceMiniForm() {
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  return (
    <>
      <form id="advice-mini" onSubmit={submit} onChange={() => setSubmitted(false)}>
        <label>
          Marque du véhicule
          <input
            name="marque"
            autoComplete="off"
            placeholder="Ex. Renault"
            required
            maxLength={80}
          />
        </label>
        <div className="advice-mini-row">
          <label>
            Modèle
            <input name="modele" placeholder="Ex. Clio" required maxLength={80} />
          </label>
          <label>
            Année
            <input name="annee" type="number" min={1950} max={2027} placeholder="2020" required />
          </label>
        </div>
        <button className="button primary" type="submit">
          Préparer mon récapitulatif <span>↗</span>
        </button>
        <p className="muted">
          Ce formulaire reste sur votre appareil et ne transmet pas de demande.
        </p>
        {submitted && (
          <p className="notice" role="status">
            Récapitulatif préparé sur cette page. Aucune information n’a été transmise à ENRM. La
            compatibilité doit être vérifiée avec la documentation du constructeur et du fabricant.
          </p>
        )}
      </form>
    </>
  );
}
