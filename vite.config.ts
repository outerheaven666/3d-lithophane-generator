import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    sourcemap: false,
    target: "es2022",
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "three/examples/jsm/controls/OrbitControls.js"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
