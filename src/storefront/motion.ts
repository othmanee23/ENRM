import { $ } from '../shared/dom';
export function setupMotion(page: string | undefined) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = $('#hero'),
    marquee = $('#marquee');
  const scenes = [...document.querySelectorAll<HTMLElement>('.motion-scene')];
  const animatedImages = [...document.querySelectorAll<HTMLImageElement>('.detail-cinema>img')];
  let scrollFrame = 0;
  function updateScroll() {
    document.body.classList.toggle('header-scrolled', scrollY > 65);
    if (!reduced.matches) {
      if (hero) {
        const p = Math.max(0, Math.min(1, scrollY / hero.offsetHeight));
        hero.style.setProperty('--hero-drift', `${p * 60}px`);
        hero.style.setProperty('--hero-copy-drift', `${p * 35}px`);
      }
      scenes.forEach((scene) => {
        const r = scene.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const stage = scene.querySelector<HTMLElement>('.showcase-stage');
        const p = stage
          ? Math.max(0, Math.min(1, (76 - r.top) / Math.max(1, r.height - stage.offsetHeight)))
          : Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
        scene.style.setProperty('--scene-progress', p.toFixed(4));
      });
      const detail = document.querySelector<HTMLElement>('.cinematic-detail');
      if (detail) {
        const r = detail.getBoundingClientRect(),
          stage = detail.querySelector<HTMLElement>('.detail-cinema')!;
        if (r.bottom > 0 && r.top < innerHeight) {
          const p = Math.max(
            0,
            Math.min(1, (76 - r.top) / Math.max(1, r.height - stage.offsetHeight)),
          );
          detail.style.setProperty('--detail-progress', p.toFixed(4));
        }
      }
    }
    scrollFrame = 0;
  }
  if (page === 'home') {
    addEventListener(
      'scroll',
      () => {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
      },
      { passive: true },
    );
    addEventListener('resize', updateScroll);
    updateScroll();
    $('#menu-button').addEventListener('click', () =>
      document.body.classList.toggle('menu-open', !$('#mobile-nav').hidden),
    );
  }
  // Each film owns its playback state; scrolling never changes the page position.
  document.querySelectorAll<HTMLVideoElement>('[data-ambient-video]').forEach((video) => {
    const control = document.querySelector<HTMLElement>(`[data-video-control="${video.id}"]`);
    let visible = false,
      manualPaused = false,
      explicitPlay = false,
      failed = false;
    function label() {
      if (!control) return;
      control.innerHTML = video.paused ? '▶' : 'Ⅱ';
      if (video.id === 'hero-video') control.innerHTML += ` <span>Vidéo</span>`;
      control.setAttribute(
        'aria-label',
        video.id === 'hero-video'
          ? video.paused
            ? 'Reprendre la vidéo et les logos'
            : 'Mettre la vidéo et les logos en pause'
          : video.paused
            ? 'Lire la vidéo'
            : 'Mettre la vidéo en pause',
      );
    }
    function sync() {
      if (failed) return;
      const play =
        visible && !document.hidden && !manualPaused && (!reduced.matches || explicitPlay);
      if (play) video.play().then(label).catch(label);
      else {
        video.pause();
        label();
      }
    }
    if (control)
      control.onclick = () => {
        manualPaused = !video.paused;
        explicitPlay = !manualPaused;
        if (video.id === 'hero-video' && marquee) marquee.classList.toggle('paused', manualPaused);
        sync();
      };
    const fallback = () => {
      failed = true;
      video.pause();
      if (control) control.hidden = true;
      const note = video.id === 'hero-video' ? $('#video-fallback') : null;
      if (note) note.hidden = false;
      video.classList.add('media-failed');
    };
    video.addEventListener('error', fallback);
    video.querySelector('source')?.addEventListener('error', fallback);
    if (video.networkState === 3) fallback();
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        sync();
      },
      { threshold: 0.1 },
    ).observe(video);
    document.addEventListener('visibilitychange', sync);
    video.addEventListener('pause', label);
    video.addEventListener('play', label);
    reduced.addEventListener('change', () => {
      explicitPlay = false;
      sync();
    });
    label();
  });
  if (marquee) {
    if (reduced.matches) marquee.classList.add('paused');
    reduced.addEventListener('change', () => {
      if (reduced.matches) marquee.classList.add('paused');
    });
  }
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  const sceneObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          sceneObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.32 },
  );
  scenes.forEach((scene) => {
    scene.classList.add('reveal');
    sceneObserver.observe(scene);
  });
  document
    .querySelectorAll<HTMLElement>(
      '.section-heading,.choice-list>a,.detail-cinema>div,.format-story,.footer-column,.footer-signature',
    )
    .forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', `${(i % 3) * 80}ms`);
      revealObserver.observe(el);
    });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      hero?.style.setProperty('--hero-drift', '0px');
      hero?.style.setProperty('--hero-copy-drift', '0px');
      scenes.forEach((s) => s.style.setProperty('--scene-progress', '.5'));
      animatedImages.forEach((i) => {
        i.style.setProperty('--image-drift', '0px');
        i.style.setProperty('--image-zoom', '1');
      });
    }
  });
}
