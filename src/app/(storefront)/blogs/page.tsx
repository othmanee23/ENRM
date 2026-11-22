import type { Metadata } from 'next';
import { publicPageMetadata } from '../../../lib/seo';
import { blogPosts } from '../../../lib/blog';

export const metadata: Metadata = publicPageMetadata(
  'Guides et conseils auto',
  'Guides pratiques ENRM pour comprendre les grades, choisir une huile moteur et suivre l’entretien de votre véhicule au Maroc.',
  '/blogs',
);

export default function BlogsPage() {
  return (
    <main id="main">
      <section className="blog-index section">
        <p className="eyebrow">LE JOURNAL ENRM</p>
        <h1>Des repères clairs pour prendre soin de votre moteur.</h1>
        <p className="blog-lead">
          Guides pratiques et explications pour mieux comprendre les huiles moteur et préparer
          l’entretien de votre véhicule.
        </p>
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <p className="eyebrow">{post.category}</p>
              <h2>
                <a href={`/blogs/${post.slug}`}>{post.title}</a>
              </h2>
              <p>{post.excerpt}</p>
              <div className="blog-card-meta">
                <span>{post.readingTime} de lecture</span>
                <a href={`/blogs/${post.slug}`}>Lire le guide</a>
              </div>
            </article>
          ))}
        </div>
        <div className="blog-contact-cta">
          <div>
            <p className="eyebrow">UN CAS PARTICULIER&nbsp;?</p>
            <h2>Parlons de votre véhicule.</h2>
            <p>Envoyez-nous sa marque, son modèle, son année et sa motorisation.</p>
          </div>
          <a className="button primary" href="/contact">
            Contacter ENRM
          </a>
        </div>
      </section>
    </main>
  );
}
