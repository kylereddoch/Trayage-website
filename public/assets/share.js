// Only copy when asked. Sharing never posts automatically or loads social embeds.
document.querySelectorAll('[data-copy-link]').forEach(button => {
  if (!navigator.clipboard?.writeText) return;
  button.hidden = false;
  button.addEventListener('click', async () => {
    const status = document.querySelector('.share-status');
    try {
      await navigator.clipboard.writeText(button.dataset.copyLink);
      status.textContent = 'Link copied. Share it wherever you like.';
    } catch {
      status.textContent = 'Could not copy automatically. Use the article link beside this button.';
    }
  });
});
