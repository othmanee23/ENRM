import { legacyPages } from '../../generated/legacy-pages';

export function LegacyPage({ name, html }: { name: keyof typeof legacyPages; html?: string }) {
  const entry = legacyPages[name];
  return (
    <div
      className="legacy-page"
      data-page={entry.page}
      dangerouslySetInnerHTML={{ __html: html ?? entry.html }}
    />
  );
}
