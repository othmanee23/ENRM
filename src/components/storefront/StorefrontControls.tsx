'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <>
      <button
        className="menu-button"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? '×' : '☰'}
      </button>
      <nav className="mobile-nav" id="mobile-nav" aria-label="Navigation mobile" hidden={!open}>
        <a href="/catalogue">Toutes les huiles ↗</a>
        <a href="/#marques">Les marques ↗</a>
        <a href="/conseil">Trouver mon huile ↗</a>
        <a href="/a-propos">À propos d’ENRM ↗</a>
      </nav>
    </>
  );
}

export function FilterToggle() {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      id="toggle-filters"
      className="outline"
      aria-controls="filters"
      aria-expanded={open}
      onClick={() => {
        const next = !open;
        setOpen(next);
        document.getElementById('filters')?.classList.toggle('open', next);
      }}
    >
      Filtres {open ? '−' : '＋'}
    </button>
  );
}

export function ProductGallery({
  recto,
  verso,
  alt,
}: {
  recto: string | null;
  verso: string | null;
  alt: string;
}) {
  const [face, setFace] = useState<'recto' | 'verso'>('recto');
  const src = face === 'verso' ? verso : recto;
  return (
    <>
      <div id="detail-photo">
        {src ? (
          <img src={src} alt={`${alt} — ${face}`} width={640} height={640} fetchPriority="high" />
        ) : (
          <div className="placeholder">
            <b>Visuel</b>
            <span>Visuel exact à venir</span>
          </div>
        )}
      </div>
      {verso && (
        <div className="gallery-buttons">
          <button type="button" aria-pressed={face === 'recto'} onClick={() => setFace('recto')}>
            Recto
          </button>
          <button type="button" aria-pressed={face === 'verso'} onClick={() => setFace('verso')}>
            Verso
          </button>
        </div>
      )}
    </>
  );
}

export function RailScrollButton({
  id,
  direction,
  label,
}: {
  id: string;
  direction: -1 | 1;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() =>
        document.getElementById(id)?.scrollBy({ left: direction * 360, behavior: 'smooth' })
      }
    >
      {direction < 0 ? '←' : '→'}
    </button>
  );
}

export function VideoControl({ videoId }: { videoId: string }) {
  const [paused, setPaused] = useState(false);
  const manualPaused = useRef(false);
  const explicitPlay = useRef(false);
  useEffect(() => {
    const video = document.getElementById(videoId) as HTMLVideoElement | null;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let failed = false;
    const sync = () => {
      if (failed) return;
      if (
        visible &&
        !document.hidden &&
        !manualPaused.current &&
        (!reduced.matches || explicitPlay.current)
      ) {
        void video.play().catch(() => setPaused(true));
      } else video.pause();
    };
    const fail = () => {
      failed = true;
      video.pause();
      video.classList.add('media-failed');
      const fallback = document.getElementById('video-fallback');
      if (videoId === 'hero-video' && fallback) fallback.hidden = false;
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    );
    observer.observe(video);
    video.addEventListener('error', fail);
    video.querySelector('source')?.addEventListener('error', fail);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    if (video.networkState === 3) fail();
    return () => {
      observer.disconnect();
      video.removeEventListener('error', fail);
      video.querySelector('source')?.removeEventListener('error', fail);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      video.pause();
    };
  }, [videoId]);
  return (
    <button
      type="button"
      className="film-control"
      aria-label={paused ? 'Lire la vidéo' : 'Mettre la vidéo en pause'}
      onClick={() => {
        const video = document.getElementById(videoId) as HTMLVideoElement | null;
        if (!video) return;
        if (video.paused) {
          manualPaused.current = false;
          explicitPlay.current = true;
          void video
            .play()
            .then(() => setPaused(false))
            .catch(() => setPaused(true));
        } else {
          manualPaused.current = true;
          explicitPlay.current = false;
          video.pause();
          setPaused(true);
        }
      }}
    >
      {paused ? '▶' : 'Ⅱ'} <span>Vidéo</span>
    </button>
  );
}

export function StorefrontEffects() {
  const pathname = usePathname();
  useEffect(() => {
    const path = pathname;
    const page =
      path === '/'
        ? 'home'
        : path.startsWith('/produits/')
          ? 'product'
          : path.split('/').filter(Boolean)[0] || 'home';
    document.body.dataset.page = page;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hero = document.getElementById('hero');
    const scenes = [...document.querySelectorAll<HTMLElement>('.motion-scene')];
    const detail = document.querySelector<HTMLElement>('.cinematic-detail');
    let frame = 0;
    const update = () => {
      document.body.classList.toggle('header-scrolled', scrollY > 65);
      if (!reduced.matches) {
        if (hero) {
          const p = Math.max(0, Math.min(1, scrollY / Math.max(1, hero.offsetHeight)));
          hero.style.setProperty('--hero-drift', `${p * 60}px`);
          hero.style.setProperty('--hero-copy-drift', `${p * 35}px`);
        }
        for (const scene of scenes) {
          const rect = scene.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > innerHeight) continue;
          const p = Math.max(
            0,
            Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)),
          );
          scene.style.setProperty('--scene-progress', p.toFixed(4));
        }
        if (detail) {
          const rect = detail.getBoundingClientRect();
          const stage = detail.querySelector<HTMLElement>('.detail-cinema');
          if (stage && rect.bottom > 0 && rect.top < innerHeight) {
            const p = Math.max(
              0,
              Math.min(1, (76 - rect.top) / Math.max(1, rect.height - stage.offsetHeight)),
            );
            detail.style.setProperty('--detail-progress', p.toFixed(4));
          }
        }
      }
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            reveal.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll('.reveal, .oil-showcase, .advice-studio, .cinematic-detail')
      .forEach((el) => reveal.observe(el));
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', update);
    update();
    if (reduced.matches) document.getElementById('marquee')?.classList.add('paused');
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', update);
      reveal.disconnect();
      if (frame) cancelAnimationFrame(frame);
      document.body.classList.remove('header-scrolled');
    };
  }, [pathname]);
  return null;
}
