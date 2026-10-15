// One copy of each partner badge keeps links, attribution, and keyboard order intact.
document.querySelectorAll('.launch-strip').forEach(strip => {
  const badges = [...strip.querySelectorAll('.launch-badges > a')];
  const toggle = strip.querySelector('.launch-toggle');
  if (badges.length < 2 || !toggle) return;
  const row = strip.querySelector('.launch-badges');
  // Each badge travels the same distance and speed, with its own measured offset.
  // Wrapping only after it leaves the viewport keeps the gap consistent at the seam.
  const measure = () => {
    const gap = parseFloat(getComputedStyle(row).columnGap);
    const widths = badges.map(badge => badge.getBoundingClientRect().width);
    const distance = widths.reduce((total, width) => total + width + gap, 0);
    const speed = 28;
    strip.style.setProperty('--badge-duration', `${distance / speed}s`);
    let offset = 0;
    badges.forEach((badge, index) => {
      const end = -widths[index] - gap;
      badge.style.setProperty('--badge-start', `${distance + end}px`);
      badge.style.setProperty('--badge-end', `${end}px`);
      badge.style.setProperty('--badge-delay', `${-(distance + end - offset) / speed}s`);
      offset += widths[index] + gap;
    });
    strip.classList.add('is-animated');
  };
  const sizes = new ResizeObserver(measure);
  badges.forEach(badge => sizes.observe(badge));
  sizes.observe(row);
  measure();
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
