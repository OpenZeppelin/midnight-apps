import { Buffer } from 'buffer';

window.Buffer = Buffer;

import React, { lazy } from 'react';
import ReactDOM from 'react-dom/client';

const root = document.getElementById('root');

const LazyApp = lazy(() => import('./App'));

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <LazyApp />
    </React.StrictMode>,
  );
}
