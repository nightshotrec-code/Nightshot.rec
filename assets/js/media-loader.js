const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function attachSources(video) {
  if (video.dataset.loaded === 'true') return;
  video.querySelectorAll('source[data-src]').forEach((source) => {
    source.src = source.dataset.src;
    delete source.dataset.src;
  });
  video.dataset.loaded = 'true';
  video.load();
}

function safePlay(video) {
  if (reducedMotion.matches) return;
  const attempt = video.play();
  attempt?.catch(() => video.setAttribute('data-autoplay-blocked', ''));
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(({ target: video, isIntersecting }) => {
    if (isIntersecting) {
      attachSources(video);
      safePlay(video);
    } else {
      video.pause();
    }
  });
}, { rootMargin: '400px 0px', threshold: 0.01 });

document.querySelectorAll('video[data-deferred]').forEach((video) => {
  observer.observe(video);
  video.addEventListener('error', () => {
    console.warn('Video unavailable:', video.currentSrc || 'deferred source');
  });
});

document.querySelector('#hero video')?.addEventListener('error', (event) => {
  console.warn('Hero video unavailable:', event.currentTarget.currentSrc);
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    document.querySelectorAll('video').forEach((video) => video.pause());
  }
});
