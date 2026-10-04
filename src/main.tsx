import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <InventoryProvider>
          <App />
          <PWAUpdatePrompt />
        </InventoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
