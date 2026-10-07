import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
const root = document.getElementById('root');
const initialData = window.__ROUTE_DATA__ || {};
const app = (
  <React.StrictMode>
    <App initialData={initialData} />
  </React.StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
