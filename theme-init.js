/* Apply the saved appearance before styles load to prevent a light flash. */
(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('investsight-ui-v2') || '{}');
    if (saved && ['light', 'dark', 'pure-dark'].includes(saved.theme)) {
      document.documentElement.dataset.theme = saved.theme;
    }
  } catch {
    /* Keep the default appearance when storage is unavailable or malformed. */
  }
})();
