import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost } from '../../../../lib/blog';
import { DEFAULT_SOCIAL_IMAGE, getSiteUrl, publicPageMetadata } from '../../../../lib/seo';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: 'Article introuvable', robots: { index: false, follow: true } };
  const base = publicPageMetadata(
    post.title,
    post.excerpt,
    `/blogs/${post.slug}`,
    DEFAULT_SOCIAL_IMAGE,
  );
  return {
    ...base,
    openGraph: {
      type: 'article',
      locale: 'fr_MA',
      siteName: 'ENRM',
      title: post.title,
      description: post.excerpt,
      url: `/blogs/${post.slug}`,
      images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: 'Guides pratiques ENRM' }],
      publishedTime: new Date(`${post.publishedAt}T12:00:00+01:00`).toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const siteUrl = getSiteUrl();
  const canonical = new URL(`/blogs/${post.slug}`, siteUrl).href;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: 'ENRM Solutions & Services' },
    publisher: {
      '@type': 'Organization',
      name: 'ENRM Solutions & Services',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: new URL('/assets/logo.svg', siteUrl).href },
    },
    mainEntityOfPage: canonical,
    image: new URL(DEFAULT_SOCIAL_IMAGE, siteUrl).href,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blogs', item: new URL('/blogs', siteUrl).href },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <article className="blog-article section">
        <nav className="blog-breadcrumb" aria-label="Fil d’Ariane">
          <a href="/">Accueil</a>
          <span aria-hidden="true">/</span>
          <a href="/blogs">Blogs</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.category}</span>
        </nav>
        <div className="blog-article-heading">
          <p className="eyebrow">
            {post.category} · {post.readingTime} de lecture
          </p>
          <h1>{post.title}</h1>
          <p className="blog-lead">{post.introduction}</p>
          <time dateTime={post.publishedAt}>
            Publié le{' '}
            {new Intl.DateTimeFormat('fr-MA', { dateStyle: 'long', timeZone: 'UTC' }).format(
              new Date(`${post.publishedAt}T12:00:00Z`),
            )}
          </time>
        </div>
        <div className="blog-article-content">
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets && (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <div className="blog-article-cta">
            <p>{post.conclusion}</p>
            <div className="blog-article-links">
              <a className="button primary" href="/catalogue">
                Parcourir les produits
              </a>
              <a className="text-link" href="/contact">
                Demander conseil
              </a>
            </div>
          </div>
          <aside className="blog-sources" aria-labelledby="blog-sources-title">
            <h2 id="blog-sources-title">Pour aller plus loin</h2>
            <ul>
              {post.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </article>
    </main>
  );
}
