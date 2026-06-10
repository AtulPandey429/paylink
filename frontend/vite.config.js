import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || env.PUBLIC_BASE_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, // Enables LAN IP binding for mobile phone testing
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
