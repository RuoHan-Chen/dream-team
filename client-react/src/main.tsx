import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import './App.css';

console.log('About to render React with Privy...');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created, rendering with Privy...');
  
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
  console.log('Privy App ID:', privyAppId ? 'Set' : 'Not set');
  
  root.render(
    <React.StrictMode>
      <PrivyProvider
        appId={privyAppId || 'YOUR_PRIVY_APP_ID'}
        config={{
          loginMethods: ['wallet', 'email', 'google', 'github'],
          appearance: {
            theme: 'dark',
            accentColor: '#676FFF',
          },
        }}
      >
        <App />
      </PrivyProvider>
    </React.StrictMode>
  );
  console.log('React render with Privy called!');
} else {
  console.error('Root element not found!');
} 