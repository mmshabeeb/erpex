import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './lib/api'; // Initialize global fetch auth interceptor
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-custom',
          duration: 3000,
          style: {
            background: '#0d1117',
            color: '#e8ecf4',
            border: '1px solid rgba(255,255,255,0.07)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
