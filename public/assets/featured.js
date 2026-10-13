// One copy of each partner badge keeps links, attribution, and keyboard order intact.
document.querySelectorAll('.launch-strip').forEach(strip => {
  const badges = [...strip.querySelectorAll('.launch-badges > a')];
  const toggle = strip.querySelector('.launch-toggle');
  if (badges.length < 2 || !toggle) return;
  strip.style.setProperty('--badge-count', badges.length);
  badges.forEach((badge, index) => badge.style.setProperty('--badge-index', index));
  strip.classList.add('is-animated');
  toggle.hidden = false;
  const viewport = strip.querySelector('.launch-viewport');
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const resetScroll = () => {
    if (motion.matches && !viewport.querySelector('a:focus-visible')) viewport.scrollLeft = 0;
  };
  viewport.addEventListener('focusin', event => requestAnimationFrame(() => {
    if (event.target.matches('a:focus-visible')) {
      event.target.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
    } else resetScroll();
  }));
  viewport.addEventListener('focusout', () => requestAnimationFrame(resetScroll));
  viewport.addEventListener('pointerdown', () => requestAnimationFrame(resetScroll));
  motion.addEventListener('change', resetScroll);
  toggle.addEventListener('click', () => {
    const paused = strip.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Resume featured badges' : 'Pause featured badges');
    toggle.innerHTML = paused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
  });
});
