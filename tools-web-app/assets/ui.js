import { getState } from './state.js';

export function initUI(root) {
  const state = getState();

  root.innerHTML = `
    <div>
      <h2>Converge</h2>
      <p>UI initialized.</p>
    </div>
  `;
}
