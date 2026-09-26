import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const certPath = path.resolve(__dirname, 'certs/localhost.crt');
const keyPath = path.resolve(__dirname, 'certs/localhost.key');
const useHttps = process.env.HTTPS === 'true' && fs.existsSync(certPath) && fs.existsSync(keyPath);

const backendUrl = useHttps ? 'https://localhost:8443' : 'http://localhost:4000';
const backendWsUrl = useHttps ? 'wss://localhost:8443' : 'ws://localhost:4000';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window'
  },
  server: {
    port: 3000,
    https: useHttps ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : undefined,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: backendWsUrl,
        ws: true,
        secure: false
      },
      '/ws-emergency': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/metrics': {
        target: backendUrl,
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: backendUrl,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
