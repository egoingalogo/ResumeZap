import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@paypal/paypal-js'],
    include: ['@paypal/paypal-js'],
    exclude: ['lucide-react'],
  },
});
