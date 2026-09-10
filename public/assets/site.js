// Progressive enhancement only. Content and navigation work without JavaScript.
const filters = document.querySelectorAll('[data-filter]');
const rows = document.querySelectorAll('[data-category]');
document.querySelector('.demo-filters')?.removeAttribute('hidden');
filters.forEach(button => {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    let count = 0;
    rows.forEach(row => {
      row.hidden = selected !== 'all' && row.dataset.category !== selected;
      if (!row.hidden) count += 1;
    });
    document.querySelector('#demo-heading').textContent = button.textContent.trim();
    document.querySelector('#demo-status').textContent = `${count} sample ${count === 1 ? 'file' : 'files'} · ${selected === 'duplicates' ? 'Contents not verified' : 'Illustration only'}`;
  });
});
