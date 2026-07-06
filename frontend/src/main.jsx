import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('main.jsx: bootstrapping application...');
try {
  const rootEl = document.getElementById('root');
  console.log('main.jsx: root element exists:', !!rootEl);
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('main.jsx: render call completed');
} catch (err) {
  console.error('main.jsx: bootstrap crashed:', err);
}
