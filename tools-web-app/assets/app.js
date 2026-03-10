import { initUI } from './ui.js';
import { initState } from './state.js';

(function () {
  const root = document.getElementById('converge-app');
  if (!root) return;

  if (root.dataset.initialized) return;
  root.dataset.initialized = 'true';

  initState();
  initUI(root);
})();
