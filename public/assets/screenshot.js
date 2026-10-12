const screenshot = document.querySelector('.screenshot-dialog');
if (screenshot && typeof screenshot.showModal === 'function') {
  document.querySelectorAll('[data-screenshot]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      screenshot.showModal();
    });
  });
  screenshot.querySelector('button').addEventListener('click', () => screenshot.close());
  screenshot.addEventListener('click', event => {
    if (event.target !== screenshot) return;
    const rect = screenshot.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) screenshot.close();
  });
}
