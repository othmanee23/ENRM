export default function NotFound() {
  return (
    <main id="main" className="section empty">
      <p className="eyebrow">PAGE INTROUVABLE</p>
      <h1>Cette référence a changé de route.</h1>
      <p>Le contenu demandé n’est pas disponible ou n’est plus publié.</p>
      <a className="button primary" href="/catalogue">
        Explorer le catalogue ↗
      </a>
    </main>
  );
}
