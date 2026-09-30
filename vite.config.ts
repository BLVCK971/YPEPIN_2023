import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Site 100% statique : `npm run build` génère le dossier dist/,
// à servir tel quel par nginx/Caddy (aucun serveur Node en production).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
