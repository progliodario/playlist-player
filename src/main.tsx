/** Browser entry point. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import { setupPwa } from './app/pwa.ts';
// Self-hosted fonts (no third-party requests, available offline): see docs/sviluppo/grafica.md.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/manrope';
// Styles, in cascade order. Each file starts with a comment explaining what it covers.
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/art.css';
import './styles/player.css';
import './styles/views.css';
import './styles/a11y.css';

setupPwa();

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
