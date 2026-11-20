import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base del sitio en GitHub Pages: https://gabosahur.github.io/MatriX/
export default defineConfig({
  plugins: [react()],
  base: "/MatriX/",
});
